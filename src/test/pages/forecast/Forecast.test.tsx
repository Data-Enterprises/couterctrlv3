import { describe, expect, it, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../utils";
import userEvent from "@testing-library/user-event";
import Forecast from "../../../pages/forecast/Forecasting";
import { screen, waitFor } from "@testing-library/react";
import { setupStore } from "../../../store";
import { getStoresAssignedToUserGroup } from "../../../api/groups";
import { getBucketList } from "../../../api/forecast";

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
  it("");
  // it("should handle API failure for fetching bucket list on mount", async () => {
  //   (getBucketList as Mock).mockRejectedValueOnce(defaultErrorResp);
  //   renderWithProviders(<Forecast />, { store });
  // });

  // it("sshould handle API success for fetching bucket list on mount", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   // resize the browser
  //   await waitFor(() => {
  //     Object.defineProperty(window, "innerWidth", {
  //       writable: true,
  //       configurable: true,
  //       value: 1600,
  //     });
  //   });
  //   window.dispatchEvent(new Event("resize"));
  // });

  // // This test needs to handle API failure when selecting a row from the FileGrid
  // it("should throw an error toast when fetching file names fails", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   (getHistoryFromList as Mock).mockRejectedValueOnce(defaultErrorResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const rows = await screen.findAllByRole("row");
  //   const rowToClick = rows[1];
  //   await user.click(rowToClick);

  //   await waitFor(() => {
  //     expect(mockToastError).toHaveBeenCalledWith(defaultErrorResp.message);
  //   });
  // });

  // it("should do nothing if error !== 0 when fetching file names", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   (getHistoryFromList as Mock).mockResolvedValue({
  //     data: { error: 1, results: [] },
  //   });
  //   renderWithProviders(<Forecast />, { store });

  //   const rows = await screen.findAllByRole("row");
  //   const rowToClick = rows[1];
  //   await user.click(rowToClick);

  //   await waitFor(() => {
  //     expect(mockToastError).not.toHaveBeenCalled();
  //     expect(store.getState().forecast.items.length).toBe(0);
  //   });
  // });

  // // This needs to be updated when the file grid endpoint is updated to match that of the price history endpoint
  // it("should handle the selecting of a file from the FileGrid component", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   (getHistoryFromList as Mock).mockResolvedValue(priceHistoryFromListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const rows = await screen.findAllByRole("row");
  //   const rowToClick = rows[1];
  //   await user.click(rowToClick);

  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     const respItems = priceHistoryFromListResp.data.results;
  //     expect(state.items.length).toBe(respItems.length);
  //   });
  // });

  // it("should allow the user to select Stores in store picker", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const storeTriggerIcon = await screen.findByTestId(
  //     "single-select-trigger-icon-1"
  //   );
  //   await user.click(storeTriggerIcon);

  //   const storeOption = await screen.findByTestId("single-select-option-1-0");
  //   await user.click(storeOption);
  // });

  // it("should handle store selection/deselection in store picker", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const storeTriggerIcon = await screen.findByTestId(
  //     "single-select-trigger-icon-2"
  //   );
  //   await user.click(storeTriggerIcon);

  //   const storeOne = await screen.findByTestId("single-select-option-2-0");
  //   const storeTwo = await screen.findByTestId("single-select-option-2-1");

  //   await user.click(storeOne);
  //   await user.click(storeTwo);

  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.selectedStores.length).toBe(2);
  //   });

  //   // Clicking store option 2 again should deselect it
  //   await user.click(storeTwo);
  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.selectedStores.length).toBe(1);
  //   });
  // });

  // it("should handle API failure when fetching stores assigned to the selected group", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const storeGroupTrigger = await screen.findByTestId(
  //     "single-select-trigger-icon-1"
  //   );
  //   await user.click(storeGroupTrigger);

  //   const groupOption = await screen.findByTestId("single-select-option-1-1");
  //   await user.click(groupOption);

  //   const groupTriggerIcon = await screen.findByTestId(
  //     "single-select-trigger-icon-2"
  //   );
  //   await user.click(groupTriggerIcon);

  //   (getStoresAssignedToUserGroup as Mock).mockRejectedValueOnce(
  //     defaultErrorResp
  //   );

  //   const groupToClick = await screen.findByTestId("single-select-option-2-0");
  //   await user.click(groupToClick);

  //   await waitFor(() => {
  //     expect(mockToastError).toHaveBeenCalledWith("API Failure");
  //   });
  // });

  // it("should handle API success when fetching stores assigned to the selected group", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   (getStoresAssignedToUserGroup as Mock).mockResolvedValue(groupStoresResp);
  //   renderWithProviders(<Forecast />, { store });

  //   // forecast radioId is still 2 here => so just select the same group without repeating the user actions
  //   const groupTriggerIcon = await screen.findByTestId(
  //     "single-select-trigger-icon-2"
  //   );
  //   await user.click(groupTriggerIcon);

  //   const groupToClick = await screen.findByTestId("single-select-option-2-0");
  //   await user.click(groupToClick);
  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.selectedStores.length).toBe(3);
  //   });
  // });

  // // handle file upload for upcs
  // it("should throw toast warning if incorrect file type is uploaded", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const fileInput = (await screen.findByTestId(
  //     "upc-file-input"
  //   )) as HTMLInputElement;
  //   await user.upload(fileInput, incorrectFile);

  //   await waitFor(() => {
  //     expect(mockToastWarn).toHaveBeenCalledWith(
  //       "Please select a valid CSV file"
  //     );
  //   });
  // });

  // it("should handle file upload for UPCs", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const fileInput = (await screen.findByTestId(
  //     "upc-file-input"
  //   )) as HTMLInputElement;
  //   await user.upload(fileInput, file);

  //   await waitFor(() => {
  //     const state = store.getState().upcs;
  //     expect(state.upcs.length).toBe(7);
  //     expect(state.upcs[0]).toBe("1200000017");
  //   });
  // });

  // // handle clearing the upcs
  // it("should handle clearing UPCs when Clear button is clicked", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const clearBtn = await screen.findByTestId("forecast-clear-upc-btn");
  //   await user.click(clearBtn);

  //   await waitFor(() => {
  //     const state = store.getState().upcs;
  //     expect(state.upcs.length).toBe(0);
  //   });
  // });

  // // Handle manually adding upcs
  // it("should handle manually adding UPCs when Add button is clicked", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const input = await screen.findByTestId("forecast-upc-input");
  //   await user.type(input, "1200000017,1200000088,1200000170");
  //   const addBtn = await screen.findByTestId("forecast-add-upc-btn");
  //   await user.click(addBtn);

  //   await user.type(input, "1200003068");
  //   // // press enter
  //   await user.keyboard("{Enter}");

  //   await waitFor(() => {
  //     const state = store.getState().upcs;
  //     expect(state.upcs.length).toBe(4);
  //     expect(state.upcs[3]).toBe("1200003068");
  //   });
  // });

  // it("should handle removing a single upc when clicking on it", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const upcToClick = await screen.findByTestId(
  //     "forecast-upc-item-1200003068-3"
  //   );
  //   await user.click(upcToClick);

  //   await waitFor(() => {
  //     const state = store.getState().upcs;
  //     expect(state.upcs.length).toBe(3);
  //     expect(state.upcs.includes("1200003068")).toBe(false);
  //   });
  // });

  // // Then we handle data fetching success and failure cases
  // it("should throw warning on data fetch if no stores are selected", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   // reset back to stores from groups
  //   const storeGroupTrigger = await screen.findByTestId(
  //     "single-select-trigger-icon-1"
  //   );
  //   await user.click(storeGroupTrigger);
  //   const storesOption = await screen.findByTestId("single-select-option-1-0");
  //   await user.click(storesOption);

  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.selectedStores.length).toBe(0);
  //   });

  //   const searchBtn = await screen.findByTestId("forecast-search-btn");
  //   await user.click(searchBtn);

  //   await waitFor(() => {
  //     expect(mockToastWarn).toHaveBeenCalledWith(
  //       "Please select at least one store"
  //     );
  //   });
  // });

  // it("should throw warning on data fetch if no UPCs are added", async () => {
  //   await waitFor(() => {
  //     store.dispatch(setSelectedStores(stores));
  //   });

  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const clearBtn = await screen.findByTestId("forecast-clear-upc-btn");
  //   await user.click(clearBtn);
  //   const searchBtn = await screen.findByTestId("forecast-search-btn");
  //   await user.click(searchBtn);

  //   await waitFor(() => {
  //     expect(mockToastWarn).toHaveBeenCalledWith("Please add at least one UPC");
  //   });

  //   await user.upload(
  //     (await screen.findByTestId("upc-file-input")) as HTMLInputElement,
  //     file
  //   );

  //   await waitFor(() => {
  //     const state = store.getState().upcs;
  //     expect(state.upcs.length).toBe(7);
  //   });
  // });

  // // => failure second
  // it("should handle API failure on data fetch", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   (getHistoryFromList as Mock).mockRejectedValueOnce(defaultErrorResp);
  //   renderWithProviders(<Forecast />, { store });

  //   // select a store
  //   const storeTriggerIcon = await screen.findByTestId(
  //     "single-select-trigger-icon-2"
  //   );
  //   await user.click(storeTriggerIcon);
  //   const storeOption = await screen.findByTestId("single-select-option-2-0");
  //   await user.click(storeOption);

  //   const searchBtn = await screen.findByTestId("forecast-search-btn");
  //   await user.click(searchBtn);

  //   await waitFor(() => {
  //     expect(mockToastError).toHaveBeenCalledWith("API Failure");
  //   });
  // });

  // it("should inform the user no results are found on data fetch", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   (getHistoryFromList as Mock).mockResolvedValue({
  //     data: { error: 0, results: [] },
  //   });
  //   renderWithProviders(<Forecast />, { store });
  //   const searchBtn = await screen.findByTestId("forecast-search-btn");
  //   await user.click(searchBtn);

  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.items.length).toBe(0);
  //   });
  // });

  // // => success third
  // it("should handle API success on data fetch", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   (getHistoryFromList as Mock).mockResolvedValue(priceHistoryFromListResp);
  //   renderWithProviders(<Forecast />, { store });
  //   const searchBtn = await screen.findByTestId("forecast-search-btn");
  //   await user.click(searchBtn);

  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.items.length).toBe(8);
  //   });
  // });

  // // Then we handle the Forecast Controls interactions => Select all, Deselect all, Toggle Display, Filter Input
  // it("should handle display toggles for forecast controls", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const allRadio = await screen.findByTestId("radio-1");
  //   const selectedRadio = await screen.findByTestId("radio-2");
  //   const storesRadio = await screen.findByTestId("radio-3");

  //   // Click selected
  //   await user.click(selectedRadio);
  //   await user.click(storesRadio);
  //   await user.click(allRadio);

  //   const labelDisplay = await screen.findByTestId(
  //     "forecast-toggle-display-btn"
  //   );
  //   // show desc
  //   await user.click(labelDisplay);

  //   // show upc
  //   await user.click(labelDisplay);
  // });

  // it("should handle upc selection in ForecastControls component", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const upcOne = await screen.findByTestId("check-0");
  //   const upcTwo = await screen.findByTestId("check-1");

  //   // select both
  //   await user.click(upcOne);
  //   await user.click(upcTwo);

  //   const selectedRadio = await screen.findByTestId("radio-2");
  //   await user.click(selectedRadio);

  //   const selectedUpcTwo = await screen.findByTestId("check-1");
  //   await user.click(selectedUpcTwo);

  //   // toggle the display
  //   const labelDisplay = await screen.findByTestId(
  //     "forecast-toggle-display-btn"
  //   );
  //   await user.click(labelDisplay);
  // });

  // it("should handle filtering in ForecastControls component", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const filterInput = await screen.findByTestId(
  //     "forecast-controls-filter-input"
  //   );
  //   await user.type(filterInput, "12000000");
  //   await user.clear(filterInput);
  // });

  // it("should handle Select All and Deselect All in ForecastControls component", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const selectAllBtn = await screen.findByTestId("forecast-select-all-btn");
  //   const deselectAllBtn = await screen.findByTestId(
  //     "forecast-deselect-all-btn"
  //   );

  //   await user.click(selectAllBtn);
  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.selectedUpcs.length).toBe(state.items.length - 1);
  //   });

  //   await user.click(deselectAllBtn);
  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.selectedUpcs.length).toBe(0);
  //   });
  // });

  // // Then we handle Outlier grid interactions => creating/updating simulations and modifying rows
  // it("should handle creating a new simulation", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const selectAllBtn = await screen.findByTestId("forecast-select-all-btn");
  //   await user.click(selectAllBtn);

  //   const saveSimBtn = await screen.findByTestId("save-new-sim-btn");
  //   await user.click(saveSimBtn);

  //   const deselectAllBtn = await screen.findByTestId(
  //     "forecast-deselect-all-btn"
  //   );

  //   // deselecting, the selecting all
  //   await user.click(deselectAllBtn);
  //   await user.click(selectAllBtn);

  //   const upcOne = await screen.findByTestId("check-0");
  //   await user.click(upcOne);
  //   await user.click(upcOne);
  // });

  // it("should update sim1 with Fcst Price", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   // cells 7 and 8 => Ad Days and Ad Price
  //   const rows = await screen.findAllByRole("row");
  //   const rowOneAdDays = rows[4].children[8];
  //   await user.dblClick(rowOneAdDays);

  //   const agInputs = document.querySelectorAll(".ag-input-field-input");
  //   const agInput = agInputs[0];
  //   await user.clear(agInput);
  //   await user.type(agInput, "8.99");
  //   await user.keyboard("{Enter}");

  //   // Expect here
  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.rowData[0].fcstPrice).toBe(8.99);
  //   });
  // });

  // it("should handle ad days greater than expected days in forecastUnits", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   // cells 7 and 8 => Ad Days and Ad Price
  //   const rows = await screen.findAllByRole("row");
  //   const rowOneAdDays = rows[4].children[7];
  //   await user.dblClick(rowOneAdDays);

  //   const agInputs = document.querySelectorAll(".ag-input-field-input");
  //   const agInput = agInputs[0];
  //   await user.clear(agInput);
  //   await user.type(agInput, "4");
  //   await user.keyboard("{Enter}");

  //   // Expect here
  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.rowData[0].adDays).toBe(4);
  //   });
  // });

  // it("should handle ad days less than expected days in forecastUnits", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   // cells 7 and 8 => Ad Days and Ad Price
  //   const rows = await screen.findAllByRole("row");
  //   const rowTwoAdDays = rows[5].children[7];
  //   await user.dblClick(rowTwoAdDays);

  //   const agInputs = document.querySelectorAll(".ag-input-field-input");
  //   const agInput = agInputs[0];
  //   await user.clear(agInput);
  //   await user.type(agInput, "2");
  //   await user.keyboard("{Enter}");

  //   // Expect here
  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.rowData[1].adDays).toBe(2);
  //   });
  // });

  // it("should update sim2 with Fcst Price", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const sim2btn = await screen.findByTestId("sim2-btn");
  //   await user.click(sim2btn);

  //   const selectAllBtn = await screen.findByTestId("forecast-select-all-btn");
  //   await user.click(selectAllBtn);

  //   // cells 7 and 8 => Ad Days and Ad Price
  //   const rows = await screen.findAllByRole("row");
  //   const rowOneAdDays = rows[4].children[8];
  //   await user.dblClick(rowOneAdDays);

  //   const agInputs = document.querySelectorAll(".ag-input-field-input");
  //   const agInput = agInputs[0];
  //   await user.clear(agInput);
  //   await user.type(agInput, "8.99");
  //   await user.keyboard("{Enter}");

  //   // Expect here
  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.rowData[0].fcstPrice).toBe(8.99);
  //   });
  // });

  // it("should update sim3 with Fcst Price", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const sim3btn = await screen.findByTestId("sim3-btn");
  //   await user.click(sim3btn);

  //   const selectAllBtn = await screen.findByTestId("forecast-select-all-btn");
  //   await user.click(selectAllBtn);

  //   // cells 7 and 8 => Ad Days and Ad Price
  //   const rows = await screen.findAllByRole("row");
  //   const rowOneAdDays = rows[4].children[8];
  //   await user.dblClick(rowOneAdDays);

  //   const agInputs = document.querySelectorAll(".ag-input-field-input");
  //   const agInput = agInputs[0];
  //   await user.clear(agInput);
  //   await user.type(agInput, "8.99");
  //   await user.keyboard("{Enter}");

  //   // Expect here
  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.rowData[0].fcstPrice).toBe(8.99);
  //   });
  // });

  // it("should update sim4 with Fcst Price", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const sim4btn = await screen.findByTestId("sim4-btn");
  //   await user.click(sim4btn);

  //   const selectAllBtn = await screen.findByTestId("forecast-select-all-btn");
  //   await user.click(selectAllBtn);

  //   // cells 7 and 8 => Ad Days and Ad Price
  //   const rows = await screen.findAllByRole("row");
  //   const rowOneAdDays = rows[4].children[8];
  //   await user.dblClick(rowOneAdDays);

  //   const agInputs = document.querySelectorAll(".ag-input-field-input");
  //   const agInput = agInputs[0];
  //   await user.clear(agInput);
  //   await user.type(agInput, "8.99");
  //   await user.keyboard("{Enter}");

  //   // Expect here
  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.rowData[0].fcstPrice).toBe(8.99);
  //   });
  // });

  // it("should should handle the middle boundary forecastUnits in the Fcst Price cell", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   // cells 7 and 8 => Fcst Price and Ad Price
  //   const rows = await screen.findAllByRole("row");
  //   const rowTwoFcstPrice = rows[6].children[8];
  //   await user.dblClick(rowTwoFcstPrice);

  //   const agInputs = document.querySelectorAll(".ag-input-field-input");
  //   const agInput = agInputs[0];
  //   await user.clear(agInput);
  //   await user.type(agInput, "8.99");
  //   await user.keyboard("{Enter}");

  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.rowData[2].fcstPrice).toBe(8.99);
  //   });
  // });

  // it("should should handle the middle boundary forecastUnits in the Fcst Price cell", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   // cells 7 and 8 => Fcst Price and Ad Price
  //   const rows = await screen.findAllByRole("row");
  //   const rowTwoFcstPrice = rows[6].children[8];
  //   await user.dblClick(rowTwoFcstPrice);

  //   const agInputs = document.querySelectorAll(".ag-input-field-input");
  //   const agInput = agInputs[0];
  //   await user.clear(agInput);
  //   await user.type(agInput, "11.99");
  //   await user.keyboard("{Enter}");

  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.rowData[2].fcstPrice).toBe(11.99);
  //   });
  // });

  // it("should handle upper boundary forecastUnits in the Fcst Price cell", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   // cells 7 and 8 => Fcst Price and Ad Price
  //   const rows = await screen.findAllByRole("row");
  //   const rowTwoFcstPrice = rows[5].children[8];
  //   await user.dblClick(rowTwoFcstPrice);

  //   const agInputs = document.querySelectorAll(".ag-input-field-input");
  //   const agInput = agInputs[0];
  //   await user.clear(agInput);
  //   await user.type(agInput, "15.99");
  //   await user.keyboard("{Enter}");

  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.rowData[1].fcstPrice).toBe(15.99);
  //   });
  // });

  // // need to create 4 sims => toggle between them => reload
  // it("should handle creating a new simulation", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const selectAllBtn = await screen.findByTestId("forecast-select-all-btn");
  //   await user.click(selectAllBtn);

  //   const saveSimBtn = await screen.findByTestId("save-new-sim-btn");
  //   // Sim One is already created from previous test => create the other 3
  //   await user.click(saveSimBtn);
  //   await user.click(saveSimBtn);
  //   await user.click(saveSimBtn);

  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.simBtns.sim1).toBe(1);
  //     expect(state.simBtns.sim2).toBe(1);
  //     expect(state.simBtns.sim3).toBe(1);
  //     expect(state.simBtns.sim4).toBe(1);
  //   });
  // });

  // it("should handle toggling between the created simulations", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const selectAllBtn = await screen.findByTestId("forecast-select-all-btn");
  //   await user.click(selectAllBtn);

  //   const sim1btn = await screen.findByTestId("sim1-btn");
  //   const sim2btn = await screen.findByTestId("sim2-btn");
  //   const sim3btn = await screen.findByTestId("sim3-btn");
  //   const sim4btn = await screen.findByTestId("sim4-btn");

  //   await user.click(sim1btn);
  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.selectedSim).toBe("sim1");
  //   });

  //   await user.click(sim2btn);
  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.selectedSim).toBe("sim2");
  //   });

  //   await user.click(sim3btn);
  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.selectedSim).toBe("sim3");
  //   });

  //   await user.click(sim4btn);
  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.selectedSim).toBe("sim4");
  //   });
  // });

  // it("should handle updating the currently selected sim2 rows", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const sim2btn = await screen.findByTestId("sim2-btn");
  //   await user.click(sim2btn);

  //   const deselectAllBtn = await screen.findByTestId(
  //     "forecast-deselect-all-btn"
  //   );

  //   const selectAllBtn = await screen.findByTestId("forecast-select-all-btn");

  //   // deselecting, the selecting all
  //   await user.click(deselectAllBtn);
  //   await user.click(selectAllBtn);

  //   const upcOne = await screen.findByTestId("check-0");
  //   await user.click(upcOne);
  //   await user.click(upcOne);

  //   const rows = await screen.findAllByRole("row");
  //   const rowOneAdDays = rows[4].children[7];
  //   await user.dblClick(rowOneAdDays);

  //   // cells 7 and 8 => Ad Days and Ad Price
  //   const agInputs = document.querySelectorAll(".ag-input-field-input");
  //   const agInput = agInputs[0];

  //   await user.clear(agInput);
  //   await user.type(agInput, "6");
  //   await user.keyboard("{Enter}");

  //   // Expect here
  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.rowData[0].adDays).toBe(6);
  //   });
  // });

  // it("should handle updating the currently selected sim3 rows", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const sim3btn = await screen.findByTestId("sim3-btn");
  //   await user.click(sim3btn);

  //   const deselectAllBtn = await screen.findByTestId(
  //     "forecast-deselect-all-btn"
  //   );

  //   const selectAllBtn = await screen.findByTestId("forecast-select-all-btn");

  //   // deselecting, the selecting all
  //   await user.click(deselectAllBtn);
  //   await user.click(selectAllBtn);

  //   const upcOne = await screen.findByTestId("check-0");
  //   await user.click(upcOne);
  //   await user.click(upcOne);

  //   const rows = await screen.findAllByRole("row");
  //   const rowOneAdDays = rows[4].children[7];
  //   await user.dblClick(rowOneAdDays);

  //   // cells 7 and 8 => Ad Days and Ad Price
  //   const agInputs = document.querySelectorAll(".ag-input-field-input");
  //   const agInput = agInputs[0];

  //   await user.clear(agInput);
  //   await user.type(agInput, "5");
  //   await user.keyboard("{Enter}");

  //   // Expect here
  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.rowData[0].adDays).toBe(5);
  //   });
  // });

  // it("should handle updating the currently selected sim4 rows", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const sim4btn = await screen.findByTestId("sim4-btn");
  //   await user.click(sim4btn);

  //   const deselectAllBtn = await screen.findByTestId(
  //     "forecast-deselect-all-btn"
  //   );

  //   const selectAllBtn = await screen.findByTestId("forecast-select-all-btn");

  //   // deselecting, the selecting all
  //   await user.click(deselectAllBtn);
  //   await user.click(selectAllBtn);

  //   const upcOne = await screen.findByTestId("check-0");
  //   await user.click(upcOne);
  //   await user.click(upcOne);

  //   const rows = await screen.findAllByRole("row");
  //   const rowOneAdDays = rows[4].children[7];
  //   await user.dblClick(rowOneAdDays);

  //   // cells 7 and 8 => Ad Days and Ad Price
  //   const agInputs = document.querySelectorAll(".ag-input-field-input");
  //   const agInput = agInputs[0];

  //   await user.clear(agInput);
  //   await user.type(agInput, "4");
  //   await user.keyboard("{Enter}");

  //   // Expect here
  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.rowData[0].adDays).toBe(4);
  //   });

  //   await user.click(sim4btn);
  // });

  // it("should handle reloading the current simulation", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const selectAllBtn = await screen.findByTestId("forecast-select-all-btn");
  //   await user.click(selectAllBtn);

  //   const reloadBtn = await screen.findByTestId("reload-sim-btn");
  //   await user.click(reloadBtn);

  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.rowData.length).toBe(0);
  //     expect(state.selectedSim).toBe("");
  //     expect(state.selectedUpcs.length).toBe(0);
  //     expect(state.globalFcstPrice).toBe("");
  //   });
  // });

  // // Global price for sim4
  // it("should handle setting the global forecast price for sim4", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const sim4btn = await screen.findByTestId("sim4-btn");
  //   await user.click(sim4btn);

  //   const input = await screen.findByTestId("global-price-input");
  //   await user.type(input, "12.99");

  //   const btn = await screen.findByTestId("set-global-price-btn");
  //   await user.click(btn);

  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.rowData.every((r) => r.fcstPrice === 12.99)).toBe(true);
  //   });
  // });

  // it("should handle global forecast price for sim1", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const sim1btn = await screen.findByTestId("sim1-btn");
  //   await user.click(sim1btn);

  //   const input = await screen.findByTestId("global-price-input");
  //   await user.clear(input);
  //   await user.type(input, "12.99");

  //   const btn = await screen.findByTestId("set-global-price-btn");
  //   await user.click(btn);

  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.rowData.every((r) => r.fcstPrice === 12.99)).toBe(true);
  //   });
  // });

  // it("should handle global forecast price for sim2", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const sim2btn = await screen.findByTestId("sim2-btn");
  //   await user.click(sim2btn);

  //   const input = await screen.findByTestId("global-price-input");
  //   await user.clear(input);
  //   await user.type(input, "12.99");

  //   const btn = await screen.findByTestId("set-global-price-btn");
  //   await user.click(btn);

  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.rowData.every((r) => r.fcstPrice === 12.99)).toBe(true);
  //   });
  // });

  // it("should handle global forecast price for sim3", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const sim3btn = await screen.findByTestId("sim3-btn");
  //   await user.click(sim3btn);

  //   const input = await screen.findByTestId("global-price-input");
  //   await user.clear(input);
  //   await user.type(input, "12.99");

  //   const btn = await screen.findByTestId("set-global-price-btn");
  //   await user.click(btn);

  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.rowData.every((r) => r.fcstPrice === 12.99)).toBe(true);
  //   });
  // });

  // it("should handle opening and closing the CalcModal", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   // const rows = await screen.findAllByRole("row");
  //   // rows.forEach((row, i) => console.log(`Row ${i}: `, row.children[0].innerHTML));
  //   const calcNowCheckbox = await screen.findByTestId(
  //     "calc-now-checkbox-1200000017"
  //   );
  //   await user.click(calcNowCheckbox);

  //   const modal = await screen.findByTestId("modal");
  //   expect(modal).toBeInTheDocument();

  //   await user.click(document.body); // clicking outside to close

  //   await waitFor(() => {
  //     expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
  //   });
  // });

  // it("should handle calculating new metrics in the CalcModal", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const calcNowCheckbox = await screen.findByTestId(
  //     "calc-now-checkbox-1200000017"
  //   );
  //   await user.click(calcNowCheckbox);

  //   const modal = await screen.findByTestId("modal");
  //   expect(modal).toBeInTheDocument();

  //   // handle interactions here => new price/new cost
  //   const priceInput = await screen.findByTestId("calc-modal-price-input");
  //   const costInput = await screen.findByTestId("calc-modal-cost-input");
  //   const calculateBtn = await screen.findByTestId(
  //     "calc-modal-calculate-button"
  //   );

  //   await user.type(priceInput, "13.99");
  //   await user.type(costInput, "10.50");

  //   // press enter and click the button => to cover the code
  //   await user.keyboard("{Enter}");
  //   await user.click(calculateBtn);

  //   await waitFor(() => {
  //     const qty = screen.getByTestId("calc-modal-qty");
  //     const revenue = screen.getByTestId("calc-modal-revenue");
  //     const profit = screen.getByTestId("calc-modal-profit");

  //     expect(qty.textContent).toEqual("15");
  //     expect(revenue.textContent).toEqual("$194.87");
  //     expect(profit.textContent).toEqual("$1.36");
  //   });

  //   const closeBtn = await screen.findByTestId("calc-modal-close-button");
  //   await user.click(closeBtn);

  //   await waitFor(() => {
  //     expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
  //   });
  // });

  // // Then we handle the export modal => data for all 5 possible scenarios
  // it("should throw toast warning if no title is provided when exporting", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const exportBtn = await screen.findByTestId("forecast-controls-export-btn");
  //   await user.click(exportBtn);

  //   const input = await screen.findByTestId("fcst-export-filename");
  //   await user.clear(input);

  //   const submitBtn = await screen.findByTestId("fcst-export-submit");
  //   await user.click(submitBtn);

  //   await waitFor(() => {
  //     expect(mockToastWarn).toHaveBeenCalledWith("Please enter a file name");
  //   });
  // });

  // // => export initial data
  // it("should handle exporting the the default initial data", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const exportBtn = await screen.findByTestId("forecast-controls-export-btn");
  //   await user.click(exportBtn);

  //   const input = await screen.findByTestId("fcst-export-filename");
  //   await user.type(input, "initial");

  //   const submitBtn = await screen.findByTestId("fcst-export-submit");
  //   await user.click(submitBtn);
  // });

  // // => export sim 1
  // it("should handle exporting the the sim1 data", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const exportBtn = await screen.findByTestId("forecast-controls-export-btn");
  //   await user.click(exportBtn);

  //   const sim1Checkbox = await screen.findByTestId(
  //     "check-2-sim1-updated-history"
  //   );
  //   await user.click(sim1Checkbox);

  //   const input = await screen.findByTestId("fcst-export-filename");
  //   await user.type(input, "sim1");

  //   const submitBtn = await screen.findByTestId("fcst-export-submit");
  //   await user.click(submitBtn);
  // });

  // it("should handle exporting the the sim2 data", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const exportBtn = await screen.findByTestId("forecast-controls-export-btn");
  //   await user.click(exportBtn);

  //   const sim2Checkbox = await screen.findByTestId(
  //     "check-3-sim2-updated-history"
  //   );
  //   await user.click(sim2Checkbox);

  //   const input = await screen.findByTestId("fcst-export-filename");
  //   await user.type(input, "sim2");

  //   const submitBtn = await screen.findByTestId("fcst-export-submit");
  //   await user.click(submitBtn);
  // });

  // it("should handle exporting the the sim3 data", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const exportBtn = await screen.findByTestId("forecast-controls-export-btn");
  //   await user.click(exportBtn);

  //   const sim3Checkbox = await screen.findByTestId(
  //     "check-4-sim3-updated-history"
  //   );
  //   await user.click(sim3Checkbox);

  //   const input = await screen.findByTestId("fcst-export-filename");
  //   await user.type(input, "sim3");

  //   const submitBtn = await screen.findByTestId("fcst-export-submit");
  //   await user.click(submitBtn);
  // });

  // it("should handle exporting the the sim4 data", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const exportBtn = await screen.findByTestId("forecast-controls-export-btn");
  //   await user.click(exportBtn);

  //   const sim4Checkbox = await screen.findByTestId(
  //     "check-5-sim4-updated-history"
  //   );
  //   await user.click(sim4Checkbox);

  //   const input = await screen.findByTestId("fcst-export-filename");
  //   await user.type(input, "sim4");

  //   const submitBtn = await screen.findByTestId("fcst-export-submit");
  //   await user.click(submitBtn);
  // });

  // it("should handle toggling back to the initial data set in the export modal", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const exportBtn = await screen.findByTestId("forecast-controls-export-btn");
  //   await user.click(exportBtn);

  //   const sim1Checkbox = await screen.findByTestId(
  //     "check-2-sim1-updated-history"
  //   );
  //   const initialCheckbox = await screen.findByTestId("check-1-all-history");

  //   await user.click(sim1Checkbox);
  //   await user.click(initialCheckbox);
  // });

  // // Then finally we handle resetting logic => sims and whole page (Reset button in ForecastControls)

  // // => reset the sims
  // it("should handle resetting all simulations when Reset button is clicked", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const resetSimBtn = await screen.findByTestId("reset-sim-btn");
  //   await user.click(resetSimBtn);

  //   await waitFor(() => {
  //     const state = store.getState().forecast;
  //     expect(state.simBtns.sim1).toBe(0);
  //     expect(state.simBtns.sim2).toBe(0);
  //     expect(state.simBtns.sim3).toBe(0);
  //     expect(state.simBtns.sim4).toBe(0);
  //   });
  // });

  // // => reset the whole page

  // it("should handle resetting the whole Forecast page when Reset button is clicked in the ForecastControls", async () => {
  //   (getBucketList as Mock).mockResolvedValue(fileListResp);
  //   renderWithProviders(<Forecast />, { store });

  //   const resetBtn = await screen.findByTestId("forecast-controls-reset-btn");
  //   await user.click(resetBtn);

  //   await waitFor(() => {
  //     const forecastState = store.getState().forecast;
  //     const upcsState = store.getState().upcs;
  //     expect(forecastState.items.length).toBe(0);
  //     expect(forecastState.selectedStores.length).toBe(0);
  //     expect(upcsState.upcs.length).toBe(0);
  //   });
  // });
});
