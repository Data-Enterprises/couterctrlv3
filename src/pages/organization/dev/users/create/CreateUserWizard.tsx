import { useEffect, useMemo, useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { useOrganizationCtx } from "../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import { createUser } from "../../../../../api/team";
import {
  resetUserInfo,
  setRefresh,
  setUserInfo,
} from "../../../../../features/dev/devUsersSlice";
import type {
  CompanyBaseGroup,
  GrantMode,
  JsonError,
  Store,
} from "../../../../../interfaces";
import UserFields from "./UserFields";
import AccessPanel from "../access/AccessPanel";
import Stepper from "./Stepper";
import {
  STEP_ORDER,
  type WizardStep,
} from "./wizardSteps";
import { usePanelFit, type PanelFit } from "../../panelFit";
import StepAccessType from "./StepAccessType";
import StepReview from "./StepReview";
import {
  accessSets,
  emptySelectedGroupIds,
  groupCompanies,
  NO_PICKS,
  type AccessPicks,
} from "../access/accessSets";
import {
  useAccessSave,
  outcomeSentence,
  NOTHING_HELD,
  type AccessOutcome,
} from "../access/useAccessSave";

interface CreateUserWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

/**
 * What the panel should be while each step is open.
 *
 * Every step but Assignments hugs its own content: they are forms, and a form
 * stretched to a dragged 1600px rectangle reads as one that failed to load.
 *
 * Assignments is the exception and needs a number. Its three columns scroll
 * independently, so the content has no natural height to hug — auto would
 * collapse all three to nothing. The width is what the columns actually need:
 * 220 for companies, 288 for base groups, and enough left for store names.
 */
const STEP_FIT: Record<WizardStep, PanelFit> = {
  identity: { width: 1060, height: "auto" },
  type: { width: 1000, height: "auto" },
  assignments: { width: 1360, height: 700 },
  review: { width: 1060, height: "auto" },
};

/** Roles that may hold exactly one store and no whole group. Matched on the
 *  role text the form carries, lowercased, because that is what the user
 *  record stores and what the server checks against. */
const isSingleStoreRole = (role: string) =>
  role.toLowerCase().replace(/[\s_-]/g, "") === "singlestore";

/**
 * Add user, in four steps.
 *
 * It was one screen for a while, on the reasoning that nothing is sent until
 * Create either way, so the steps were pacing rather than protection. What
 * changed is that **access type is now a real decision with consequences
 * nobody can see on the finished screen** — a group held as `auto` keeps
 * granting stores for years, a `fixed` one never does, and both look
 * identical in a list of ticks. Asking it on its own screen, before any store
 * is picked, is the point of the step rather than ceremony.
 *
 * Nothing is still sent until Create. The call order is unchanged: create the
 * account, then its access outermost first.
 */
const CreateUserWizard = ({ onComplete, onCancel }: CreateUserWizardProps) => {
  const toast = useToast();
  const ctx = useOrganizationCtx();
  const saveAccess = useAccessSave();

  const [step, setStep] = useState<WizardStep>("identity");
  const [furthest, setFurthest] = useState<WizardStep>("identity");
  const [accessType, setAccessType] = useState<GrantMode>("all");
  const [picks, setPicks] = useState<AccessPicks>(NO_PICKS);
  const [companyGroups, setCompanyGroups] = useState<
    Record<number, CompanyBaseGroup[]>
  >({});
  const [groupStores, setGroupStores] = useState<Record<number, Store[]>>({});
  const [identityValid, setIdentityValid] = useState(false);
  const [saving, setSaving] = useState(false);
  /** Set only once the account exists. What it names is a person who is
   *  already real, so the screen must not pretend the form is still unsent. */
  const [stranded, setStranded] = useState<{
    userid: number;
    name: string;
    outcome: AccessOutcome;
  } | null>(null);

  const singleStoreOnly = isSingleStoreRole(String(ctx.userInfo.role ?? ""));

  usePanelFit(STEP_FIT[step]);

  useEffect(() => {
    ctx.dispatch(resetUserInfo());

    const source = ctx.duplicateSource;
    if (!source) return;
    // Access copies, identity never does — a duplicate that half-becomes the
    // person it was copied from is worse than one that copies nothing.
    ctx.dispatch(setUserInfo({ key: "role", value: source.role }));
    ctx.dispatch(setUserInfo({ key: "user_level", value: source.user_level }));
    setCompanyGroups(
      source.groups.reduce<Record<number, CompanyBaseGroup[]>>((acc, g) => {
        acc[g.company] = [...(acc[g.company] ?? []), g];
        return acc;
      }, {}),
    );
    // The source's companies and groups are picked in their own right rather
    // than re-derived from its stores: a group whose stores are all unticked
    // still has to survive the copy.
    //
    // Modes are NOT copied. The duplicate's groups come back without one, and
    // guessing `all` would hand somebody every future store because a
    // different person has them. The Access type step asks instead.
    setPicks({
      ...NO_PICKS,
      companies: Array.from(new Set(source.groups.map((g) => g.company))),
      baseGroups: source.groups.map((g) => g.id),
      stores: source.stores,
    });
  }, []);

  // A role change after the fact has to drag the access with it, or the form
  // holds a combination the server will refuse.
  useEffect(() => {
    if (!singleStoreOnly) return;
    setAccessType("selected");
    setPicks((prev) => {
      const modes: Record<number, GrantMode> = {};
      prev.baseGroups.forEach((id) => (modes[id] = "selected"));
      return { ...prev, modes, stores: prev.stores.slice(0, 1) };
    });
  }, [singleStoreOnly]);

  // A held group contributes its company. Without it an Auto grant sent no
  // company at all — there are no picked stores in that mode to supply one —
  // and every endpoint that reads a user's base groups filters on
  // `company_link`, so the group vanished from the screen the moment it saved.
  const sets = useMemo(
    () => accessSets(picks, undefined, groupCompanies(companyGroups)),
    [picks, companyGroups],
  );
  const emptyGroups = emptySelectedGroupIds(sets);
  const hasAccess = sets.companyIds.length > 0 || sets.grants.length > 0;

  const stepReady: Record<WizardStep, boolean> = {
    identity: identityValid,
    type: true,
    assignments: hasAccess && emptyGroups.length === 0,
    review: true,
  };

  const at = STEP_ORDER.indexOf(step);
  const isLast = step === "review";
  const canAdvance = stepReady[step];

  const goTo = (next: WizardStep) => {
    setStep(next);
    if (STEP_ORDER.indexOf(next) > STEP_ORDER.indexOf(furthest)) {
      setFurthest(next);
    }
  };

  const advance = () => goTo(STEP_ORDER[at + 1]);
  const back = () => setStep(STEP_ORDER[at - 1]);

  const finish = (name: string) => {
    toast.success(`${name} created`);
    ctx.dispatch(resetUserInfo());
    ctx.dispatch(setRefresh(true));
    onComplete();
  };

  const handleCreate = async () => {
    setSaving(true);
    const name =
      `${ctx.userInfo.first_name} ${ctx.userInfo.last_name}`.trim() ||
      ctx.userInfo.username;

    let userid: number;
    try {
      const resp = await createUser(ctx.url, ctx.token, ctx.userInfo);
      if (resp.data.error !== 0) {
        // Back to the identity step with everything still in it. The reason is
        // the server's own — "username taken" belongs beside the field.
        toast.error(resp.data.msg ?? "The account could not be created");
        setStep("identity");
        setSaving(false);
        return;
      }
      userid = resp.data.new_userid;
    } catch (err) {
      toast.error((err as JsonError).message);
      setSaving(false);
      return;
    }

    const outcome = await saveAccess(userid, sets, NOTHING_HELD);
    setSaving(false);
    if (outcome.ok) {
      finish(name);
      return;
    }
    // The account exists and its access does not. Hand back something that can
    // be finished rather than a toast that disappears.
    ctx.dispatch(setRefresh(true));
    setStranded({ userid, name, outcome });
  };

  const handleRetry = async () => {
    if (!stranded) return;
    setSaving(true);
    // The whole set again, including the per-group calls that already landed:
    // each replaces its own group, so writing the same grant twice writes the
    // same grant.
    const outcome = await saveAccess(stranded.userid, sets, NOTHING_HELD);
    setSaving(false);
    if (outcome.ok) {
      finish(stranded.name);
      return;
    }
    setStranded({ ...stranded, outcome });
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0 px-4 pt-3 pb-0">
      <div className="flex items-center gap-2 mb-2 flex-shrink-0">
        <button
          onClick={onCancel}
          className="flex items-center gap-1 text-[11.5px] font-semibold px-2 py-1 -ml-2 rounded-md text-brand_navy hover:bg-gray-50"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          Back to users
        </button>
        <span className="text-[11.5px] text-content/85" aria-hidden="true">
          /
        </span>
        <span className="text-[11.5px] text-content/85">Add user</span>
      </div>

      <h2 className="text-[17px] font-bold text-content mb-2.5 flex-shrink-0">
        Add user
      </h2>

      <div className="flex-shrink-0 mb-4">
        <Stepper current={step} furthest={furthest} onGoTo={goTo} />
      </div>

      {/* Danger, not severity: the severity family grades data against a
          threshold, and this is a save that did not finish. */}
      {stranded && (
        <div className="flex flex-wrap items-center gap-3 mb-3 px-3 py-2.5 rounded-lg bg-brand_danger_bg border border-brand_danger_line flex-shrink-0">
          <div className="flex-1 min-w-[260px]">
            <div className="text-[12.5px] font-semibold text-content">
              {stranded.name} was created, but their access didn’t finish
              saving.
            </div>
            <div className="text-[11.5px] text-content/85">
              {outcomeSentence(stranded.outcome)}
              {stranded.outcome.reason ? ` ${stranded.outcome.reason}` : ""}
            </div>
          </div>
          <button
            onClick={handleRetry}
            disabled={saving}
            className="text-[12px] font-medium px-3 py-1.5 rounded-md bg-brand_navy text-custom-white hover:bg-brand_navy/85 flex-shrink-0"
          >
            {saving ? "Retrying…" : "Retry access"}
          </button>
          <button
            onClick={onComplete}
            className="text-[11.5px] font-medium text-content/85 flex-shrink-0 hover:underline"
          >
            Leave it for now
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col overflow-auto thin-scrollbar">
        {step === "identity" && (
          <UserFields onValidityChange={setIdentityValid} />
        )}

        {step === "type" && (
          <StepAccessType
            value={accessType}
            onChange={setAccessType}
            who={
              `${ctx.userInfo.first_name} ${ctx.userInfo.last_name}`.trim() ||
              ctx.userInfo.username
            }
            singleStoreOnly={singleStoreOnly}
          />
        )}

        {step === "assignments" && (
          <div className="flex-1 min-h-0 flex flex-col">
            <AccessPanel
              picks={picks}
              onPicksChange={setPicks}
              companyGroups={companyGroups}
              onCompanyGroupsChange={setCompanyGroups}
              groupStores={groupStores}
              onGroupStoresChange={setGroupStores}
              defaultMode={accessType}
              singleStoreOnly={singleStoreOnly}
            />
          </div>
        )}

        {step === "review" && (
          <StepReview
            picks={picks}
            companyIds={sets.companyIds}
            companyGroups={companyGroups}
            groupStores={groupStores}
            onGoTo={goTo}
          />
        )}
      </div>

      {/* Sticky, because the assignments step is taller than the panel and
          the way forward should not be below the fold of a scroll area. */}
      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3 -mx-4 mt-3 bg-custom-white border-t border-gray-100 flex-shrink-0">
        <button
          onClick={onCancel}
          className="text-[12px] font-semibold px-2 py-1.5 rounded-md text-brand_navy hover:bg-gray-50"
        >
          Cancel
        </button>
        <div className="flex items-center gap-2.5">
          <span className="text-[11.5px] text-content/85">
            Step {at + 1} of {STEP_ORDER.length}
          </span>
          {at > 0 && (
            <button
              onClick={back}
              disabled={saving}
              className="text-[12px] font-medium px-3.5 py-1.5 rounded-md border border-brand_line text-content hover:bg-gray-50"
            >
              Back
            </button>
          )}
          <button
            onClick={isLast ? handleCreate : advance}
            disabled={!canAdvance || saving || stranded !== null}
            className={`text-[12px] font-medium px-4 py-1.5 rounded-md text-custom-white ${
              canAdvance && !saving && stranded === null
                ? "bg-brand_navy hover:bg-brand_navy/85"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {isLast ? (saving ? "Creating…" : "Create user") : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateUserWizard;
