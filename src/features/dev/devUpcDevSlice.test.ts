import { describe, expect, it } from "vitest";
import reducer, {
  clearDevUpcData,
  setDevAssociationSeedResult,
  setDevSearchSnapshot,
  type UpcSearchedScope,
} from "./devUpcDevSlice";
import { seedDataFor } from "../../pages/upc/dev/modules/association/associationStats";
import { emptyGroup } from "../groupSlice";
import type { Store } from "../../interfaces";

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

  it("is only read for the seed set it answers", () => {
    const state = reducer(
      undefined,
      setDevAssociationSeedResult({ key: "4011,4046", result, error: null }),
    );
    // Same set ticked in another order: the same seed.
    expect(seedDataFor(["4046", "4011"], state.associationSeedData, state.associationSeedDataKey)).toBe(
      state.associationSeedData,
    );
    // A different set: not this answer, whatever is still in state.
    expect(seedDataFor(["4011"], state.associationSeedData, state.associationSeedDataKey)).toBeNull();
  });

  it("is dropped by a failed load, which keeps its reason", () => {
    let state = reducer(
      undefined,
      setDevAssociationSeedResult({ key: "4011", result, error: null }),
    );
    state = reducer(
      state,
      setDevAssociationSeedResult({ key: "4011,4046", result: null, error: "error 500" }),
    );
    expect(state.associationSeedData).toBeNull();
    expect(state.associationSeedError).toBe("error 500");
  });
});

