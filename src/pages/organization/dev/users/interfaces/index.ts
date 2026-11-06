// Interfaces
import type { GrantMode, Store } from "../../../../../interfaces";

// A store tagged with the base group it was picked through, for the wizard's
// Assignments step.
export type SelectableStore = Store & { base_group: number };

/**
 * What a person is given, as companies, base groups and stores, picked and
 * carried separately. Not derived from ticked stores: a store carries one group
 * link (not necessarily the one chosen), and a company with no stores yet could
 * not be given at all. Stores still contribute their company and group.
 */
export interface AccessPicks {
  /** Companies ticked in their own column. */
  companies: number[];
  /** Base groups ticked in their own column. */
  baseGroups: number[];
  /**
   * How this person holds **every** group they hold: `all` is the whole group
   * and whatever joins it later; `selected` is only the ticked stores.
   * **One mode per person**, asked on its own step, though
   * `user_base_group_link.mode` is stored per link.
   */
  mode: GrantMode;
  /** Stores ticked, each tagged with the group it was picked through. */
  stores: SelectableStore[];
}

/**
 * Ids the person holds that this screen never showed. Lists here are scoped
 * while the company save REPLACES, so these are carried through or saving would
 * strip what the editor can't see. Base groups are not carried:
 * `assign_base_group_to_user` replaces one group at a time, so an unsent group
 * is left alone. Empty on a new user.
 */
export interface CarriedAccess {
  companies: number[];
  /**
   * Stores held that no pick here explains: direct assignments, and the
   * rosters of groups held as `all`. **Display only, never written**: re-sending
   * them after a revocation would put back what it removed.
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
 * What goes to the endpoints. No store list on purpose: every store this screen
 * grants travels in its group's grant (an `assigned_via` row), so it can be
 * revoked later; a store written straight to `assigned` never can be.
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
