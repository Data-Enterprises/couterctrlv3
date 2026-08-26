import type { Store } from "../../interfaces";

// A store tagged with which base group it was picked through — used by the
// create-user wizard's Assignments step, kept local to this feature instead
// of the legacy baseGroupSlice's StoreWithBGID.
export type SelectableStore = Store & { base_group: number };

export type StoreSplit = { assigned: Store[]; unassigned: Store[] };

export interface ShareBgUserResult {
  userid: number;
  store_groupid: number;
  group_name: string;
  company_link_created: boolean;
  base_group_link_created: boolean;
  store_group_reused: boolean;
  stores_added: number[];
  stores_removed: number[];
  store_count: number;
}

export interface UnshareBgUserResult {
  userid: number;
  base_group_link_removed: boolean;
  store_groupid: number | null;
  store_group_deleted: boolean;
  stores_revoked: number[];
  stores_kept: number[];
}

interface BgAssignmentEnvelope {
  error: number;
  success: boolean;
  msg: string;
  company: number;
  base_group: number;
  group_name: string;
  user_count: number;
  store_count: number;
  stores: { storeid: number; store_number: string; store_name: string }[];
}

export type ShareBgResp = BgAssignmentEnvelope & {
  users: ShareBgUserResult[];
};

export type UnshareBgResp = BgAssignmentEnvelope & {
  users: UnshareBgUserResult[];
};
