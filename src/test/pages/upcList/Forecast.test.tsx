import { describe, expect, it, vi, type Mock } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { setupStore } from "../../../store";
import { renderWithProviders } from "../../utils";
import userEvent from "@testing-library/user-event";

// Dispatchers
import { setAssignedStores } from "../../../features/userSlice";

// API calls to be mocked
import { getForecasting } from "../../../api/upc";

// Responses
import { stores, forecastResp, JsonErrorResp } from ".";

// Components being tested
import UpcList from "../../../pages/upc/UpcList";
// import type { JSX } from "react";

vi.mock("../../../api/upc");
const store = setupStore();
store.dispatch(setAssignedStores(stores));

const user = userEvent.setup();
const mockedToastWarn = vi.fn();
const mockedToastError = vi.fn();
vi.mock("../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    warn: mockedToastWarn,
    error: mockedToastError,
  }),
}));

vi.mock("@nivo/line", () => ({
  ResponsiveLine: vi.fn((props) => {
    if (props.axisLeft?.format) {
      props.axisLeft.format("5.99"); // singleRow case
      props.axisLeft.format("3"); // multiRow case
    }

    if (props.colors) props.colors({ id: "test", value: 100 });
    return <div data-testid="responsive-line" />;
  }),
}));

describe("PriceOpt Module in UpcList", () => {
  it("");
  // it("should handle API failure when fetching Price Optimization data", async () => {
  //   renderWithProviders(<UpcList />, { store });

  //   // Go through the steps of the UpcWizard to reach SalesComp module
  //   const upcFileInput = await screen.findByTestId("upc-file-input");

  //   const csvFile = new File(["upc1\nupc2\nupc3"], "upc_list.csv", {
  //     type: "text/csv",
  //   });

  //   await user.upload(upcFileInput, csvFile);
  //   const input = upcFileInput as HTMLInputElement;
  //   expect(input.files?.[0]).toBe(csvFile);

  //   // Selecting TrendDetector module
  //   const forecastMode = await screen.findByTestId("radio-2");
  //   await user.click(forecastMode);
  //   await waitFor(() => {
  //     const state = store.getState().upc;
  //     expect(state.selectedMode).toBe(2);
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
  //   (getForecasting as Mock).mockRejectedValueOnce(JsonErrorResp);

  //   // Fetch the data
  //   const btn2 = await screen.findByTestId("upc-wizard-next-btn-2");
  //   await user.click(btn2);

  //   const stepOne = await screen.findByTestId("upc-step-one");
  //   expect(stepOne).toBeInTheDocument();
  // });

  // it("should inform the user when do records are found", async () => {
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
  //   const forecastMode = await screen.findByTestId("radio-2");
  //   await user.click(forecastMode);
  //   await waitFor(() => {
  //     const state = store.getState().upc;
  //     expect(state.selectedMode).toBe(2);
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
  //   (getForecasting as Mock).mockResolvedValue({ data: { error: 1 } });

  //   // Fetch the data
  //   const btn2 = await screen.findByTestId("upc-wizard-next-btn-2");
  //   await user.click(btn2);

  //   await waitFor(() => {
  //     expect(mockedToastWarn).toHaveBeenCalledWith("No Records Found");
  //   });
  // });

  // // In this case, we're just trying to render Forecast
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
  //   const forecastMode = await screen.findByTestId("radio-2");
  //   await user.click(forecastMode);
  //   await waitFor(() => {
  //     const state = store.getState().upc;
  //     expect(state.selectedMode).toBe(2);
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
  //   (getForecasting as Mock).mockResolvedValue(forecastResp);

  //   // Fetch the data
  //   const btn2 = await screen.findByTestId("upc-wizard-next-btn-2");
  //   await user.click(btn2);

  //   expect(await screen.findByTestId("upc-forecast")).toBeInTheDocument();
  // });

  // it("should handle info icon hover in MetricCard", async () => {
  //   renderWithProviders(<UpcList />, { store });

  //   const overallQtyInfoIcon = await screen.findByTestId(
  //     "info-icon-quantity-overall"
  //   );
  //   await user.hover(overallQtyInfoIcon);
  //   await user.unhover(overallQtyInfoIcon);
  // });

  // it("should populate forecast line componenet when selecing a upc", async () => {
  //   renderWithProviders(<UpcList />, { store });

  //   const upcOne = await screen.findByTestId("check-0");
  //   await user.click(upcOne);
  //   // await user.click(upcOne);

  //   const selectedItem = await screen.findByTestId("forecast-legend-item-0");
  //   expect(selectedItem).toBeInTheDocument();

  //   await user.click(selectedItem);
  // });

  // // Test the exporting of the data in UpcModal
  // it("should throw warning for missing file name in export modal", async () => {
  //   renderWithProviders(<UpcList />, { store });
  //   const exportBtn = await screen.findByTestId("upc-controls-export-btn");
  //   await user.click(exportBtn);

  //   const modal = await screen.findByTestId("modal");
  //   expect(modal).toBeInTheDocument();

  //   const submit = await screen.findByTestId("upc-export-modal-submit-btn");
  //   await user.click(submit);

  //   await waitFor(() => {
  //     expect(mockedToastWarn).toHaveBeenCalledWith("Please enter a file name");
  //   });
  // });

  // it("should handle exporting forecast dates data", async () => {
  //   renderWithProviders(<UpcList />, { store });
  //   const exportBtn = await screen.findByTestId("upc-controls-export-btn");
  //   await user.click(exportBtn);

  //   const modal = await screen.findByTestId("modal");
  //   expect(modal).toBeInTheDocument();

  //   //file name
  //   const fileNameInput = await screen.findByTestId("text-input-csvFileName");
  //   await user.type(fileNameInput, "forecast_export");

  //   // Testing the clicking of the radio options
  //   const datesRadio = await screen.findByTestId("check-0-forecast-dates");
  //   const metricsRadio = await screen.findByTestId("check-1-forecast-metrics");

  //   await user.click(metricsRadio);
  //   await user.click(datesRadio);

  //   // submit the valid export request
  //   const submit = await screen.findByTestId("upc-export-modal-submit-btn");
  //   await user.click(submit);

  //   await waitFor(() => {
  //     expect(modal).not.toBeInTheDocument();
  //   });
  // });

  // it("should handle exporting forecast metrics data", async () => {
  //   renderWithProviders(<UpcList />, { store });
  //   const exportBtn = await screen.findByTestId("upc-controls-export-btn");
  //   await user.click(exportBtn);

  //   const modal = await screen.findByTestId("modal");
  //   expect(modal).toBeInTheDocument();

  //   //file name and metrics radio
  //   const metricsRadio = await screen.findByTestId("check-1-forecast-metrics");
  //   const fileNameInput = await screen.findByTestId("text-input-csvFileName");
  //   await user.type(fileNameInput, "forecast_export");
  //   await user.click(metricsRadio);

  //   // submit the valid export request
  //   const submit = await screen.findByTestId("upc-export-modal-submit-btn");
  //   await user.click(submit);

  //   await waitFor(() => {
  //     expect(modal).not.toBeInTheDocument();
  //   });
  // });
});
