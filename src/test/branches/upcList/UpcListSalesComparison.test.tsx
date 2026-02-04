import { describe, it } from "vitest";
import { renderWithProviders } from "../../utils";
import { setupStore } from "../../../store";
import { setSelectedSalesComps } from "../../../features/upcSlice";
import SalesComparison from "../../../pages/upc/modules/salesComp/SalesComparison";
import { compOne, compTwo } from ".";

const store = setupStore();
store.dispatch(setSelectedSalesComps(compOne));
store.dispatch(setSelectedSalesComps(compTwo));

describe("Upc List Comparison cards", () => {
  it("should handle the null week day values in the comparison card", async () => {
    renderWithProviders(<SalesComparison />, { store });
  });
});
