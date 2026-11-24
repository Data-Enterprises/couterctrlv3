import { describe, expect, it } from "vitest";
import reducer, {
  cacheSubDeptProducts,
  patchSubDeptView,
} from "@/features/dev/devPriceOptSlice";

// Interfaces
import type { ProductSummary } from "@/pages/inventory/dev/interfaces";

const items = (tag: string) =>
  [{ productCode: tag, description: tag }] as unknown as ProductSummary[];

const withDepts = (...ids: string[]) =>
  ids.reduce(
    (state, id) =>
      reducer(state, cacheSubDeptProducts({ subDept: id, products: items(id) })),
    reducer(undefined, { type: "@@init" }),
  );

describe("the Sub Department item cache", () => {
  it("keeps every department opened in the window", () => {
    const state = withDepts("5|Grocery", "23|Deli");
    expect(state.subDept.productsBySubDept["5|Grocery"]).toEqual(items("5|Grocery"));
    expect(state.subDept.productsBySubDept["23|Deli"]).toEqual(items("23|Deli"));
  });

  it("replaces one department without touching the others", () => {
    const state = reducer(
      withDepts("5|Grocery", "23|Deli"),
      cacheSubDeptProducts({ subDept: "5|Grocery", products: items("new") }),
    );
    expect(state.subDept.productsBySubDept["5|Grocery"]).toEqual(items("new"));
    expect(state.subDept.productsBySubDept["23|Deli"]).toEqual(items("23|Deli"));
  });

  it("remembers a department that really is empty", () => {
    // The page reads "is this id in the cache", not "does it have items" — an
    // empty department must not look like one that was never fetched, or
    // opening it would re-ask forever.
    const state = reducer(
      withDepts("5|Grocery"),
      cacheSubDeptProducts({ subDept: "9|Bakery", products: [] }),
    );
    expect("9|Bakery" in state.subDept.productsBySubDept).toBe(true);
  });

  it("empties on a new search, so another store's items cannot answer", () => {
    const state = reducer(
      withDepts("5|Grocery", "23|Deli"),
      patchSubDeptView({ openSubDept: null, productsBySubDept: {} }),
    );
    expect(state.subDept.productsBySubDept).toEqual({});
    expect(state.subDept.openSubDept).toBeNull();
  });
});
