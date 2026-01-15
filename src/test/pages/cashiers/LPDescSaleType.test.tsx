import { describe, it, expect, vi, type Mock } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../utils";
import Cashiers from "../../../pages/cashiers/Cashiers";
import {
  getSaleTypes,
  getCashierTable,
  getCashierDetails,
} from "../../../api/cashiers";
import userEvent from "@testing-library/user-event";
import { setupStore } from "../../../store";
import { saleTypes, mockSaleTrendResp, mockCashierTableResp } from ".";

const user = userEvent.setup();
const initialStore = setupStore();

vi.mock("../../../api/cashiers");
const mockedToastError = vi.fn();
const mockedToastWarn = vi.fn();
vi.mock("../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    error: mockedToastError,
    warn: mockedToastWarn,
  }),
}));

describe("LPDescSaleType", () => {
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

  it("should handle selecting the description sale type", async () => {
    (getCashierTable as Mock).mockResolvedValueOnce({
      data: mockCashierTableResp,
    });
    (getCashierDetails as Mock).mockResolvedValueOnce({
      data: mockSaleTrendResp,
    });

    renderWithProviders(<Cashiers />, { store: initialStore });

    const descPanel = await screen.findByTestId("sale-type-panel-Description");
    await user.click(descPanel);

    const descModal = await screen.findByTestId("modal");
    expect(descModal).toBeInTheDocument();

    await user.click(document.body); // Click outside to close the modal
    await user.click(descPanel);

    const input = screen.getByTestId("desc-input");
    await user.type(input, "banana");

    const submit = screen.getByTestId("desc-submit-btn");
    await user.click(submit);
  });

  it("should throw api error when fetching description details", async () => {
    (getCashierTable as Mock).mockResolvedValueOnce({
      data: mockCashierTableResp,
    });
    (getCashierDetails as Mock).mockRejectedValueOnce(new Error("API Error"));
    renderWithProviders(<Cashiers />, { store: initialStore });

    const descPanel = await screen.findByTestId("sale-type-panel-Description");
    await user.click(descPanel);

    const input = screen.getByTestId("desc-input");
    await user.type(input, "banana");

    const submit = screen.getByTestId("desc-submit-btn");
    await user.click(submit);
  });

  it("should throw api error when fetching description cashier table", async () => {
    (getCashierTable as Mock).mockRejectedValueOnce(new Error("API Error"));
    (getCashierDetails as Mock).mockResolvedValueOnce({
      data: mockSaleTrendResp,
    });

    renderWithProviders(<Cashiers />, { store: initialStore });

    const descPanel = await screen.findByTestId("sale-type-panel-Description");
    await user.click(descPanel);

    const input = screen.getByTestId("desc-input");
    await user.type(input, "banana");

    const submit = screen.getByTestId("desc-submit-btn");
    await user.click(submit);
  });

  it("should display No Transactions Found when description search yields no results", async () => {
    (getCashierTable as Mock).mockResolvedValueOnce({
      data: mockCashierTableResp,
    });
    (getCashierDetails as Mock).mockResolvedValueOnce({
      data: { error: 0, sales: [] },
    });

    renderWithProviders(<Cashiers />, { store: initialStore });

    const descPanel = await screen.findByTestId("sale-type-panel-Description");
    await user.click(descPanel);

    const input = screen.getByTestId("desc-input");
    await user.type(input, "banana");

    const submit = screen.getByTestId("desc-submit-btn");
    await user.click(submit);
    expect(
      await screen.findByTestId("no-transactions-msg")
    ).toBeInTheDocument();
  });

  it("should display No Transactions found when any other Sale Type search yields no results", async () => {
    (getCashierTable as Mock).mockResolvedValueOnce({
      data: mockCashierTableResp,
    });
    (getCashierDetails as Mock).mockResolvedValueOnce({
      data: { error: 0, sales: [] },
    });

    renderWithProviders(<Cashiers />, { store: initialStore });

    const refundedPanel = await screen.findByTestId("sale-type-panel-Refunded");
    await user.click(refundedPanel);

    expect(
      await screen.findByTestId("no-transactions-msg")
    ).toBeInTheDocument();
  });
});
