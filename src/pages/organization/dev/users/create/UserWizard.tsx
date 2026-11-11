// Hooks
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import { useOrganizationCtx } from "../../hooks";
import { usePanelFit } from "../../utils/panelFit";
import { useSeededPicks, useAccessSave, outcomeSentence, NOTHING_HELD, useAccessMode, failedReadsText, useHeldAccess, useExistingAccess } from "./hooks";

// Redux
import { setUnsavedWizard } from "../../../../../features/dev/devOrganizationSlice";
import {
  clearDuplicateSource,
  markUserInfoSaved,
  resetUserInfo,
  setRefresh,
  setUserCompanyIds,
  setUserInfo,
} from "../../../../../features/dev/devUsersSlice";

// API
import { createUser, updateUser } from "../../../../../api/team";
import { getAllStoresInBaseGroup } from "../../../../../api/baseGroups";

// Utils
import { accessSets, directStoreIds, emptySelectedGroupIds, groupCompanies, hasChanges, NO_PICKS } from "../utils";
import { identityOf, isSingleStoreRole, STEP_FIT, STEP_ORDER } from "./utils";
import {
  createBlockReason,
  duplicateCompanies,
  editBlockReason,
  needsSingleStoreTrim,
  reachableLimit,
  readiness,
  singleStoreNote,
  trimToSingleStore,
} from "./utils/wizardRules";

// Interfaces
import type { AccessPicks } from "../interfaces";
import type { AccessOutcome, WizardStep } from "./interfaces";
import type {
  CompanyBaseGroup,
  GrantMode,
  JsonError,
  Store,
} from "../../../../../interfaces";

// Components
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import ConfirmModal from "../../../../../components-dev/ConfirmModal";
import UserFields from "./components/UserFields";
import AccessPanel from "./components/AccessPanel";
import EffectiveStoresPanel from "./components/EffectiveStoresPanel";
import Stepper from "./components/Stepper";
import StepAccessType from "./components/StepAccessType";
import StepReview from "./components/StepReview";

interface UserWizardProps {
  /**
   * The person being edited, or nothing for Add user. One component for both:
   * Edit is Add, filled in, with every step reachable from the first click.
   */
  editUserId?: number;
  onComplete: () => void;
  onCancel: () => void;
}

