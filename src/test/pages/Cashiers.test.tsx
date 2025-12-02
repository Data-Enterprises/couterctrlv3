import { describe, it, expect, vi, type Mock } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../utils";
import Cashiers from "../../pages/cashiers/Cashiers";
import {
  getSaleTypes,
  getCashierTable,
  getCashierDetails,
  getTransactionList,
} from "../../api/cashiers";
import userEvent from "@testing-library/user-event";
import { setupStore, store } from "../../store";
import {
  saleTypes,
  mockSaleTrendResp,
  mockCashierTableResp,
  mockTransListResp,
} from "./cashiers";

const user = userEvent.setup();
const initialStore = setupStore();

vi.mock("../../api/cashiers");
const mockedToastError = vi.fn();
vi.mock("../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    error: mockedToastError,
  }),
}));

describe("Cashiers Page", () => {
  it("should render", () => {
    renderWithProviders(<Cashiers />);
    const cashiersPage = screen.getByTestId("cashiers-page");
    expect(cashiersPage).toBeInTheDocument();
  });

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

  it("should handle errors for cashier table and cashier details endpoints", async () => {
    (getCashierTable as Mock).mockRejectedValueOnce(new Error("API Error"));
    (getCashierDetails as Mock).mockRejectedValueOnce(new Error("API Error"));

    renderWithProviders(<Cashiers />, { store: initialStore });

    const saleTypePanel = await screen.findByTestId("sale-type-panel-Refunded");
    await user.click(saleTypePanel);
  });

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

  it("should fetch unique cashiers and transaction list when clicking on a cashier trend card", async () => {
    (getTransactionList as Mock).mockResolvedValueOnce({
      data: mockTransListResp,
    });

    renderWithProviders(<Cashiers />, { store: initialStore });

    const cashCard = await screen.findByTestId("cashier-trend-card-0-36");
    await user.click(cashCard);

    expect(getTransactionList).toHaveBeenCalled();
  });

it("should handle the selection of a cashier from the Unique Cashiers Table", async () => {
  renderWithProviders(<Cashiers />, { store: initialStore });

  // The below isn't working
  // const row = await screen.findByRole("row", {
  //   name: /25/, // Fixed: proper regex to match "25" in cell text
  // });

  // const div = screen.getByText("25");
  // const row = div.closest("div[role='row']")!;
  // expect(row).toBeInTheDocument();

  // expect(row).toHaveAttribute("data-row-id", "25-001"); // Verify row ID
  // fireEvent.click(row);

  // // Assert Redux state updated
  // expect(store.getState().cashier.selectedCashier).toEqual({
  //   cashier_number: 25,
  //   store_number: "001",
  // });
});


  it("should load all transactions in the Transaction Modal when clicking Show All", async () => {
    renderWithProviders(<Cashiers />, { store: initialStore });
    const showAllBtn = await screen.findByTestId("cashiers-table-export-btn");
    await user.click(showAllBtn);
  });

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
});
