import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { setupStore } from "@/store";
import { setSelectedStore, setType } from "@/features/searchSlice";
import { setAssignedStores } from "@/features/userSlice";
import ForecastListPanel from "@/pages/forecast/prod/listPanel/ForecastListPanel";
import type { Store } from "@/interfaces";

/*
 * The item panel names the store searched by its store name, never "Store 36",
 * even when the picked store arrived without its name.
 */

describe("Forecasting's item panel", () => {
  it("names a one-store search by the store's name", () => {
    const store = setupStore();
    store.dispatch(setAssignedStores([{ storeid: 36, store_number: "36", store_name: "Chapel Hill" }] as Store[]));
    store.dispatch(setType("Store"));
    store.dispatch(setSelectedStore({ storeid: 36, store_name: "" } as Store));
    render(
      <Provider store={store}>
        <ForecastListPanel onReSearch={() => {}} />
      </Provider>,
    );
    expect(screen.getByText("Chapel Hill")).toBeTruthy();
    expect(screen.queryByText("Store 36")).toBeNull();
  });
});
