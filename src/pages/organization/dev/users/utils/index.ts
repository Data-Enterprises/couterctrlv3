// Interfaces
import type {
  AccessPicks,
  AccessSets,
  CarriedAccess,
  EffectiveStore,
  GroupGrant,
  SelectableStore,
} from "../interfaces";
import type { GrantMode, Store } from "../../../../../interfaces";

export const NO_CARRY: CarriedAccess = {
  companies: [],
  stores: [],
};

/**
 * The stores held with no group behind them at all: granted on the Stores
 * tab, or from before groups granted anything. Effective stores labels these
 * Direct ("no group change can take it away").
 *
 * `carried.stores` is wider than that: it also holds the rosters of groups
 * held By group, which have no pick behind them either. Labelling those
 * Direct meant unticking the group (or switching to By store and unticking
 * a store) left them listed and counted, though the save does remove them.
 * So any store in a held group's roster is left out here.
 */
export const directStoreIds = (
  carried: CarriedAccess,
  heldGroupIds: number[],
  groupStores: Record<number, { storeid: number }[]>,
): number[] => {
  const viaHeld = new Set(
    heldGroupIds.flatMap((id) => (groupStores[id] ?? []).map((s) => s.storeid)),
  );
  return carried.stores.filter((id) => !viaHeld.has(id));
};

/**
 * Holding nothing.
 *
 * `selected` rather than `all` because it is the narrower claim, and this is
 * what Clear all lands on. Callers that know the person's answer spread their
 * own mode over it — the wizard from the Access type step, Edit from what the
 * person already holds — so the default is only ever a floor.
 */
export const NO_PICKS: AccessPicks = {
  companies: [],
  baseGroups: [],
  mode: "selected",
  stores: [],
};

const uniq = (ids: number[]) =>
  Array.from(new Set(ids.filter((id) => Number.isFinite(id) && id !== 0)));

/**
 * A person's one access type, read back from the groups they hold.
 *
 * `all` only when every held group says `all`. The column is physically per
 * link, so a hand-edited or pre-split row could still produce a mix; nothing
 * on these screens creates one, and `selected` is the reading that cannot
 * silently widen somebody — a group read as `selected` keeps its picks, while
 * one read as `all` would hand over every store in it and every store added
 * to it afterwards.
 *
 * Edit and Duplicate both read it here, so the two can never disagree about
 * which kind of person they are looking at.
 *
 * `mode` is null only for a group the person does not hold; the endpoint's
 * default is the safe reading either way.
 */
export const accessModeOf = (
  held: { mode: GrantMode | null }[],
): GrantMode =>
  held.length > 0 && held.every((g) => (g.mode ?? "selected") === "all")
    ? "all"
    : "selected";

/** The stores ticked inside one group. */
export const picksInGroup = (picks: AccessPicks, groupid: number): Store[] =>
  picks.stores.filter((s) => s.base_group === groupid);

/**
 * Every group the person should end up holding.
 *
 * A group counts as held when it was ticked in its own right, OR when a store
 * was ticked inside it — ticking stores in East and never ticking East itself
 * still means East, held as `selected`.
 *
 * Exported because every screen that DESCRIBES the access has to count the
 * same groups this saves. The panel's counter and summary and the review step
 * counted ticked groups only, so a store ticked in an unticked group read
 * "0 base groups" and "This person will not see any stores" while Create
 * would have saved the group with that store (dev board review, finding AK).
 * Ticked groups come first, in the order they were ticked.
 */
export const heldGroupIds = (picks: AccessPicks) =>
  uniq([...picks.baseGroups, ...picks.stores.map((s) => s.base_group)]);

/**
 * Tick or untick a group in its own column.
 *
 * Held means held either way, ticked or implied by a picked store, which is
 * what the box shows. Unticking drops the group and its picked stores.
 * Ticking adds the roster given (empty By group, or for a single-store
 * person) **merged** with what is already picked under the group: it was
 * appended, so a group with one store already picked showed "11 of 10".
 */
