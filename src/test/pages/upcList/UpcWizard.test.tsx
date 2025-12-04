import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UpcList from "../../../pages/upc/wizard/UpcList";
import { renderWithProviders } from "../../utils";
import { setupStore } from "../../../store";
import { setAssignedStores } from "../../../features/userSlice";
import { stores } from ".";

const store = setupStore();
store.dispatch(setAssignedStores(stores));
const user = userEvent.setup();
const mockedToastWarn = vi.fn();
vi.mock("../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    warn: mockedToastWarn,
  }),
}));

describe("SalesComp Module in UpcList", () => {
  // UpcWizard Step One
  it("should render SalesComp module when selected", async () => {
    renderWithProviders(<UpcList />, { store });

    const upcWizardContainer = await screen.findByTestId("upcwizard-container");
    expect(upcWizardContainer).toBeInTheDocument();

    const upcFileInput = await screen.findByTestId("upc-file-input");
    expect(upcFileInput).toBeInTheDocument();

    // Try uploading a non-CSV file first to trigger the warning
    const notCsvFile = new File(["not,a,csv,file"], "not_a_csv.txt", {
      type: "text/plain",
    });

    user.upload(upcFileInput, notCsvFile);
    await waitFor(() => {
      expect(mockedToastWarn).toHaveBeenCalledWith(
        "Please select a valid CSV file"
      );
    });

    // Now upload a valid CSV file
    await user.upload(upcFileInput, notCsvFile);
    const csvFile = new File(["upc1\nupc2\nupc3"], "upc_list.csv", {
      type: "text/csv",
    });

    await user.upload(upcFileInput, csvFile);
    const input = upcFileInput as HTMLInputElement;
    expect(input.files?.[0]).toBe(csvFile);

    // mode select
    const modeOne = await screen.findByTestId("radio-1");
    const modeTwo = await screen.findByTestId("radio-2");

    // Handle Clicking => should toggle on and off for the modes if selected twice
    await user.click(modeTwo);
    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.selectedMode).toBe(2);
    });
    await user.click(modeTwo);
    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.selectedMode).toBe(0);
    });

    // Now select mode one for Sales Comparison
    await user.click(modeOne);
    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.selectedMode).toBe(1);
    });

    // Now that a valid file is selected and mode one is selected, the next button should be available
    const nextBtn = await screen.findByTestId("upc-wizard-next-btn-1");
    expect(nextBtn).toBeInTheDocument();
    await user.click(nextBtn);

    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.index).toBe(1);
    });
  });

  // UpcWizard Step Two
  it("should render and handle interactions in Step Two", async () => {
    renderWithProviders(<UpcList />, { store });

    const tooltipOne = await screen.findByTestId("tooltip-icon-0");
    const tooltipTwo = await screen.findByTestId("tooltip-icon-1");
    const tooltipThree = await screen.findByTestId("tooltip-icon-2");
    const tooltipFour = await screen.findByTestId("tooltip-icon-3");
    expect(tooltipOne).toBeInTheDocument();
    expect(tooltipTwo).toBeInTheDocument();
    expect(tooltipThree).toBeInTheDocument();
    expect(tooltipFour).toBeInTheDocument();

    await user.hover(tooltipOne);
    await user.hover(tooltipTwo);
    await user.hover(tooltipThree);
    await user.hover(tooltipFour);

    const storeGroupSelectIcon = await screen.findByTestId(
      "single-select-trigger-icon-1"
    );

    const storeOption = await screen.findByTestId("single-select-option-1-0");
    const groupOption = await screen.findByTestId("single-select-option-1-1");
    expect(storeOption).toBeInTheDocument();
    expect(groupOption).toBeInTheDocument();

    // Click on Stores
    await user.click(storeGroupSelectIcon);
    await user.click(storeOption);
    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.radioId).toBe(1);
    });

    // Click on Group
    await user.click(storeGroupSelectIcon);
    await user.click(groupOption);
    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.radioId).toBe(2);
    });

    await waitFor(() => {
      const state = store.getState();
      console.log(state.user.assignedStores);
    });
  });
});
