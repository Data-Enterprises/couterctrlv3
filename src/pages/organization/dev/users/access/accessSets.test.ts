import { describe, it, expect } from "vitest";
import {
  accessSets,
  changedGrants,
  changedSets,
  effectiveStores,
  emptySelectedGroupIds,
  groupCompanies,
  hasChanges,
  heldGroupIds,
  accessModeOf,
  NO_PICKS,
  picksForMode,
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

describe("accessModeOf", () => {
  it("reads By group when every held group is all", () => {
    expect(accessModeOf([{ mode: "all" }, { mode: "all" }])).toBe("all");
  });

  it("reads By store when every held group is selected", () => {
    expect(accessModeOf([{ mode: "selected" }])).toBe("selected");
  });

  it("reads a stray mix as By store, the reading that cannot widen anyone", () => {
    expect(accessModeOf([{ mode: "all" }, { mode: "selected" }])).toBe(
      "selected",
    );
  });

  it("treats a missing mode as the endpoint's default", () => {
    expect(accessModeOf([{ mode: null }])).toBe("selected");
  });

  it("reads somebody holding nothing as By store", () => {
    expect(accessModeOf([])).toBe("selected");
  });
});

describe("picksForMode", () => {
  const rosters = {
    4: [store(53, 4), store(56, 4)],
    9: [store(76, 9)],
  };

  it("ticks every store of a held group when switching to By store", () => {
    // A By group person has no picks — the absence is the answer — so an
    // empty switch would take every store away. It starts full instead.
    const got = picksForMode(
      picks({ baseGroups: [4, 9], mode: "all" }),
      "selected",
      rosters,
    );
    expect(got.mode).toBe("selected");
    expect(got.stores.map((s) => [s.base_group, s.storeid])).toEqual([
      [4, 53],
      [4, 56],
      [9, 76],
    ]);
  });

  it("leaves a group's existing ticks alone rather than refilling it", () => {
    const got = picksForMode(
      picks({ baseGroups: [4, 9], mode: "all", stores: [store(56, 4)] }),
      "selected",
      rosters,
    );
    expect(got.stores.map((s) => s.storeid)).toEqual([56, 76]);
  });

  it("adds nothing for a group whose roster has not loaded", () => {
    const got = picksForMode(
      picks({ baseGroups: [12], mode: "all" }),
      "selected",
      rosters,
    );
    expect(got.stores).toEqual([]);
  });

  it("keeps the ticks when switching to By group, so switching back loses nothing", () => {
    const before = picks({ baseGroups: [4], stores: [store(56, 4)] });
    const got = picksForMode(before, "all", rosters);
    expect(got.mode).toBe("all");
    expect(got.stores).toEqual(before.stores);
    // ...and they are not sent while the mode is all.
    expect(accessSets(got).grants).toEqual([
      { groupid: 4, mode: "all", storeids: [] },
    ]);
  });

  it("is a no-op when the mode does not change", () => {
    const p = picks({ baseGroups: [4], stores: [store(56, 4)] });
    expect(picksForMode(p, "selected", rosters)).toEqual(p);
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
    const sets = accessSets(picks({ baseGroups: [4], mode: "all" }));
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
        mode: "all",
        // Stale ticks from before the mode was switched must not travel.
        stores: [store(53, 4)],
      }),
    );
    expect(sets.grants[0]).toEqual({ groupid: 4, mode: "all", storeids: [] });
  });

  it("writes every group in the person's one mode", () => {
    const sets = accessSets(
      picks({
        baseGroups: [4, 9],
        mode: "selected",
        stores: [store(53, 4), store(76, 9)],
      }),
    );
    expect(sets.grants).toEqual([
      { groupid: 4, mode: "selected", storeids: [53] },
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
      picks({ baseGroups: [4, 9], mode: "all" }),
    );
    expect(revokedGroupIds(next, before)).toEqual([]);
  });
});

describe("emptySelectedGroupIds", () => {
  it("catches a group held By store with nothing picked", () => {
    // The endpoint accepts it, but it grants nothing — nearly always an
    // accident on this screen, so the UI blocks first.
    const sets = accessSets(picks({ baseGroups: [4] }));
    expect(emptySelectedGroupIds(sets)).toEqual([4]);
  });

  it("is quiet once a store is picked", () => {
    const sets = accessSets(picks({ stores: [store(53, 4)] }));
    expect(emptySelectedGroupIds(sets)).toEqual([]);
  });

  it("never complains about an all-mode group", () => {
    const sets = accessSets(picks({ baseGroups: [4], mode: "all" }));
    expect(emptySelectedGroupIds(sets)).toEqual([]);
  });
});

describe("changedGrants", () => {
  const before = accessSets(
    picks({ baseGroups: [4, 9], stores: [store(53, 4), store(76, 9)] }),
  );

  it("sends nothing when nothing moved", () => {
    expect(changedGrants(before, before)).toEqual([]);
  });

  it("sends only the group whose picks changed", () => {
    const next = accessSets(
      picks({
        baseGroups: [4, 9],
        stores: [store(53, 4), store(76, 9), store(77, 9)],
      }),
    );
    expect(changedGrants(next, before).map((g) => g.groupid)).toEqual([9]);
  });

  it("sends every group when the access type changes", () => {
    // One mode per person, so a switch rewrites everything they hold.
    const next = accessSets(
      picks({
        baseGroups: [4, 9],
        mode: "all",
        stores: [store(53, 4), store(76, 9)],
      }),
    );
    expect(changedGrants(next, before).map((g) => g.groupid)).toEqual([4, 9]);
  });

  it("sends a newly held group", () => {
    const next = accessSets(
      picks({
        baseGroups: [4, 9, 12],
        stores: [store(53, 4), store(76, 9), store(80, 12)],
      }),
    );
    expect(changedGrants(next, before).map((g) => g.groupid)).toEqual([12]);
  });

  it("ignores the order stores were ticked in", () => {
    const next = accessSets(
      picks({ baseGroups: [9, 4], stores: [store(76, 9), store(53, 4)] }),
    );
    expect(changedGrants(next, before)).toEqual([]);
  });
});

