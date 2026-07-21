import type { Store } from "../../interfaces";

// A store tagged with which base group it was picked through — used by the
// create-user wizard's Assignments step, kept local to this feature instead
// of the legacy baseGroupSlice's StoreWithBGID.
export type SelectableStore = Store & { base_group: number };

export type StoreSplit = { assigned: Store[]; unassigned: Store[] };
