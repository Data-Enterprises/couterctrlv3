import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { setupStore } from "@/store";
import { setEndDate, setLastStore, setStartDate, setType } from "@/features/searchSlice";
import { useCashierCtx, useDesktopExplorer } from "@/pages/cashiers/dev/hooks";

/*
 * The desktop search card lists the exceptions found for one store or group
 * and date range. Once the search moves to another store or other dates, that
 * list no longer answers, so the card goes back to Find exceptions instead of
 * exploring with the old list.
 */

vi.mock("@/api/lossPrevention", () => ({
  getSaleTypes: vi.fn(() =>
    Promise.resolve({ data: { error: 0, sale_types: [{ sale_type: "Void" }, { sale_type: "Tender" }, { sale_type: "Refund" }] } }),
  ),
  getCashierTable: vi.fn(),
  getTransactionList: vi.fn(),
}));

vi.mock("@/components/toasts/hooks/useToast", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn(), warn: vi.fn() }),
}));

const explorerFor = (store: ReturnType<typeof setupStore>) =>
  renderHook(() => useDesktopExplorer(useCashierCtx()), {
    wrapper: ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>,
  });

const searchedStore = async () => {
  const store = setupStore();
  store.dispatch(setType("Store"));
  store.dispatch(setLastStore(36));
  store.dispatch(setStartDate("11/02/2026"));
  store.dispatch(setEndDate("11/08/2026"));
  const view = explorerFor(store);
  act(() => view.result.current.runPreflight());
  await waitFor(() => expect(view.result.current.saleTypes).toEqual(["Void", "Refund"]));
  return { store, view };
};

describe("Cashiers' exception list follows the search", () => {
  it("has no list before Find exceptions runs", () => {
    const { result } = explorerFor(setupStore());
    expect(result.current.saleTypes).toEqual([]);
    expect(result.current.preflightRan).toBe(false);
  });

  it("drops the list when the store changes, and gets it back on the same store", async () => {
    const { store, view } = await searchedStore();
    act(() => {
      store.dispatch(setLastStore(99));
    });
    expect(view.result.current.saleTypes).toEqual([]);
    expect(view.result.current.preflightRan).toBe(false);
    act(() => {
      store.dispatch(setLastStore(36));
    });
    expect(view.result.current.saleTypes).toEqual(["Void", "Refund"]);
  });

  it("drops the list when the dates change", async () => {
    const { store, view } = await searchedStore();
    act(() => {
      store.dispatch(setEndDate("11/09/2026"));
    });
    expect(view.result.current.saleTypes).toEqual([]);
  });

  it("finds the new store's exceptions when run again", async () => {
    const { store, view } = await searchedStore();
    act(() => {
      store.dispatch(setLastStore(99));
    });
    act(() => view.result.current.runPreflight());
    await waitFor(() => expect(view.result.current.saleTypes).toEqual(["Void", "Refund"]));
    expect(view.result.current.preflightRan).toBe(true);
  });
});
