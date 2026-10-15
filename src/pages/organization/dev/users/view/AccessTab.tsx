import { useEffect, useMemo, useState } from "react";
import { useOrganizationCtx } from "../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import { getUserStores } from "../../../../../api/user";
import {
  getBaseGroupsAssignedToUser,
  getUserGroupPicks,
} from "../../../../../api/team";
import {
  setRefresh,
  setSelectedUserStores,
  setUserCompanyIds,
} from "../../../../../features/dev/devUsersSlice";
import type {
  BaseGroup,
  CompanyBaseGroup,
  JsonError,
  Store,
  UserGroupPick,
} from "../../../../../interfaces";
import AccessPanel from "../access/AccessPanel";
import EffectiveStoresPanel from "./EffectiveStoresPanel";
import EmptyPicksNotice from "../access/EmptyPicksNotice";
import {
  accessSets,
  changedSets,
  emptySelectedGroupIds,
  groupCompanies,
  hasChanges,
  modeOf,
  NO_PICKS,
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

  const [heldGroups, setHeldGroups] = useState<BaseGroup[]>([]);
  const [groupPicks, setGroupPicks] = useState<UserGroupPick[]>([]);
  const existing = useExistingAccess(heldGroups, groupPicks);

  const [picks, setPicks] = useState<AccessPicks>(existing.picks);
  const [companyGroups, setCompanyGroups] = useState<
    Record<number, CompanyBaseGroup[]>
  >({});
  const [groupStores, setGroupStores] = useState<Record<number, Store[]>>({});
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<AccessOutcome | null>(null);

  /**
   * The three things the grid row does not carry: the base groups the person
   * holds and how, their stores, and which group each picked store came
   * through.
   *
   * All three are needed before the panel can be seeded. Without the groups
   * the screen shows an empty panel for somebody who holds plenty — the bug
   * that made a freshly granted group look like it had never saved. Without
   * the picks every store looks direct, and the save then revokes nothing.
   */
  const loadHeld = () => {
    if (!ctx.selectedUserId) return;
    getBaseGroupsAssignedToUser(ctx.url, ctx.token, ctx.selectedUserId)
      .then((resp) => {
        const j = resp.data;
        // `active` is already the held half — the endpoint splits them, and
        // `inactive` is what they could be given rather than what they have.
        setHeldGroups(j.error === 0 ? ((j.active ?? []) as BaseGroup[]) : []);
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching base groups " + err.message),
      );

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

  /** A held group contributes its company, so an Auto grant creates the
   *  company link the group reads require. Seeded from the groups the person
   *  already holds, so it works before any company is opened in the panel. */
  const groupCompany = useMemo(() => {
    const fromPanel = groupCompanies(companyGroups);
    heldGroups.forEach((g) => {
      if (fromPanel[g.id] === undefined) fromPanel[g.id] = g.company;
    });
    return fromPanel;
  }, [companyGroups, heldGroups]);

  const before = useMemo(
    () => accessSets(existing.picks, existing.carried, groupCompany),
    [existing, groupCompany],
  );
  const next = useMemo(
    () => accessSets(picks, existing.carried, groupCompany),
    [picks, existing.carried, groupCompany],
  );
  const changed = changedSets(next, before);
  const dirty = hasChanges(next, before);
  const emptyGroups = emptySelectedGroupIds(next);
  const canSave = dirty && !saving && emptyGroups.length === 0;

  /** Ticked stores, which only `selected` groups have — an Auto group's
   *  stores are included without anybody naming them. */
  const picked = picks.stores.filter(
    (s) => modeOf(picks, s.base_group) === "selected",
  ).length;

  /**
   * "East (Houchens)" for a group with nothing picked.
   *
   * Resolved from the groups this person holds, not from the panel's loaded
   * companies — the panel only knows a group whose company you have browsed
   * to, so it said "Group 54" for exactly the ones worth warning about.
   */
  const emptyLabels = useMemo(
    () =>
      emptyGroups.map((id) => {
        const held = heldGroups.find((g) => g.id === id);
        if (held) {
          return held.company_name
            ? `${held.name} (${held.company_name})`
            : held.name;
        }
        const browsed = Object.values(companyGroups)
          .flat()
          .find((g) => g.id === id);
        return browsed?.name ?? `Group ${id}`;
      }),
    [emptyGroups, heldGroups, companyGroups],
  );

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
      <p className="text-[11.5px] text-content/85 mb-2 flex-shrink-0 leading-snug">
        Pick companies, base groups and individual stores. Effective stores
        shows what they add up to.
      </p>

      {/* Above the card, not under it: a warning read after the thing it
          warns about has already been scrolled past. */}
      {emptyLabels.length > 0 && (
        <div className="mb-2 flex-shrink-0">
          <EmptyPicksNotice labels={emptyLabels} />
        </div>
      )}

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

      <div className="flex-1 min-h-0 flex flex-col">
        <AccessPanel
          picks={picks}
          onPicksChange={setPicks}
          companyGroups={companyGroups}
          onCompanyGroupsChange={setCompanyGroups}
          groupStores={groupStores}
          onGroupStoresChange={setGroupStores}
          hideFooter
          hideEmptyNotice
          rightColumn={
            <EffectiveStoresPanel
              picks={picks}
              companyGroups={companyGroups}
              groupStores={groupStores}
              directStoreIds={existing.carried.stores}
              assignedStores={ctx.selectedUserStores.assigned}
            />
          }
        />

        {/* One bar under the card: what is picked on the left, what to do
            about it on the right. The Save button lives here rather than up
            by the title so it sits beside the thing it saves. */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 mt-2 rounded-lg bg-bkg shadow-card-sm flex-shrink-0">
          <div className="text-[12px] text-content min-w-0">
            <span className="font-semibold">
              {picks.baseGroups.length} base group
              {picks.baseGroups.length === 1 ? "" : "s"}, {picked} store
              {picked === 1 ? "" : "s"} picked
            </span>
            <span className="text-content/85">
              {" · "}
              {dirty ? summary() : "No unsaved changes"}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setPicks(NO_PICKS)}
              className="text-[11.5px] font-semibold text-brand_navy hover:underline"
            >
              Clear all
            </button>
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
        </div>
      </div>
    </div>
  );
};

export default AccessTab;
