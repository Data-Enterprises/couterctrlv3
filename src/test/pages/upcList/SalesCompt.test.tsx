import { describe, expect, it, vi, type Mock } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { setupStore } from "../../../store";
import { renderWithProviders } from "../../utils";
import userEvent from "@testing-library/user-event";

// Dispatchers
import { setAssignedStores } from "../../../features/userSlice";
import { setGroups } from "../../../features/groupSlice";

// API calls to be mocked
import { getSalesComp } from "../../../api/upc";

// Responses
import { stores, groups, salesCompResp, JsonErrorResp } from ".";

// Components being tested
import UpcList from "../../../pages/upc/UpcList";

vi.mock("../../../api/upc");
const store = setupStore();
store.dispatch(setAssignedStores(stores));
store.dispatch(setGroups(groups));
const user = userEvent.setup();
const mockedToastWarn = vi.fn();
const mockedToastError = vi.fn();
vi.mock("../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    warn: mockedToastWarn,
    error: mockedToastError,
  }),
}));

describe("SalesComp Module in UpcList", () => {
  it("");
  // it("should handle API failure when fetching Sales Comp data", async () => {
  //   renderWithProviders(<UpcList />, { store });

  //   // Go through the steps of the UpcWizard to reach SalesComp module
  //   const upcFileInput = await screen.findByTestId("upc-file-input");

  //   const csvFile = new File(["upc1\nupc2\nupc3"], "upc_list.csv", {
  //     type: "text/csv",
  //   });

  //   await user.upload(upcFileInput, csvFile);
  //   const input = upcFileInput as HTMLInputElement;
  //   expect(input.files?.[0]).toBe(csvFile);

  //   // Selecting SalesComp module
  //   const modeOne = await screen.findByTestId("radio-1");
  //   await user.click(modeOne);
  //   await waitFor(() => {
  //     const state = store.getState().upc;
  //     expect(state.selectedMode).toBe(1);
  //   });

  //   const nextBtn = await screen.findByTestId("upc-wizard-next-btn-1");
  //   await user.click(nextBtn);

  //   await waitFor(() => {
  //     const state = store.getState().upc;
  //     expect(state.index).toBe(1);
  //   });

  //   const storeGroupSelectIcon = await screen.findByTestId(
  //     "single-select-trigger-icon-1"
  //   );

  //   // Click on Stores
  //   const storeOption = await screen.findByTestId("single-select-option-1-0");
  //   await user.click(storeGroupSelectIcon);
  //   await user.click(storeOption);
  //   await waitFor(() => {
  //     const state = store.getState().upc;
  //     expect(state.radioId).toBe(1);
  //   });

  //   const storeToClick = await screen.findByTestId("single-select-option-2-1");
  //   await user.click(storeToClick);

  //   // handle error
  //   (getSalesComp as Mock).mockRejectedValueOnce(JsonErrorResp);

  //   // Fetch the data
  //   const btn2 = await screen.findByTestId("upc-wizard-next-btn-2");
  //   await user.click(btn2);

  //   const stepOne = await screen.findByTestId("upc-step-one");
  //   expect(stepOne).toBeInTheDocument();
  // });

  // // In this case, we're just trying to render SalesComp
  // it("should inform the user no data was found", async () => {
  //   renderWithProviders(<UpcList />, { store });

  //   // Go through the steps of the UpcWizard to reach SalesComp module
  //   const upcFileInput = await screen.findByTestId("upc-file-input");

  //   const csvFile = new File(["upc1\nupc2\nupc3"], "upc_list.csv", {
  //     type: "text/csv",
  //   });

  //   await user.upload(upcFileInput, csvFile);
  //   const input = upcFileInput as HTMLInputElement;
  //   expect(input.files?.[0]).toBe(csvFile);

  //   // Selecting SalesComp module
  //   const modeOne = await screen.findByTestId("radio-1");
  //   await user.click(modeOne);
  //   await waitFor(() => {
  //     const state = store.getState().upc;
  //     expect(state.selectedMode).toBe(1);
  //   });

  //   const nextBtn = await screen.findByTestId("upc-wizard-next-btn-1");
  //   await user.click(nextBtn);

  //   await waitFor(() => {
  //     const state = store.getState().upc;
  //     expect(state.index).toBe(1);
  //   });

  //   const storeGroupSelectIcon = await screen.findByTestId(
  //     "single-select-trigger-icon-1"
  //   );

  //   // Click on Stores
  //   const storeOption = await screen.findByTestId("single-select-option-1-0");
  //   await user.click(storeGroupSelectIcon);
  //   await user.click(storeOption);
  //   await waitFor(() => {
  //     const state = store.getState().upc;
  //     expect(state.radioId).toBe(1);
  //   });

  //   const storeToClick = await screen.findByTestId("single-select-option-2-1");
  //   await user.click(storeToClick);

  //   // handle success
  //   (getSalesComp as Mock).mockResolvedValue({
  //     data: {
  //       error: 0,
  //       daily: [],
  //     },
  //   });

  //   // Fetch the data
  //   const btn2 = await screen.findByTestId("upc-wizard-next-btn-2");
  //   await user.click(btn2);

  //   await waitFor(() => {
  //     const state = store.getState().upc;
  //     expect(state.salesComp).toEqual([]);
  //     expect(mockedToastWarn).toHaveBeenCalledWith("No Records Found");
  //   });
  // });

  // // In this case, we're just trying to render SalesComp
  // it("should render selected module correctly", async () => {
  //   renderWithProviders(<UpcList />, { store });

  //   // Go through the steps of the UpcWizard to reach SalesComp module
  //   const upcFileInput = await screen.findByTestId("upc-file-input");

  //   const csvFile = new File(["upc1\nupc2\nupc3"], "upc_list.csv", {
  //     type: "text/csv",
  //   });

  //   await user.upload(upcFileInput, csvFile);
  //   const input = upcFileInput as HTMLInputElement;
  //   expect(input.files?.[0]).toBe(csvFile);

  //   // Selecting SalesComp module
  //   const modeOne = await screen.findByTestId("radio-1");
  //   await user.click(modeOne);
  //   await waitFor(() => {
  //     const state = store.getState().upc;
  //     expect(state.selectedMode).toBe(1);
  //   });

  //   const nextBtn = await screen.findByTestId("upc-wizard-next-btn-1");
  //   await user.click(nextBtn);

  //   await waitFor(() => {
  //     const state = store.getState().upc;
  //     expect(state.index).toBe(1);
  //   });

  //   const storeGroupSelectIcon = await screen.findByTestId(
  //     "single-select-trigger-icon-1"
  //   );

  //   // Click on Stores
  //   const storeOption = await screen.findByTestId("single-select-option-1-0");
  //   await user.click(storeGroupSelectIcon);
  //   await user.click(storeOption);
  //   await waitFor(() => {
  //     const state = store.getState().upc;
  //     expect(state.radioId).toBe(1);
  //   });

  //   const storeToClick = await screen.findByTestId("single-select-option-2-1");
  //   await user.click(storeToClick);

  //   // handle success
  //   (getSalesComp as Mock).mockResolvedValue(salesCompResp);

  //   // Fetch the data
  //   const btn2 = await screen.findByTestId("upc-wizard-next-btn-2");
  //   await user.click(btn2);

  //   await waitFor(() => {
  //     const state = store.getState().upc;
  //     expect(state.salesComp).toEqual(salesCompResp.data.daily);
  //   });

  //   expect(screen.getByTestId("upc-sales-comp")).toBeInTheDocument();
  // });

  // it("should throw warnings for export modal with file name", async () => {
  //   renderWithProviders(<UpcList />, { store });

  //   const exportBtn = await screen.findByTestId("upc-controls-export-btn");
  //   await user.click(exportBtn);

  //   const submitBtn = await screen.findByTestId("upc-export-modal-submit-btn");
  //   await user.click(submitBtn);

  //   expect(mockedToastWarn).toHaveBeenCalledWith("Please enter a file name");
  // });

  // it("should handle successful exporting of Sales Comp data", async () => {
  //   renderWithProviders(<UpcList />, { store });

  //   const exportBtn = await screen.findByTestId("upc-controls-export-btn");
  //   await user.click(exportBtn);

  //   const input = await screen.findByTestId("text-input-csvFileName");
  //   await user.type(input, "sales_comp_data");
  //   const submitBtn = await screen.findByTestId("upc-export-modal-submit-btn");
  //   await user.click(submitBtn);
  // });

  // it("should handle copying a upc from context menu", async () => {
  //   renderWithProviders(<UpcList />, { store });

  //   const upc1 = await screen.findByTestId("check-0");
  //   fireEvent.contextMenu(upc1);

  //   const copyDescOption = await screen.findByTestId("ctx-menu-option-0");
  //   await user.click(copyDescOption);
  // });

  // it("should handle copying a description from context menu", async () => {
  //   renderWithProviders(<UpcList />, { store });

  //   const upc1 = await screen.findByTestId("check-0");
  //   fireEvent.contextMenu(upc1);

  //   const copyDescOption = await screen.findByTestId("ctx-menu-option-1");
  //   await user.click(copyDescOption);
  // });

  // it("should handle row selection in SalesCompGrid", async () => {
  //   renderWithProviders(<UpcList />, { store });

  //   const upc1 = await screen.findByTestId("check-0");
  //   const upc2 = await screen.findByTestId("check-1");
  //   const upc3 = await screen.findByTestId("check-2");
  //   const upc4 = await screen.findByTestId("check-3");
  //   const upc5 = await screen.findByTestId("check-4");
  //   await user.click(upc1);
  //   await user.click(upc2);
  //   await user.click(upc3);
  //   await user.click(upc4);
  //   await user.click(upc5);
  // });

  // it("should compare two selected UPCs in Sales Comparison", async () => {
  //   renderWithProviders(<UpcList />, { store });

  //   const cells = await screen.findAllByRole("gridcell");
  //   const cell1 = cells.find((cell) => cell.textContent === "1800000001");
  //   const cell2 = cells.find((cell) => cell.textContent === "1800000003");

  //   await user.click(cell1!);
  //   await user.click(cell2!);
  //   await user.click(cell1!);
  //   await user.click(cell2!);
  // });

  // it("should clear the cards in Sales Comparison", async () => {
  //   renderWithProviders(<UpcList />, { store });

  //   const clearBtn = await screen.findByTestId("sales-comp-clear-btn");
  //   await user.click(clearBtn);

  //   await waitFor(() => {
  //     const state = store.getState().upc;
  //     expect(state.selectedCompOne).toBeNull();
  //     expect(state.selectedCompTwo).toBeNull();
  //   });
  // });

  // it("should set grid-rows-[18%_82%] on large screens", async () => {
  //   renderWithProviders(<UpcList />, { store });

  //   // to similuate the resizing of the browser
  //   Object.defineProperty(window, "innerWidth", {
  //     writable: true,
  //     configurable: true,
  //     value: 1600,
  //   });

  //   window.dispatchEvent(new Event("resize"));
  //   await waitFor(() => {
  //     const grid = screen.getByTestId("sales-comp-main-grid");
  //     expect(grid).toHaveClass("grid-rows-[18%_82%]");
  //   });
  // });
});
