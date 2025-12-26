import { describe, expect, it, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../utils";
import userEvent from "@testing-library/user-event";
import Forecast from "../../../pages/forecast/Forecasting";
import { screen, waitFor } from "@testing-library/react";
import { setupStore } from "../../../store";
import { getStoresAssignedToUserGroup } from "../../../api/groups";
import { getBucketList, getFromExistingS3File } from "../../../api/forecast";

import {
  defaultErrorResp,
  fileListResp,
  groupStoresResp,
  groups,
  stores,
  priceHistoryFromListResp,
} from ".";
import { setGroups } from "../../../features/groupSlice";
import { setAssignedStores } from "../../../features/userSlice";
import { getHistoryFromList } from "../../../api/priceSim";
import { setSelectedStores } from "../../../features/forecastSlice";

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
vi.mock("../../../api/priceSim");

const file = new File(
  [
    "upc\n1200000017\n1200000088\n1200000170\n1200003068\n2412601022\n7800008216\n3410057306",
  ],
  "forecast.csv",
  {
    type: "text/csv",
  }
);

const incorrectFile = new File(["invalid content"], "invalid.txt", {
  type: "text/plain",
});

describe("Forecast Page", () => {
  it("should handle API failure for fetching bucket list on mount", async () => {
    (getBucketList as Mock).mockRejectedValueOnce(defaultErrorResp);
    renderWithProviders(<Forecast />, { store });
  });

  it("sshould handle API success for fetching bucket list on mount", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    renderWithProviders(<Forecast />, { store });
  });

  // This test needs to handle API failure when selecting a row from the FileGrid
  // it("should handle API failure when selecting a file from the FileGrid component", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   (getFromExistingS3File as Mock).mockRejectedValueOnce(defaultErrorResp);
  //   renderWithProviders(<Forecast />, { store });
  // });

  // This needs to be updated when the file grid endpoint is updated to match that of the price history endpoint
  it("should handle the selecting of a file from the FileGrid component", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    (getFromExistingS3File as Mock).mockResolvedValue(priceHistoryFromListResp);
    renderWithProviders(<Forecast />, { store });

    // Finding the rows in the AgGrid table
    // The first row of each AGGrid is the header row, so we need to select the second row
    const rows = await screen.findAllByRole("row");
    await user.click(rows[1]);

    // Expect the data to come back => use the slice as a checker
  });

  it("should allow the user to select Stores in store picker", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    renderWithProviders(<Forecast />, { store });

    const storeTriggerIcon = await screen.findByTestId(
      "single-select-trigger-icon-1"
    );
    await user.click(storeTriggerIcon);

    const storeOption = await screen.findByTestId("single-select-option-1-0");
    await user.click(storeOption);
  });

  it("should handle store selection/deselection in store picker", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    renderWithProviders(<Forecast />, { store });

    const storeTriggerIcon = await screen.findByTestId(
      "single-select-trigger-icon-2"
    );
    await user.click(storeTriggerIcon);

    const storeOne = await screen.findByTestId("single-select-option-2-0");
    const storeTwo = await screen.findByTestId("single-select-option-2-1");

    await user.click(storeOne);
    await user.click(storeTwo);

    await waitFor(() => {
      const state = store.getState().forecast;
      expect(state.selectedStores.length).toBe(2);
    });

    // Clicking store option 2 again should deselect it
    await user.click(storeTwo);
    await waitFor(() => {
      const state = store.getState().forecast;
      expect(state.selectedStores.length).toBe(1);
    });
  });

  it("should handle API failure when fetching stores assigned to the selected group", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    renderWithProviders(<Forecast />, { store });

    const storeGroupTrigger = await screen.findByTestId(
      "single-select-trigger-icon-1"
    );
    await user.click(storeGroupTrigger);

    const groupOption = await screen.findByTestId("single-select-option-1-1");
    await user.click(groupOption);

    const groupTriggerIcon = await screen.findByTestId(
      "single-select-trigger-icon-2"
    );
    await user.click(groupTriggerIcon);

    (getStoresAssignedToUserGroup as Mock).mockRejectedValueOnce(
      defaultErrorResp
    );

    const groupToClick = await screen.findByTestId("single-select-option-2-0");
    await user.click(groupToClick);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("API Failure");
    });
  });

  it("should handle API success when fetching stores assigned to the selected group", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    (getStoresAssignedToUserGroup as Mock).mockResolvedValue(groupStoresResp);
    renderWithProviders(<Forecast />, { store });

    // forecast radioId is still 2 here => so just select the same group without repeating the user actions
    const groupTriggerIcon = await screen.findByTestId(
      "single-select-trigger-icon-2"
    );
    await user.click(groupTriggerIcon);

    const groupToClick = await screen.findByTestId("single-select-option-2-0");
    await user.click(groupToClick);
    await waitFor(() => {
      const state = store.getState().forecast;
      expect(state.selectedStores.length).toBe(3);
    });
  });

  // handle file upload for upcs
  it("should throw toast warning if incorrect file type is uploaded", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    renderWithProviders(<Forecast />, { store });

    const fileInput = (await screen.findByTestId(
      "upc-file-input"
    )) as HTMLInputElement;
    await user.upload(fileInput, incorrectFile);

    await waitFor(() => {
      expect(mockToastWarn).toHaveBeenCalledWith(
        "Please select a valid CSV file"
      );
    });
  });

  it("should handle file upload for UPCs", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    renderWithProviders(<Forecast />, { store });

    const fileInput = (await screen.findByTestId(
      "upc-file-input"
    )) as HTMLInputElement;
    await user.upload(fileInput, file);

    await waitFor(() => {
      const state = store.getState().upcs;
      expect(state.upcs.length).toBe(7);
      expect(state.upcs[0]).toBe("1200000017");
    });
  });

  // handle clearing the upcs
  it("should handle clearing UPCs when Clear button is clicked", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    renderWithProviders(<Forecast />, { store });

    const clearBtn = await screen.findByTestId("forecast-clear-upc-btn");
    await user.click(clearBtn);

    await waitFor(() => {
      const state = store.getState().upcs;
      expect(state.upcs.length).toBe(0);
    });
  });

  // Handle manually adding upcs
  it("should handle manually adding UPCs when Add button is clicked", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    renderWithProviders(<Forecast />, { store });

    const input = await screen.findByTestId("forecast-upc-input");
    await user.type(input, "1200000017,1200000088,1200000170");
    const addBtn = await screen.findByTestId("forecast-add-upc-btn");
    await user.click(addBtn);

    await user.type(input, "1200003068");
    // // press enter
    await user.keyboard("{Enter}");

    await waitFor(() => {
      const state = store.getState().upcs;
      expect(state.upcs.length).toBe(4);
      expect(state.upcs[3]).toBe("1200003068");
    });
  });

  it("should handle removing a single upc when clicking on it", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    renderWithProviders(<Forecast />, { store });

    const upcToClick = await screen.findByTestId(
      "forecast-upc-item-1200003068-3"
    );
    await user.click(upcToClick);

    await waitFor(() => {
      const state = store.getState().upcs;
      expect(state.upcs.length).toBe(3);
      expect(state.upcs.includes("1200003068")).toBe(false);
    });
  });

  // Then we handle data fetching success and failure cases
  it("should throw warning on data fetch if no stores are selected", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    renderWithProviders(<Forecast />, { store });

    // reset back to stores from groups
    const storeGroupTrigger = await screen.findByTestId(
      "single-select-trigger-icon-1"
    );
    await user.click(storeGroupTrigger);
    const storesOption = await screen.findByTestId("single-select-option-1-0");
    await user.click(storesOption);

    await waitFor(() => {
      const state = store.getState().forecast;
      expect(state.selectedStores.length).toBe(0);
    });

    const searchBtn = await screen.findByTestId("forecast-search-btn");
    await user.click(searchBtn);

    await waitFor(() => {
      expect(mockToastWarn).toHaveBeenCalledWith(
        "Please select at least one store"
      );
    });
  });

  it("should throw warning on data fetch if no UPCs are added", async () => {
    await waitFor(() => {
      store.dispatch(setSelectedStores(stores));
    });

    (getBucketList as Mock).mockResolvedValue(fileListResp);
    renderWithProviders(<Forecast />, { store });

    const clearBtn = await screen.findByTestId("forecast-clear-upc-btn");
    await user.click(clearBtn);
    const searchBtn = await screen.findByTestId("forecast-search-btn");
    await user.click(searchBtn);

    await waitFor(() => {
      expect(mockToastWarn).toHaveBeenCalledWith(
        "Please add at least one UPC"
      );
    });

    await user.upload(
      (await screen.findByTestId(
        "upc-file-input"
      )) as HTMLInputElement,
      file
    );

    await waitFor(() => {
      const state = store.getState().upcs;
      expect(state.upcs.length).toBe(7);
    });
  });

  // => failure second
  it("should handle API failure on data fetch", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    (getHistoryFromList as Mock).mockRejectedValueOnce(defaultErrorResp);
    renderWithProviders(<Forecast />, { store });

    // select a store
    const storeTriggerIcon = await screen.findByTestId(
      "single-select-trigger-icon-2"
    );
    await user.click(storeTriggerIcon);
    const storeOption = await screen.findByTestId("single-select-option-2-0");
    await user.click(storeOption);

    const searchBtn = await screen.findByTestId("forecast-search-btn");;
    await user.click(searchBtn);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("API Failure");
    });
  });

  // => success third
  it("should handle API success on data fetch", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    (getHistoryFromList as Mock).mockResolvedValue(
      priceHistoryFromListResp
    );
    renderWithProviders(<Forecast />, { store });
    const searchBtn = await screen.findByTestId("forecast-search-btn");;
    await user.click(searchBtn);

    await waitFor(() => {
      const state = store.getState().forecast;
      expect(state.items.length).toBe(7);
    });
  });

  // Then we handle the Forecast Controls interactions => Select all, Deselect all, Toggle Display, Filter Input

  // Then we handle Outlier grid interactions

  // then we handle simulations interactions

  // Then we handle the calc modal

  // Then we handle the export modal
});
