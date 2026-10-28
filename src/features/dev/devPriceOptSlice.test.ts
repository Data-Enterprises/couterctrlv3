import { describe, expect, it } from "vitest";
import reducer, {
  cacheSubDeptProducts,
  patchSubDeptView,
} from "./devPriceOptSlice";
import type { ProductSummary } from "../../pages/inventory/dev/inventoryData";

const items = (tag: string) =>
  [{ productCode: tag, description: tag }] as unknown as ProductSummary[];

const withDepts = (...ids: number[]) =>
  ids.reduce(
    (state, id) =>
      reducer(state, cacheSubDeptProducts({ subDept: id, products: items(String(id)) })),
    reducer(undefined, { type: "@@init" }),
  );

describe("the Sub Department item cache", () => {
  it("keeps every department opened in the window", () => {
    const state = withDepts(5, 23);
    expect(state.subDept.productsBySubDept[5]).toEqual(items("5"));
    expect(state.subDept.productsBySubDept[23]).toEqual(items("23"));
  });

  it("replaces one department without touching the others", () => {
    const state = reducer(
      withDepts(5, 23),
      cacheSubDeptProducts({ subDept: 5, products: items("new") }),
    );
    expect(state.subDept.productsBySubDept[5]).toEqual(items("new"));
    expect(state.subDept.productsBySubDept[23]).toEqual(items("23"));
  });

  it("remembers a department that really is empty", () => {
    // The page reads "is this id in the cache", not "does it have items" — an
    // empty department must not look like one that was never fetched, or
    // opening it would re-ask forever.
    const state = reducer(
      withDepts(5),
      cacheSubDeptProducts({ subDept: 9, products: [] }),
    );
    expect(9 in state.subDept.productsBySubDept).toBe(true);
  });

  it("empties on a new search, so another store's items cannot answer", () => {
    const state = reducer(
      withDepts(5, 23),
      patchSubDeptView({ openSubDept: null, productsBySubDept: {} }),
    );
    expect(state.subDept.productsBySubDept).toEqual({});
    expect(state.subDept.openSubDept).toBeNull();
  });
});
