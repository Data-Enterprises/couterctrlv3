// Interfaces
import type { GrantMode, Store } from "../../../../../interfaces";

// A store tagged with which base group it was picked through — used by the
// create-user wizard's Assignments step, kept local to this feature instead
// of the legacy baseGroupSlice's StoreWithBGID.
export type SelectableStore = Store & { base_group: number };

/**
 * What a person is given, as companies, base groups, and stores.
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
  /**
   * How this person holds **every** group they hold.
   *
   * `all` is the whole group and whatever joins it later — the auto grant.
   * `selected` is only the stores ticked in the third column.
   *
   * **One mode per person, not one per group.** `user_base_group_link.mode`
   * is physically per link, and the screen used to expose that: each group
   * carried its own Auto / Pick stores toggle. Nobody used it that way, the
   * answer was invisible on a finished screen — a list of ticks looks the
   * same either way — and it made "is this person by group or by store" a
   * question with no answer. It is asked once now, on its own step, and every
   * group the person holds is written in it.
   */
  mode: GrantMode;
  /** Stores ticked, each tagged with the group it was picked through. */
  stores: SelectableStore[];
}

/**
 * Ids the person already holds that this screen never showed.
 *
 * Every list here is rendered scoped — a level 7 is offered their own
 * companies, and the stores they can see — while the company save REPLACES.
 * Without carrying the unseen ids through, saving access would quietly strip
 * whatever the editor was not entitled to look at.
 *
 * **Base groups are no longer carried.** `assign_base_group_to_user` replaces
 * one group at a time now, so a group left out of the call is a group left
 * alone — and that is the only safe thing to do with a group whose picks this
 * editor cannot see. Sending it would either wipe its picks or be refused for
 * having none.
 *
 * Empty on a new user, who holds nothing yet.
 */
export interface CarriedAccess {
  companies: number[];
  /**
   * Stores held that no pick on this screen explains — direct assignments,
   * and the rosters of groups held as `all`.
   *
   * **Display only. Never written.** Store access flows through group grants
   * now, so there is nothing for this panel to send: the rows already exist,
   * and re-sending them after a revocation would put back exactly what the
   * revocation removed. They are here so the effective list can show them and
   * say where they came from.
   */
  stores: number[];
}

/** One base group grant, exactly as it goes to the endpoint. */
export interface GroupGrant {
  groupid: number;
  mode: GrantMode;
  /** Empty for `all`, which needs no store list. */
  storeids: number[];
}

/**
 * What goes to the endpoints.
 *
 * There is deliberately no store list. Every store this screen grants is
 * picked inside a base group, so it travels in that group's grant, where it
 * gets an `assigned_via` row and can therefore be revoked precisely later. A
 * store written straight to `assigned` has no provenance and no group change
 * can ever take it back — right for a legacy direct assignment, wrong for
 * anything this panel does.
 */
export interface AccessSets {
  companyIds: number[];
  /** One entry per group the person should hold, in id order. */
  grants: GroupGrant[];
}

/** A store the person ends up with, and what accounts for it. */
export interface EffectiveStore {
  storeid: number;
  /** The group that grants it. */
  groupid: number;
  /** How that group is held — `all` means the store arrived without anyone
   *  naming it, and that a future store will arrive the same way. */
  mode: GrantMode;
}

export type SelectOption = {
  value: number | string;
  label: string;
};

export type View = "grid" | "create";

export type Outcome =
  | { kind: "changed" }
  | { kind: "unchanged" }
  | { kind: "refused"; reason: string }
  | { kind: "not_found" };
