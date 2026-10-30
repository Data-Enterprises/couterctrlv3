import { describe, expect, it } from "vitest";
import reducer, {
  clearDevUpcData,
  setDevSearchSnapshot,
  type UpcSearchedScope,
} from "./devUpcDevSlice";
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
