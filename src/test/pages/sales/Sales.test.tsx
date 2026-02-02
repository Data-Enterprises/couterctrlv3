import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../utils";
import { screen, waitFor, renderHook } from "@testing-library/react";
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
  noSubData,
  sub_sales2,
} from ".";
// import Sales from "../../../pages/sales/SalesOld";
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
import { act } from "react";
import { useHeight } from "../../../pages/sales/utils/hooks";
import { useHeight as useHeight2 } from "../../../pages/hooks";
import { ResponsiveBar } from "@nivo/bar";

const user = userEvent.setup();
vi.mock("../../../api/sales");

// Setting up the store with values that should already be in redux
const store = setupStore();
store.dispatch(setIsDesktop(true));
store.dispatch(setIsMobile(false));
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
    warn: vi.fn(),
  }),
}));

// put this near top of the test file
type BarClickDatum = {
  id: string;
  index: number;
  data: any;
};

vi.mock("@nivo/bar", () => ({
  ResponsiveBar: vi.fn((props: any) => {
    if (!props.data || props.data.length === 0) {
      return <div data-testid="responsive-bar-empty" />;
    }

    if (props.data.length > 0) {
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
        props.data.forEach((datum: any) => {
          props.colors({ data: datum });
        });
      if (props.borderColor) {
        props.data.forEach((datum: any) => {
          props.borderColor({ data: { data: datum } });
        });
      }

      // use one element per bar if you want more realism, or just one element
      return (
        <div data-testid="responsive-bar">
          {props.data.map((d: any, idx: number) => (
            <div
              key={idx}
              data-testid={`bar.item.total_sales.${idx}`}
              onClick={(e) =>
                props.onClick?.(
                  {
                    id: "total_sales",
                    index: idx,
                    data: d,
                  } as BarClickDatum,
                  e,
                )
              }
            />
          ))}
        </div>
      );
    }
  }),
}));

// All uncovered attributes of the nivo/bar need to be mocked based
// on what the chart is expecting
// vi.mock("@nivo/bar", () => ({
//   ResponsiveBar: vi.fn((props) => {
//     if (props.data.length > 0) {
//       if (props.axisLeft?.format) {
//         props.axisLeft.format("1 - $5.99");
//       }

//       if (props.tooltip) {
//         props.tooltip({ data: { label: "Test Label", color: "black" } });
//       }

//       if (props.axisBottom?.format) {
//         props.axisBottom.format("1 - $5.99");
//       }

//       if (props.colors)
//         props.data.forEach((datum: any) => {
//           props.colors({ data: datum });
//         });
//       if (props.borderColor) {
//         props.data.forEach((datum: any) => {
//           props.borderColor({ data: { data: datum } });
//         });
//       }

//       return <div data-testid="responsive-bar"></div>;
//     }
//   }),
// }));

// vi.mock("@nivo/line", () => ({
//   ResponsiveLine: vi.fn((props) => {
//     if (props.axisLeft?.format) {
//       props.axisLeft.format(1);
//     }

//     if (props.tooltip) {
//       props.tooltip({ point: { data: { x: "12/9/2025", y: 1.99 } } });
//     }
//     return <ResponsiveBar data={props.data} />;
//   }),
// }));

const renderSuccess = (subData: any, group: boolean = false) => {
  const resp = group ? groupTopTen : topten;
  (getSalesPanels as Mock).mockResolvedValue(singleStoreSalesPanel);
  (getHourlyStoreDepts as Mock).mockResolvedValue(storedepts);
  (getWeekly as Mock).mockResolvedValue(weekly);
  (getHourly as Mock).mockResolvedValue(hourly);
  (getTopTen as Mock).mockResolvedValue(resp);
  (getSubs as Mock).mockResolvedValue(subData);
  renderWithProviders(<Sales />, { store });
};

const renderSuccessMobile = (group: boolean = false) => {
  const resp = group ? groupTopTen : topten;
  const mobileStore = setupStore();
  mobileStore.dispatch(setIsDesktop(false));
  mobileStore.dispatch(setIsMobile(true));
  mobileStore.dispatch(setToken("fake-token"));
  mobileStore.dispatch(setLastGroup(1));
  mobileStore.dispatch(setLastStore(1));
  mobileStore.dispatch(setType("Store"));
  mobileStore.dispatch(setAssignedStores(userStores.assigned_stores));
  mobileStore.dispatch(setUnassignedStores(userStores.unassigned_stores));
  mobileStore.dispatch(setGroups(groups));
  (getSalesPanels as Mock).mockResolvedValue(singleStoreSalesPanel);
  (getHourlyStoreDepts as Mock).mockResolvedValue(storedepts);
  (getWeekly as Mock).mockResolvedValue(weekly);
  (getHourly as Mock).mockResolvedValue(hourly);
  (getTopTen as Mock).mockResolvedValue(resp);
  (getSubs as Mock).mockResolvedValue(sub_sales);
  renderWithProviders(<Sales />, { store: mobileStore });
};

