import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../utils";
import { screen, waitFor } from "@testing-library/react";
import { setupStore } from "../../../store";
import {
  defaultError,
  groups,
  groupTopTen,
  hourly,
  singleStoreSalesPanel,
  storedepts,
  sub_sales,
  topten,
  userStores,
  weekly,
  weeklyTwo,
  cat_sales,
  sub_sales2,
} from ".";
import Sales from "../../../pages/sales/Sales";

import {
  getTopTen, // topten
  getHourlyStoreDepts, // storedepts
  getSalesPanels, // singleSalesPanel
  getWeekly, // weekly
  getHourly, // hourly
  getSubs, // sub_sales
  getCats,
  // getCompareSubs, // cat_sales
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

// Setting up the store with values that should already be in redux
const store = setupStore();
store.dispatch(setToken("fake-token"));
store.dispatch(setLastGroup(1));
store.dispatch(setLastStore(1));
store.dispatch(setType("Store"));
store.dispatch(setAssignedStores(userStores.assigned_stores));
store.dispatch(setUnassignedStores(userStores.unassigned_stores));
store.dispatch(setGroups(groups));

// Always mock toast if using API
const mockToastError = vi.fn();
vi.mock("../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    error: mockToastError,
  }),
}));

// All uncovered attributes of the nivo/bar need to be mocked based
// on what the chart is expecting
vi.mock("@nivo/bar", () => ({
  ResponsiveBar: vi.fn((props) => {
    if (props.axisLeft?.format) {
      props.axisLeft.format("1 - $5.99");
    }

    if (props.tooltip) {
      props.tooltip({ data: { label: "Test Label", color: "black" } });
    }

    if (props.axisBottom?.format) {
      props.axisBottom.format("1 - $5.99");
    }

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

vi.mock("@nivo/line", () => ({
  ResponsiveLine: vi.fn((props) => {
    if (props.axisLeft?.format) {
      props.axisLeft.format(1);
    }

    if (props.tooltip) {
      props.tooltip({ point: { data: { x: "12/9/2025", y: 1.99 } } });
    }
    return <div data-testid="responsive-line" />;
  }),
}));

const renderSuccess = (group: boolean = false) => {
  const resp = group ? groupTopTen : topten;
  (getSalesPanels as Mock).mockResolvedValue(singleStoreSalesPanel);
  (getHourlyStoreDepts as Mock).mockResolvedValue(storedepts);
  (getWeekly as Mock).mockResolvedValue(weekly);
  (getHourly as Mock).mockResolvedValue(hourly);
  (getTopTen as Mock).mockResolvedValue(resp);
  (getSubs as Mock).mockResolvedValue(sub_sales);
  renderWithProviders(<Sales />, { store });
};

/**
 * NOTES:
 *
 * hour 9 in the hourly response is duplicated to cover the if(existing) logic in Hourly.tsx
 */

describe("Sales Page", () => {
  it("should handle API failure on mount", async () => {
    (getSalesPanels as Mock).mockRejectedValue(defaultError);
    (getHourlyStoreDepts as Mock).mockRejectedValue(defaultError);
    renderWithProviders(<Sales />, { store });

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledTimes(3);
    });
  });

  it("should handle api failure for fetching all data after sales panels are fetched", async () => {
    (getSalesPanels as Mock).mockResolvedValue(singleStoreSalesPanel);
    (getHourlyStoreDepts as Mock).mockResolvedValue(storedepts);
    (getWeekly as Mock).mockRejectedValueOnce(defaultError);
    (getHourly as Mock).mockRejectedValueOnce(defaultError);
    (getTopTen as Mock).mockRejectedValueOnce(defaultError);
    (getSubs as Mock).mockRejectedValueOnce(defaultError);

    renderWithProviders(<Sales />, { store });
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledTimes(4);
    });
  });

  it("should handle setting/unsetting selected sales panel", async () => {
    await waitFor(() => {
      renderSuccess();
    });

    const panel = await screen.findByTestId("sales-panel-0-0");
    await user.click(panel);

    await waitFor(() => {
      const state = store.getState().sales;
      expect(state.selectedSalesPanel.storeid).toBe(2);
    });

    const samePanel = await screen.findByTestId("sales-panel-1-0");
    await user.click(samePanel);

    await waitFor(() => {
      const state = store.getState().sales;
      expect(state.selectedSalesPanel.storeid).toBe(0);
    });
  });

  it("should filter sales panels based on search input", async () => {
    await waitFor(() => {
      renderSuccess();
    });

    const input = await screen.findByTestId("sales-panel-filter-input");
    await user.type(input, "Store 1");

    await waitFor(() => {
      const state = store.getState().sales;
      expect(state.salesPanelSearchText).toBe("Store 1");
    });

    await user.clear(input);
  });

  it("should handle mobile styling for main Sales page", async () => {
    await waitFor(() => {
      renderSuccess();
    });

    await waitFor(() => {
      store.dispatch(setIsDesktop(false));
      store.dispatch(setIsMobile(true));
    });
  });
  it("should handle desktop styling for main Sales page", async () => {
    await waitFor(() => {
      renderSuccess();
    });

    await waitFor(() => {
      store.dispatch(setIsDesktop(true));
      store.dispatch(setIsMobile(false));
    });
  });

  it("should handle the toggling of searchValue in main Sales page for API calls", async () => {
    await waitFor(() => {
      store.dispatch(setType("Group"));
    });
    await waitFor(() => {
      renderSuccess();
    });
  });

  // Hourly tests => nivo/bar is tested, just need to select a new hour
  it("should handle the hour selection in Hourly.tsx", async () => {
    await waitFor(() => {
      renderSuccess();
    });

    const hourTrigger = await screen.findByTestId(
      "single-select-trigger-icon-0"
    );
    await user.click(hourTrigger);
    const hour8 = await screen.findByTestId("single-select-option-0-1");
    await user.click(hour8);
  });

  // top ten items
  it("should set the top ten items based on clicking a sales panel", async () => {
    await waitFor(() => {
      renderSuccess(true);
    });

    // // select a sales panel
    const panel = await screen.findByTestId("sales-panel-0");
    await user.click(panel);

    await waitFor(() => {
      store.dispatch(setType("Store"));
    });
  });

  // weekly net sales
  it("should handle weekly sales based on group vs sales panel selection", async () => {
    await waitFor(() => {
      renderSuccess(true);
    });

    (getWeekly as Mock).mockResolvedValue(weeklyTwo);

    // Set the weekly net sales based on the clicked panel
    const panel = await screen.findByTestId("sales-panel-0");
    await user.click(panel);
  });

  it("should handle api failure for getting compare subs", async () => {
    await waitFor(() => {
      renderSuccess(true);
    });

    const panel = await screen.findByTestId("sales-panel-0");
    await user.click(panel);

    // clicking on compare subs to set the compare panel
    (getSubs as Mock).mockRejectedValueOnce(defaultError);
    const comparePanel = await screen.findByTestId("sales-panel-2-1");
    await user.click(comparePanel);

    
  });
  it("should compare sub sales when two panels are selected", async () => {
    await waitFor(() => {
      renderSuccess(true);
    });

    const panel = await screen.findByTestId("sales-panel-0");
    await user.click(panel);

    // clicking on compare subs to set the compare panel
    (getSubs as Mock).mockResolvedValue(sub_sales2);
    const comparePanel = await screen.findByTestId("sales-panel-2-1");
    await user.click(comparePanel);

    await waitFor(() => {
      const state = store.getState().sales;
      expect(state.compareSalesPanel.store_name).toBe("Store 2");
    });


    await user.click(comparePanel);
    await waitFor(() => {
      const state = store.getState().sales;
      expect(state.compareSalesPanel.store_name).toBe("");
    });
  });

  it("should cats api failure when Cats button is clicked", async () => {
    (getCats as Mock).mockRejectedValueOnce(defaultError);
    await waitFor(() => {
      renderSuccess(true);
    });

    const panel = await screen.findByTestId("sales-panel-cat-0");
    await user.click(panel);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Error fetching cats data: An error occurred"
      );
    });
  });

  it("should fetch categories data when Cats button is clicked", async () => {
    (getCats as Mock).mockResolvedValue(cat_sales);
    await waitFor(() => {
      renderSuccess(true);
    });

    const panel = await screen.findByTestId("sales-panel-cat-0");
    await user.click(panel);

    await waitFor(() => {
      const state = store.getState().sales;
      console.log(state.catSales)
    });
  });
});
