import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { useOrganizationCtx } from "../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import { createUser, updateUser } from "../../../../../api/team";
import {
  resetUserInfo,
  setRefresh,
  setUserCompanyIds,
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
import EffectiveStoresPanel from "../view/EffectiveStoresPanel";
import Stepper from "./Stepper";
import { STEP_ORDER, type WizardStep } from "./wizardSteps";
import { usePanelFit, type PanelFit } from "../../panelFit";
import StepAccessType from "./StepAccessType";
import StepReview from "./StepReview";
import {
  accessSets,
  emptySelectedGroupIds,
  groupCompanies,
  hasChanges,
  NO_PICKS,
  type AccessPicks,
} from "../access/accessSets";
import {
  useAccessSave,
  outcomeSentence,
  NOTHING_HELD,
  type AccessOutcome,
} from "../access/useAccessSave";
import { useAccessMode } from "../access/useAccessMode";
import { useHeldAccess } from "../access/useHeldAccess";
import { useExistingAccess } from "../access/useExistingAccess";

interface UserWizardProps {
  /**
   * The person being edited, or nothing for Add user.
   *
   * One component for both on purpose. Edit used to be two tabs — Basic info
   * and Access — that looked nothing like the four steps a person was created
   * through, so the same question ("by group or by store?") was asked one way
   * on the way in and could not be asked at all afterwards. Now Edit is Add,
   * filled in: same steps, same order, same review, every step reachable from
   * the first click.
   */
  editUserId?: number;
  onComplete: () => void;
  onCancel: () => void;
}

/**
 * What the panel should be while each step is open.
 *
 * Every step gets a real height rather than hugging its content. `auto` reads
 * well on paper and clips in practice: the panel is capped at the viewport,
 * and with no definite height of its own the flex chain inside it never
 * establishes a scroll container — so a form taller than the cap lost its
 * bottom rather than scrolling, and a step scrolled part-way lost its top.
 * A number plus that cap gives both: the panel fits the step on a tall
 * screen, and the step scrolls inside it on a short one.
 *
 * The widths are what each step actually needs — step one is a form beside
 * its aside, assignments is four columns, the other two are reading.
 */
const STEP_FIT: Record<WizardStep, PanelFit> = {
  identity: { width: 1180, height: 680 },
  type: { width: 1020, height: 560 },
  assignments: { width: 1360, height: 700 },
  review: { width: 1100, height: 700 },
};

/**
 * The single-store role, as the form holds it.
 *
 * `role` is the option value from `constants.roles` — `1` is Single Store —
 * stored as a number, and the server's `SINGLE_STORE_ROLE` is that same `1`.
 * This used to compare the role against the TEXT "singlestore", which a
 * number can never equal, so By group was never greyed out for anyone and
 * the server's refusal was the first anybody heard of it.
 */
const isSingleStoreRole = (role: unknown) => Number(role) === 1;

/** The identity fields `update_user` writes, for telling whether any moved. */
const identityOf = (info: {
  first_name: string;
  last_name: string;
  email: string;
  role: number | string;
  user_level: number;
}) =>
  [info.first_name, info.last_name, info.email, String(info.role), info.user_level].join(
    "\u0000",
  );

/**
 * Add user and Edit user, in four steps.
 *
 * **Why steps.** Access type is a real decision with consequences nobody can
 * see on the finished screen — a person held By group keeps receiving stores
 * for years, one held By store never does, and both look identical in a list
 * of ticks. Asking it on its own screen, before any store is picked, is the
 * point of the step rather than ceremony.
 *
 * **Nothing is sent until the last button.** Add: create the account, then
 * its access outermost first. Edit: the identity fields if any moved, then
 * only the access that changed.
 */
const UserWizard = ({ editUserId, onComplete, onCancel }: UserWizardProps) => {
  const toast = useToast();
  const ctx = useOrganizationCtx();
  const saveAccess = useAccessSave();
  const switchMode = useAccessMode();
  const editing = editUserId !== undefined && editUserId > 0;

  const [step, setStep] = useState<WizardStep>("identity");
  // Edit opens with every step reachable: there is nothing to fill in before
  // a later step makes sense, because it is all filled in already.
  const [furthest, setFurthest] = useState<WizardStep>(
    editing ? "review" : "identity",
  );
  const [picks, setPicks] = useState<AccessPicks>({ ...NO_PICKS, mode: "all" });
  const [companyGroups, setCompanyGroups] = useState<
    Record<number, CompanyBaseGroup[]>
  >({});
  const [groupStores, setGroupStores] = useState<Record<number, Store[]>>({});
  const [identityValid, setIdentityValid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [switching, setSwitching] = useState(false);
  /** Add only. Set once the account exists, so the screen stops pretending
   *  the form is still unsent. */
  const [stranded, setStranded] = useState<{
    userid: number;
    name: string;
    outcome: AccessOutcome;
  } | null>(null);
  /** Edit only. An access save that stopped part way. */
  const [failure, setFailure] = useState<AccessOutcome | null>(null);

  // ── What the person already holds (Edit) ──────────────────────────────
  const held = useHeldAccess(editing ? editUserId : 0);
  const existing = useExistingAccess(held.heldGroups, held.groupPicks);

  /**
   * The identity as it was opened, for "did any of it change". Captured once,
   * on the first render that has a username — the grid fills `userInfo`
   * before this mounts, so that is the first render.
   */
  const identityBefore = useRef<string | null>(null);
  const emailBefore = useRef("");
  if (editing && identityBefore.current === null && ctx.userInfo.username) {
    identityBefore.current = identityOf(ctx.userInfo);
    emailBefore.current = ctx.userInfo.email;
  }

  /** Re-seed whenever what they hold arrives or changes under us — the three
   *  reads land a moment apart, and a save re-reads all three. */
  useEffect(() => {
    if (!editing) return;
    setPicks(existing.picks);
  }, [editing, existing.picks]);

  const singleStoreOnly = isSingleStoreRole(ctx.userInfo.role);

  usePanelFit(STEP_FIT[step]);

  // ── Add: start clean, or from the person being duplicated ─────────────
  useEffect(() => {
    if (editing) return;
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
    // The access type copies too. It is one answer per person now, read back
    // from what the source actually holds, so there is nothing to guess.
    setPicks({
      companies: Array.from(new Set(source.groups.map((g) => g.company))),
      baseGroups: source.groups.map((g) => g.id),
      mode: source.mode,
      stores: source.stores,
    });
    // Runs once, on open. A duplicate is a starting point, not a binding.
  }, []);

  // A role change after the fact has to drag the access with it, or the form
  // holds a combination the server will refuse.
  useEffect(() => {
    if (!singleStoreOnly) return;
    setPicks((prev) =>
      prev.mode === "selected" && prev.stores.length <= 1
        ? prev
        : { ...prev, mode: "selected", stores: prev.stores.slice(0, 1) },
    );
  }, [singleStoreOnly]);

  const handleModeChange = async (mode: GrantMode) => {
    if (mode === picks.mode) return;
    setSwitching(true);
    const next = await switchMode(picks, mode, groupStores, setGroupStores);
    setPicks(next);
    setSwitching(false);
  };

  // ── What would be written ─────────────────────────────────────────────
  /** A held group contributes its company, so a By group grant creates the
   *  company link the group reads require. Seeded from the groups the person
   *  already holds, so it works before any company is opened in the panel. */
  const groupCompany = useMemo(() => {
    const fromPanel = groupCompanies(companyGroups);
    held.heldGroups.forEach((g) => {
      if (fromPanel[g.id] === undefined) fromPanel[g.id] = g.company;
    });
    return fromPanel;
  }, [companyGroups, held.heldGroups]);

  const before = useMemo(
    () =>
      editing
        ? accessSets(existing.picks, existing.carried, groupCompany)
        : NOTHING_HELD,
    [editing, existing, groupCompany],
  );
  const sets = useMemo(
    () =>
      accessSets(picks, editing ? existing.carried : undefined, groupCompany),
    [picks, editing, existing.carried, groupCompany],
  );
  const emptyGroups = emptySelectedGroupIds(sets);
  const hasAccess = sets.companyIds.length > 0 || sets.grants.length > 0;

  const identityDirty =
    editing && identityBefore.current !== identityOf(ctx.userInfo);
  const accessDirty = editing && hasChanges(sets, before);

  const stepReady: Record<WizardStep, boolean> = {
    identity: identityValid,
    type: !switching,
    assignments: hasAccess && emptyGroups.length === 0,
    review: true,
  };

  const at = STEP_ORDER.indexOf(step);
  const isLast = step === "review";
  const canAdvance = stepReady[step];
  /** Edit saves when every step is ready and something moved; there is no
   *  point sending an unchanged person back to the server. */
  const canSave = editing
    ? stepReady.identity &&
      stepReady.assignments &&
      !switching &&
      (identityDirty || accessDirty)
    : canAdvance;

  const goTo = (next: WizardStep) => {
    setStep(next);
    if (STEP_ORDER.indexOf(next) > STEP_ORDER.indexOf(furthest)) {
      setFurthest(next);
    }
  };

  const advance = () => goTo(STEP_ORDER[at + 1]);
  const back = () => setStep(STEP_ORDER[at - 1]);

  const displayName =
    `${ctx.userInfo.first_name} ${ctx.userInfo.last_name}`.trim() ||
    ctx.userInfo.username;

  // ── Add ───────────────────────────────────────────────────────────────
  const finishCreate = (name: string) => {
    toast.success(`${name} created`);
    ctx.dispatch(resetUserInfo());
    ctx.dispatch(setRefresh(true));
    onComplete();
  };

  const handleCreate = async () => {
    setSaving(true);
    const name = displayName;

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
      finishCreate(name);
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
    // The whole set again, including the calls that already landed: each
    // replaces its own group, so writing the same grant twice writes the
    // same grant.
    const outcome = await saveAccess(stranded.userid, sets, NOTHING_HELD);
    setSaving(false);
    if (outcome.ok) {
      finishCreate(stranded.name);
      return;
    }
    setStranded({ ...stranded, outcome });
  };

  // ── Edit ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setFailure(null);

    if (identityDirty) {
      try {
        const resp = await updateUser(ctx.url, ctx.token, ctx.userInfo, 0, 0);
        if (resp.data.error !== 0) {
          toast.error(resp.data.msg ?? "Their details could not be saved");
          setStep("identity");
          setSaving(false);
          return;
        }
        identityBefore.current = identityOf(ctx.userInfo);
        emailBefore.current = ctx.userInfo.email;
      } catch (err) {
        toast.error((err as JsonError).message);
        setSaving(false);
        return;
      }
    }

    if (accessDirty) {
      const outcome = await saveAccess(editUserId, sets, before);
      if (!outcome.ok) {
        setSaving(false);
        setFailure(outcome);
        ctx.dispatch(setRefresh(true));
        // Re-read anyway: a save that stopped part way has written some of
        // it, and the screen must show which rather than its own guess.
        held.reload();
        return;
      }
      // Keep the ids the rest of the screen reads in step with what was just
      // written, so a second save this session starts from the new truth.
      ctx.dispatch(setUserCompanyIds(sets.companyIds));
    }

    setSaving(false);
    ctx.dispatch(setRefresh(true));
    toast.success(`${displayName} saved`);
    onComplete();
  };

  const primaryLabel = editing
    ? saving
      ? "Saving…"
      : "Save changes"
    : saving
      ? "Creating…"
      : "Create user";
  const primaryEnabled = isLast
    ? editing
      ? canSave && !saving
      : canAdvance && !saving && stranded === null
    : canAdvance && !saving && stranded === null;

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
        <span className="text-[11.5px] text-content/95" aria-hidden="true">
          /
        </span>
        <span className="text-[11.5px] text-content/95 truncate">
          {editing ? displayName : "Add user"}
        </span>
      </div>

      <h2 className="text-[17px] font-bold text-content mb-2.5 flex-shrink-0">
        {editing ? `Edit ${displayName}` : "Add user"}
      </h2>

      <div data-help="wizard" className="flex-shrink-0 mb-4">
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
            <div className="text-[11.5px] text-content/95">
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
            className="text-[11.5px] font-medium text-content/95 flex-shrink-0 hover:underline"
          >
            Leave it for now
          </button>
        </div>
      )}

      {failure && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-brand_danger_bg border border-brand_danger_line flex-shrink-0">
          <div className="text-[12.5px] font-semibold text-content">
            Access didn’t finish saving.
          </div>
          <div className="text-[11.5px] text-content/95">
            {outcomeSentence(failure)}
            {failure.reason ? ` ${failure.reason}` : ""} The lists have been
            re-read, so what you see is what saved. Press Save changes to try
            the rest.
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col overflow-auto thin-scrollbar">
        {step === "identity" && (
          <UserFields
            onValidityChange={setIdentityValid}
            editing={
              editing
                ? { userid: editUserId, email: emailBefore.current }
                : undefined
            }
          />
        )}

        {step === "type" && (
          <StepAccessType
            value={picks.mode}
            onChange={handleModeChange}
            who={displayName}
            singleStoreOnly={singleStoreOnly}
            editing={editing}
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
              singleStoreOnly={singleStoreOnly}
              rightColumn={
                // Edit only: the one place a direct assignment — a store no
                // group explains — shows up, and Add has none of those.
                editing ? (
                  <EffectiveStoresPanel
                    picks={picks}
                    companyGroups={companyGroups}
                    groupStores={groupStores}
                    directStoreIds={existing.carried.stores}
                    assignedStores={ctx.selectedUserStores.assigned}
                  />
                ) : undefined
              }
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
            modeBefore={editing ? existing.picks.mode : undefined}
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
          <span className="text-[11.5px] text-content/95">
            {editing && !isLast && (identityDirty || accessDirty)
              ? "Unsaved changes · "
              : ""}
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
            onClick={
              isLast ? (editing ? handleSave : handleCreate) : advance
            }
            disabled={!primaryEnabled}
            className={`text-[12px] font-medium px-4 py-1.5 rounded-md text-custom-white ${
              primaryEnabled
                ? "bg-brand_navy hover:bg-brand_navy/85"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {isLast ? primaryLabel : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserWizard;