/**
 * Add user and Edit user, in four steps. Access type gets its own step, before
 * any store is picked: By group keeps receiving stores, By store never does,
 * and the two look the same in a list of ticks.
 *
 * **Nothing is sent until the last button.** Add: create the account, then its
 * access, outermost first. Edit: identity fields if any moved, then only the
 * access that changed.
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

  /**
   * A person with no access type on file (`access_mode` null: made in prod's
   * wizard, or before types existed). Save treats the type as unset and sends
   * every group in the type chosen here, even if nothing else changed.
   */
  const typeUnset =
    editing && ctx.users.find((u) => u.id === editUserId)?.access_mode === null;
  const existing = useExistingAccess(held.heldGroups, held.groupPicks);
  /** Seeded from what they hold as the reads land, except after a save that
   *  stopped part way: see useSeededPicks. */
  const { picks, setPicks, keepPicks } = useSeededPicks(
    editing,
    existing.picks,
    { ...NO_PICKS, mode: "all" },
  );

  /**
   * The identity as it was opened, for "did any of it change", from the slice
   * (a copy taken at mount was retaken after a tab switch).
   */
  const identityBefore = ctx.userInfoBefore ? identityOf(ctx.userInfoBefore) : null;
  const emailBefore = ctx.userInfoBefore?.email ?? "";

  /**
   * Edit: every held group's stores, fetched as soon as the groups are known,
   * so Effective stores can count. A list that won't load counts as empty.
   */
  const rosterAsked = useRef(new Set<number>());
  useEffect(() => {
    if (!editing) return;
    held.heldGroups.forEach((g) => {
      if (groupStores[g.id] !== undefined || rosterAsked.current.has(g.id)) return;
      rosterAsked.current.add(g.id);
      const land = (stores: Store[]) =>
        setGroupStores((prev) =>
          prev[g.id] !== undefined ? prev : { ...prev, [g.id]: stores },
        );
      getAllStoresInBaseGroup(ctx.url, ctx.token, g.id)
        .then((resp) => {
          const j = resp.data;
          land(
            j.error === 0
              ? (j.assigned_stores as Store[]).filter((s) => s.store_name != null)
              : [],
          );
        })
        .catch(() => land([]));
    });
  }, [editing, held.heldGroups]);

  const singleStoreOnly = isSingleStoreRole(ctx.userInfo.role);

  usePanelFit(STEP_FIT[step]);

  // ── Add: start clean, or from the person being duplicated ─────────────
  /**
   * The Duplicate this Add was opened for, taken once and cleared from the
   * slice. Held in state because StrictMode runs the effect twice.
   */
  const [source] = useState(() => (editing ? null : ctx.duplicateSource));
  useEffect(() => {
    if (editing) return;
    ctx.dispatch(resetUserInfo());

    if (!source) return;
    ctx.dispatch(clearDuplicateSource());
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
    // The source's companies and groups are picked in their own right, not
    // re-derived from its stores: a group with every store unticked still
    // copies, and so does a company with no group in it. The access type
    // copies too, read from what the source holds.
    setPicks({
      companies: duplicateCompanies(source),
      baseGroups: source.groups.map((g) => g.id),
      mode: source.mode,
      stores: source.stores,
    });
    // Runs once, on open. A duplicate is a starting point, not a binding.
  }, []);

  /**
   * A role change drags the access with it, or the form holds what the server
   * refuses (Single Store is one store, By store). The old picks are kept, the
   * note says what changed, and changing the role back restores them. Only a
   * role change does this; a Single Store person in Edit shows as they are.
   */
  const wasSingle = useRef(singleStoreOnly);
  const beforeSingle = useRef<AccessPicks | null>(null);
  const [singleNote, setSingleNote] = useState<string | null>(null);
  useEffect(() => {
    if (singleStoreOnly === wasSingle.current) return;
    wasSingle.current = singleStoreOnly;
    if (singleStoreOnly) {
      if (!needsSingleStoreTrim(picks)) return;
      const next = trimToSingleStore(picks);
      beforeSingle.current = picks;
      setPicks(next);
      setSingleNote(singleStoreNote(picks, next));
    } else if (beforeSingle.current) {
      setPicks(beforeSingle.current);
      beforeSingle.current = null;
      setSingleNote(null);
    }
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
   *  company link its reads require. Seeded from the groups already held. */
  const groupCompany = useMemo(() => {
    const fromPanel = groupCompanies(companyGroups);
    held.heldGroups.forEach((g) => {
      if (fromPanel[g.id] === undefined) fromPanel[g.id] = g.company;
    });
    return fromPanel;
  }, [companyGroups, held.heldGroups]);

  const before = useMemo(() => {
    if (!editing) return NOTHING_HELD;
    const was = accessSets(existing.picks, existing.carried, groupCompany);
    // No grants on file to compare against, so every group is written.
    // Companies keep their real "before" — those are recorded either way.
    return typeUnset ? { ...was, grants: [] } : was;
  }, [editing, existing, groupCompany, typeUnset]);
  const sets = useMemo(
    () =>
      accessSets(picks, editing ? existing.carried : undefined, groupCompany),
    [picks, editing, existing.carried, groupCompany],
  );
  const emptyGroups = emptySelectedGroupIds(sets);
  const hasAccess = sets.companyIds.length > 0 || sets.grants.length > 0;

  const identityDirty =
    editing && identityBefore !== null && identityBefore !== identityOf(ctx.userInfo);
  const accessDirty = editing && hasChanges(sets, before);

  const stepReady = readiness({
    identity: identityValid,
    switching,
    hasAccess,
    emptyGroups: emptyGroups.length,
  });
  /** Add only: the step bar stops at the first step that isn't ready. Edit
   *  keeps every step reachable; its Save checks them all. */
  const limit = editing ? STEP_ORDER.length - 1 : reachableLimit(stepReady);

  const at = STEP_ORDER.indexOf(step);
  const isLast = step === "review";
  /** In Edit, a step whose half hasn't changed can be passed as it is: a
   *  person with no access can still get to Review to fix their name. */
  const canAdvance =
    editing && step === "identity"
      ? !identityDirty || stepReady.identity
      : editing && step === "assignments"
        ? !accessDirty || stepReady.assignments
        : stepReady[step];
  /** Edit saves when something moved and what moved is ready; there is no
   *  point sending an unchanged person back to the server. */
  const editReason = editing
    ? editBlockReason({
        ready: stepReady,
        identityDirty,
        accessDirty,
        hasAccess,
        held: held.failed.length > 0 ? "failed" : held.loaded ? "loaded" : "loading",
      })
    : null;
  const canSave = editing ? editReason === null : canAdvance;

  const goTo = (next: WizardStep) => {
    if (STEP_ORDER.indexOf(next) > limit) return;
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

  /**
   * Unsaved work, and whose: Cancel, Back to users and the tab bar ask before
   * losing it. Add counts anything filled in (a Duplicate too); Edit counts a
   * change from what was opened.
   */
  const u = ctx.userInfo;
  const addDirty =
    !editing &&
    (u.username !== "" ||
      u.email !== "" ||
      u.first_name !== "" ||
      u.last_name !== "" ||
      u.password !== "" ||
      u.role > 0 ||
      u.user_level > 0 ||
      picks.companies.length > 0 ||
      picks.baseGroups.length > 0 ||
      picks.stores.length > 0);
  const unsaved = editing ? identityDirty || accessDirty : addDirty;
  const unsavedFor = editing ? displayName || "this user" : "the new user";
  const [leaving, setLeaving] = useState(false);
  const leave = () => (unsaved && !saving ? setLeaving(true) : onCancel());

  useEffect(() => {
    ctx.dispatch(setUnsavedWizard(unsaved && !saving ? unsavedFor : null));
  }, [unsaved, saving, unsavedFor]);
  useEffect(() => () => void ctx.dispatch(setUnsavedWizard(null)), []);

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
    // The whole set again, landed calls included: each replaces its own
    // group, so re-sending a grant writes the same grant.
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
        // update_user writes `security` and `template` on every call, so the
        // row's own values go back (0 would clear them); null sends 0.
        const row = ctx.users.find((x) => x.id === editUserId);
        const resp = await updateUser(
          ctx.url,
          ctx.token,
          ctx.userInfo,
          row?.security ?? 0,
          row?.template ?? 0,
        );
        if (resp.data.error !== 0) {
          toast.error(resp.data.msg ?? "Their details could not be saved");
          setStep("identity");
          setSaving(false);
          return;
        }
        ctx.dispatch(markUserInfoSaved());
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
        // Re-read after a part-way save: it moves only the "before" side, so
        // what didn't save stays different and Save changes sends just that.
        keepPicks();
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
  /** Under a greyed-out Create user or Save changes, the reason. */
  const blockReason =
    isLast && !saving && stranded === null
      ? editing
        ? editReason
        : createBlockReason(stepReady, { hasAccess })
      : null;

  return (
    <div className="w-full h-full flex flex-col min-h-0 px-4 pt-3 pb-0">
      <div className="flex items-center gap-2 mb-2 flex-shrink-0">
        <button
          onClick={leave}
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

      {leaving && (
        <ConfirmModal
          title="Discard changes?"
          message={`Discard your changes to ${unsavedFor}? Nothing has been saved.`}
          confirmLabel="Discard"
          onConfirm={() => {
            setLeaving(false);
            onCancel();
          }}
          onCancel={() => setLeaving(false)}
        />
      )}

      <h2 className="text-[17px] font-bold text-content mb-2.5 flex-shrink-0">
        {editing ? `Edit ${displayName}` : "Add user"}
      </h2>

      <div data-help="wizard" className="flex-shrink-0 mb-4">
        <Stepper current={step} furthest={furthest} limit={limit} onGoTo={goTo} />
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

      {/* A failed read says so, rather than showing the person holding
          nothing. */}
      {editing && held.failed.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-3 px-3 py-2 rounded-lg bg-brand_danger_bg border border-brand_danger_line flex-shrink-0">
          <div className="flex-1 min-w-[260px] text-[11.5px] text-content leading-snug">
            <span className="font-semibold">
              Couldn’t read their {failedReadsText(held.failed)}.
            </span>{" "}
            What they hold may be missing below, so Save changes is off until
            it loads.
          </div>
          <button
            onClick={held.reload}
            className="text-[12px] font-medium px-3 py-1.5 rounded-md bg-brand_navy text-custom-white hover:bg-brand_navy/85 flex-shrink-0"
          >
            Retry
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
            {failure.reason ? ` ${failure.reason}` : ""} What did save has
            been re-read, and your changes are still on screen. Press Save
            changes to send the rest.
          </div>
        </div>
      )}

      {singleNote && (
        <div
          role="status"
          className="flex items-start gap-3 mb-3 px-3 py-2 rounded-lg bg-filter_active border border-filter_active_border flex-shrink-0"
        >
          <div className="flex-1 text-[11.5px] text-content leading-snug">
            {singleNote}
          </div>
          <button
            onClick={() => setSingleNote(null)}
            className="text-[11.5px] font-medium text-content/95 hover:underline flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col overflow-auto thin-scrollbar">
        {step === "identity" && (
          <UserFields
            onValidityChange={setIdentityValid}
            editing={
              editing
                ? {
                    userid: editUserId,
                    email: emailBefore,
                    blankNames: {
                      first: !ctx.userInfoBefore?.first_name.trim(),
                      last: !ctx.userInfoBefore?.last_name.trim(),
                    },
                  }
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
            typeUnset={typeUnset}
          />
        )}

        {step === "assignments" && (
          <div className="flex-1 min-h-0 flex flex-col">
            <AccessPanel
              picks={picks}
              heldGroups={held.heldGroups}
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
                    heldGroups={held.heldGroups}
                    companyGroups={companyGroups}
                    groupStores={groupStores}
                    directStoreIds={directStoreIds(
                      existing.carried,
                      held.heldGroups.map((g) => g.id),
                      groupStores,
                    )}
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
            modeBefore={editing && !typeUnset ? existing.picks.mode : undefined}
            typeUnset={typeUnset}
            heldGroups={held.heldGroups}
          />
        )}
      </div>

      {/* Sticky, because the assignments step is taller than the panel and
          the way forward should not be below the fold of a scroll area. */}
      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3 -mx-4 mt-3 bg-custom-white border-t border-line_hair flex-shrink-0">
        <button
          onClick={leave}
          className="text-[12px] font-semibold px-2 py-1.5 rounded-md text-brand_navy hover:bg-gray-50"
        >
          Cancel
        </button>
        <div className="flex items-center gap-2.5">
          {blockReason && (
            <span className="text-[11.5px] font-semibold text-content" role="status">
              {blockReason}
            </span>
          )}
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
