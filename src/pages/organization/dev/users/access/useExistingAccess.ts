import { useMemo } from "react";
import { useOrganizationCtx } from "../../hooks";
import type { BaseGroup, UserGroupPick } from "../../../../../interfaces";
import type { SelectableStore } from "../../types";
import {
  accessModeOf,
  type AccessPicks,
  type CarriedAccess,
} from "./accessSets";

export interface ExistingAccess {
  /** What the panel may show and the editor may change. */
  picks: AccessPicks;
  /** What the panel cannot show or does not own, kept out of its reach. */
  carried: CarriedAccess;
}

/**
 * What the selected user already holds.
 *
 * ### Two kinds of thing are kept out of the panel's reach
 *
 * **Companies this editor cannot see.** Every column is scoped — a level 7 is
 * offered their own companies and the stores inside them — while the company
 * save REPLACES. An id merely absent from the screen would be removed by the
 * next save, so it is carried and added back at save time. `Clear all` empties
 * the picks and leaves the carried set alone, which is right: you cannot clear
 * what you were never shown.
 *
 * **Stores no base group explains.** These are direct assignments — rows in
 * `assigned` with no `assigned_via` behind them, from before groups granted
 * anything, or written by hand. Nothing on this screen granted them and no
 * group change can revoke them, so they are carried rather than picked: they
 * show in the effective list as `direct` and are never re-sent.
 *
 * ### Where the picks come from now
 *
 * `groupPicks` is `/groups/user_group_picks`, which says which stores were
 * selected and through which group. Before it existed this hook tagged every
 * store with group 0 and left a comment admitting the guess — a store from
 * `users/stores` carried no group, and inventing one assigned a group nobody
 * chose. The provenance is real now, so the guess is gone.
 *
 * `heldGroups` is passed in rather than read from the base-group slice. The
 * dev slice's `setUserBaseGroups` is dispatched by nothing in this tree — only
 * the legacy pages fill their own copy — so `activeBaseGroups` was always
 * empty here. Every user looked as though they held no groups, which made the
 * panel show nothing and a save re-grant everything.
 */
export const useExistingAccess = (
  heldGroups: BaseGroup[],
  groupPicks: UserGroupPick[],
): ExistingAccess => {
  const ctx = useOrganizationCtx();

  const visibleCompanyIds = useMemo(
    () =>
      new Set(
        ctx.isProgrammer
          ? ctx.allCompanies.map((c) => c.id)
          : ctx.companies.map((c) => c.company),
      ),
    [ctx.isProgrammer, ctx.allCompanies, ctx.companies],
  );

  return useMemo(() => {
    const stores = ctx.selectedUserStores.assigned;
    const seen = (companyId: number) => visibleCompanyIds.has(companyId);

    /** Company details for a picked store, which `user_group_picks` does not
     *  carry — joined from the stores the detail screen already loaded. */
    const storeById = new Map(stores.map((s) => [s.storeid, s]));

    /** Scoped to companies this editor can see — the panel cannot show the
     *  rest, so offering an edit to them would be an edit that never lands. */
    const visibleGroups = heldGroups.filter((g) => seen(g.company));
    const heldIds = new Set(visibleGroups.map((g) => g.id));

    /** The person's one answer, read back from rows that each carry their
     *  own. Shared with Duplicate, so the two cannot disagree. */
    const mode = accessModeOf(visibleGroups);

    /** Only picks for groups this editor can see. A pick inside a company they
     *  cannot reach belongs to a group they cannot send, so showing it would
     *  offer an edit that never leaves. */
    const pickedStores: SelectableStore[] = groupPicks
      .filter((p) => heldIds.has(p.groupid))
      .map((p) => {
        const store = storeById.get(p.storeid);
        return {
          storeid: p.storeid,
          store_number: p.store_number ?? store?.store_number ?? "",
          store_name: p.store_name ?? store?.store_name ?? "",
          company: store?.company ?? 0,
          company_name: store?.company_name ?? "",
          base_group: p.groupid,
        };
      });

    const pickedIds = new Set(pickedStores.map((s) => s.storeid));

    return {
      picks: {
        companies: ctx.userCompanyIds.filter(seen),
        baseGroups: visibleGroups.map((g) => g.id),
        mode,
        stores: pickedStores,
      },
      carried: {
        companies: ctx.userCompanyIds.filter((id) => !seen(id)),
        // Everything with no pick behind it: the direct assignments, plus the
        // rosters of groups held as `all` — neither is this panel's to write.
        stores: stores
          .filter((s) => !pickedIds.has(s.storeid))
          .map((s) => s.storeid),
      },
    };
  }, [
    visibleCompanyIds,
    ctx.userCompanyIds,
    heldGroups,
    ctx.selectedUserStores.assigned,
    groupPicks,
  ]);
};
