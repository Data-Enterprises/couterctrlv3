import { useMemo } from "react";
import { useOrganizationCtx } from "../../hooks";
import type { AccessPicks, CarriedAccess } from "./accessSets";

export interface ExistingAccess {
  /** What the panel may show and the editor may change. */
  picks: AccessPicks;
  /** What the panel cannot show, kept out of its reach entirely. */
  carried: CarriedAccess;
}

/**
 * What the selected user already holds, split by what this editor can see.
 *
 * The split is the whole point. Every column in the panel is scoped — a level
 * 7 is offered their own companies, and only groups and stores inside them —
 * while all three endpoints REPLACE what the person holds. So an id that is
 * merely absent from the screen would be removed by the next save.
 *
 * Anything belonging to a company this editor cannot see is therefore carried
 * rather than picked: it is added back at save time and no control on the
 * screen can reach it. Clear all empties the picks and leaves the carried set
 * alone, which is exactly the behaviour wanted — you cannot clear what you
 * were never shown.
 *
 * The three sources are the ones the detail screen already loads: the user's
 * company ids seeded when the row was opened, their active base groups, and
 * their assigned stores.
 */
export const useExistingAccess = (): ExistingAccess => {
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
    const groups = ctx.activeBaseGroups;
    const stores = ctx.selectedUserStores.assigned;
    const seen = (companyId: number) => visibleCompanyIds.has(companyId);

    return {
      picks: {
        companies: ctx.userCompanyIds.filter(seen),
        baseGroups: groups.filter((g) => seen(g.company)).map((g) => g.id),
        // Tagged with group 0: a store from `users/stores` does not say which
        // base group it was granted through, and inventing one would assign a
        // group nobody chose. Zero is dropped before the ids are sent, and the
        // person's real groups come from `activeBaseGroups` above.
        stores: stores
          .filter((s) => seen(s.company))
          .map((s) => ({ ...s, base_group: 0 })),
      },
      carried: {
        companies: ctx.userCompanyIds.filter((id) => !seen(id)),
        baseGroups: groups.filter((g) => !seen(g.company)).map((g) => g.id),
        stores: stores.filter((s) => !seen(s.company)).map((s) => s.storeid),
      },
    };
  }, [
    visibleCompanyIds,
    ctx.userCompanyIds,
    ctx.activeBaseGroups,
    ctx.selectedUserStores.assigned,
  ]);
};
