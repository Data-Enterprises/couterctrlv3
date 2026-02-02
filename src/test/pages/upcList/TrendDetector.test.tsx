import { describe, expect, it, vi, type Mock } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { setupStore } from "../../../store";
import { renderWithProviders } from "../../utils";
import userEvent from "@testing-library/user-event";

// Dispatchers
import { setAssignedStores } from "../../../features/userSlice";

// API calls to be mocked
import { getTrendDetect } from "../../../api/upc";

// Responses
import { stores, trendDetectResp, JsonErrorResp } from ".";

// Components being tested
import UpcList from "../../../pages/upc/wizard/UpcList";
import type { JSX } from "react";

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

// Need to mock ResponsiveBar from @nivo/bar and pass in the props we want to test
let colors: (datum: any) => string;
let borderColor: (datum: any) => string;
let tooltip: (datum: any) => JSX.Element;
vi.mock("@nivo/bar", () => ({
  ResponsiveBar: vi.fn(({ colors: c, borderColor: b, tooltip: t }) => {
    colors = c;
    borderColor = b;
    tooltip = t;

    // both colors datums => needed to test colors function in ResponsiveBar
    const mockColorsDatum = {
      id: "Before",
      data: {
        color1: "#f97316",
        color2: "#3b82f6",
      },
    };

    const mockColorsAfterDatum = {
      id: "After",
      data: {
        color1: "#f97316",
        color2: "#3b82f6",
      },
    };

    // borderColor datum => needed to test borderColor function in ResponsiveBar
    // ResponsiveBar passes a more complex structure for borderColor, so we mimic that here
    const mockBorderDatum = {
      id: "Before",
      data: {
        id: "Before",
        data: {
          color1: "#f97316",
          color2: "#3b82f6",
        },
      },
    };

    colors(mockColorsDatum);
    colors(mockColorsAfterDatum);

    borderColor(mockBorderDatum);
    borderColor({
      ...mockBorderDatum,
      id: "After",
      data: { ...mockBorderDatum.data, id: "After" },
    });
    tooltip({
      data: {
        desc: "Test Product",
        tooltip: "Before: 100. After: 150",
      },
    });

    return <div data-testid="responsive-bar" />;
  }),
}));

