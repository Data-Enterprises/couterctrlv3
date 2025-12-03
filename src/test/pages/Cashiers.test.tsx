import { describe, it, expect, vi, type Mock } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../utils";
import Cashiers from "../../pages/cashiers/Cashiers";
import {
  getSaleTypes,
  getCashierTable,
  getCashierDetails,
  getTransactionList,
  getCashierTransactions,
  emailTransaction,
} from "../../api/cashiers";
import userEvent from "@testing-library/user-event";
import { setupStore } from "../../store";
import {
  saleTypes,
  mockSaleTrendResp,
  mockCashierTableResp,
  mockTransListResp,
  mockSingleTransResp,
} from "./cashiers";

const user = userEvent.setup();
const initialStore = setupStore();

vi.mock("../../api/cashiers");
const mockedToastError = vi.fn();
const mockedToastWarn = vi.fn();
vi.mock("../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    error: mockedToastError,
    warn: mockedToastWarn,
  }),
}));

describe("Cashiers Page", () => {
  // Testing the fetching of sale types and resetting between fetches (Step 1 of the Cashiers flow)
  // //////////////////////////////////////////////////////////////////////////////////////////////
  it("should fetch sale types and reset the sales types between fetches", async () => {
    (getSaleTypes as Mock).mockResolvedValueOnce({
      data: { error: 0, sale_types: saleTypes },
    });

    renderWithProviders(<Cashiers />, { store: initialStore });
    const btn = screen.getByTestId("date-picker-search-btn");
    await user.click(btn);

    expect(getSaleTypes).toHaveBeenCalled();

    // If you need to make a call again, then make the new resolved value
    (getSaleTypes as Mock).mockResolvedValueOnce({
      data: { error: 0, sale_types: saleTypes },
    });

    await user.click(btn);
  });

  // Testing error handling for cashier table and cashier details endpoints
  // //////////////////////////////////////////////////////////////////////
  it("should handle errors for cashier table and cashier details endpoints", async () => {
    (getCashierTable as Mock).mockRejectedValueOnce(new Error("API Error"));
    (getCashierDetails as Mock).mockRejectedValueOnce(new Error("API Error"));

    renderWithProviders(<Cashiers />, { store: initialStore });

    const saleTypePanel = await screen.findByTestId("sale-type-panel-Refunded");
    await user.click(saleTypePanel);
  });

  // Testing the clicking of a sale type to fetch cashier sales and trends
  // /////////////////////////////////////////////////////////////////////
  it("selecting a sale type should make a call to get cashier sales and trends", async () => {
    (getCashierTable as Mock).mockResolvedValueOnce({
      data: mockCashierTableResp,
    });
    (getCashierDetails as Mock).mockResolvedValueOnce({
      data: mockSaleTrendResp,
    });

    renderWithProviders(<Cashiers />, { store: initialStore });

    const refundPanel = await screen.findByTestId("sale-type-panel-Refunded");
    await user.click(refundPanel);

    expect(getCashierTable).toHaveBeenCalled();
    expect(getCashierDetails).toHaveBeenCalled();
  });

  // Testing the clicking of a cashier trend card to fetch unique cashiers and transaction list
  // //////////////////////////////////////////////////////////////////////////////////////////
  it("should fetch unique cashiers and transaction list when clicking on a cashier trend card", async () => {
    (getTransactionList as Mock).mockResolvedValueOnce({
      data: mockTransListResp,
    });

    renderWithProviders(<Cashiers />, { store: initialStore });

    const cashCard = await screen.findByTestId("cashier-trend-card-0-36");
    await user.click(cashCard);

    expect(getTransactionList).toHaveBeenCalled();
  });

  // Testing the selection/deselection of a cashier behavior from the Unique Cashiers Table
  // /////////////////////////////////////////////////////////////////////////////
  it("should handle the selection/deselection of a cashier from the Unique Cashiers Table", async () => {
    renderWithProviders(<Cashiers />, { store: initialStore });

    // const uniqueCashiersTable = await screen.findByTestId("unique-cashiers-table");
    const cells = await screen.findAllByRole("gridcell");

    // Finding the first row in the unique cashiers table with cashier_number 25 => this is from the mock api response I set up
    const cellToClick = cells.find((cell) => cell.textContent === "25");
    expect(cellToClick).toBeDefined();

    // Click to select the cashier
    await user.click(cellToClick!);
    const state = initialStore.getState();
    expect(state.cashier.selectedCashier.cashier_number).toBe(25);
    expect(state.cashier.selectedCashier.store_number).toBe("2");

    // Click again to deselect the cashier
    await user.click(cellToClick!);
    const updatedState = initialStore.getState();
    expect(updatedState.cashier.selectedCashier.cashier_number).toBe(0);
    expect(updatedState.cashier.selectedCashier.store_number).toBe("");
  });

  // Testing the API failure when trying to open the Transaction Modal
  // /////////////////////////////////////////////////////////////////
  it("should handle API failure when trying to open the Transaction Modal", async () => {
    (getCashierTransactions as Mock).mockRejectedValueOnce(
      new Error("API Error")
    );

    renderWithProviders(<Cashiers />, { store: initialStore });

    // Grabbing the first cell with a sale_id to click on
    const cells = await screen.findAllByRole("gridcell");
    const cellToClick = cells.find(
      (cell) => cell.textContent === "36-869567-4-12-1-2025"
    );
    expect(cellToClick).toBeDefined();
    await user.click(cellToClick!);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledTimes(1);
    });
  });

  // Testing the Show All Button Click behavior at the bottom of the cashiers table
  // //////////////////////////////////////////////////////////////////////////////
  it("Should show all transactions when clicking Show All button", async () => {
    renderWithProviders(<Cashiers />, { store: initialStore });

    const showAllBtn = await screen.findByTestId("cashiers-table-showall-btn");
    await user.click(showAllBtn);

    const modal = await screen.findByTestId("trans-modal");
    expect(modal).toBeInTheDocument();
  });

  // Testing the the opening and closing of the Transaction Modal from the Cashiers Table
  // ///////////////////////////////////////////////////////////////////////////////////
  it("should open transaction modal and handle its behavior", async () => {
    (getCashierTransactions as Mock).mockResolvedValueOnce({
      data: mockSingleTransResp,
    });

    renderWithProviders(<Cashiers />, { store: initialStore });

    // Grabbing the first cell with a sale_id to click on
    const cells = await screen.findAllByRole("gridcell");
    const cellToClick = cells.find(
      (cell) => cell.textContent === "36-869567-4-12-1-2025"
    );
    expect(cellToClick).toBeDefined();
    await user.click(cellToClick!);

    // Expecting the Transaction Modal to render
    const modal = await screen.findByTestId("modal");
    expect(modal).toBeInTheDocument();

    // Export the data
    const exportBtn = await screen.findByTestId(
      "cashier-trans-modal-export-btn"
    );

    // Click the export button to open the Export Modal
    expect(exportBtn).toBeInTheDocument();
    await user.click(exportBtn);

    // email the export modal
    (emailTransaction as Mock).mockResolvedValueOnce({
      data: { error: 0 },
    });

    const emailBtn = await screen.findByTestId("cashier-trans-modal-email-btn");
    expect(emailBtn).toBeInTheDocument();

    await user.click(emailBtn);
    expect(emailTransaction).toHaveBeenCalled();

    // Click outside the modal to close it
    await user.click(document.body);
    await waitFor(() => {
      expect(modal).not.toBeInTheDocument();
    });
  });

  // Clicking Export at the bottom of the Cashies Table
  // //////////////////////////////////////////
  it("should load all transactions in the Transaction Modal when clicking Show All", async () => {
    renderWithProviders(<Cashiers />, { store: initialStore });
    const exportAllBtn = await screen.findByTestId("cashiers-table-export-btn");
    await user.click(exportAllBtn);

    // Clicking Export should render the modal
    const exportModal = await screen.findByTestId("modal");
    expect(exportModal).toBeInTheDocument();

    const cancelBtn = await screen.findByTestId("cashier-export-modal-cancel");
    expect(cancelBtn).toBeInTheDocument();

    await user.click(cancelBtn);
    expect(exportModal).not.toBeInTheDocument();
  });

  // Testing the exporting of transactions from the Export Modal
  // //////////////////////////////////////////
  it("should handle the exporting of transactions from the Export Modal component", async () => {
    renderWithProviders(<Cashiers />, { store: initialStore });
    const exportBtn = await screen.findByTestId("cashiers-table-export-btn");
    await user.click(exportBtn);

    // Clicking Export should render the modal
    const exportModal = await screen.findByTestId("modal");
    expect(exportModal).toBeInTheDocument();

    const fileNameInput = await screen.findByTestId(
      "cashier-export-modal-filename-input"
    );
    expect(fileNameInput).toBeInTheDocument();

    const exportConfirmBtn = await screen.findByTestId(
      "cashier-export-modal-export"
    );
    expect(exportConfirmBtn).toBeInTheDocument();

    // Click the export button without a file name to trigger the warning
    await user.click(exportConfirmBtn);
    expect(mockedToastWarn).toHaveBeenCalledTimes(1);
    expect(mockedToastWarn).toHaveBeenCalledWith(
      expect.stringContaining("Please enter a valid file name.")
    );

    // Now enter a file name and click export
    await user.type(fileNameInput, "test_export");
    await user.click(exportConfirmBtn);

    // The modal should close after exporting
    expect(exportModal).not.toBeInTheDocument();
  });

  // Testing the Cashier Table Filters component behavior now that the export modal is out of the document
  // ////////////////////////////////////////////////////
  it("should handle the Cashier Table Sale Date filter", async () => {
    renderWithProviders(<Cashiers />, { store: initialStore });

    // find all the table filters
    const saleDateFilter = await screen.findByTestId(
      "cashier-table-filter-sale"
    );
    expect(saleDateFilter).toBeInTheDocument();
  });

  /**
   *     const upcFilter = await screen.findByTestId("cashier-table-filter-upc");
    const descFilter = await screen.findByTestId(
      "cashier-table-filter-description"
    );
    const totalFilter = await screen.findByTestId("cashier-table-filter-total");
    const priceFilter = await screen.findByTestId("cashier-table-filter-price");
    const refreshFilter = await screen.findByTestId(
      "cashier-table-filter-refresh"
    );
   */

  // Failing cases that need to be tested
  // ////////////////////////////////////
  it("should handle API failure for fetching sale types", async () => {
    const failStore = setupStore();

    (getSaleTypes as Mock).mockRejectedValueOnce(new Error("API Error"));
    renderWithProviders(<Cashiers />, { store: failStore });

    const btn = screen.getByTestId("date-picker-search-btn");
    await user.click(btn);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledTimes(1);
      expect(mockedToastError).toHaveBeenCalledWith(
        expect.stringContaining("Error fetching sale types")
      );
    });
  });

  // Test the Cancelled stuff here to cover the Transaction Modal agg function
  // /////////////////////////////////////////////////////////////////////////
});
