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
import UpcList from "../../../pages/upc/wizard/UpcList";

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
    const forecastMode = await screen.findByTestId("radio-2");
    await user.click(forecastMode);
    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.selectedMode).toBe(2);
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
    (getForecasting as Mock).mockRejectedValueOnce(JsonErrorResp);

    // Fetch the data
    const btn2 = await screen.findByTestId("upc-wizard-next-btn-2");
    await user.click(btn2);

    const stepOne = await screen.findByTestId("upc-step-one");
    expect(stepOne).toBeInTheDocument();
  });

  // In this case, we're just trying to render SalesComp
  it("should render selected module correctly", async () => {
    renderWithProviders(<UpcList />, { store });

    // Go through the steps of the UpcWizard to reach SalesComp module
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
    (getForecasting as Mock).mockResolvedValue(forecastResp);

    // Fetch the data
    const btn2 = await screen.findByTestId("upc-wizard-next-btn-2");
    await user.click(btn2);

    expect(await screen.findByTestId("upc-price")).toBeInTheDocument();
  });
});
