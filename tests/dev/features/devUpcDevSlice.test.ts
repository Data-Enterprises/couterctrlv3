import { describe, expect, it } from "vitest";
import reducer, {
  clearDevUpcData,
  dropDevAssociationReroot,
  setDevAssociationRerootUpc,
  setDevAssociationSeedKey,
  setDevAssociationSeedResult,
  setDevSearchSnapshot,
  type UpcSearchedScope,
} from "@/features/dev/devUpcDevSlice";
import { seedDataFor } from "@/pages/upc/dev/modules/association/associationStats";
import { emptyGroup } from "@/features/groupSlice";
import type { Store } from "@/interfaces";

const scope: UpcSearchedScope = {
  type: "Store",
  startDate: "10/18/2026",
  endDate: "10/24/2026",
  selectedStore: { storeid: 101, store_number: "20", store_name: "Store 20" } as Store,
  selectedGroup: emptyGroup,
};

describe("the searched scope", () => {
  it("is kept with the search, so the tabs read what was searched", () => {
    const state = reducer(
      undefined,
      setDevSearchSnapshot({ upcs: ["4011"], scopeKey: "k", scope }),
    );
    expect(state.searchedScope).toEqual(scope);
  });

  it("goes with the data on a new search", () => {
    let state = reducer(undefined, setDevSearchSnapshot({ upcs: ["4011"], scopeKey: "k", scope }));
    state = reducer(state, clearDevUpcData());
    expect(state.searchedScope).toBeNull();
  });
});

describe("the association seed answer", () => {
  const result = { totalBaskets: 120, items: [] };
  /** The tab sets the key, then the answer lands for it. */
  const asked = (key: string, state = reducer(undefined, { type: "init" })) =>
    reducer(state, setDevAssociationSeedKey(key));

  it("is only read for the seed set it answers", () => {
    const state = reducer(
      asked("4011,4046"),
      setDevAssociationSeedResult({ key: "4011,4046", result, error: null }),
    );
    expect(state.associationSeedData).toBe(result);
    // Same set ticked in another order: the same seed.
    expect(seedDataFor(["4046", "4011"], state.associationSeedData, state.associationSeedDataKey)).toBe(
      state.associationSeedData,
    );
    // A different set: not this answer, whatever is still in state.
    expect(seedDataFor(["4011"], state.associationSeedData, state.associationSeedDataKey)).toBeNull();
  });

  it("is dropped by a failed load, which keeps its reason", () => {
    let state = reducer(
      asked("4011"),
      setDevAssociationSeedResult({ key: "4011", result, error: null }),
    );
    state = asked("4011,4046", state);
    state = reducer(
      state,
      setDevAssociationSeedResult({ key: "4011,4046", result: null, error: "error 500" }),
    );
    expect(state.associationSeedData).toBeNull();
    expect(state.associationSeedError).toBe("error 500");
  });

  it("from a set since left is dropped, so the tab can't stick on Loading", () => {
    // A, then B, then A again; A answers, then B's answer lands last.
    let state = asked("4011");
    state = asked("4046", state);
    state = asked("4011", state);
    state = reducer(state, setDevAssociationSeedResult({ key: "4011", result, error: null }));
    const other = { totalBaskets: 9, items: [] };
    state = reducer(state, setDevAssociationSeedResult({ key: "4046", result: other, error: null }));
    expect(seedDataFor(["4011"], state.associationSeedData, state.associationSeedDataKey)).toBe(result);
    expect(state.associationSeedLoaded).toBe(true);
  });

  it("doesn't carry one set's error to the next", () => {
    let state = asked("4011");
    state = reducer(state, setDevAssociationSeedResult({ key: "4011", result: null, error: "error 500" }));
    state = asked("4046", state);
    expect(state.associationSeedError).toBeNull();
    // Nor does a late failure for the old set land on the new one.
    state = reducer(state, setDevAssociationSeedResult({ key: "4011", result: null, error: "late" }));
    expect(state.associationSeedError).toBeNull();
  });
});

describe("dropping a re-root that didn't load", () => {
  it("goes back to the seed view", () => {
    let state = reducer(undefined, setDevAssociationRerootUpc("4011"));
    state = reducer(state, dropDevAssociationReroot("4011"));
    expect(state.associationRerootUpc).toBeNull();
  });

  it("leaves a newer re-root alone", () => {
    // X failed after the user had already moved on to Y.
    let state = reducer(undefined, setDevAssociationRerootUpc("4046"));
    state = reducer(state, dropDevAssociationReroot("4011"));
    expect(state.associationRerootUpc).toBe("4046");
  });
});

