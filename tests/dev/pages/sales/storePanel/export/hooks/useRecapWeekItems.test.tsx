import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { setupStore } from "@/store";
import { cacheRecapItems } from "@/features/dev/devSalesLedgerSlice";
import type { SubDeptMargin } from "@/interfaces";
import { RECAP_ITEMS_MAX, dayKey, localIsoToday } from "@/pages/sales/dev/storePanel/summary/utils/recapKeys";
import { useRecapWeekItems } from "@/pages/sales/dev/storePanel/export/hooks";
import type { WeekDayItems } from "@/pages/sales/dev/storePanel/export/interfaces";

const fetchRows = vi.fn();
vi.mock("@/utils/marginRows", () => ({
  fetchSubDeptRowsOrEmpty: (...args: unknown[]) => fetchRows(...args),
}));

const row = (product_code: string) =>
  ({
    store_number: "369",
    product_code,
    product_description: `Item ${product_code}`,
    sub_department: 1,
    sub_department_description: "Drinks",
    total_sales: 10,
    total_tax: 0,
    qty: 1,
    weight: 0,
  }) as SubDeptMargin;

const item = (code: string) => ({
  code,
  name: code,
  subDeptId: 1,
  subDeptName: "Drinks",
  units: 1,
  pounds: 0,
  net: 1,
  vendors: [],
});

const setup = (store = setupStore()) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return { store, ...renderHook(() => useRecapWeekItems(685, "369"), { wrapper }) };
};

const read = async (load: (d: string[]) => Promise<WeekDayItems[]>, dates: string[]) => {
  let out: WeekDayItems[] = [];
  await act(async () => {
    out = await load(dates);
  });
  return out;
};

describe("the export's week of items", () => {
  beforeEach(() => fetchRows.mockReset());

  it("takes days Summary already read from the cache and reads only the rest", async () => {
    const store = setupStore();
    store.dispatch(cacheRecapItems({ key: dayKey(685, "369", "2026-10-29"), items: [item("held")] }));
    fetchRows.mockResolvedValue([row("fresh")]);
    const { result } = setup(store);
    const week = await read(result.current, ["2026-10-29", "2026-10-30"]);
    expect(week.map((d) => d.items.map((i) => i.code))).toEqual([["held"], ["fresh"]]);
    expect(fetchRows).toHaveBeenCalledTimes(1);
    expect(fetchRows.mock.calls[0][3]).toBe("2026-10-30");
  });

  it("keeps a finished day it read, but never today", async () => {
    fetchRows.mockResolvedValue([row("a")]);
    const today = localIsoToday();
    const { result, store } = setup();
    await read(result.current, ["2026-10-30", today]);
    const held = store.getState().dev.salesLedger.recapItems;
    expect(held[dayKey(685, "369", "2026-10-30")]).toBeDefined();
    expect(held[dayKey(685, "369", today)]).toBeUndefined();
    await read(result.current, [today]);
    expect(fetchRows).toHaveBeenCalledTimes(3);
  });

  it("marks a day that could not be read and keeps the rest", async () => {
    fetchRows.mockResolvedValueOnce([row("a")]).mockRejectedValueOnce(new Error("502"));
    const { result } = setup();
    const week = await read(result.current, ["2026-10-29", "2026-10-30"]);
    expect(week.map((d) => [d.date, d.items.length, !!d.failed])).toEqual([
      ["2026-10-29", 1, false],
      ["2026-10-30", 0, true],
    ]);
  });

  it("holds no more than its cap of store-days, dropping the least recent", () => {
    const store = setupStore();
    for (let i = 0; i <= RECAP_ITEMS_MAX; i++) {
      store.dispatch(cacheRecapItems({ key: `k${i}`, items: [item(`i${i}`)] }));
    }
    const { recapItems, recapItemsOrder } = store.getState().dev.salesLedger;
    expect(recapItemsOrder).toHaveLength(RECAP_ITEMS_MAX);
    expect(recapItems.k0).toBeUndefined();
    expect(recapItems[`k${RECAP_ITEMS_MAX}`]).toBeDefined();
  });
});