describe("TrendDetector Module in UpcList", () => {
  it("");
  // it("should handle API failure when fetching Trend Detection data", async () => {
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
  //   const trendMode = await screen.findByTestId("radio-4");
  //   await user.click(trendMode);
  //   await waitFor(() => {
  //     const state = store.getState().upc;
  //     expect(state.selectedMode).toBe(4);
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
  //   (getTrendDetect as Mock).mockRejectedValueOnce(JsonErrorResp);

  //   // Fetch the data
  //   const btn2 = await screen.findByTestId("upc-wizard-next-btn-2");
  //   await user.click(btn2);

  //   const stepOne = await screen.findByTestId("upc-step-one");
  //   expect(stepOne).toBeInTheDocument();
  // });

  //   it("should inform the user if no records were found", async () => {
  //     renderWithProviders(<UpcList />, { store });

  //     // Go through the steps of the UpcWizard to reach SalesComp module
  //     const upcFileInput = await screen.findByTestId("upc-file-input");

  //     const csvFile = new File(["upc1\nupc2\nupc3"], "upc_list.csv", {
  //       type: "text/csv",
  //     });

  //     await user.upload(upcFileInput, csvFile);
  //     const input = upcFileInput as HTMLInputElement;
  //     expect(input.files?.[0]).toBe(csvFile);

  //     // Selecting SalesComp module
  //     const trendMode = await screen.findByTestId("radio-4");
  //     await user.click(trendMode);
  //     await waitFor(() => {
  //       const state = store.getState().upc;
  //       expect(state.selectedMode).toBe(4);
  //     });

  //     const nextBtn = await screen.findByTestId("upc-wizard-next-btn-1");
  //     await user.click(nextBtn);

  //     await waitFor(() => {
  //       const state = store.getState().upc;
  //       expect(state.index).toBe(1);
  //     });

  //     const storeGroupSelectIcon = await screen.findByTestId(
  //       "single-select-trigger-icon-1"
  //     );

  //     // Click on Stores
  //     const storeOption = await screen.findByTestId("single-select-option-1-0");
  //     await user.click(storeGroupSelectIcon);
  //     await user.click(storeOption);
  //     await waitFor(() => {
  //       const state = store.getState().upc;
  //       expect(state.radioId).toBe(1);
  //     });

  //     const storeToClick = await screen.findByTestId(
  //       "single-select-option-2-1"
  //     );
  //     await user.click(storeToClick);

  //     // handle success
  //     (getTrendDetect as Mock).mockResolvedValue({ data: { error: 0, trends: [] } });

  //     // Fetch the data
  //     const btn2 = await screen.findByTestId("upc-wizard-next-btn-2");
  //     await user.click(btn2);

  //     await waitFor(() => {
  //       expect(mockedToastWarn).toHaveBeenCalledWith("No Records Found");
  //     });
  //   });

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
  //   const trendMode = await screen.findByTestId("radio-4");
  //   await user.click(trendMode);
  //   await waitFor(() => {
  //     const state = store.getState().upc;
  //     expect(state.selectedMode).toBe(4);
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
  //   (getTrendDetect as Mock).mockResolvedValue(trendDetectResp);

  //   // Fetch the data
  //   const btn2 = await screen.findByTestId("upc-wizard-next-btn-2");
  //   await user.click(btn2);

  //   expect(await screen.findByTestId("upc-trend")).toBeInTheDocument();
  // });

  // it("should set selected trends when UPCs are selected", async () => {
  //   renderWithProviders(<UpcList />, { store });

  //   const upc1 = await screen.findByTestId("check-0");
  //   const upc2 = await screen.findByTestId("check-1");
  //   await user.click(upc1);
  //   await user.click(upc2);

  //   // Trend cards at the bottom show now have both selected trends
  //   const trendCard1 = await screen.findByTestId("selected-trend-card-0");
  //   const trendCard2 = await screen.findByTestId("selected-trend-card-1");
  //   expect(trendCard1).toBeInTheDocument();
  //   expect(trendCard2).toBeInTheDocument();
  // });

  // it("should handle TrendModal when selecting top or bottom trends", async () => {
  //   renderWithProviders(<UpcList />, { store });

  //   const upc1 = await screen.findByTestId("check-0");
  //   const upc2 = await screen.findByTestId("check-1");
  //   await user.click(upc1);
  //   await user.click(upc2);

  //   // Check to see if a top trend card is rendered
  //   const topTrendCard = await screen.findByTestId("top-trend-0");
  //   expect(topTrendCard).toBeInTheDocument();

  //   await user.click(topTrendCard);

  //   // TrendModal should now be open
  //   const modal = await screen.findByTestId("modal");
  //   expect(modal).toBeInTheDocument();

  //   const closeBtn = await screen.findByTestId("trend-modal-close-btn");
  //   await user.click(closeBtn);

  //   // open another trend modal from bottom trends
  //   const nextBtn = await screen.findByTestId("metrics-carousel-next-btn");
  //   await user.click(nextBtn);

  //   const bottomTrendCard = await screen.findByTestId("bottom-trend-0");
  //   expect(bottomTrendCard).toBeInTheDocument();
  //   await user.click(bottomTrendCard);

  //   await user.click(closeBtn);

  //   await waitFor(() => {
  //     expect(modal).not.toBeInTheDocument();
  //   });
  // });

  // it("should handle setting the trend option in the UpcControls", async () => {
  //   renderWithProviders(<UpcList />, { store });

  //   // Selecting these should update the grouped bar chart
  //   const upc1 = await screen.findByTestId("check-0");
  //   const upc2 = await screen.findByTestId("check-1");
  //   await user.click(upc1);
  //   await user.click(upc2);

  //   // mean, volatility buttons
  //   const totalsBtn = await screen.findByTestId("trend-totals-btn");
  //   const meanBtn = await screen.findByTestId("trend-mean-btn");
  //   const volatilityBtn = await screen.findByTestId("trend-volatility-btn");

  //   // select Mean
  //   await user.click(meanBtn);
  //   await waitFor(() => {
  //     const state = store.getState().upc;
  //     expect(state.trendMode).toBe("Mean");
  //   });

  //   // select Volatility
  //   await user.click(volatilityBtn);
  //   await waitFor(() => {
  //     const state = store.getState().upc;
  //     expect(state.trendMode).toBe("Volatility");
  //   });

  //   await user.click(totalsBtn);
  //   await waitFor(() => {
  //     const state = store.getState().upc;
  //     expect(state.trendMode).toBe("Totals");
  //   });
  // });

  // it("should handle exporting trend data in UpcModal", async () => {
  //   renderWithProviders(<UpcList />, { store });

  //   const exportBtn = await screen.findByTestId("upc-controls-export-btn");
  //   await user.click(exportBtn);

  //   const modal = await screen.findByTestId("modal");
  //   expect(modal).toBeInTheDocument();

  //   // Click the CheckboxIcon, not the container div
  //   const allCheckboxIcon = await screen.findByTestId("check-0-trend-all");
  //   const topCheckboxIcon = await screen.findByTestId("check-1-trend-top");
  //   const bottomCheckboxIcon = await screen.findByTestId(
  //     "check-2-trend-bottom"
  //   );

  //   await user.click(topCheckboxIcon);
  //   await waitFor(() => {
  //     const state = store.getState().upcModal;
  //     expect(state.trendOption.top).toBe(true);
  //   });

  //   await user.click(bottomCheckboxIcon);
  //   await waitFor(() => {
  //     const state = store.getState().upcModal;
  //     expect(state.trendOption.bottom).toBe(true);
  //   });

  //   await user.click(allCheckboxIcon);
  //   await waitFor(() => {
  //     const state = store.getState().upcModal;
  //     expect(state.trendOption.all).toBe(true);
  //   });
  // });

  // it("should throw a warning if no file name has been entered in UpcModal", async () => {
  //   renderWithProviders(<UpcList />, { store });

  //   const exportBtn = await screen.findByTestId("upc-controls-export-btn");
  //   await user.click(exportBtn);

  //   const submit = await screen.findByTestId("upc-export-modal-submit-btn");
  //   await user.click(submit);

  //   await waitFor(() => {
  //     expect(mockedToastWarn).toHaveBeenCalledWith(
  //       "Please enter a file name..."
  //     );
  //   });
  // });

  // it("should handle the file name in UpcModal", async () => {
  //   renderWithProviders(<UpcList />, { store });

  //   const exportBtn = await screen.findByTestId("upc-controls-export-btn");
  //   await user.click(exportBtn);

  //   const fileNameInput = await screen.findByTestId("text-input-csvFileName");
  //   await user.type(fileNameInput, "trend_data");
  // });

  // it("should export all trend data when 'All' is selected in UpcModal", async () => {
  //   renderWithProviders(<UpcList />, { store });

  //   const exportBtn = await screen.findByTestId("upc-controls-export-btn");
  //   await user.click(exportBtn);

  //   const modal = await screen.findByTestId("modal");
  //   expect(modal).toBeInTheDocument();

  //   const fileNameInput = await screen.findByTestId("text-input-csvFileName");
  //   await user.type(fileNameInput, "trend_data");

  //   const allCheckboxIcon = await screen.findByTestId("check-0-trend-all");
  //   await user.click(allCheckboxIcon);

  //   const submit = await screen.findByTestId("upc-export-modal-submit-btn");
  //   await user.click(submit);

  //   await waitFor(() => {
  //     const state = store.getState().upcModal;
  //     expect(state.openModal).toBe(false);
  //   });
  // });

  // it("should handle exporting top trend data when 'Top 5' is selected in UpcModal", async () => {
  //   renderWithProviders(<UpcList />, { store });

  //   const exportBtn = await screen.findByTestId("upc-controls-export-btn");
  //   await user.click(exportBtn);

  //   const modal = await screen.findByTestId("modal");
  //   expect(modal).toBeInTheDocument();

  //   const fileNameInput = await screen.findByTestId("text-input-csvFileName");
  //   await user.type(fileNameInput, "trend_data");

  //   const topCheckboxIcon = await screen.findByTestId("check-1-trend-top");
  //   await user.click(topCheckboxIcon);

  //   const submit = await screen.findByTestId("upc-export-modal-submit-btn");
  //   await user.click(submit);

  //   await waitFor(() => {
  //     const state = store.getState().upcModal;
  //     expect(state.openModal).toBe(false);
  //   });
  // });

  // it("should handle exporting bottom trend data when 'Bottom 5' is selected in UpcModal", async () => {
  //   renderWithProviders(<UpcList />, { store });

  //   const exportBtn = await screen.findByTestId("upc-controls-export-btn");
  //   await user.click(exportBtn);

  //   const modal = await screen.findByTestId("modal");
  //   expect(modal).toBeInTheDocument();

  //   const fileNameInput = await screen.findByTestId("text-input-csvFileName");
  //   await user.type(fileNameInput, "trend_data");

  //   const bottomCheckboxIcon = await screen.findByTestId("check-2-trend-bottom");
  //   await user.click(bottomCheckboxIcon);

  //   const submit = await screen.findByTestId("upc-export-modal-submit-btn");
  //   await user.click(submit);

  //   await waitFor(() => {
  //     const state = store.getState().upcModal;
  //     expect(state.openModal).toBe(false);
  //   });
  // });
});
