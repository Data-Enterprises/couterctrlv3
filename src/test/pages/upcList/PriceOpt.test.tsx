import { describe, expect, it, vi, type Mock } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { setupStore } from "../../../store";
import { renderWithProviders } from "../../utils";
import userEvent from "@testing-library/user-event";

// Dispatchers
import { setAssignedStores } from "../../../features/userSlice";

// API calls to be mocked
import { getPriceOpt } from "../../../api/upc";

// Responses
import { stores, priceOptResp, JsonErrorResp } from ".";

// Components being tested
import UpcList from "../../../pages/upc/wizard/UpcList";
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

// Need to mock ResponsiveBar from @nivo/bar and pass in the props we want to test
// let colors: (datum: any) => string;
// let borderColor: (datum: any) => string;
// let tooltip: (datum: any) => JSX.Element;
// vi.mock("@nivo/bar", () => ({
//   ResponsiveBar: vi.fn(({ colors: c, borderColor: b, tooltip: t }) => {
//     colors = c;
//     borderColor = b;
//     tooltip = t;

//     // both colors datums => needed to test colors function in ResponsiveBar
//     const mockColorsDatum = {
//       id: "Before",
//       data: {
//         color1: "#f97316",
//         color2: "#3b82f6",
//       },
//     };

//     const mockColorsAfterDatum = {
//       id: "After",
//       data: {
//         color1: "#f97316",
//         color2: "#3b82f6",
//       },
//     };

//     // borderColor datum => needed to test borderColor function in ResponsiveBar
//     // ResponsiveBar passes a more complex structure for borderColor, so we mimic that here
//     const mockBorderDatum = {
//       id: "Before",
//       data: {
//         id: "Before",
//         data: {
//           color1: "#f97316",
//           color2: "#3b82f6",
//         },
//       },
//     };

//     colors(mockColorsDatum);
//     colors(mockColorsAfterDatum);

//     borderColor(mockBorderDatum);
//     borderColor({
//       ...mockBorderDatum,
//       id: "After",
//       data: { ...mockBorderDatum.data, id: "After" },
//     });
//     tooltip({
//       data: {
//         desc: "Test Product",
//         tooltip: "Before: 100. After: 150",
//       },
//     });

//     return <div data-testid="responsive-bar" />;
//   }),
// }));

describe("PriceOpt Module in UpcList", () => {
  it("should handle API failure when fetching Price Optimization data", async () => {
    renderWithProviders(<UpcList />, { store });

    // Go through the steps of the UpcWizard to reach SalesComp module
    const upcFileInput = await screen.findByTestId("upc-file-input");

    const csvFile = new File(["upc1\nupc2\nupc3"], "upc_list.csv", {
      type: "text/csv",
    });

    await user.upload(upcFileInput, csvFile);
    const input = upcFileInput as HTMLInputElement;
    expect(input.files?.[0]).toBe(csvFile);

    // Selecting TrendDetector module
    const priceOptMode = await screen.findByTestId("radio-3");
    await user.click(priceOptMode);
    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.selectedMode).toBe(3);
    });

    const nextBtn = await screen.findByTestId("upc-wizard-next-btn-1");
    await user.click(nextBtn);

    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.index).toBe(1);
    });

    const storeGroupSelectIcon = await screen.findByTestId(
      "single-select-trigger-icon-1"
    );

    // Click on Stores
    const storeOption = await screen.findByTestId("single-select-option-1-0");
    await user.click(storeGroupSelectIcon);
    await user.click(storeOption);
    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.radioId).toBe(1);
    });

    const storeToClick = await screen.findByTestId("single-select-option-2-1");
    await user.click(storeToClick);

    // handle error
    (getPriceOpt as Mock).mockRejectedValueOnce(JsonErrorResp);

    // Fetch the data
    const btn2 = await screen.findByTestId("upc-wizard-next-btn-2");
    await user.click(btn2);

    const stepOne = await screen.findByTestId("upc-step-one");
    expect(stepOne).toBeInTheDocument();
  });

  // In this case, we're just trying to render PriceOpt module after fetching data successfully
  it("should render selected module correctly", async () => {
    renderWithProviders(<UpcList />, { store });
    const upcFileInput = await screen.findByTestId("upc-file-input");
    const csvFile = new File(["upc1\nupc2\nupc3"], "upc_list.csv", {
      type: "text/csv",
    });

    await user.upload(upcFileInput, csvFile);
    const input = upcFileInput as HTMLInputElement;
    expect(input.files?.[0]).toBe(csvFile);

    // Selecting SalesComp module
    const priceOptMode = await screen.findByTestId("radio-3");
    await user.click(priceOptMode);
    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.selectedMode).toBe(3);
    });

    const nextBtn = await screen.findByTestId("upc-wizard-next-btn-1");
    await user.click(nextBtn);

    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.index).toBe(1);
    });

    const storeGroupSelectIcon = await screen.findByTestId(
      "single-select-trigger-icon-1"
    );

    // Click on Stores
    const storeOption = await screen.findByTestId("single-select-option-1-0");
    await user.click(storeGroupSelectIcon);
    await user.click(storeOption);
    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.radioId).toBe(1);
    });

    const storeToClick = await screen.findByTestId("single-select-option-2-1");
    await user.click(storeToClick);

    // handle success
    (getPriceOpt as Mock).mockResolvedValue(priceOptResp);

    // Fetch the data
    const btn2 = await screen.findByTestId("upc-wizard-next-btn-2");
    await user.click(btn2);
    expect(await screen.findByTestId("upc-price")).toBeInTheDocument();
  });

  it("should handle populating the bar charts when selecting upcs", async () => {
    renderWithProviders(<UpcList />, { store });

    const upc1 = await screen.findByTestId("check-0");
    const upc2 = await screen.findByTestId("check-1");
    await user.click(upc1);
    await user.click(upc2);
  });
});