export const toggleGroup = (
  picks: AccessPicks,
  id: number,
  roster: SelectableStore[],
): AccessPicks => {
  if (heldGroupIds(picks).includes(id)) {
    return {
      ...picks,
      baseGroups: picks.baseGroups.filter((g) => g !== id),
      stores: picks.stores.filter((s) => s.base_group !== id),
    };
  }
  const already = new Set(
    picks.stores.filter((s) => s.base_group === id).map((s) => s.storeid),
  );
  return {
    ...picks,
    baseGroups: [...picks.baseGroups, id],
    stores: [...picks.stores, ...roster.filter((s) => !already.has(s.storeid))],
  };
};

/**
 * The same picks, held the other way.
 *
 * **To `all`:** nothing but the mode changes. Ticks are left exactly where
 * they are, so flipping back and forth does not lose a selection somebody
 * just made — they simply stop being sent while the mode is `all`.
 *
 * **To `selected`:** every held group that has no ticks gets its whole roster
 * ticked. This is the case that matters. A group held as `all` has no picks
 * behind it — `user_group_picks` returns no rows for one, and the absence IS
 * the answer — so switching a person to By store with nothing ticked would
 * read as "picked nothing" and take away every store they have. Starting from
 * the full roster makes the switch a no-op until somebody unticks, which is
 * what the switch is for: dropping two stores out of a group, not starting
 * over.
 *
 * A group whose roster has not loaded contributes nothing rather than an
 * empty tick list, so a half-loaded panel cannot silently narrow anybody.
 * Callers fetch the rosters first; `useAccessMode` does.
 */
export const picksForMode = (
  picks: AccessPicks,
  mode: GrantMode,
  rosters: Record<number, Store[]>,
): AccessPicks => {
  if (mode === "all" || mode === picks.mode) return { ...picks, mode };

  const added: SelectableStore[] = [];
  heldGroupIds(picks).forEach((groupid) => {
    if (picks.stores.some((s) => s.base_group === groupid)) return;
    (rosters[groupid] ?? []).forEach((s) =>
      added.push({ ...s, base_group: groupid }),
    );
  });

  return { ...picks, mode, stores: [...picks.stores, ...added] };
};

/**
 * Each base group's company, keyed by group id.
 *
 * Flattened from the panel's per-company group lists, which is the only place
 * the pairing exists on the client.
 */
export const groupCompanies = (
  companyGroups: Record<number, { id: number; company: number }[]>,
): Record<number, number> => {
  const map: Record<number, number> = {};
  Object.values(companyGroups)
    .flat()
    .forEach((g) => {
      map[g.id] = g.company;
    });
  return map;
};

/**
 * The lists exactly as they go to the endpoints.
 *
 * Zeros and nulls are dropped rather than sent: a store created without its
 * base-group link carries `base_group` as null, and passing that through put
 * a null in the middle of an id array the backend then had to make sense of.
 * Those stores become `directStoreIds` instead, which is what they are.
 */
export const accessSets = (
  picks: AccessPicks,
  carried: CarriedAccess = NO_CARRY,
  groupCompany: Record<number, number> = {},
): AccessSets => ({
  companyIds: uniq([
    ...carried.companies,
    ...picks.companies,
    ...picks.stores.map((s) => s.company),
    // **A held group brings its company with it.** Without this, granting a
    // group in `all` mode added no company at all — there are no picked
    // stores in that mode to contribute one — and both
    // `base_groups_assigned_to_user` and its `_split` twin filter on
    // `company_link`. The grant wrote its rows and then no screen could see
    // the group, which reads exactly like the stores never arriving.
    ...heldGroupIds(picks).map((id) => groupCompany[id]),
  ]),
  grants: heldGroupIds(picks)
    .map((groupid) => ({
      groupid,
      mode: picks.mode,
      storeids:
        picks.mode === "all"
          ? []
          : uniq(picksInGroup(picks, groupid).map((s) => s.storeid)),
    }))
    .sort((a, b) => a.groupid - b.groupid),
});

