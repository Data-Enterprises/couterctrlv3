import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../utils";
import { screen, waitFor } from "@testing-library/react";
import { setupStore } from "../../../store";
import {
  defaultError,
  groups,
  hourly,
  singleStoreSalesPanel,
  storedepts,
  sub_sales,
  topten,
  userStores,
  weekly,
} from ".";
import Sales from "../../../pages/sales/Sales";

import {
  getTopTen, // topten
  getHourlyStoreDepts, // storedepts
  getSalesPanels, // singleSalesPanel
  getWeekly, // weekly
  getHourly, // hourly
  getSubs, // sub_sales
} from "../../../api/sales";
import {
  setIsDesktop,
  setIsMobile,
  setToken,
} from "../../../features/appSlice";
import userEvent from "@testing-library/user-event";
import {
  setLastGroup,
  setLastStore,
  setType,
} from "../../../features/searchSlice";
import {
  setAssignedStores,
  setUnassignedStores,
} from "../../../features/userSlice";
import { setGroups } from "../../../features/groupSlice";

const user = userEvent.setup();
vi.mock("../../../api/sales");

const store = setupStore();
store.dispatch(setToken("fake-token"));
store.dispatch(setLastGroup(1));
store.dispatch(setLastStore(1));
store.dispatch(setType("Store"));
store.dispatch(setAssignedStores(userStores.assigned_stores));
store.dispatch(setUnassignedStores(userStores.unassigned_stores));
store.dispatch(setGroups(groups));

const mockToastError = vi.fn();
vi.mock("../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    error: mockToastError,
  }),
}));

vi.mock("@nivo/bar", () => ({
  ResponsiveBar: vi.fn((props) => {
    // Cover axisLeft.format - called with string values
    if (props.axisLeft?.format) {
      props.axisLeft.format("1 - $5.99"); // singleRow case
      props.axisLeft.format("UPC123"); // multiRow case
    }

    if (props.tooltip) {
      props.tooltip({ data: { label: "Test Label", color: "black" } });
    }

    if (props.axisBottom?.format) {
      props.axisBottom.format("1 - $5.99");
    }

    // Previous coverage
    if (props.colors)
      props.colors({ id: "test", value: 100, data: { fill: "red" } });
    if (props.borderColor)
      props.borderColor({
        id: "test",
        value: 100,
        data: { data: { color: "red" } },
      });

    return <div data-testid="responsive-bar" />;
  }),
}));

describe("Sales Page", () => {
  it("should handle API failure on mount", async () => {
    (getSalesPanels as Mock).mockRejectedValue(defaultError);
    (getHourlyStoreDepts as Mock).mockRejectedValue(defaultError);
    renderWithProviders(<Sales />, { store });

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledTimes(3);
    });
  });

  it("should handle API success on mount", async () => {
    (getSalesPanels as Mock).mockResolvedValue(singleStoreSalesPanel);
    (getHourlyStoreDepts as Mock).mockResolvedValue(storedepts);
    (getWeekly as Mock).mockResolvedValue(weekly);
    (getHourly as Mock).mockResolvedValue(hourly);
    (getTopTen as Mock).mockResolvedValue(topten);
    (getSubs as Mock).mockResolvedValue(sub_sales);
    renderWithProviders(<Sales />, { store });
  });

  it("should filter sales panels based on search input", async () => {
    (getSalesPanels as Mock).mockResolvedValue(singleStoreSalesPanel);
    (getHourlyStoreDepts as Mock).mockResolvedValue(storedepts);
    (getWeekly as Mock).mockResolvedValue(weekly);
    (getHourly as Mock).mockResolvedValue(hourly);
    (getTopTen as Mock).mockResolvedValue(topten);
    (getSubs as Mock).mockResolvedValue(sub_sales);
    renderWithProviders(<Sales />, { store });

    const input = await screen.findByTestId("sales-panel-filter-input");
    await user.type(input, "Store 1");

    await waitFor(() => {
      const state = store.getState().sales;
      expect(state.salesPanelSearchText).toBe("Store 1");
    });

    await user.clear(input);
  });

  it("should handle mobile styling for main Sales page", async () => {
    (getSalesPanels as Mock).mockResolvedValue(singleStoreSalesPanel);
    (getHourlyStoreDepts as Mock).mockResolvedValue(storedepts);
    (getWeekly as Mock).mockResolvedValue(weekly);
    (getHourly as Mock).mockResolvedValue(hourly);
    (getTopTen as Mock).mockResolvedValue(topten);
    (getSubs as Mock).mockResolvedValue(sub_sales);
    renderWithProviders(<Sales />, { store });

    await waitFor(() => {
      store.dispatch(setIsDesktop(false));
      store.dispatch(setIsMobile(true));
    });
  });
  it("should handle desktop styling for main Sales page", async () => {
    (getSalesPanels as Mock).mockResolvedValue(singleStoreSalesPanel);
    (getHourlyStoreDepts as Mock).mockResolvedValue(storedepts);
    (getWeekly as Mock).mockResolvedValue(weekly);
    (getHourly as Mock).mockResolvedValue(hourly);
    (getTopTen as Mock).mockResolvedValue(topten);
    (getSubs as Mock).mockResolvedValue(sub_sales);
    renderWithProviders(<Sales />, { store });

    await waitFor(() => {
      store.dispatch(setIsDesktop(true));
      store.dispatch(setIsMobile(false));
    });
  });

  it("should handle the toggling of searchValue in main Sales page for API calls", async () => {
    await waitFor(() => {
      store.dispatch(setType("Group"));
    });
    (getSalesPanels as Mock).mockResolvedValue(singleStoreSalesPanel);
    (getHourlyStoreDepts as Mock).mockResolvedValue(storedepts);
    (getWeekly as Mock).mockResolvedValue(weekly);
    (getHourly as Mock).mockResolvedValue(hourly);
    (getTopTen as Mock).mockResolvedValue(topten);
    (getSubs as Mock).mockResolvedValue(sub_sales);
    renderWithProviders(<Sales />, { store });
  });
});
