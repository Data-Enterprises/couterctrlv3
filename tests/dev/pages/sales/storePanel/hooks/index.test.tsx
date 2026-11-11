import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { setupStore } from "@/store";
import { setSingleDate } from "@/features/searchSlice";
import { setSearchedDate } from "@/features/dev/devSalesLedgerSlice";
import { useWeekWindow } from "@/pages/sales/dev/storePanel/hooks";

/*
 * The store panel's week is the week the ledger searched. The search date is
 * shared by every page, so another page moving it (Forecasting set 11/10)
 * must not move the panel off the ledger's week.
 */

const weekFor = (store: ReturnType<typeof setupStore>) =>
  renderHook(() => useWeekWindow(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    ),
  }).result.current;

describe("the store panel's week", () => {
  it("stays on the searched week when another page moves the shared date", () => {
    const store = setupStore();
    store.dispatch(setSingleDate("11/08/2026"));
    store.dispatch(setSearchedDate("11/08/2026"));
    store.dispatch(setSingleDate("11/10/2026"));
    const w = weekFor(store);
    expect(w.twStart).toBe("2026-11-02");
    expect(w.twEnd).toBe("2026-11-08");
    expect(w.twRealDates).toEqual([
      "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08",
    ]);
  });

  it("follows the picker before Sales has searched", () => {
    const store = setupStore();
    store.dispatch(setSingleDate("11/10/2026"));
    expect(weekFor(store).twEnd).toBe("2026-11-10");
  });
});
