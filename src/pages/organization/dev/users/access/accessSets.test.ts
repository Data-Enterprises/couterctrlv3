import { describe, it, expect } from "vitest";
import {
  accessSets,
  changedSets,
  hasChanges,
  NO_CARRY,
  type AccessPicks,
} from "./accessSets";
import type { SelectableStore } from "../../types";

const store = (
  storeid: number,
  company: number,
  base_group: number,
): SelectableStore =>
  ({ storeid, company, base_group, store_name: `Store ${storeid}` }) as
    SelectableStore;

const picks = (p: Partial<AccessPicks> = {}): AccessPicks => ({
  companies: [],
  baseGroups: [],
  stores: [],
  ...p,
});

describe("accessSets", () => {
  it("assigns a company that has no stores behind it yet", () => {
    // The case that sent people into RDS: a company created this morning
    // cannot be reached through any store, so ticking it has to be enough.
    const sets = accessSets(picks({ companies: [42] }));
    expect(sets.companyIds).toEqual([42]);
    expect(sets.storeIds).toEqual([]);
  });

  it("assigns the group that was picked, not the one its stores point at", () => {
    const sets = accessSets(
      picks({ baseGroups: [7], stores: [store(1, 5, 9)] }),
    );
    expect(sets.baseGroupIds).toContain(7);
    expect(sets.baseGroupIds).toContain(9);
  });

  it("still carries a ticked store's own company and group", () => {
    const sets = accessSets(picks({ stores: [store(1, 5, 9)] }));
    expect(sets.companyIds).toEqual([5]);
    expect(sets.baseGroupIds).toEqual([9]);
    expect(sets.storeIds).toEqual([1]);
  });

  it("drops a missing base-group link rather than sending a hole", () => {
    // `create_new_store` writes no store_base_group_link row, so this arrives
    // as 0/null and used to travel into the id array as-is.
    const sets = accessSets(
      picks({ stores: [store(1, 5, 0), store(2, 5, 9)] }),
    );
    expect(sets.baseGroupIds).toEqual([9]);
  });

  it("de-duplicates across the three sources", () => {
    const sets = accessSets(
      picks({
        companies: [5],
        baseGroups: [9],
        stores: [store(1, 5, 9), store(2, 5, 9)],
      }),
    );
    expect(sets.companyIds).toEqual([5]);
    expect(sets.baseGroupIds).toEqual([9]);
    expect(sets.storeIds).toEqual([1, 2]);
  });

  it("keeps what the editor was never shown", () => {
    // A level 7 editing a user who also belongs to a company they cannot see.
    // The save replaces, so an uncarried id is a silent removal.
    const sets = accessSets(picks({ companies: [5] }), {
      companies: [99],
      baseGroups: [77],
      stores: [55],
    });
    expect(sets.companyIds).toEqual(expect.arrayContaining([5, 99]));
    expect(sets.baseGroupIds).toEqual([77]);
    expect(sets.storeIds).toEqual([55]);
  });
});

describe("changedSets", () => {
  const before = accessSets(
    picks({ companies: [5], baseGroups: [9], stores: [store(1, 5, 9)] }),
    NO_CARRY,
  );

  it("reports nothing when the same picks are made again", () => {
    const next = accessSets(
      picks({ companies: [5], baseGroups: [9], stores: [store(1, 5, 9)] }),
    );
    expect(hasChanges(next, before)).toBe(false);
  });

  it("ignores order", () => {
    const next = accessSets(
      picks({
        companies: [5],
        baseGroups: [9],
        stores: [store(1, 5, 9)],
      }),
    );
    next.companyIds.reverse();
    expect(changedSets(next, before).companies).toBe(false);
  });

  it("marks only the list that moved", () => {
    const next = accessSets(
      picks({
        companies: [5],
        baseGroups: [9],
        stores: [store(1, 5, 9), store(2, 5, 9)],
      }),
    );
    const changed = changedSets(next, before);
    expect(changed.stores).toBe(true);
    expect(changed.companies).toBe(false);
    expect(changed.baseGroups).toBe(false);
  });

  it("sees a removal, not just an addition", () => {
    const next = accessSets(picks({ companies: [5], baseGroups: [9] }));
    const changed = changedSets(next, before);
    expect(changed.stores).toBe(true);
  });
});
