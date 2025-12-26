import { describe, expect, it, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../utils";
import userEvent from "@testing-library/user-event";
import Forecast from "../../../pages/forecast/Forecasting";
import { screen, waitFor } from "@testing-library/react";
import { setupStore } from "../../../store";
import { getStoresAssignedToUserGroup } from "../../../api/groups";
import {
  getBucketList,
  getFromExistingS3File,
  getPriceHistory,
} from "../../../api/forecast";

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
      expect(mockToastWarn).toHaveBeenCalledWith("Please add at least one UPC");
    });

    await user.upload(
      (await screen.findByTestId("upc-file-input")) as HTMLInputElement,
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

    const searchBtn = await screen.findByTestId("forecast-search-btn");
    await user.click(searchBtn);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("API Failure");
    });
  });

  // => success third
  it("should handle API success on data fetch", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    (getHistoryFromList as Mock).mockResolvedValue(priceHistoryFromListResp);
    renderWithProviders(<Forecast />, { store });
    const searchBtn = await screen.findByTestId("forecast-search-btn");
    await user.click(searchBtn);

    await waitFor(() => {
      const state = store.getState().forecast;
      expect(state.items.length).toBe(7);
    });
  });

  // Then we handle the Forecast Controls interactions => Select all, Deselect all, Toggle Display, Filter Input
  it("should handle display toggles for forecast controls", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    renderWithProviders(<Forecast />, { store });

    const allRadio = await screen.findByTestId("radio-1");
    const selectedRadio = await screen.findByTestId("radio-2");
    const storesRadio = await screen.findByTestId("radio-3");

    // Click selected
    await user.click(selectedRadio);
    await user.click(storesRadio);
    await user.click(allRadio);

    const labelDisplay = await screen.findByTestId(
      "forecast-toggle-display-btn"
    );
    // show desc
    await user.click(labelDisplay);

    // show upc
    await user.click(labelDisplay);
  });

  it("should handle upc selection in ForecastControls component", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    renderWithProviders(<Forecast />, { store });

    const upcOne = await screen.findByTestId("check-0");
    const upcTwo = await screen.findByTestId("check-1");

    // select both
    await user.click(upcOne);
    await user.click(upcTwo);

    const selectedRadio = await screen.findByTestId("radio-2");
    await user.click(selectedRadio);

    const selectedUpcTwo = await screen.findByTestId("check-1");
    await user.click(selectedUpcTwo);

    // toggle the display
    const labelDisplay = await screen.findByTestId(
      "forecast-toggle-display-btn"
    );
    await user.click(labelDisplay);
  });

  it("should handle filtering in ForecastControls component", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    renderWithProviders(<Forecast />, { store });

    const filterInput = await screen.findByTestId(
      "forecast-controls-filter-input"
    );
    await user.type(filterInput, "12000000");
    await user.clear(filterInput);
  });

  it("should handle Select All and Deselect All in ForecastControls component", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    renderWithProviders(<Forecast />, { store });
    // "forecast-select-all-btn"
    // "forecast-select-all-btn"
    const selectAllBtn = await screen.findByTestId("forecast-select-all-btn");
    const deselectAllBtn = await screen.findByTestId(
      "forecast-deselect-all-btn"
    );

    await user.click(selectAllBtn);
    await waitFor(() => {
      const state = store.getState().forecast;
      expect(state.selectedUpcs.length).toBe(state.items.length);
    });

    await user.click(deselectAllBtn);
    await waitFor(() => {
      const state = store.getState().forecast;
      expect(state.selectedUpcs.length).toBe(0);
    });
  });

  // Then we handle Outlier grid interactions => creating/updating simulations and modifying rows
  it("should handle creating a new simulation", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    renderWithProviders(<Forecast />, { store });

    const selectAllBtn = await screen.findByTestId("forecast-select-all-btn");
    await user.click(selectAllBtn);

    const saveSimBtn = await screen.findByTestId("save-new-sim-btn");
    await user.click(saveSimBtn);
  });

  it("should allow the user to modify the Ad Days cell", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    renderWithProviders(<Forecast />, { store });

    const rows = await screen.findAllByRole("row");
    // rows.forEach((row, i) => console.log(`Row ${i}: `, row.textContent));

    const rowOneAdDays = rows[3].children[7];
    await user.dblClick(rowOneAdDays);

    // cells 7 and 8 => Ad Days and Ad Price
    const agInputs = document.querySelectorAll(".ag-input-field-input");
    // console.log("AG Inputs: ", Array.from(agInputs));
    const agInput = agInputs[0];

    await user.type(agInput, "4");
    await user.keyboard("{Enter}");

    // Expect here
    await waitFor(() => {
      const state = store.getState().forecast;
      expect(state.rowData[0].adDays).toBe(4);
    });
  });

  it("should allow the user to modify the Ad Days cell", async () => {
    (getBucketList as Mock).mockResolvedValue(fileListResp);
    renderWithProviders(<Forecast />, { store });

    const rows = await screen.findAllByRole("row");
    rows.forEach((row, i) => console.log(`Row ${i}: `, row.textContent));

    // cells 7 and 8 => Ad Days and Ad Price
    const rowTwoFcstPrice = rows[5].children[8];
    await user.dblClick(rowTwoFcstPrice);

    const agInputs = document.querySelectorAll(".ag-input-field-input");
    const agInput = agInputs[0];
    // console.log(agInput.getAttribute("id")); // #ag-901-input
    // console.log("AG Inputs: ", Array.from(agInputs));

    await user.clear(agInput);
    await user.type(agInput, "8.99");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      const state = store.getState().forecast;
      expect(state.rowData[2].fcstPrice).toBe(8.99);
    });
  });

  // need to create 4 sims => toggle between them => reload

  // Then we handle the calc modal => handle typing and calculating

  // Then we handle the export modal => data for all 5 possible scenarios
 
  // Then finally we handle resetting logic => sims and whole page (Reset button in ForecastControls)
});
