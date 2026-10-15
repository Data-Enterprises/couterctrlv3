import { describe, it, expect } from "vitest";
import {
  accessSets,
  changedGrants,
  changedSets,
  emptySelectedGroupIds,
  hasChanges,
  modeOf,
  NO_PICKS,
  revokedGroupIds,
  type AccessPicks,
} from "./accessSets";
import type { SelectableStore } from "../../types";

const store = (
  storeid: number,
  base_group: number,
  company = 7,
): SelectableStore => ({
  storeid,
  store_number: String(storeid).padStart(3, "0"),
  store_name: `Store ${storeid}`,
  company,
  company_name: "Houchens",
  base_group,
});

const picks = (over: Partial<AccessPicks> = {}): AccessPicks => ({
  ...NO_PICKS,
  ...over,
});

describe("modeOf", () => {
  it("defaults to selected, matching the endpoint", () => {
    expect(modeOf(picks(), 4)).toBe("selected");
  });

  it("reads the mode when one is set", () => {
    expect(modeOf(picks({ modes: { 4: "all" } }), 4)).toBe("all");
  });
});

describe("accessSets", () => {
  it("keeps a company that was ticked in its own right", () => {
    // The case that had no answer before: a company created this morning,
    // with no stores to derive it from.
    expect(accessSets(picks({ companies: [21] })).companyIds).toEqual([21]);
  });

  it("contributes a picked store's company without it defining the pick", () => {
    const sets = accessSets(picks({ stores: [store(53, 4, 9)] }));
    expect(sets.companyIds).toEqual([9]);
  });

  it("holds a group that was ticked with no stores in it", () => {
    const sets = accessSets(picks({ baseGroups: [4], modes: { 4: "all" } }));
    expect(sets.grants).toEqual([{ groupid: 4, mode: "all", storeids: [] }]);
  });

  it("holds a group that was never ticked but has stores picked inside it", () => {
    // Ticking stores in East and never ticking East still means East.
    const sets = accessSets(picks({ stores: [store(53, 4), store(56, 4)] }));
    expect(sets.grants).toEqual([
      { groupid: 4, mode: "selected", storeids: [53, 56] },
    ]);
  });

  it("sends no store list for an all-mode group", () => {
    const sets = accessSets(
      picks({
        baseGroups: [4],
        modes: { 4: "all" },
        // Stale ticks from before the mode was switched must not travel.
        stores: [store(53, 4)],
      }),
    );
    expect(sets.grants[0]).toEqual({ groupid: 4, mode: "all", storeids: [] });
  });

  it("keeps two groups in different modes apart", () => {
    const sets = accessSets(
      picks({
        baseGroups: [4, 9],
        modes: { 4: "all" },
        stores: [store(76, 9)],
      }),
    );
    expect(sets.grants).toEqual([
      { groupid: 4, mode: "all", storeids: [] },
      { groupid: 9, mode: "selected", storeids: [76] },
    ]);
  });

  it("drops a store whose base group is unknown rather than inventing one", () => {
    // base_group 0 is the panel saying it does not know. It used to be sent.
    const sets = accessSets(picks({ stores: [store(53, 0)] }));
    expect(sets.grants).toEqual([]);
  });

  it("adds back a company the editor was never shown", () => {
    const sets = accessSets(picks({ companies: [7] }), {
      companies: [21],
      stores: [],
    });
    expect([...sets.companyIds].sort((a, b) => a - b)).toEqual([7, 21]);
  });

  it("never writes a store list, even for carried stores", () => {
    // Carried stores are display-only: re-sending them after a revocation
    // would put back exactly what the revocation removed.
    const sets = accessSets(picks(), { companies: [], stores: [53, 56] });
    expect(Object.keys(sets).sort()).toEqual(["companyIds", "grants"]);
  });

  it("is deterministic in group order", () => {
    const a = accessSets(picks({ baseGroups: [9, 4, 1] }));
    const b = accessSets(picks({ baseGroups: [1, 9, 4] }));
    expect(a.grants.map((g) => g.groupid)).toEqual([1, 4, 9]);
    expect(a).toEqual(b);
  });
});

describe("revokedGroupIds", () => {
  const before = accessSets(picks({ baseGroups: [4, 9] }));

  it("names a group dropped from the panel", () => {
    const next = accessSets(picks({ baseGroups: [4] }));
    expect(revokedGroupIds(next, before)).toEqual([9]);
  });

  it("is empty when nothing was dropped", () => {
    expect(revokedGroupIds(before, before)).toEqual([]);
  });

  it("does not revoke a group that only changed mode", () => {
    const next = accessSets(
      picks({ baseGroups: [4, 9], modes: { 9: "all" } }),
    );
    expect(revokedGroupIds(next, before)).toEqual([]);
  });
});

describe("emptySelectedGroupIds", () => {
  it("catches a group set to pick-stores with nothing picked", () => {
    // The endpoint answers 400 for this, so the UI has to block first.
    const sets = accessSets(picks({ baseGroups: [4] }));
    expect(emptySelectedGroupIds(sets)).toEqual([4]);
  });

  it("is quiet once a store is picked", () => {
    const sets = accessSets(picks({ stores: [store(53, 4)] }));
    expect(emptySelectedGroupIds(sets)).toEqual([]);
  });

  it("never complains about an all-mode group", () => {
    const sets = accessSets(picks({ baseGroups: [4], modes: { 4: "all" } }));
    expect(emptySelectedGroupIds(sets)).toEqual([]);
  });
});

describe("changedGrants", () => {
  const before = accessSets(
    picks({ baseGroups: [4, 9], modes: { 4: "all" }, stores: [store(76, 9)] }),
  );

  it("sends nothing when nothing moved", () => {
    expect(changedGrants(before, before)).toEqual([]);
  });

  it("sends only the group whose picks changed", () => {
    const next = accessSets(
      picks({
        baseGroups: [4, 9],
        modes: { 4: "all" },
        stores: [store(76, 9), store(77, 9)],
      }),
    );
    expect(changedGrants(next, before).map((g) => g.groupid)).toEqual([9]);
  });

  it("sends a group whose mode changed even though its stores did not", () => {
    const next = accessSets(
      picks({
        baseGroups: [4, 9],
        modes: { 4: "all", 9: "all" },
        stores: [store(76, 9)],
      }),
    );
    expect(changedGrants(next, before).map((g) => g.groupid)).toEqual([9]);
  });

  it("sends a newly held group", () => {
    const next = accessSets(
      picks({
        baseGroups: [4, 9, 12],
        modes: { 4: "all", 12: "all" },
        stores: [store(76, 9)],
      }),
    );
    expect(changedGrants(next, before).map((g) => g.groupid)).toEqual([12]);
  });

  it("ignores the order stores were ticked in", () => {
    const next = accessSets(
      picks({
        baseGroups: [4, 9],
        modes: { 4: "all" },
        stores: [store(76, 9)],
      }),
    );
    expect(changedGrants(next, before)).toEqual([]);
  });
});

describe("hasChanges", () => {
  const before = accessSets(picks({ baseGroups: [4], modes: { 4: "all" } }));

  it("is false for the same access", () => {
    expect(hasChanges(before, before)).toBe(false);
  });

  it("is true when a group is dropped, which no grant would show", () => {
    const next = accessSets(picks());
    expect(changedSets(next, before).grants).toEqual([]);
    expect(hasChanges(next, before)).toBe(true);
  });

  it("is true for a company added on its own", () => {
    const next = accessSets(
      picks({ companies: [21], baseGroups: [4], modes: { 4: "all" } }),
    );
    expect(hasChanges(next, before)).toBe(true);
  });
});
