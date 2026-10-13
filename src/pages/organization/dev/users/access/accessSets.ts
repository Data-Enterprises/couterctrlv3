import type { SelectableStore } from "../../types";

/**
 * What a person is given, as three independent sets.
 *
 * The wizard used to derive companies and base groups from the stores that
 * were ticked, reading `store.company` and `store.base_group` off each one.
 * That is wrong in two directions and both of them bite:
 *
 *   A store carries ONE base-group link. Picking the East group and meaning
 *   "East" assigned whatever group each East store happened to point at, so
 *   the group you chose was not necessarily the group that was written.
 *
 *   A company with no stores yet cannot be derived from a ticked store at
 *   all, so a company created this morning could be given to nobody — the
 *   case that sent people into the database by hand.
 *
 * So companies, base groups and stores are picked and carried separately.
 * Stores still CONTRIBUTE their company and group, because a store is
 * meaningless to a person who holds neither, but they no longer define them.
 */
export interface AccessPicks {
  /** Companies ticked in their own column. */
  companies: number[];
  /** Base groups ticked in their own column. */
  baseGroups: number[];
  /** Stores ticked, each tagged with the group it was picked through. */
  stores: SelectableStore[];
}

/**
 * Ids the person already holds that this screen never showed.
 *
 * Every list here is rendered scoped — a level 7 is offered their own
 * companies, and the stores they can see — while the save REPLACES. Without
 * carrying the unseen ids through, saving access would quietly strip whatever
 * the editor was not entitled to look at. The panel renders a subset; it
 * always saves the full set.
 *
 * Empty on a new user, who holds nothing yet.
 */
export interface CarriedAccess {
  companies: number[];
  baseGroups: number[];
  stores: number[];
}

export const NO_CARRY: CarriedAccess = {
  companies: [],
  baseGroups: [],
  stores: [],
};

export interface AccessSets {
  companyIds: number[];
  baseGroupIds: number[];
  storeIds: number[];
}

const uniq = (ids: number[]) =>
  Array.from(new Set(ids.filter((id) => Number.isFinite(id) && id !== 0)));

/**
 * The three lists exactly as they go to the three endpoints.
 *
 * Zeros and nulls are dropped rather than sent: a store created without its
 * base-group link carries `base_group` as null, and passing that through put
 * a null in the middle of an id array the backend then had to make sense of.
 * Dropping it loses nothing — the group was never there to assign.
 */
export const accessSets = (
  picks: AccessPicks,
  carried: CarriedAccess = NO_CARRY,
): AccessSets => ({
  companyIds: uniq([
    ...carried.companies,
    ...picks.companies,
    ...picks.stores.map((s) => s.company),
  ]),
  baseGroupIds: uniq([
    ...carried.baseGroups,
    ...picks.baseGroups,
    ...picks.stores.map((s) => s.base_group),
  ]),
  storeIds: uniq([...carried.stores, ...picks.stores.map((s) => s.storeid)]),
});

const same = (a: number[], b: number[]) => {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
};

/**
 * Which of the three actually moved.
 *
 * One Save button, up to three calls. Sending all three every time is
 * harmless in result — they replace, so the same set written twice is the
 * same set — but it means ticking one store rewrites the person's companies
 * and groups as well, and any staleness anywhere in the panel lands on all
 * three levels at once. Only what changed goes out.
 *
 * Order is not compared, because none of the three endpoints keeps one.
 */
export const changedSets = (next: AccessSets, before: AccessSets) => ({
  companies: !same(next.companyIds, before.companyIds),
  baseGroups: !same(next.baseGroupIds, before.baseGroupIds),
  stores: !same(next.storeIds, before.storeIds),
});

export const hasChanges = (next: AccessSets, before: AccessSets) => {
  const c = changedSets(next, before);
  return c.companies || c.baseGroups || c.stores;
};
