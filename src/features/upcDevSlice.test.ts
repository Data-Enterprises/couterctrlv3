import { describe, it, expect } from "vitest";
import reducer, {
  removeDevUpcs,
  setDevSearchSnapshot,
  seedDevUpcItems,
  setDevUpcItems,
  mergeDevSalesComp,
  mergeDevPriceOpt,
  mergeDevTrends,
} from "./upcDevSlice";
import type { UpcSalesComp, UpcPriceOpt, UpcTrend } from "../interfaces";

const salesRow = (code: string): UpcSalesComp => ({
  product_code: code,
  description: `desc ${code}`,
  week: "2026-08-17",
  Monday: 1, Tuesday: 1, Wednesday: 1, Thursday: 1, Friday: 1, Saturday: 1, Sunday: 1,
});

const priceRow = (code: string): UpcPriceOpt => ({
  product_code: code,
  product_description: `desc ${code}`,
  price: 1.99,
  total_qty: 10,
  total_revenue: 19.9,
  total_weight: 0,
});

const trendRow = (code: string): UpcTrend =>
  ({ product_code: code, product_description: `desc ${code}`, impact_units: -5 }) as UpcTrend;

/** A page in the state a completed search leaves it in: three UPCs loaded
 *  across every module, with B selected and seeding Association. */
const loaded = () => {
  const base = reducer(undefined, { type: "@@init" });
  return {
    ...base,
    upcs: ["A", "B", "C"],
    searchedUpcs: ["A", "B", "C"],
    searchedScopeKey: "Store|1|8/1/2026|8/21/2026",
    dataLoaded: true,
    upcItems: [
      { product_code: "A", description: "desc A" },
      { product_code: "B", description: "desc B" },
      { product_code: "C", description: "desc C" },
    ],
    selectedUpcs: ["B", "C"],
    salesComp: [salesRow("A"), salesRow("B"), salesRow("C")],
    salesCompLY: [salesRow("A"), salesRow("B")],
    optBestPrices: [priceRow("A"), priceRow("A"), priceRow("B")],
    optBestPricesByUpc: [priceRow("A"), priceRow("B"), priceRow("C")],
    upcTrends: [trendRow("A"), trendRow("B"), trendRow("C")],
    salesCompCoverage: ["A", "B", "C"],
    salesCompLYCoverage: ["A", "B"],
    priceOptCoverage: ["A", "B", "C"],
    trendCoverage: ["A", "B", "C"],
    forecastExport: [
      { upc: "A", description: "desc A", date: "8/1/2026", quantity: 1 },
      { upc: "B", description: "desc B", date: "8/1/2026", quantity: 1 },
    ],
    forecastMetricExport: [
      { upc: "A", description: "desc A", avg_daily_qty: 1, days_active: 1, max_day_qty: 1, qty: 1 },
    ],
    upcList: [
      { label: "A", value: "A", color: "#000", metrics: { avg_daily_qty: 1, days_active: 1, description: "desc A", max_day_qty: 1, qty: 1 } },
      { label: "B", value: "B", color: "#000", metrics: { avg_daily_qty: 1, days_active: 1, description: "desc B", max_day_qty: 1, qty: 1 } },
    ],
    associationSeedKey: "B,C",
    associationSeedLoaded: true,
    associationSeedData: { totalBaskets: 100, items: [] },
    associationRerootUpc: "C",
    associationRerootCache: {
      A: { totalBaskets: 10, items: [] },
      C: { totalBaskets: 30, items: [] },
    },
  };
};

