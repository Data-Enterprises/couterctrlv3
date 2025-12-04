import { describe, expect, it, vi, type Mock } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { setupStore } from "../../../store";
import { renderWithProviders } from "../../utils";
import userEvent from "@testing-library/user-event";

// Dispatchers
import { setAssignedStores } from "../../../features/userSlice";
import { setGroups } from "../../../features/groupSlice";

// API calls to be mocked
import { getStoresAssignedToUserGroup } from "../../../api/groups";

// Responses
import {
  stores,
  groups,
  getGroupStoresResp,
  JsonErrorResp,
} from ".";

// Components being tested
import UpcList from "../../../pages/upc/wizard/UpcList";

vi.mock("../../../api/groups");

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
    expect(tooltipOne).toBeInTheDocument();

    await user.hover(tooltipOne);
    await user.unhover(tooltipOne);

    const storeGroupSelectIcon = await screen.findByTestId(
      "single-select-trigger-icon-1"
    );

    const trendInput = await screen.findByTestId("text-input-trend");
    await user.type(trendInput, "0");

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

    const storeToClick = await screen.findByTestId("single-select-option-2-1");
    await user.click(storeToClick);
    await user.click(storeToClick); // Click twice to add and then remove
    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.selectedStores.length).toBe(0);
    });

    // Click on Group
    await user.click(storeGroupSelectIcon);
    await user.click(groupOption);
    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.radioId).toBe(2);
    });

    // handle error
    (getStoresAssignedToUserGroup as Mock).mockRejectedValue(JsonErrorResp);
    const groupToClick = await screen.findByTestId("single-select-option-2-1");
    await user.click(groupToClick);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith("API request failed");
    });

    // now handle success
    (getStoresAssignedToUserGroup as Mock).mockResolvedValue(
      getGroupStoresResp
    );
    await user.click(groupToClick);
    await waitFor(() => {
      const state = store.getState().upc;
      expect(state.selectedStores.length).toBeGreaterThan(0);
    });

    const backBtn2 = await screen.findByTestId("upc-wizard-back-btn-2");;
    await user.click(backBtn2);

    const btn1 = await screen.findByTestId("upc-wizard-next-btn-1");
    await user.click(btn1);

    const btn2 = await screen.findByTestId("upc-wizard-next-btn-2");
    await user.click(btn2);
  });
});
