import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { setupStore } from "@/store";
import { useSelectedItem, useTop200View } from "@/pages/sales/prod/storePanel/top200/hooks";
import { compareWindows, DEFAULT_TOP_ITEM_SORT } from "@/pages/sales/prod/storePanel/top200/utils/topItems";
import type { TopItemRow } from "@/api/topItems";

/*
 * The Top 200 tab's list state is in the slice, so the list, the landing and
 * the item report all read the same search, department, sort and pick.
 */

const row = (over: Partial<TopItemRow> = {}): TopItemRow => ({
  storeid: 1,
  store_number: "001",
  store_name: "IGA GLASGOW KY",
  product_code: "7800004110",
  product_description: "RC 24 PK",
  weight: 0,
  sub_department: 21,
  sub_department_description: "Soft Drinks",
  sub_department_count: 1,
  qty: 46,
  total_sales: 439.5,
  ext_cost: 478.3,
  cost_coverage: 100,
  margin: -8.8,
  qty_regular: 0,
  qty_promo: 46,
  qty_deal_item: 0,
  qty_unknown: 0,
  ...over,
});

const ranked = compareWindows(
  [row({ product_code: "A" }), row({ product_code: "B", product_description: "PEPSI 12 PK" })],
  [],
  [],
);

const hooks = () => {
  const store = setupStore();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  const view = renderHook(() => useTop200View(), { wrapper });
  const item = renderHook(() => useSelectedItem(ranked), { wrapper });
  return { view, item };
};

describe("useTop200View", () => {
  it("starts on the default sort with nothing searched or picked", () => {
    const { view } = hooks();
    expect(view.result.current.sort).toEqual(DEFAULT_TOP_ITEM_SORT);
    expect(view.result.current.search).toBe("");
    expect(view.result.current.selectedCode).toBeNull();
  });

  it("takes a sort as a value or as a step from the current one", () => {
    const { view } = hooks();
    act(() => view.result.current.setSort({ column: "vsLW", direction: "asc" }));
    expect(view.result.current.sort).toEqual({ column: "vsLW", direction: "asc" });
    act(() =>
      view.result.current.setSort((cur) => ({ ...cur, direction: "desc" })),
    );
    expect(view.result.current.sort).toEqual({ column: "vsLW", direction: "desc" });
  });
});

describe("useSelectedItem", () => {
  it("finds the item picked in the list", () => {
    const { view, item } = hooks();
    expect(item.result.current.selected).toBeNull();
    act(() => view.result.current.setSelectedCode("B"));
    expect(item.result.current.selected?.ty.product_description).toBe("PEPSI 12 PK");
  });
});
