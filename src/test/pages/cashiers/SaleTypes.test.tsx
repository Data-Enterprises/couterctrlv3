import { describe, it, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../utils";
import { setupStore } from "../../../store";
import userEvent from "@testing-library/user-event";
import Cashiers from "../../../pages/cashiers/Cashiers";
import { getSaleTypes } from "../../../api/cashiers";
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
});