describe("hasChanges", () => {
  const before = accessSets(picks({ baseGroups: [4], mode: "all" }));

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
      picks({ companies: [21], baseGroups: [4], mode: "all" }),
    );
    expect(hasChanges(next, before)).toBe(true);
  });
});

describe("effectiveStores", () => {
  const rosters = {
    4: [{ storeid: 53 }, { storeid: 56 }, { storeid: 71 }],
    9: [{ storeid: 53 }, { storeid: 76 }],
  };

  it("counts a whole group from its roster, which the grant does not name", () => {
    const got = effectiveStores(
      picks({ baseGroups: [4], mode: "all" }),
      rosters,
    );
    expect(got.map((e) => e.storeid)).toEqual([53, 56, 71]);
    expect(got.every((e) => e.mode === "all")).toBe(true);
  });

  it("counts only the picks for a selected group", () => {
    const got = effectiveStores(picks({ stores: [store(56, 4)] }), rosters);
    expect(got).toEqual([{ storeid: 56, groupid: 4, mode: "selected" }]);
  });

  it("holds a store once when two groups both contain it", () => {
    const got = effectiveStores(
      picks({ baseGroups: [4, 9], mode: "all" }),
      rosters,
    );
    expect(got.map((e) => e.storeid)).toEqual([53, 56, 71, 76]);
  });

  it("attributes a shared store to the lowest group id, every render", () => {
    // 53 is in both. One mode for the person, so neither claim is stronger;
    // the lowest id wins so the attribution never flickers.
    const got = effectiveStores(
      picks({ baseGroups: [9, 4], mode: "all" }),
      rosters,
    );
    expect(got.find((e) => e.storeid === 53)).toEqual({
      storeid: 53,
      groupid: 4,
      mode: "all",
    });
  });

  it("contributes nothing for a roster that has not loaded", () => {
    const got = effectiveStores(
      picks({ baseGroups: [12], mode: "all" }),
      rosters,
    );
    expect(got).toEqual([]);
  });

  it("is stable in store order", () => {
    const got = effectiveStores(
      picks({ stores: [store(76, 9), store(53, 9)] }),
      rosters,
    );
    expect(got.map((e) => e.storeid)).toEqual([53, 76]);
  });
});

describe("groupCompanies", () => {
  it("flattens the panel's per-company lists into group to company", () => {
    expect(
      groupCompanies({
        7: [
          { id: 4, company: 7 },
          { id: 9, company: 7 },
        ],
        21: [{ id: 12, company: 21 }],
      }),
    ).toEqual({ 4: 7, 9: 7, 12: 21 });
  });
});

describe("a held group brings its company", () => {
  // The bug this covers: granting a group in `all` mode wrote no company at
  // all, because only picked stores contributed one and `all` picks none.
  // Every endpoint that reads a user's base groups filters on company_link,
  // so the group saved and then no screen could see it.
  const groupCompany = { 4: 7, 9: 21 };

  it("sends the company of a group held as all, with nothing ticked", () => {
    const sets = accessSets(
      picks({ baseGroups: [4], mode: "all" }),
      undefined,
      groupCompany,
    );
    expect(sets.companyIds).toEqual([7]);
  });

  it("sends it for a group held only through picked stores", () => {
    const sets = accessSets(
      picks({ stores: [store(53, 9, 21)] }),
      undefined,
      groupCompany,
    );
    expect(sets.companyIds).toEqual([21]);
  });

  it("does not duplicate a company that was also ticked", () => {
    const sets = accessSets(
      picks({ companies: [7], baseGroups: [4], mode: "all" }),
      undefined,
      groupCompany,
    );
    expect(sets.companyIds).toEqual([7]);
  });

  it("carries on when a group's company is not known yet", () => {
    // The panel may not have loaded that company's groups. Better to send the
    // rest than to put an undefined in the middle of an id array.
    const sets = accessSets(
      picks({ baseGroups: [4, 99], mode: "all" }),
      undefined,
      groupCompany,
    );
    expect(sets.companyIds).toEqual([7]);
    expect(sets.grants).toHaveLength(2);
  });
});

describe("heldGroupIds", () => {
  it("counts a group a ticked store implies, as Create saves it (AK)", () => {
    // By store, All Stores (54) left unticked, store 695 ticked inside it.
    // The counter read "0 base groups" and the review "This person will not
    // see any stores", while the save would have granted All Stores.
    const p = picks({ stores: [store(695, 54, 3)] });
    expect(heldGroupIds(p)).toEqual([54]);
    expect(accessSets(p).grants.map((g) => g.groupid)).toEqual([54]);
  });

  it("lists ticked groups first, in the order they were ticked", () => {
    const p = picks({ baseGroups: [9, 4], stores: [store(1, 2)] });
    expect(heldGroupIds(p)).toEqual([9, 4, 2]);
  });

  it("counts a group once when it is both ticked and implied", () => {
    const p = picks({ baseGroups: [54], stores: [store(695, 54, 3)] });
    expect(heldGroupIds(p)).toEqual([54]);
  });
});
