import { describe, expect, it, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../utils";
import { setupStore } from "../../../store";
import userEvent from "@testing-library/user-event";
import Cashiers from "../../../pages/lossPrevention/LossPrevention";
import {
  getCashierDetails,
  getCashierTable,
  getSaleTypes,
} from "../../../api/lossPrevention";
import { screen, waitFor } from "@testing-library/react";

const user = userEvent.setup();
const store = setupStore();
store.dispatch(setType("Group"));
vi.mock("../../../api/cashiers");
import { saleTypes } from ".";
import { setType } from "../../../features/searchSlice";

// just testing the if else paths in the useApiContext
describe("SaleTypes Component", () => {
  it("should handle value changes for the useApiContext", async () => {
    (getSaleTypes as Mock).mockResolvedValue({
      data: { error: 0, sale_types: saleTypes },
    });

    renderWithProviders(<Cashiers />, { store });
    const btn = screen.getByTestId("date-picker-search-btn");
    await user.click(btn);
    await user.click(btn);

    await waitFor(() => {
      store.dispatch(setType("Store"));
    });
  });

  it("should handle error !== 0 for getCashierTable", async () => {
    (getSaleTypes as Mock).mockResolvedValue({
      data: { error: 0, sale_types: saleTypes },
    });
    (getCashierTable as Mock).mockResolvedValue({
      data: { error: 1, cashier_table: [] },
    });
    (getCashierDetails as Mock).mockResolvedValue({
      data: { error: 1, cashier_details: {} },
    });

    renderWithProviders(<Cashiers />, { store });
    const btn = screen.getByTestId("date-picker-search-btn");
    await user.click(btn);
    const panel = await screen.findByTestId("sale-type-panel-Refunded");
    expect(panel).toBeInTheDocument();

    await user.click(panel);
  });
});
