import { useEffect, useMemo, useState } from "react";
import { useOrganizationCtx } from "../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import { getUserStores } from "../../../../../api/user";
import { getUserGroupPicks } from "../../../../../api/team";
import {
  setRefresh,
  setSelectedUserStores,
  setUserCompanyIds,
} from "../../../../../features/dev/devUsersSlice";
import type {
  CompanyBaseGroup,
  JsonError,
  Store,
  UserGroupPick,
} from "../../../../../interfaces";
import AccessPanel from "../access/AccessPanel";
import EffectiveStoresPanel from "./EffectiveStoresPanel";
import {
  accessSets,
  changedSets,
  emptySelectedGroupIds,
  hasChanges,
  type AccessPicks,
} from "../access/accessSets";
import { useExistingAccess } from "../access/useExistingAccess";
import {
  useAccessSave,
  outcomeSentence,
  type AccessOutcome,
} from "../access/useAccessSave";

/**
 * One tab for everything a person's access is made of.
 *
 * It replaces the Companies, Base groups and Stores tabs, which were three
 * screens asking three halves of one question — and which could not express
 * the common answer at all, because a company with no stores had no row to
 * tick anywhere.
 *
 * Add and Edit share both the picker and the save. The differences here are
 * that Edit starts from what the person already holds, sends only the groups
 * that moved, and shows the consequence beside the controls: the effective
 * store list with the group behind each row.
 */
const AccessTab = () => {
  const toast = useToast();
  const ctx = useOrganizationCtx();
  const saveAccess = useAccessSave();

  const [groupPicks, setGroupPicks] = useState<UserGroupPick[]>([]);
  const existing = useExistingAccess(groupPicks);

  const [picks, setPicks] = useState<AccessPicks>(existing.picks);
  const [companyGroups, setCompanyGroups] = useState<
    Record<number, CompanyBaseGroup[]>
  >({});
  const [groupStores, setGroupStores] = useState<Record<number, Store[]>>({});
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<AccessOutcome | null>(null);

  /**
   * The two things the grid row does not carry: the person's stores, and which
   * group each picked store came through.
   *
   * Both are needed before the panel can be seeded — without the picks every
   * store would look direct, and a save would then revoke nothing and grant
   * nothing.
   */
  const loadHeld = () => {
    if (!ctx.selectedUserId) return;
    const noNulls = (arr: Store[]) => arr.filter((s) => s.store_name !== null);
    getUserStores(ctx.url, ctx.token, ctx.selectedUserId)
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0) return;
        ctx.dispatch(
          setSelectedUserStores({
            assigned: noNulls(j.assigned_stores),
            unassigned: noNulls(j.unassigned_stores),
          }),
        );
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching stores " + err.message),
      );

    getUserGroupPicks(ctx.url, ctx.token, ctx.selectedUserId)
      .then((resp) => {
        const j = resp.data;
        setGroupPicks(j.error === 0 ? (j.data ?? []) : []);
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching store picks " + err.message),
      );
  };

  useEffect(loadHeld, [ctx.selectedUserId]);

  /** Re-seed whenever what they hold changes under us — a different user
   *  opened, or the stores and picks arriving a moment after the tab did. */
  useEffect(() => {
    setPicks(existing.picks);
    setFailure(null);
  }, [existing.picks]);

  const before = useMemo(
    () => accessSets(existing.picks, existing.carried),
    [existing],
  );
  const next = useMemo(
    () => accessSets(picks, existing.carried),
    [picks, existing.carried],
  );
  const changed = changedSets(next, before);
  const dirty = hasChanges(next, before);
  const emptyGroups = emptySelectedGroupIds(next);
  const canSave = dirty && !saving && emptyGroups.length === 0;

  const summary = () => {
    const bits: string[] = [];
    if (changed.grants.length > 0) {
      bits.push(
        `${changed.grants.length} group${changed.grants.length === 1 ? "" : "s"} to write`,
      );
    }
    if (changed.revoke.length > 0) {
      bits.push(
        `${changed.revoke.length} to remove`,
      );
    }
    if (changed.companies) bits.push("companies");
    return bits.join(" · ");
  };

  const handleSave = async () => {
    setSaving(true);
    setFailure(null);
    const outcome = await saveAccess(ctx.selectedUserId, next, before);
    setSaving(false);
    ctx.dispatch(setRefresh(true));

    if (!outcome.ok) {
      setFailure(outcome);
      // Re-read anyway: a per-group save that stopped half way has written
      // some groups, and the screen must show which rather than its own
      // optimistic guess.
      loadHeld();
      return;
    }
    // Keep the ids the rest of the screen reads in step with what was just
    // written, so a second save this session starts from the new truth.
    ctx.dispatch(setUserCompanyIds(next.companyIds));
    loadHeld();
    toast.success(outcome.saved.length === 0 ? "Nothing to save" : "Access saved");
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 flex-shrink-0">
        <span className="text-[11.5px] text-content/85">
          {dirty
            ? `Unsaved changes — ${summary()}`
            : "Companies and base groups this person holds, and what they add up to"}
        </span>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={`text-[12px] font-medium px-4 py-1.5 rounded-md text-custom-white ${
            canSave
              ? "bg-brand_navy hover:bg-brand_navy/85"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          {saving ? "Saving…" : "Save access"}
        </button>
      </div>

      {failure && (
        <div className="mb-2 px-3 py-2 rounded-lg bg-brand_danger_bg border border-brand_danger_line flex-shrink-0">
          <div className="text-[12.5px] font-semibold text-content">
            Access didn’t finish saving.
          </div>
          <div className="text-[11.5px] text-content/85">
            {outcomeSentence(failure)}
            {failure.reason ? ` ${failure.reason}` : ""} The lists have been
            re-read, so what you see is what saved. Press Save access to try
            the rest.
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 flex gap-3">
        <div className="flex-1 min-w-0">
          <AccessPanel
            picks={picks}
            onPicksChange={setPicks}
            companyGroups={companyGroups}
            onCompanyGroupsChange={setCompanyGroups}
            groupStores={groupStores}
            onGroupStoresChange={setGroupStores}
          />
        </div>
        <div className="w-[320px] flex-shrink-0 hidden lg:block">
          <EffectiveStoresPanel
            picks={picks}
            companyGroups={companyGroups}
            groupStores={groupStores}
            directStoreIds={existing.carried.stores}
            assignedStores={ctx.selectedUserStores.assigned}
          />
        </div>
      </div>
    </div>
  );
};

export default AccessTab;