describe("removeDevUpcs", () => {
  it("drops the UPC from every place its data lives", () => {
    const next = reducer(loaded(), removeDevUpcs(["A"]));

    expect(next.upcs).toEqual(["B", "C"]);
    expect(next.searchedUpcs).toEqual(["B", "C"]);
    expect(next.upcItems.map((i) => i.product_code)).toEqual(["B", "C"]);
    expect(next.salesComp.every((r) => r.product_code !== "A")).toBe(true);
    expect(next.salesCompLY.every((r) => r.product_code !== "A")).toBe(true);
    expect(next.optBestPrices.every((r) => r.product_code !== "A")).toBe(true);
    expect(next.optBestPricesByUpc.every((r) => r.product_code !== "A")).toBe(true);
    expect(next.upcTrends.every((r) => r.product_code !== "A")).toBe(true);
    expect(next.forecastExport.every((r) => r.upc !== "A")).toBe(true);
    expect(next.forecastMetricExport.every((r) => r.upc !== "A")).toBe(true);
    expect(next.upcList.every((r) => r.value !== "A")).toBe(true);
    expect(next.associationRerootCache).not.toHaveProperty("A");
  });

  it("leaves every other UPC's data untouched", () => {
    const before = loaded();
    const next = reducer(before, removeDevUpcs(["A"]));

    // The equivalence the whole approach rests on: pruning must land on
    // exactly what a re-search for {B,C} would have returned.
    expect(next.salesComp).toEqual(before.salesComp.filter((r) => r.product_code !== "A"));
    expect(next.optBestPrices).toEqual(before.optBestPrices.filter((r) => r.product_code !== "A"));
    expect(next.upcTrends).toEqual(before.upcTrends.filter((r) => r.product_code !== "A"));
    expect(next.selectedUpcs).toEqual(["B", "C"]);
  });

  it("drops removed UPCs from the selection", () => {
    const next = reducer(loaded(), removeDevUpcs(["B"]));
    expect(next.selectedUpcs).toEqual(["C"]);
  });

  it("invalidates association seed data when a seed UPC is removed", () => {
    // B is in the seed key "B,C" — total_baskets and every companion's numbers
    // were computed over a seed set that no longer exists.
    const next = reducer(loaded(), removeDevUpcs(["B"]));

    expect(next.associationSeedKey).toBe("");
    expect(next.associationSeedLoaded).toBe(false);
    expect(next.associationSeedData).toBeNull();
    expect(next.associationRerootCache).toEqual({});
    expect(next.associationRerootUpc).toBeNull();
  });

  it("keeps association seed data when the removed UPC was not a seed", () => {
    // A is loaded but not selected, so it never fed the seed fetch — those
    // numbers are still true and must not be thrown away.
    const next = reducer(loaded(), removeDevUpcs(["A"]));

    expect(next.associationSeedKey).toBe("B,C");
    expect(next.associationSeedData).toEqual({ totalBaskets: 100, items: [] });
    expect(next.associationRerootUpc).toBe("C");
    // ...but A's own re-root entry goes, since A itself is gone.
    expect(Object.keys(next.associationRerootCache)).toEqual(["C"]);
  });

  it("clears the re-root target when that UPC is the one removed", () => {
    const next = reducer(loaded(), removeDevUpcs(["C"]));
    expect(next.associationRerootUpc).toBeNull();
  });

  it("handles removing several UPCs at once", () => {
    const next = reducer(loaded(), removeDevUpcs(["A", "C"]));
    expect(next.upcs).toEqual(["B"]);
    expect(next.upcItems.map((i) => i.product_code)).toEqual(["B"]);
    expect(next.selectedUpcs).toEqual(["B"]);
    expect(next.optBestPricesByUpc.map((r) => r.product_code)).toEqual(["B"]);
  });


  it("prunes coverage alongside the data", () => {
    const next = reducer(loaded(), removeDevUpcs(["A"]));

    // A UPC left in a coverage list would look already-fetched if the user
    // added it back, leaving that module permanently missing its rows.
    expect(next.salesCompCoverage).toEqual(["B", "C"]);
    expect(next.salesCompLYCoverage).toEqual(["B"]);
    expect(next.priceOptCoverage).toEqual(["B", "C"]);
    expect(next.trendCoverage).toEqual(["B", "C"]);
  });

  it("bumps searchVersion so an aborted module refetches on the reduced set", () => {
    const before = loaded();
    const next = reducer(before, removeDevUpcs(["A"]));
    expect(next.searchVersion).toBe(before.searchVersion + 1);
  });

  it("is a no-op for an empty list", () => {
    const before = loaded();
    expect(reducer(before, removeDevUpcs([]))).toEqual(before);
  });

  it("ignores codes that were never loaded", () => {
    const before = loaded();
    const next = reducer(before, removeDevUpcs(["ZZZ"]));
    expect(next.upcs).toEqual(["A", "B", "C"]);
    expect(next.salesComp).toEqual(before.salesComp);
  });
});