/**
 * Groups held before and not now.
 *
 * Revocation has to be explicit, because the grant call only ever writes the
 * groups it is given. A group dropped from the panel and never mentioned
 * again would otherwise stay granted.
 */
export const revokedGroupIds = (
  next: AccessSets,
  before: AccessSets,
): number[] => {
  const keep = new Set(next.grants.map((g) => g.groupid));
  return before.grants
    .map((g) => g.groupid)
    .filter((id) => !keep.has(id))
    .sort((a, b) => a - b);
};

/**
 * Groups that cannot be saved as they stand.
 *
 * A group held as `selected` with nothing selected grants no stores. The
 * endpoint allows it — it reads as "holds the group, has picked nothing out
 * of it yet", which is a legitimate halfway house — but it is almost never
 * what somebody meant on this screen, so it is named here and the save blocks
 * on it rather than writing a grant that gives nobody anything.
 *
 * (An older comment here claimed the endpoint answers 400 for this. It does
 * not, and has not for some time.)
 */
export const emptySelectedGroupIds = (sets: AccessSets): number[] =>
  sets.grants
    .filter((g) => g.mode === "selected" && g.storeids.length === 0)
    .map((g) => g.groupid);

/**
 * Every store the picks add up to, with the group that accounts for each.
 *
 * `rosters` is each group's full store list, which only the panel has — the
 * group grant itself names no stores when the mode is `all`, so the roster is
 * the only way to say what "all" currently amounts to. A group with no roster
 * loaded contributes nothing rather than guessing at zero stores, so a count
 * built from this is honest about still loading.
 *
 * One row per store, not per grant: two groups can both contain store 053 and
 * the person has it once. The lowest group id wins so the attribution does not
 * change between renders. Every group is held the same way now, so there is no
 * longer a stronger claim to prefer between two groups that both have it.
 */
export const effectiveStores = (
  picks: AccessPicks,
  rosters: Record<number, { storeid: number }[]>,
): EffectiveStore[] => {
  const byStore = new Map<number, EffectiveStore>();
  const mode = picks.mode;

  heldGroupIds(picks)
    .slice()
    .sort((a, b) => a - b)
    .forEach((groupid) => {
      const ids =
        mode === "all"
          ? (rosters[groupid] ?? []).map((s) => s.storeid)
          : picksInGroup(picks, groupid).map((s) => s.storeid);

      ids.forEach((storeid) => {
        if (!byStore.has(storeid)) {
          byStore.set(storeid, { storeid, groupid, mode });
        }
      });
    });

  return [...byStore.values()].sort((a, b) => a.storeid - b.storeid);
};

const same = (a: number[], b: number[]) => {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
};

const sameGrant = (a: GroupGrant, b: GroupGrant) =>
  a.groupid === b.groupid &&
  a.mode === b.mode &&
  same(a.storeids, b.storeids);

/**
 * Which groups actually moved, and whether the companies did.
 *
 * One Save button, one call per group that changed. Re-granting every group
 * every time is harmless in result — each call replaces that group — but it
 * means ticking one store in East rewrites South as well, and each rewrite
 * deletes and re-inserts rows that were already right.
 *
 * Order inside `storeids` is not compared, because the endpoint sorts them.
 */
export const changedGrants = (
  next: AccessSets,
  before: AccessSets,
): GroupGrant[] => {
  const prev = new Map(before.grants.map((g) => [g.groupid, g]));
  return next.grants.filter((g) => {
    const was = prev.get(g.groupid);
    return was === undefined || !sameGrant(g, was);
  });
};

export const changedSets = (next: AccessSets, before: AccessSets) => ({
  companies: !same(next.companyIds, before.companyIds),
  grants: changedGrants(next, before),
  revoke: revokedGroupIds(next, before),
});

export const hasChanges = (next: AccessSets, before: AccessSets) => {
  const c = changedSets(next, before);
  return c.companies || c.grants.length > 0 || c.revoke.length > 0;
};
