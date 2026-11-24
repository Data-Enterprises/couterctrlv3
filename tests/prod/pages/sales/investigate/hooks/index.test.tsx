import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { setupStore } from "@/store";
import { useItemsGrid } from "@/pages/sales/prod/investigate/hooks";
import { judge } from "@/pages/sales/prod/investigate/utils/deptInvestigation";
import { PAGE_ROWS } from "@/pages/sales/prod/investigate/utils";
import type { ItemFacts, ItemVerdict } from "@/pages/sales/prod/investigate/interfaces";

/*
 * The Items grid's filters, sort and page are in the slice, so the page (its
 * export, and the other tabs sending an item to the grid) and the Items tab
 * see one grid.
 */

const item = (over: Partial<ItemFacts> = {}): ItemVerdict =>
  judge({
    productCode: "0001",
    description: "Thing",
    vendorName: "Acme",
    mineTy: 0, theirsTy: 0, mineLw: 0, theirsLw: 0, mineLy: 0, theirsLy: 0,
    mineUnits: 0, theirsUnits: 0, weighted: false, mineCogs: 0, theirsCogs: 0,
    mineSales: over.mineTy ?? 0,
    theirsSales: over.theirsTy ?? 0,
    orderedQty: 0, receivedUnits: 0,
    lastOrderDate: null, lastOrderQty: 0, receivedSinceOrder: 0,
    ...over,
  });

/** Enough items for three pages, every third from another vendor. */
const items = Array.from({ length: PAGE_ROWS * 2 + 10 }, (_, i) =>
  item({
    productCode: String(i).padStart(4, "0"),
    vendorName: i % 3 === 0 ? "Zed" : "Acme",
    mineTy: i,
    mineUnits: i,
  }),
);

const twoGrids = () => {
  const store = setupStore();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  const page = renderHook(() => useItemsGrid(items), { wrapper });
  const tab = renderHook(() => useItemsGrid(items), { wrapper });
  return { store, page, tab };
};

describe("useItemsGrid", () => {
  it("shares one grid between the page and the Items tab", () => {
    const { page, tab } = twoGrids();
    act(() => page.result.current.filters.setVendorQ("Zed"));
    expect(tab.result.current.sorted.every((r) => r.vendorName === "Zed")).toBe(true);
    expect(tab.result.current.sorted).toHaveLength(Math.ceil(items.length / 3));
  });

  it("sorts desc, asc, then back to the list's order", () => {
    const { tab } = twoGrids();
    act(() => tab.result.current.handleSort("mine"));
    expect(tab.result.current.sorted[0].productCode).toBe(
      items[items.length - 1].productCode,
    );
    act(() => tab.result.current.handleSort("mine"));
    expect(tab.result.current.sorted[0].productCode).toBe("0000");
    act(() => tab.result.current.handleSort("mine"));
    expect(tab.result.current.sort).toBeNull();
  });

  it("lands on the page that holds an item shown from another tab", () => {
    const { page, tab } = twoGrids();
    const far = items[PAGE_ROWS + 3].productCode;
    act(() => page.result.current.show(far));
    expect(tab.result.current.picked).toBe(far);
    expect(tab.result.current.at_).toBe(1);
    expect(tab.result.current.capped.some((r) => r.productCode === far)).toBe(true);
  });

  it("keeps a page past the end of a shorter list on its last page", () => {
    const { tab } = twoGrids();
    act(() => tab.result.current.setPage(2));
    act(() => tab.result.current.filters.setVendorQ("Zed"));
    expect(tab.result.current.at_).toBe(tab.result.current.pages - 1);
  });

  it("steps the rail through the filtered list, moving the page with it", () => {
    const { tab } = twoGrids();
    act(() => tab.result.current.show(items[PAGE_ROWS - 1].productCode));
    act(() => tab.result.current.stepItem(1));
    expect(tab.result.current.picked).toBe(items[PAGE_ROWS].productCode);
    expect(tab.result.current.at_).toBe(1);
  });
});
