import { describe, it, expect, vi, type Mock } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../utils";
import LossPrevention from "../../../pages/lossPrevention/LossPrevention";
import {
  getSaleTypes,
  getCashierTable,
  getCashierDetails,
  getTransactionList,
  getCashierTransaction,
  emailTransaction,
} from "../../../api/lossPrevention";
import userEvent from "@testing-library/user-event";
import { setupStore } from "../../../store";
import {
  saleTypes,
  mockSaleTrendResp,
  mockCashierTableResp,
  mockTransListResp,
  mockSingleTransResp,
  mockCashierCancelledTableResp,
  mockSaleTrendCancelResp,
} from ".";
import { setIsDesktop, setIsMobile } from "../../../features/appSlice";

const user = userEvent.setup();
const initialStore = setupStore();

vi.mock("../../../api/lossPrevention");
const mockedToastError = vi.fn();
const mockedToastWarn = vi.fn();
vi.mock("../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    error: mockedToastError,
    warn: mockedToastWarn,
  }),
}));

describe("LossPrevention Page", () => {
  // Testing the fetching of sale types and resetting between fetches (Step 1 of the LossPrevention flow)
  // //////////////////////////////////////////////////////////////////////////////////////////////
  it("should fetch sale types and reset the sales types between fetches", async () => {
    (getSaleTypes as Mock).mockResolvedValueOnce({
      data: { error: 0, sale_types: saleTypes },
    });

    renderWithProviders(<LossPrevention />, { store: initialStore });
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

    renderWithProviders(<LossPrevention />, { store: initialStore });

    const saleTypePanel = await screen.findByTestId("sale-type-panel-Refunded");
    await user.click(saleTypePanel);
  });

  it("should throw an error when fetching cashier details", async () => {
    (getCashierTable as Mock).mockResolvedValueOnce({
      data: mockCashierTableResp,
    });
    (getCashierDetails as Mock).mockRejectedValueOnce(new Error("API Error"));

    renderWithProviders(<LossPrevention />, { store: initialStore });

    const saleTypePanel = await screen.findByTestId("sale-type-panel-Refunded");
    await user.click(saleTypePanel);
  });

  it("should handle API error when fetching transaction list", async () => {
    (getCashierTable as Mock).mockResolvedValueOnce(
      mockCashierCancelledTableResp,
    );
    (getCashierDetails as Mock).mockResolvedValueOnce(mockSaleTrendCancelResp);
    (getTransactionList as Mock).mockRejectedValueOnce(new Error("API Error"));

    renderWithProviders(<LossPrevention />, { store: initialStore });

    const refundPanel = await screen.findByTestId("sale-type-panel-Refunded");
    await user.click(refundPanel);

    const rows = await screen.findAllByRole("row");
    const rowToClick = rows.find((row) => row.textContent.includes("2"));

    if (rowToClick) {
      await user.click(rowToClick);
    }
  });

  it("should toggle the no transaction message when there are no sales", async () => {
    (getCashierDetails as Mock).mockResolvedValueOnce({
      data: { error: 0, sales: [] },
    });

    renderWithProviders(<LossPrevention />, { store: initialStore });
    const refundPanel = await screen.findByTestId("sale-type-panel-Refunded");
    await user.click(refundPanel);

    await waitFor(() => {
      const state = initialStore.getState().lossPrevention;
      expect(state.noTransMsg).toBe(true);
    });
  });

  // Testing the clicking of a sale type to fetch cashier sales and trends
  // /////////////////////////////////////////////////////////////////////
  it("selecting a sale type should make a call to get cashier sales and trends", async () => {
    (getCashierDetails as Mock).mockResolvedValueOnce({
      data: mockSaleTrendResp,
    });

    renderWithProviders(<LossPrevention />, { store: initialStore });
    const refundPanel = await screen.findByTestId("sale-type-panel-Refunded");
    await user.click(refundPanel);

    expect(getCashierDetails).toHaveBeenCalled();
  });

  // Testing the clicking of a cashier trend card to fetch unique cashiers and transaction list
  // //////////////////////////////////////////////////////////////////////////////////////////
  it("should fetch unique cashiers and transaction list when clicking on a cashier trend card", async () => {
    (getCashierTable as Mock).mockRejectedValueOnce(new Error("API Error"));
    // (getTransactionList as Mock).mockRejectedValueOnce(new Error("API Error"));

    renderWithProviders(<LossPrevention />, { store: initialStore });

    // Doing this just to cover some of the mobile styling, functionally all is passing and working correctly
    await waitFor(() => {
      initialStore.dispatch(setIsDesktop(false));
      initialStore.dispatch(setIsMobile(true));
    });

    await waitFor(() => {
      initialStore.dispatch(setIsDesktop(true));
      initialStore.dispatch(setIsMobile(false));
    });

    const rows = await screen.findAllByRole("row");
    const rowToClick = rows.find((row) => row.textContent.includes("2"));

    if (rowToClick) {
      await user.click(rowToClick);
    }

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledTimes(1);
    });
  });

  it("should fetch unique cashiers and transaction list when clicking on a cashier trend card", async () => {
    (getCashierTable as Mock).mockResolvedValueOnce({
      data: mockCashierTableResp,
    });
    (getTransactionList as Mock).mockResolvedValueOnce({
      data: mockTransListResp,
    });

    renderWithProviders(<LossPrevention />, { store: initialStore });

    // Doing this just to cover some of the mobile styling, functionally all is passing and working correctly
    await waitFor(() => {
      initialStore.dispatch(setIsDesktop(false));
      initialStore.dispatch(setIsMobile(true));
    });

    await waitFor(() => {
      initialStore.dispatch(setIsDesktop(true));
      initialStore.dispatch(setIsMobile(false));
    });

    const cashCard = await screen.findByTestId("cashier-trend-card-0-36");
    await user.click(cashCard);

    // expect(getTransactionList).toHaveBeenCalled();
  });

  // Testing the selection/deselection of a cashier behavior from the Unique LossPrevention Table
  // /////////////////////////////////////////////////////////////////////////////
  it("should handle the selection/deselection of a cashier from the Unique LossPrevention Table", async () => {
    renderWithProviders(<LossPrevention />, { store: initialStore });
    (getCashierDetails as Mock).mockResolvedValueOnce({
      data: mockSaleTrendResp,
    });

    (getCashierTable as Mock).mockResolvedValueOnce({
      data: mockCashierTableResp,
    });
    (getTransactionList as Mock).mockResolvedValueOnce({
      data: mockTransListResp,
    });

    const refundPanel = await screen.findByTestId("sale-type-panel-Refunded");
    await user.click(refundPanel);

    const rows = await screen.findAllByRole("row");
    const rowToClick = rows.find((row) => row.textContent.includes("2"));

    if (rowToClick) {
      await user.click(rowToClick);
    }

    const uniqueCashiersTable = await screen.findByTestId(
      "unique-cashiers-table",
    );
    expect(uniqueCashiersTable).toBeInTheDocument();

    // Finding the first row in the unique cashiers table with cashier_number 25 => this is from the mock api response I set up
    const cells = await screen.findAllByRole("gridcell");
    const cellToClick = cells.find((cell) => cell.textContent === "25");
    expect(cellToClick).toBeDefined();

    // // Click to select the cashier
    await user.click(cellToClick!);
    const state = initialStore.getState();
    expect(state.lossPrevention.selectedCashier.cashier_number).toBe(25);
    expect(state.lossPrevention.selectedCashier.store_number).toBe("2");

    // // Click again to deselect the cashier
    await user.click(cellToClick!);
    const updatedState = initialStore.getState();
    expect(updatedState.lossPrevention.selectedCashier.cashier_number).toBe(0);
    expect(updatedState.lossPrevention.selectedCashier.store_number).toBe("");
  });

  // Testing the API failure when trying to open the Transaction Modal
  // /////////////////////////////////////////////////////////////////
  it("should handle API failure when trying to open the Transaction Modal", async () => {
    (getCashierTransaction as Mock).mockRejectedValueOnce(
      new Error("API Error"),
    );

    renderWithProviders(<LossPrevention />, { store: initialStore });

    // Grabbing the first cell with a sale_id to click on
    const cells = await screen.findAllByRole("gridcell");
    const cellToClick = cells.find((cell) => cell.textContent === "869567");
    expect(cellToClick).toBeDefined();
    await user.click(cellToClick!);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledTimes(1);
    });
  });

  // Testing the Show All Button Click behavior at the bottom of the cashiers table
  // //////////////////////////////////////////////////////////////////////////////
  it("Should show all transactions when clicking Show All button", async () => {
    renderWithProviders(<LossPrevention />, { store: initialStore });

    const showAllBtn = await screen.findByTestId("cashiers-table-showall-btn");
    await user.click(showAllBtn);

    const modal = await screen.findByTestId("trans-modal");
    expect(modal).toBeInTheDocument();
  });

  // Testing the the opening and closing of the Transaction Modal from the LossPrevention Table
  // ///////////////////////////////////////////////////////////////////////////////////
  it("should open transaction modal and handle its behavior", async () => {
    (getCashierTransaction as Mock).mockResolvedValueOnce({
      data: mockSingleTransResp,
    });

    renderWithProviders(<LossPrevention />, { store: initialStore });

    // Grabbing the first cell with a sale_id to click on
    const cells = await screen.findAllByRole("gridcell");
    const cellToClick = cells.find((cell) => cell.textContent === "869567");
    expect(cellToClick).toBeDefined();
    await user.click(cellToClick!);

    // Expecting the Transaction Modal to render
    const modal = await screen.findByTestId("modal");
    expect(modal).toBeInTheDocument();

    // Export the data
    const exportBtn = await screen.findByTestId(
      "cashier-trans-modal-export-btn",
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
    renderWithProviders(<LossPrevention />, { store: initialStore });
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
    renderWithProviders(<LossPrevention />, { store: initialStore });
    const exportBtn = await screen.findByTestId("cashiers-table-export-btn");
    await user.click(exportBtn);

    // Clicking Export should render the modal
    const exportModal = await screen.findByTestId("modal");
    expect(exportModal).toBeInTheDocument();

    const fileNameInput = await screen.findByTestId(
      "cashier-export-modal-filename-input",
    );
    expect(fileNameInput).toBeInTheDocument();

    const exportConfirmBtn = await screen.findByTestId(
      "cashier-export-modal-export",
    );
    expect(exportConfirmBtn).toBeInTheDocument();

    // Click the export button without a file name to trigger the warning
    await user.click(exportConfirmBtn);
    expect(mockedToastWarn).toHaveBeenCalledTimes(1);
    expect(mockedToastWarn).toHaveBeenCalledWith(
      expect.stringContaining("Please enter a valid file name."),
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
    renderWithProviders(<LossPrevention />, { store: initialStore });

    // find all the table filters
    const saleDateFilter = await screen.findByTestId(
      "cashier-table-filter-sale-date",
    );
    expect(saleDateFilter).toBeInTheDocument();
    await user.click(saleDateFilter);

    const modal = await screen.findByTestId("cashier-table-filter-modal");
    expect(modal).toBeInTheDocument();

    const filterInput = await screen.findByTestId(
      "cashier-table-filter-text-input",
    );

    const filterBtn = await screen.findByTestId(
      "cashier-table-filter-modal-submit-btn",
    );

    await user.type(filterInput, "12/1/2025");
    await user.click(filterBtn);

    // The modal should close after applying the filter
    expect(modal).not.toBeInTheDocument();
  });

  // it("Should handle the Cashier Table UPC Filter", async () => {
  //   renderWithProviders(<LossPrevention />, { store: initialStore });

  //   const upcFilter = await screen.findByTestId("cashier-table-filter-upc");
  //   expect(upcFilter).toBeInTheDocument();
  //   await user.click(upcFilter);

  //   const modal = await screen.findByTestId("cashier-table-filter-modal");
  //   expect(modal).toBeInTheDocument();

  //   const filterInput = await screen.findByTestId(
  //     "cashier-table-filter-text-input",
  //   );

  //   const filterBtn = await screen.findByTestId(
  //     "cashier-table-filter-modal-submit-btn",
  //   );

  //   await user.type(filterInput, "4470000210");
  //   await user.click(filterBtn);

  //   // The modal should close after applying the filter
  //   expect(modal).not.toBeInTheDocument();
  // });

  // it("Should handle the Cashier Table Description Filter", async () => {
  //   renderWithProviders(<LossPrevention />, { store: initialStore });

  //   const descFilter = await screen.findByTestId(
  //     "cashier-table-filter-description",
  //   );
  //   expect(descFilter).toBeInTheDocument();
  //   await user.click(descFilter);

  //   const modal = await screen.findByTestId("cashier-table-filter-modal");
  //   expect(modal).toBeInTheDocument();

  //   const filterInput = await screen.findByTestId(
  //     "cashier-table-filter-text-input",
  //   );

  //   const filterBtn = await screen.findByTestId(
  //     "cashier-table-filter-modal-submit-btn",
  //   );

  //   await user.type(filterInput, "cash");
  //   await user.click(filterBtn);

  //   // The modal should close after applying the filter
  //   expect(modal).not.toBeInTheDocument();
  // });

  // it("Should handle the Cashier Table Total Sales Filter", async () => {
  //   renderWithProviders(<LossPrevention />, { store: initialStore });

  //   const totalFilter = await screen.findByTestId(
  //     "cashier-table-filter-total-sales",
  //   );
  //   expect(totalFilter).toBeInTheDocument();
  //   await user.click(totalFilter);

  //   const modal = await screen.findByTestId("cashier-table-filter-modal");
  //   expect(modal).toBeInTheDocument();

  //   const filterBtn = await screen.findByTestId(
  //     "cashier-table-filter-modal-submit-btn",
  //   );

  //   const ltCheckbox = await screen.findByTestId(
  //     "cashier-table-filter-ts-lt-checkbox",
  //   );
  //   const gtCheckbox = await screen.findByTestId(
  //     "cashier-table-filter-ts-gt-checkbox",
  //   );
  //   const filterInput = await screen.findByTestId(
  //     "cashier-table-filter-total-sales-input",
  //   );
  //   await user.click(gtCheckbox);
  //   await user.click(ltCheckbox);
  //   await user.type(filterInput, "5");
  //   await user.click(filterBtn);

  //   // The modal should close after applying the filter
  //   expect(modal).not.toBeInTheDocument();
  // });

  // it("Should handle the Cashier Table Total Qty Filter", async () => {
  //   renderWithProviders(<LossPrevention />, { store: initialStore });

  //   const totalFilter = await screen.findByTestId(
  //     "cashier-table-filter-total-qty",
  //   );
  //   expect(totalFilter).toBeInTheDocument();
  //   await user.click(totalFilter);

  //   const modal = await screen.findByTestId("cashier-table-filter-modal");
  //   expect(modal).toBeInTheDocument();

  //   const filterBtn = await screen.findByTestId(
  //     "cashier-table-filter-modal-submit-btn",
  //   );

  //   const gtCheckbox = await screen.findByTestId(
  //     "cashier-table-filter-ts-gt-checkbox",
  //   );
  //   const filterInput = await screen.findByTestId(
  //     "cashier-table-filter-total-sales-input",
  //   );
  //   await user.click(gtCheckbox);
  //   await user.type(filterInput, "4");
  //   await user.click(filterBtn);

  //   // The modal should close after applying the filter
  //   expect(modal).not.toBeInTheDocument();

  //   // await waitFor(() => {
  //   //   const state = initialStore.getState().lossPrevention;
  //   //   console.log(state.totalQtyFilter, state.cashierTableQtyThreshComp);
  //   // });
  // });

  // it("Should handle the Cashier Table Price Type Filter", async () => {
  //   renderWithProviders(<LossPrevention />, { store: initialStore });

  //   const priceFilter = await screen.findByTestId("cashier-table-filter-price");
  //   expect(priceFilter).toBeInTheDocument();
  //   await user.click(priceFilter);

  //   const modal = await screen.findByTestId("cashier-table-filter-modal");
  //   expect(modal).toBeInTheDocument();

  //   // Just for this test
  //   await waitFor(() => {
  //     initialStore.dispatch(setAvailablePriceTypes(["REG", "TPR"]));
  //   });

  //   const tprCheckbox = await screen.findByTestId(
  //     "cashier-table-filter-price-type-TPR",
  //   );

  //   // Click to add TPR to the selected price types
  //   await user.click(tprCheckbox);

  //   // Click to remove TPR from the selected price types
  //   await user.click(tprCheckbox);

  //   // Add TPR back in
  //   await user.click(tprCheckbox);

  //   const filterBtn = await screen.findByTestId(
  //     "cashier-table-filter-modal-submit-btn",
  //   );
  //   await user.click(filterBtn);

  //   // The modal should close after applying the filter
  //   expect(modal).not.toBeInTheDocument();
  // });

  it("should handle the transaction id filter for the cashiers table", async () => {
    renderWithProviders(<LossPrevention />, { store: initialStore });

    const transFilter = await screen.findByTestId(
      "cashier-table-filter-transaction-id",
    );
    expect(transFilter).toBeInTheDocument();
    await user.click(transFilter);

    const filterInput = await screen.findByTestId(
      "cashier-table-filter-text-input",
    );

    const filterBtn = await screen.findByTestId(
      "cashier-table-filter-modal-submit-btn",
    );

    await user.type(filterInput, "952804");
    await user.click(filterBtn);
  });

  it("Should refresh all the Cashier Table Filters when clicking Refresh", async () => {
    renderWithProviders(<LossPrevention />, { store: initialStore });

    const refreshFilter = await screen.findByTestId(
      "cashier-table-filter-refresh",
    );
    expect(refreshFilter).toBeInTheDocument();
    await user.click(refreshFilter);
  });

  // Failing cases that need to be tested
  // ////////////////////////////////////
  it("should handle API failure for fetching sale types", async () => {
    const failStore = setupStore();

    (getSaleTypes as Mock).mockRejectedValueOnce(new Error("API Error"));
    renderWithProviders(<LossPrevention />, { store: failStore });

    const btn = screen.getByTestId("date-picker-search-btn");
    await user.click(btn);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledTimes(1);
      expect(mockedToastError).toHaveBeenCalledWith(
        expect.stringContaining("Error fetching sale types"),
      );
    });
  });

  it("should handle Cancelled data", async () => {
    (getCashierDetails as Mock).mockResolvedValue(mockSaleTrendCancelResp);
    (getCashierTable as Mock).mockResolvedValue(mockCashierCancelledTableResp);
    (getTransactionList as Mock).mockResolvedValue({
      data: mockTransListResp,
    });

    renderWithProviders(<LossPrevention />, { store: initialStore });

    const cancelPanel = await screen.findByTestId("sale-type-panel-Cancelled");
    await user.click(cancelPanel);

    const rows = await screen.findAllByRole("row");
    const rowToClick = rows.find((row) => row.textContent.includes("10"));

    if (rowToClick) {
      await user.click(rowToClick);
      await user.click(rowToClick);
    }

    const showAllBtn = await screen.findByTestId("cashiers-table-showall-btn");
    await user.click(showAllBtn);

    const modal = await screen.findByTestId("trans-modal");
    expect(modal).toBeInTheDocument();

    await waitFor(() => {
      const state = initialStore.getState().lossPrevention;
      expect(state.selectedSaleType).toBe("Cancelled");
    });
  });

  it("should handle api failure for the description sale type", async () => {
    (getCashierDetails as Mock).mockRejectedValueOnce(new Error("API Error"));
    renderWithProviders(<LossPrevention />, { store: initialStore });

    const descPanel = await screen.findByTestId("sale-type-panel-Description");
    await user.click(descPanel);
    const descInput = await screen.findByTestId("desc-input");
    await user.type(descInput, "milk");

    const submitBtn = await screen.findByTestId("desc-submit-btn");
    await user.click(submitBtn);
    await waitFor(() => expect(mockedToastError).toHaveBeenCalled());
  });

  it("should handle description sale type", async () => {
    (getCashierDetails as Mock).mockResolvedValue(mockSaleTrendCancelResp);
    (getCashierTable as Mock).mockResolvedValue({
      data: mockCashierCancelledTableResp,
    });

    renderWithProviders(<LossPrevention />, { store: initialStore });
    const descPanel = await screen.findByTestId("sale-type-panel-Description");
    await user.click(descPanel);

    await user.click(document.body); // Click outside to close the description input
    await user.click(descPanel); // Click again to open the description input

    const descInput = await screen.findByTestId("desc-input");
    await user.type(descInput, "milk");

    const submitBtn = await screen.findByTestId("desc-submit-btn");
    await user.click(submitBtn);

    await waitFor(() => initialStore.dispatch(setIsDesktop(false)));
    await waitFor(() => initialStore.dispatch(setIsDesktop(true)));

    const rows = await screen.findAllByRole("row");
    const rowToClick = rows.find((row) => row.textContent.includes("2"));

    if (rowToClick) {
      await user.click(rowToClick);
    }
  });

  it("should handle the less than threshold filter for total qty", async () => {
    (getCashierTable as Mock).mockResolvedValueOnce(
      mockCashierCancelledTableResp,
    );
    (getCashierDetails as Mock).mockResolvedValueOnce(mockSaleTrendCancelResp);
    (getTransactionList as Mock).mockResolvedValueOnce({
      data: mockTransListResp,
    });

    renderWithProviders(<LossPrevention />, { store: initialStore });

    const cancelPanel = await screen.findByTestId("sale-type-panel-Cancelled");
    await user.click(cancelPanel);

    const rows = await screen.findAllByRole("row");
    const rowToClick = rows.find((row) => row.textContent.includes("2"));

    if (rowToClick) {
      await user.click(rowToClick);
    }

    const totalFilter = await screen.findByTestId(
      "cashier-table-filter-total-qty",
    );
    expect(totalFilter).toBeInTheDocument();
    await user.click(totalFilter);

    const modal = await screen.findByTestId("cashier-table-filter-modal");
    expect(modal).toBeInTheDocument();

    const filterBtn = await screen.findByTestId(
      "cashier-table-filter-modal-submit-btn",
    );

    const ltCheckbox = await screen.findByTestId(
      "cashier-table-filter-ts-lt-checkbox",
    );

    const filterInput = await screen.findByTestId(
      "cashier-table-filter-total-sales-input",
    );

    await user.click(ltCheckbox);
    await user.type(filterInput, "4");
    await user.click(filterBtn);

    await waitFor(() => {
      const state = initialStore.getState().lossPrevention;
      expect(state.totalQtyFilter).toBe(4);
      expect(state.cashierTableQtyThreshComp.lt).toBe(true);
    });
  });

  it("should handle the greater than threshold filter for total qty", async () => {
    (getCashierTable as Mock).mockResolvedValueOnce({
      data: mockCashierCancelledTableResp,
    });
    (getCashierDetails as Mock).mockResolvedValueOnce(mockSaleTrendCancelResp);
    (getTransactionList as Mock).mockResolvedValueOnce({
      data: mockTransListResp,
    });

    renderWithProviders(<LossPrevention />, { store: initialStore });

    const cancelPanel = await screen.findByTestId("sale-type-panel-Cancelled");
    await user.click(cancelPanel);

    const rows = await screen.findAllByRole("row");
    const rowToClick = rows.find((row) => row.textContent.includes("2"));

    if (rowToClick) {
      await user.click(rowToClick);
    }

    const totalFilter = await screen.findByTestId(
      "cashier-table-filter-total-qty",
    );
    expect(totalFilter).toBeInTheDocument();
    await user.click(totalFilter);

    const modal = await screen.findByTestId("cashier-table-filter-modal");
    expect(modal).toBeInTheDocument();

    const filterBtn = await screen.findByTestId(
      "cashier-table-filter-modal-submit-btn",
    );

    const gtCheckbox = await screen.findByTestId(
      "cashier-table-filter-ts-gt-checkbox",
    );
    const filterInput = await screen.findByTestId(
      "cashier-table-filter-total-sales-input",
    );
    await user.click(gtCheckbox);
    await user.type(filterInput, "4");
    await user.click(filterBtn);

    await waitFor(() => {
      const state = initialStore.getState().lossPrevention;
      expect(state.totalQtyFilter).toBe(4);
      expect(state.cashierTableQtyThreshComp.gt).toBe(true);
    });
  });

  it("should handle the less than threshold filter for total sales", async () => {
    (getCashierTable as Mock).mockResolvedValueOnce(
      mockCashierCancelledTableResp,
    );
    (getCashierDetails as Mock).mockResolvedValueOnce(mockSaleTrendCancelResp);
    (getTransactionList as Mock).mockResolvedValueOnce({
      data: mockTransListResp,
    });

    renderWithProviders(<LossPrevention />, { store: initialStore });

    const cancelPanel = await screen.findByTestId("sale-type-panel-Cancelled");
    await user.click(cancelPanel);

    const rows = await screen.findAllByRole("row");
    const rowToClick = rows.find((row) => row.textContent.includes("2"));

    if (rowToClick) {
      await user.click(rowToClick);
    }

    const totalFilter = await screen.findByTestId(
      "cashier-table-filter-total-sales",
    );
    expect(totalFilter).toBeInTheDocument();
    await user.click(totalFilter);

    const modal = await screen.findByTestId("cashier-table-filter-modal");
    expect(modal).toBeInTheDocument();

    const filterBtn = await screen.findByTestId(
      "cashier-table-filter-modal-submit-btn",
    );

    const ltCheckbox = await screen.findByTestId(
      "cashier-table-filter-ts-lt-checkbox",
    );

    const filterInput = await screen.findByTestId(
      "cashier-table-filter-total-sales-input",
    );

    await user.click(ltCheckbox);
    await user.type(filterInput, "5");
    await user.click(filterBtn);

    await waitFor(() => {
      const state = initialStore.getState().lossPrevention;
      expect(state.totalSalesFilter).toBe(5);
      expect(state.cashierTableThreshComp.lt).toBe(true);
    });
  });

  it("should handle the greater than threshold filter for total sales", async () => {
    (getCashierTable as Mock).mockResolvedValueOnce(
      mockCashierCancelledTableResp,
    );
    (getCashierDetails as Mock).mockResolvedValueOnce(mockSaleTrendCancelResp);
    (getTransactionList as Mock).mockResolvedValueOnce({
      data: mockTransListResp,
    });

    renderWithProviders(<LossPrevention />, { store: initialStore });

    const cancelPanel = await screen.findByTestId("sale-type-panel-Cancelled");
    await user.click(cancelPanel);

    const rows = await screen.findAllByRole("row");
    const rowToClick = rows.find((row) => row.textContent.includes("2"));

    if (rowToClick) {
      await user.click(rowToClick);
    }

    const totalFilter = await screen.findByTestId(
      "cashier-table-filter-total-sales",
    );
    expect(totalFilter).toBeInTheDocument();
    await user.click(totalFilter);

    const modal = await screen.findByTestId("cashier-table-filter-modal");
    expect(modal).toBeInTheDocument();

    const filterBtn = await screen.findByTestId(
      "cashier-table-filter-modal-submit-btn",
    );

    const gtCheckbox = await screen.findByTestId(
      "cashier-table-filter-ts-gt-checkbox",
    );

    const filterInput = await screen.findByTestId(
      "cashier-table-filter-total-sales-input",
    );

    await user.click(gtCheckbox);
    await user.type(filterInput, "5");
    await user.click(filterBtn);

    await waitFor(() => {
      const state = initialStore.getState().lossPrevention;
      expect(state.totalSalesFilter).toBe(5);
      expect(state.cashierTableThreshComp.gt).toBe(true);
    });
  });

  it("should handle the cashiers grid pagination", async () => {
    (getCashierTable as Mock).mockResolvedValue(mockCashierCancelledTableResp);
    (getCashierDetails as Mock).mockResolvedValue(mockSaleTrendCancelResp);
    (getTransactionList as Mock).mockResolvedValue({
      data: mockTransListResp,
    });

    renderWithProviders(<LossPrevention />, { store: initialStore });

    const cancelPanel = await screen.findByTestId("sale-type-panel-Cancelled");
    await user.click(cancelPanel);

    const rows = await screen.findAllByRole("row");
    const rowToClick = rows.find((row) => row.textContent.includes("2"));

    if (rowToClick) {
      await user.click(rowToClick);
    }

    const nextBtn = await screen.findByTestId("cashiers-next-page-btn");
    // const prevBtn = await screen.findByTestId("cashiers-prev-page-btn");

    await user.click(nextBtn);
  });

  it("should handle transaction list api failure on cashiers table pagination", async () => {
    (getCashierTable as Mock).mockResolvedValue(mockCashierCancelledTableResp);
    (getCashierDetails as Mock).mockResolvedValue(mockSaleTrendCancelResp);
    (getTransactionList as Mock).mockResolvedValueOnce({
      data: mockTransListResp,
    });

    renderWithProviders(<LossPrevention />, { store: initialStore });

    const cancelPanel = await screen.findByTestId("sale-type-panel-Cancelled");
    await user.click(cancelPanel);

    const rows = await screen.findAllByRole("row");
    const rowToClick = rows.find((row) => row.textContent.includes("2"));

    if (rowToClick) {
      await user.click(rowToClick);
    }

    (getTransactionList as Mock).mockRejectedValue(new Error("API Error"));

    const prevBtn = await screen.findByTestId("cashiers-prev-page-btn");
    await user.click(prevBtn);
  });

  it("should handle the cashiers tableapi failure on cashiers table pagination", async () => {
    (getCashierTable as Mock).mockResolvedValue(mockCashierCancelledTableResp);
    (getCashierDetails as Mock).mockResolvedValue(mockSaleTrendCancelResp);
    (getTransactionList as Mock).mockResolvedValueOnce({
      data: mockTransListResp,
    });

    renderWithProviders(<LossPrevention />, { store: initialStore });

    const cancelPanel = await screen.findByTestId(
      "sale-type-panel-Description",
    );
    await user.click(cancelPanel);

    const descInput = await screen.findByTestId("desc-input");
    await user.type(descInput, "milk");

    const submitBtn = await screen.findByTestId("desc-submit-btn");
    await user.click(submitBtn);

    const rows = await screen.findAllByRole("row");
    const rowToClick = rows.find((row) => row.textContent.includes("2"));

    if (rowToClick) {
      await user.click(rowToClick);
    }

    // const nextBtn = await screen.findByTestId("cashiers-next-page-btn");

    (getCashierTable as Mock).mockRejectedValue(new Error("API Error"));
    // await user.click(nextBtn);
    const input = await screen.findByTestId("input-");
    await user.clear(input);
    await user.type(input, "2");
    await user.keyboard("{Enter}");
  });
});
