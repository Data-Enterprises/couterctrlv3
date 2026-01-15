import { describe, expect, it, vi, type Mock } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
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

vi.mock("@nivo/bar", () => ({
  ResponsiveBar: vi.fn((props) => {
    // Cover axisLeft.format - called with string values
    if (props.axisLeft?.format) {
      props.axisLeft.format("1 - $5.99"); // singleRow case
      props.axisLeft.format("UPC123"); // multiRow case
    }

    if (props.tooltipLabel) {
      // 1st call: item NOT found → hits if (!item) return ""
      props.tooltipLabel({ indexValue: "nonexistent-upc" });

      // 2nd call: item FOUND → hits both return statements
      // This is data from the mock response
      props.tooltipLabel({ indexValue: "1200000017" });
    }

    // Previous coverage
    if (props.colors) props.colors({ id: "test", value: 100 });
    if (props.borderColor) props.borderColor({ id: "test", value: 100 });

    return <div data-testid="responsive-bar" />;
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

  it("should inform the user no records were found", async () => {
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
    (getPriceOpt as Mock).mockResolvedValue({ data: { error: 1 } });

    // Fetch the data
    const btn2 = await screen.findByTestId("upc-wizard-next-btn-2");
    await user.click(btn2);
   
    await waitFor(() => {
      expect(mockedToastWarn).toHaveBeenCalledWith("No Records Found");
    });
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

  it("should handle grid row selection", async () => {
    renderWithProviders(<UpcList />, { store });

    const cells = await screen.findAllByRole("gridcell");
    const cellToClick = cells.find((c) => c.textContent === "PEPSI 24 PK");
    if (cellToClick) {
      await user.click(cellToClick);
    }
  });

  it("should handle grid row unselection", async () => {
    renderWithProviders(<UpcList />, { store });
    const cells = await screen.findAllByRole("gridcell");
    const cellToClick = cells.find((c) => c.textContent === "PEPSI 24 PK");
    if (cellToClick) {
      await user.click(cellToClick);
    }
  });

  it("should handle context menu clicking", async () => {
    renderWithProviders(<UpcList />, { store });
    const cells = await screen.findAllByRole("gridcell");
    const cellToClick = cells.find((c) => c.textContent === "PEPSI 24 PK");

    if (cellToClick) {
      fireEvent.contextMenu(cellToClick);
    }
  });

  it("should handle info tooltip display on metric cards", async () => {
    renderWithProviders(<UpcList />, { store });

    const infoIcon = await screen.findByTestId("opt-metric-info-icon-0-Price");
    await user.hover(infoIcon);
    await user.unhover(infoIcon);
  });

  it("should handle export modal warnings", async () => {
    renderWithProviders(<UpcList />, { store });

    const exportBtn = await screen.findByTestId("upc-controls-export-btn");
    await user.click(exportBtn);

    const modal = await screen.findByTestId("modal");
    expect(modal).toBeInTheDocument();

    // Get the warning for no file name
    const submitBtn = await screen.findByTestId("upc-export-modal-submit-btn");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockedToastWarn).toHaveBeenCalledWith(
        "Please enter a file name..."
      );
    });

    // Enter a file name
    const fileInput = await screen.findByTestId("text-input-csvFileName");
    await user.type(fileInput, "exported_price_opt_data");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockedToastWarn).toHaveBeenCalledWith(
        "Please select the list and data for the export..."
      );
    });

    // Select List only
    const listSelect = await screen.findByTestId(
      "single-select-trigger-icon-0"
    );
    await user.click(listSelect);
    const allUpcs = await screen.findByTestId("single-select-option-0-0");
    await user.click(allUpcs);
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockedToastWarn).toHaveBeenCalledWith(
        "Please select the data for the export..."
      );
    });
  });

  it("should throw warning for unselected list options during export", async () => {
    renderWithProviders(<UpcList />, { store });

    const exportBtn = await screen.findByTestId("upc-controls-export-btn");
    await user.click(exportBtn);

    const modal = await screen.findByTestId("modal");
    expect(modal).toBeInTheDocument();

    // Get the warning for no file name
    const submitBtn = await screen.findByTestId("upc-export-modal-submit-btn");
    const fileInput = await screen.findByTestId("text-input-csvFileName");
    await user.type(fileInput, "exported_price_opt_data");

    const listSelect = await screen.findByTestId(
      "single-select-trigger-icon-0"
    );
    await user.click(listSelect);
    const allUpcs = await screen.findByTestId("single-select-option-0-0");
    await user.click(allUpcs);
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockedToastWarn).toHaveBeenCalledWith(
        "Please select the data for the export..."
      );
    });
  });

  it("should throw warning for unselected data options during export", async () => {
    renderWithProviders(<UpcList />, { store });

    const exportBtn = await screen.findByTestId("upc-controls-export-btn");
    await user.click(exportBtn);

    const modal = await screen.findByTestId("modal");
    expect(modal).toBeInTheDocument();

    const submitBtn = await screen.findByTestId("upc-export-modal-submit-btn");
    const fileInput = await screen.findByTestId("text-input-csvFileName");
    await user.type(fileInput, "exported_price_opt_data");

    const dataSelect = await screen.findByTestId(
      "single-select-trigger-icon-1"
    );
    await user.click(dataSelect);
    const selectedUpcs = await screen.findByTestId("single-select-option-1-1");
    await user.click(selectedUpcs);
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockedToastWarn).toHaveBeenCalledWith(
        "Please select the list for the export..."
      );
    });
  });

  it("should throw warning when no upcs are selected but 'selected' list option is chosen", async () => {
    renderWithProviders(<UpcList />, { store });

    const deselectAll = await screen.findByTestId("upc-deselect-all-btn");
    await user.click(deselectAll);

    const exportBtn = await screen.findByTestId("upc-controls-export-btn");
    await user.click(exportBtn);

    const submitBtn = await screen.findByTestId("upc-export-modal-submit-btn");
    const fileInput = await screen.findByTestId("text-input-csvFileName");
    await user.type(fileInput, "exported_price_opt_data");

    const listSelect = await screen.findByTestId(
      "single-select-trigger-icon-0"
    );
    await user.click(listSelect);
    const selectedUpcs = await screen.findByTestId("single-select-option-0-1");
    await user.click(selectedUpcs);

    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockedToastWarn).toHaveBeenCalledWith(
        "Please select at least one upc to export..."
      );
    });
  });

  it("should handle exporting all data for selected upcs", async () => {
    renderWithProviders(<UpcList />, { store });
    const upc1 = await screen.findByTestId("check-0");
    const upc2 = await screen.findByTestId("check-1");
    await user.click(upc1);
    await user.click(upc2);

    const exportBtn = await screen.findByTestId("upc-controls-export-btn");
    await user.click(exportBtn);

    const submitBtn = await screen.findByTestId("upc-export-modal-submit-btn");
    const fileInput = await screen.findByTestId("text-input-csvFileName");
    await user.type(fileInput, "exported_price_opt_data");

    const listSelect = await screen.findByTestId(
      "single-select-trigger-icon-0"
    );
    await user.click(listSelect);
    const selectedUpcs = await screen.findByTestId("single-select-option-0-1");
    await user.click(selectedUpcs);

    const dataSelect = await screen.findByTestId(
      "single-select-trigger-icon-1"
    );
    await user.click(dataSelect);
    const allData = await screen.findByTestId("single-select-option-1-0");
    await user.click(allData);
    await user.click(submitBtn);
  });

  it("should handle exporting best prices data for all upcs", async () => {
    renderWithProviders(<UpcList />, { store });
    const upc1 = await screen.findByTestId("check-0");
    const upc2 = await screen.findByTestId("check-1");
    await user.click(upc1);
    await user.click(upc2);

    const exportBtn = await screen.findByTestId("upc-controls-export-btn");
    await user.click(exportBtn);

    const submitBtn = await screen.findByTestId("upc-export-modal-submit-btn");
    const fileInput = await screen.findByTestId("text-input-csvFileName");
    await user.type(fileInput, "exported_price_opt_data");

    const listSelect = await screen.findByTestId(
      "single-select-trigger-icon-0"
    );
    await user.click(listSelect);
    const allUpcs = await screen.findByTestId("single-select-option-0-0");
    await user.click(allUpcs);

    const dataSelect = await screen.findByTestId(
      "single-select-trigger-icon-1"
    );
    await user.click(dataSelect);
    const allData = await screen.findByTestId("single-select-option-1-1");
    await user.click(allData);
    await user.click(submitBtn);
  });
});
