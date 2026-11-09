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
 * Stores held with no group behind them (granted on the Stores tab, or from
 * before groups), which Effective stores labels Direct. Stores in a held
 * group's roster are left out, since `carried.stores` holds those too.
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
 * Holding nothing, as `selected` (the narrower claim); what Clear all lands
 * on. Callers spread the person's real mode over it.
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
 * A person's one access type, from the groups they hold: `all` only when every
 * held group says `all`, else `selected`, the reading that cannot widen anyone.
 * Edit and Duplicate both read it here. `mode` is null only for a group not held.
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
 * Every group the person should end up holding: ticked in its own right, or
 * implied by a ticked store inside it (held as `selected`). Exported so every
 * screen describing the access counts the same groups the save writes. Ticked
 * groups come first, in tick order.
 */
export const heldGroupIds = (picks: AccessPicks) =>
  uniq([...picks.baseGroups, ...picks.stores.map((s) => s.base_group)]);

/**
 * Tick or untick a group in its own column. Unticking drops the group and its
 * picked stores; ticking adds the given roster **merged** with what is already
 * picked under it.
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
 * **To `all`:** only the mode changes; ticks stay, so flipping back loses
 * nothing.
 *
 * **To `selected`:** every held group with no ticks gets its whole roster
 * ticked. A group held as `all` has no picks behind it, so without this the
 * switch would read as "picked nothing" and strip every store. A group whose
 * roster hasn't loaded contributes nothing; `useAccessMode` fetches them first.
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
 * Each base group's company, keyed by group id, from the panel's per-company
 * group lists.
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
 * The lists exactly as they go to the endpoints. Zeros and nulls are dropped:
 * a store with no base-group link (null) goes to `directStoreIds` instead.
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
    // **A held group brings its company with it.** Without it, an `all` grant
    // added no company, and the group's reads filter on `company_link`, so no
    // screen could see the group.
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
 * Groups held before and not now. Revocation must be explicit: the grant call
 * only writes the groups it is given.
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
 * Groups that cannot be saved as they stand: held as `selected` with nothing
 * picked. The endpoint allows it, but it grants nothing, so the save blocks.
 */
export const emptySelectedGroupIds = (sets: AccessSets): number[] =>
  sets.grants
    .filter((g) => g.mode === "selected" && g.storeids.length === 0)
    .map((g) => g.groupid);

/**
 * Every store the picks add up to, with the group that accounts for each.
 * `rosters` says what `all` amounts to; a group with no roster loaded adds
 * nothing. One row per store; when two groups hold it, the lowest group id wins.
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
 * Which groups moved, and whether the companies did, so Save writes one call
 * per changed group only. `storeids` order is not compared (the endpoint sorts).
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

/** Server reasons are lower-case phrases ("above your level") written to be
 *  read; on their own in a column they want a capital. */
export const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** A yyyy-mm-dd date as mm/dd/yyyy, or N/A when missing. */
export const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "N/A";
  const split = dateStr.split("-");
  return `${split[1]}/${split[2]}/${split[0]}`;
};