const renderFailure = () => {
  (getSalesPanels as Mock).mockRejectedValue(defaultError);
  (getHourlyStoreDepts as Mock).mockRejectedValue(defaultError);
  (getWeekly as Mock).mockRejectedValue(defaultError);
  (getHourly as Mock).mockRejectedValue(defaultError);
  (getTopTen as Mock).mockRejectedValue(defaultError);
  (getSubs as Mock).mockRejectedValue(defaultError);
  renderWithProviders(<Sales />, { store });
};
/**
 * NOTES:
 *
 * hour 9 in the hourly response is duplicated to cover the if(existing) logic in Hourly.tsx
 */

describe("Sales Page", () => {
  it("should handle API failure on mount", async () => {
    await waitFor(() => {
      renderFailure();
    });

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
    });
  });

  it("should not update height when gridRef is null", () => {
    const { result } = renderHook(() => useHeight());
    // Initially, ref is not attached to any element
    expect(result.current.height).toBe(0);

    // Trigger resize - height should still be 0
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current.height).toBe(0);
  });

  it("should not update height when gridRef is null and maintain useHeight custom hook", async () => {
    await waitFor(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 500,
      });
      window.dispatchEvent(new Event("resize"));
    });

    await waitFor(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1800,
      });
      window.dispatchEvent(new Event("resize"));
    });

    const { result } = renderHook(() => useHeight());
    expect(result.current.height).toBe(0);
  });

  it("should not update height when gridRef is null and maintain useHeight custom hook", async () => {
    await waitFor(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 500,
      });
      window.dispatchEvent(new Event("resize"));
    });

    await waitFor(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1800,
      });
      window.dispatchEvent(new Event("resize"));
    });

    const { result } = renderHook(() => useHeight2());
    expect(result.current.height).toBe(385);
  });

  it("should handle api failure for fetching all data after sales panels are fetched", async () => {
    await waitFor(() => {
      renderFailure();
    });
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
    });
  });

  it("should handle setting/unsetting selected sales panel", async () => {
    await waitFor(() => {
      renderSuccess(sub_sales);
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

  it("should handle the toggling of searchValue in main Sales page for API calls", async () => {
    await waitFor(() => {
      store.dispatch(setType("Group"));
    });
    await waitFor(() => {
      renderSuccess(sub_sales, true);
    });
  });

  it("should handle hour selection in HourlyGrid.tsx", async () => {
    await waitFor(() => {
      renderSuccess(sub_sales);
    });

    const hourTen = await screen.findByTestId("hour-10");
    await user.click(hourTen);
  });

  it("should handle mobile styling for main Sales page", async () => {
    await waitFor(() => {
      renderSuccessMobile();
    });
  });

  it("should throw warning if a sub dept period doesn't return any rows", async () => {
    await waitFor(() => {
      renderSuccess(noSubData);
    });
  });

  it("should handle Sub Dept selection in the SubDeptGrid.tsx", async () => {
    await waitFor(() => {
      renderSuccess(sub_sales2);
    });

    const subDeptRows = await screen.findAllByRole("row");
    await user.click(subDeptRows[2]);
    await user.click(subDeptRows[2]);
  });

  it("should handle sub dept selection in mobile view in the SubDeptGrid.tsx", async () => {
    await waitFor(() => {
      renderSuccessMobile();
    });

    // id for the sub dept single select is set to 1 in the SubDeptGrid component
    const select = await screen.findByTestId("single-select-trigger-icon-1");
    await user.click(select);

    const option = await screen.findByTestId("single-select-option-1-3");
    await user.click(option);
  });

  it("should handle desktop item selection in TopTen.tsx", async () => {
    await waitFor(() => {
      renderSuccess(sub_sales);
    });

    // format for nivo/bar test id is bar.item.total_sales.8 for the topTen bar
    const itemOne = await screen.findByTestId("bar.item.total_sales.9");
    const item = await screen.findByTestId("bar.item.total_sales.8");
    await user.click(item);
    await user.click(itemOne);
  });

  it("should handle mobile item selection in TopTen.tsx", async () => {
    await waitFor(() => {
      renderSuccessMobile();
    });

    const select = await screen.findByTestId("single-select-trigger-icon-2");
    await user.click(select);

    const option = await screen.findByTestId("single-select-option-2-3");
    await user.click(option);
  });

  it("should handle hovering over the tooltips in TopTen.tsx desktop view", async () => {
    await waitFor(() => {
      renderSuccess(sub_sales);
    });

    const icons = [
      await screen.findByTestId("gpm-tooltip-icon"),
      await screen.findByTestId("rpu-tooltip-icon"),
      await screen.findByTestId("ppu-tooltip-icon"),
      await screen.findByTestId("cpu-tooltip-icon"),
    ];

    for (const icon of icons) {
      await user.hover(icon);
      await user.unhover(icon);
    }
  });
});
