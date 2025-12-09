import { describe, expect, it, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../utils";
import userEvent from "@testing-library/user-event";
import Forecast from "../../../pages/forecast/Forecasting";
import { screen, waitFor } from "@testing-library/react";
import { setupStore } from "../../../store";
import { getStoresAssignedToUserGroup } from "../../../api/groups";
import {
  getForecasting,
  getPriceHistory,
  getBucketList,
  getFromExistingS3File
} from "../../../api/forecast";

import {
  defaultErrorResp,
  fileListResp,
  priceHistoryResp,
  forecastResp,
  groupStoresResp,
  groups,
  stores,
} from ".";
import { setGroups } from "../../../features/groupSlice";
import { setAssignedStores } from "../../../features/userSlice";

const store = setupStore();
// Set the stores and groups since that gets fetched at login
store.dispatch(setGroups(groups));
store.dispatch(setAssignedStores(stores));

const user = userEvent.setup();
const mockToastWarn = vi.fn();
const mockToastError = vi.fn();
vi.mock("../../../components/toasts/hooks/useToast", () => {
  return {
    useToast: () => ({
      error: mockToastError,
      warn: mockToastWarn,
    }),
  };
});
vi.mock("../../../api/groups");
vi.mock("../../../api/forecast");

const file = new File(
  ["store,date,forecast\n001,2024-01-01,100"],
  "forecast.csv",
  {
    type: "text/csv",
  }
);

describe("Forecast Page", () => {
  it("should handle API failure for fetching bucket list on mount", async () => {
    (getBucketList as Mock).mockRejectedValueOnce(defaultErrorResp);
    renderWithProviders(<Forecast />, { store });
  });

  it("should handle API success for fetching bucket list on mount", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    renderWithProviders(<Forecast />, { store });
    const page = await screen.findByTestId("forecast-page");
    expect(page).toBeInTheDocument();
  });

  it("should show warning toast for invalid file type", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    renderWithProviders(<Forecast />);
    const incorrecFile = new File(["dummy content"], "forecast.txt", {
      type: "text/plain",
    });
    const input = screen.getByTestId("upc-file-input") as HTMLInputElement;
    await user.upload(input, incorrecFile);

    await waitFor(() => {
      expect(mockToastWarn).toHaveBeenCalledWith(
        "Please select a valid CSV file"
      );
    });
  });

  it("should handle successful .csv file upload from user", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    renderWithProviders(<Forecast />, { store });
    const input = screen.getByTestId("upc-file-input") as HTMLInputElement;
    await user.upload(input, file);
    expect(input.files).toHaveLength(1);
    expect(input.files?.[0]).toStrictEqual(file);
  });

  it("should handle API failure for fetching group stores", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    (getStoresAssignedToUserGroup as Mock).mockRejectedValueOnce(
      defaultErrorResp
    );
    renderWithProviders(<Forecast />, { store });

    const storeGroupTrigger = await screen.findByTestId(
      "single-select-trigger-icon-1"
    );
    await user.click(storeGroupTrigger);

    const groupOpt = await screen.findByTestId("single-select-option-1-1");
    await user.click(groupOpt);

    const trigger2 = await screen.findByTestId("single-select-trigger-icon-2");
    await user.click(trigger2);

    const option2 = await screen.findByTestId("single-select-option-2-0");
    await user.click(option2);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
    });
  });

  it("should fetch group stores for search values", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    renderWithProviders(<Forecast />, { store });

    const storeGroupTrigger = await screen.findByTestId(
      "single-select-trigger-icon-1"
    );
    await user.click(storeGroupTrigger);

    const groupOpt = await screen.findByTestId("single-select-option-1-1");
    await user.click(groupOpt);

    (getStoresAssignedToUserGroup as Mock).mockResolvedValueOnce(
      groupStoresResp
    );

    const trigger2 = await screen.findByTestId("single-select-trigger-icon-2");
    await user.click(trigger2);

    const option2 = await screen.findByTestId("single-select-option-2-0");
    await user.click(option2);
  });

  it("should allow the selection/deselection of stores for the query params", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    renderWithProviders(<Forecast />, { store });

    // Select Stores
    const storeGroupTrigger = await screen.findByTestId(
      "single-select-trigger-icon-1"
    );
    await user.click(storeGroupTrigger);

    const storeOpt = await screen.findByTestId("single-select-option-1-0");
    await user.click(storeOpt);

    // Open the stores
    const trigger2 = await screen.findByTestId("single-select-trigger-icon-2");
    await user.click(trigger2);

    //select the first store
    const store1 = await screen.findByTestId("single-select-option-2-0");
    await user.click(store1);

    // select and deselect the second store => testing the deselection logic
    const store2 = await screen.findByTestId("single-select-option-2-1");
    await user.click(store2); // Select
    await user.click(store2); // Deselect
  });

  it("should handle API failure for fetching main forecasting data", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    (getForecasting as Mock).mockRejectedValueOnce(defaultErrorResp);
    renderWithProviders(<Forecast />, { store });

    // Upload File
    const input = screen.getByTestId("upc-file-input") as HTMLInputElement;
    await user.upload(input, file);
    expect(input.files).toHaveLength(1);
    expect(input.files?.[0]).toStrictEqual(file);

    const searchBtn = await screen.findByTestId("forecast-search-btn");
    await user.click(searchBtn);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
    });
  });

  it("should handle API success for fetching main forecasting data", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    (getForecasting as Mock).mockResolvedValue(forecastResp);
    // (getPriceHistory as Mock).mockResolvedValueOnce(priceHistoryResp);
    renderWithProviders(<Forecast />, { store });

    // Upload File
    const input = screen.getByTestId("upc-file-input") as HTMLInputElement;
    await user.upload(input, file);
    expect(input.files).toHaveLength(1);
    expect(input.files?.[0]).toStrictEqual(file);

    // Successful data fetch
    const searchBtn = await screen.findByTestId("forecast-search-btn");
    await user.click(searchBtn);

    await waitFor(async () => {
      expect(
        await screen.findByTestId("forecast-controls")
      ).toBeInTheDocument();
    });
  });

  it("should handle radio button changes in ForecastControls", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    // (getForecasting as Mock).mockResolvedValue(forecastResp);
    renderWithProviders(<Forecast />, { store });

    const controls = await screen.findByTestId("forecast-controls");
    expect(controls).toBeInTheDocument();

    // radios
    const allRadio = await screen.findByTestId("radio-1");
    const selectedRadio = await screen.findByTestId("radio-2");
    const storesRadio = await screen.findByTestId("radio-3");

    // Stores to select
    const store1 = await screen.findByTestId("check-0");
    const store2 = await screen.findByTestId("check-1");
    const store3 = await screen.findByTestId("check-2");

    await user.click(store1);
    await user.click(store2);
    await user.click(store3);

    // show all selected
    await user.click(selectedRadio);

    // show the stores
    await user.click(storesRadio);

    // back to all
    await user.click(allRadio);
  });

  it("should handle toggling UPC/Description display and deselect all in ForecastControls", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    renderWithProviders(<Forecast />, { store });

    const controls = await screen.findByTestId("forecast-controls");
    expect(controls).toBeInTheDocument();
    const toggleBtn = await screen.findByTestId("forecast-toggle-display-btn");
    const deselectAllBtn = await screen.findByTestId(
      "forecast-deselect-all-btn"
    );
    const selectedRadio = await screen.findByTestId("radio-2");

    // Toggle display
    await user.click(toggleBtn);

    // Show selected
    await user.click(selectedRadio);

    // remove one from selected view
    const storeCheck = await screen.findByTestId("check-0");
    await user.click(storeCheck);

    // Deselect all
    await user.click(deselectAllBtn);

    await waitFor(() => {
      const state = store.getState().forecast;
      expect(state.selectedUpcs.length).toBe(0);
    });
  });

  it("should handle the filtering of UPCs in ForecastControls", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    (getPriceHistory as Mock).mockRejectedValueOnce(defaultErrorResp);
    renderWithProviders(<Forecast />, { store });

    const input = await screen.findByTestId("forecast-controls-filter-input");
    await user.type(input, "12345");
    expect((input as HTMLInputElement).value).toBe("12345");
    await user.clear(input);
    expect((input as HTMLInputElement).value).toBe("");
  });

  it("should handle API failure from row selection in Outlier Grid", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    (getPriceHistory as Mock).mockRejectedValueOnce(defaultErrorResp);
    renderWithProviders(<Forecast />, { store });

    // select store 1
    const store1 = await screen.findByTestId("check-0");
    await user.click(store1);

    // Find the cell and click it
    const cells = await screen.findAllByRole("gridcell");
    const cellToClick = cells.find((cell) => cell.textContent === "1200000017");
    if (cellToClick) {
      await user.click(cellToClick);
    }

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
    });
  });

  it("should handle API success from row selection in Outlier Grid", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    (getPriceHistory as Mock).mockResolvedValue(priceHistoryResp);
    renderWithProviders(<Forecast />, { store });

    // Store 1 should still be selected at this point => Find the cell and click it
    const cells = await screen.findAllByRole("gridcell");
    const cellToClick = cells.find((cell) => cell.textContent === "1200000017");
    if (cellToClick) {
      await user.click(cellToClick);
    }
  });

  it("should handle clearing all data and resetting the page", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    renderWithProviders(<Forecast />, { store });

    const resetBtn = await screen.findByTestId("forecast-controls-reset-btn");
    await user.click(resetBtn);

    await waitFor(() => {
      const state = store.getState().forecast;
      expect(state.items.length).toBe(0);
      expect(state.qty.length).toBe(0);
      expect(state.sales.length).toBe(0);
      expect(state.selectedUpcs.length).toBe(0);
    });
  });

  it("should handle api failure when fetching data from FileGrid", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    (getFromExistingS3File as Mock).mockRejectedValueOnce(defaultErrorResp);
    renderWithProviders(<Forecast />, { store });

    // Upload File
    const input = screen.getByTestId("upc-file-input") as HTMLInputElement;
    await user.upload(input, file);

    const cells = await screen.findAllByRole("gridcell");
    const cellToClick = cells.find(
      (cell) => cell.textContent === "1_12_08_2025_UPC_List.csv"
    );

    if (cellToClick) {
      await user.click(cellToClick);
    }

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
    });
  });

  it("should handle api success when fetching data from FileGrid", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    (getFromExistingS3File as Mock).mockResolvedValue(forecastResp);
    renderWithProviders(<Forecast />, { store });

    // Upload File
    const input = screen.getByTestId("upc-file-input") as HTMLInputElement;
    await user.upload(input, file);

    const cells = await screen.findAllByRole("gridcell");
    const cellToClick = cells.find(
      (cell) => cell.textContent === "1_12_08_2025_UPC_List.csv"
    );

    if (cellToClick) {
      await user.click(cellToClick);
    }
  });

  ////////////////////////////////////
  // handle the exporting of data here
  ////////////////////////////////////
  it("should open the export modal and handle closing it", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    renderWithProviders(<Forecast />, { store });

    const exportBtn = await screen.findByTestId("forecast-controls-export-btn");
    await user.click(exportBtn);
  });
});
