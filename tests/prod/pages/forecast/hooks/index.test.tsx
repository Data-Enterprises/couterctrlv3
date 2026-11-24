import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { setupStore } from "@/store";
import { setLastGroup, setLastStore, setType } from "@/features/searchSlice";
import { setAssignedStores } from "@/features/userSlice";
import { useForecastCtx, useForecastSearch } from "@/pages/forecast/prod/hooks";
import type { Store } from "@/interfaces";

/*
 * A Shared search on Forecasting searches the shared group's stores, the ones
 * assigned to the person searching, never their last single store.
 */

const groupStores = vi.fn((..._args: unknown[]) =>
  Promise.resolve({
    data: { stores: [{ storeid: 5, active: 1 }, { storeid: 6, active: 1 }, { storeid: 7, active: 1 }] },
  }),
);
const history = vi.fn((..._args: unknown[]) => Promise.resolve({ data: { error: 0, results: [] } }));

vi.mock("@/api/groups", () => ({
  getStoresAssignedToUserGroup: (...args: unknown[]) => groupStores(...args),
}));
vi.mock("@/api/priceSim", () => ({
  getHistoryFromList: (...args: unknown[]) => history(...args),
}));
vi.mock("@/components/toasts/hooks/useToast", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn(), warn: vi.fn() }),
}));

describe("Forecasting's Shared search", () => {
  it("searches the shared group's assigned stores, not the last store", async () => {
    const store = setupStore();
    store.dispatch(setAssignedStores([{ storeid: 5 }, { storeid: 6 }] as Store[]));
    store.dispatch(setLastStore(36));
    store.dispatch(setLastGroup(12));
    store.dispatch(setType("Shared"));
    const { result } = renderHook(() => useForecastSearch(useForecastCtx(), () => {}), {
      wrapper: ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>,
    });

    await act(() => result.current.handleSearch());

    expect(groupStores.mock.calls[0][3]).toBe(12);
    await waitFor(() => expect(history).toHaveBeenCalled());
    expect(history.mock.calls[0][2]).toBe("5,6");
    expect(store.getState().prod.forecastDev.storeids).toBe("5,6");
  });
});