describe("setDevSearchSnapshot", () => {
  it("records what the loaded data covers", () => {
    const next = reducer(
      reducer(undefined, { type: "@@init" }),
      setDevSearchSnapshot({ upcs: ["A", "B"], scopeKey: "Store|1|d1|d2" }),
    );
    expect(next.searchedUpcs).toEqual(["A", "B"]);
    expect(next.searchedScopeKey).toBe("Store|1|d1|d2");
  });
});

describe("coverage merging", () => {
  const empty = () => reducer(undefined, { type: "@@init" });

  it("appends a delta without disturbing what is already loaded", () => {
    let state = reducer(empty(), mergeDevSalesComp({ rows: [salesRow("A")], codes: ["A"] }));
    state = reducer(state, mergeDevSalesComp({ rows: [salesRow("B")], codes: ["B"] }));

    expect(state.salesComp.map((r) => r.product_code)).toEqual(["A", "B"]);
    expect(state.salesCompCoverage).toEqual(["A", "B"]);
  });

  it("covers a UPC that returned no rows, so it is not re-requested forever", () => {
    // The case that makes coverage "what was asked for" rather than "what came
    // back": a UPC with no sales in the window is absent from the response.
    const state = reducer(empty(), mergeDevSalesComp({ rows: [], codes: ["Z"] }));

    expect(state.salesComp).toEqual([]);
    expect(state.salesCompCoverage).toEqual(["Z"]);
  });

  it("replaces rather than duplicates when a UPC is fetched twice", () => {
    let state = reducer(empty(), mergeDevSalesComp({ rows: [salesRow("A")], codes: ["A"] }));
    state = reducer(state, mergeDevSalesComp({ rows: [salesRow("A")], codes: ["A"] }));

    // Doubling A's rows would silently double its contribution to every total.
    expect(state.salesComp).toHaveLength(1);
    expect(state.salesCompCoverage).toEqual(["A"]);
  });

  it("merges both price-opt arrays under one coverage list", () => {
    let state = reducer(
      empty(),
      mergeDevPriceOpt({ bestPrices: [priceRow("A")], byUpc: [priceRow("A")], codes: ["A"] }),
    );
    state = reducer(
      state,
      mergeDevPriceOpt({ bestPrices: [priceRow("B")], byUpc: [priceRow("B")], codes: ["B"] }),
    );

    expect(state.optBestPrices.map((r) => r.product_code)).toEqual(["A", "B"]);
    expect(state.optBestPricesByUpc.map((r) => r.product_code)).toEqual(["A", "B"]);
    expect(state.priceOptCoverage).toEqual(["A", "B"]);
  });

  it("merges trend deltas", () => {
    let state = reducer(empty(), mergeDevTrends({ rows: [trendRow("A")], codes: ["A"] }));
    state = reducer(state, mergeDevTrends({ rows: [trendRow("B")], codes: ["B"] }));

    expect(state.upcTrends.map((r) => r.product_code)).toEqual(["A", "B"]);
    expect(state.trendCoverage).toEqual(["A", "B"]);
  });
});

describe("upc roster", () => {
  const empty = () => reducer(undefined, { type: "@@init" });

  it("seeds every searched UPC, named or not", () => {
    const state = reducer(empty(), seedDevUpcItems(["A", "B"]));
    expect(state.upcItems).toEqual([
      { product_code: "A", description: "" },
      { product_code: "B", description: "" },
    ]);
  });

  it("does not re-seed a UPC that already has a description", () => {
    let state = reducer(empty(), seedDevUpcItems(["A"]));
    state = reducer(state, setDevUpcItems([{ product_code: "A", description: "COKE 12PK" }]));
    state = reducer(state, seedDevUpcItems(["A", "B"]));

    expect(state.upcItems).toEqual([
      { product_code: "A", description: "COKE 12PK" },
      { product_code: "B", description: "" },
    ]);
  });

  it("never lets a blank description overwrite a real one", () => {
    let state = reducer(empty(), setDevUpcItems([{ product_code: "A", description: "COKE 12PK" }]));
    // A later module returns the row but doesn't name it.
    state = reducer(state, setDevUpcItems([{ product_code: "A", description: "" }]));

    expect(state.upcItems[0].description).toBe("COKE 12PK");
  });
});
