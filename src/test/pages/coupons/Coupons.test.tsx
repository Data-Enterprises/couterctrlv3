import { describe, expect, it, vi, type Mock } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../utils";
import Coupons from "../../../pages/coupons/Coupons";
import { getCoupons } from "../../../api/coupons";
import { getCashierTransaction } from "../../../api/cashiers";
import { setupStore } from "../../../store";
import { setToken } from "../../../features/appSlice";
import {
  setLastGroup,
  setLastStore,
  setType,
} from "../../../features/searchSlice";
import { groups, userStores } from "../sales";
import { setGroups } from "../../../features/groupSlice";
import {
  setAssignedStores,
  setUnassignedStores,
} from "../../../features/userSlice";
import { getCouponsResp, getTransResp } from ".";

const store = setupStore();
const user = userEvent.setup();
vi.mock("../../../api/cashiers");
vi.mock("../../../api/coupons");
store.dispatch(setToken("fake-token"));
store.dispatch(setLastGroup(1));
store.dispatch(setLastStore(1));
store.dispatch(setType("Group"));
store.dispatch(setAssignedStores(userStores.assigned_stores));
store.dispatch(setUnassignedStores(userStores.unassigned_stores));
store.dispatch(setGroups(groups));

const mockedToastError = vi.fn();
const mockedToastWarn = vi.fn();
vi.mock("../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    error: mockedToastError,
    warn: mockedToastWarn,
  }),
}));

describe("Coupons Page", () => {
  // Main component files
  it("should throw api error when fetching Coupons", async () => {
    (getCoupons as Mock).mockRejectedValueOnce(new Error("API Error"));
    renderWithProviders(<Coupons />, { store });

    const searchBtn = await screen.findByTestId("date-picker-search-btn");
    await user.click(searchBtn);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith("API Error");
      store.dispatch(setType("Store"));
    });
  });

  it("should inform the user if no records are found when fetching Coupons", async () => {
    (getCoupons as Mock).mockResolvedValue({ data: { error: 0, records: [] } });
    renderWithProviders(<Coupons />, { store });

    const searchBtn = await screen.findByTestId("date-picker-search-btn");
    await user.click(searchBtn);

    await waitFor(() => {
      const state = store.getState().coupons;
      expect(state.coupons).toEqual([]);
    });
    expect(await screen.findByTestId("no-coupons")).toBeInTheDocument();
  });

  it("should handle api success when fetching Coupons", async () => {
    (getCoupons as Mock).mockResolvedValue(getCouponsResp);
    renderWithProviders(<Coupons />, { store });

    const searchBtn = await screen.findByTestId("date-picker-search-btn");
    await user.click(searchBtn);

    await waitFor(() => {
      const state = store.getState().coupons;
      expect(state.coupons).toEqual(getCouponsResp.data.records);
    });
  });

  it("should handle exporting the data", async () => {
    renderWithProviders(<Coupons />, { store });

    const exportBtn = await screen.findByTestId("coupons-export-btn");
    await user.click(exportBtn);

    expect(screen.getByTestId("modal")).toBeInTheDocument();
    const exportConfirmBtn = await screen.findByTestId("export-modal-export");
    await user.click(exportConfirmBtn);

    await waitFor(() => {
      expect(mockedToastWarn).toHaveBeenCalledWith(
        "Please enter a valid file name."
      );
    });

    const input = await screen.findByTestId("export-modal-filename-input");
    await user.type(input, "test-file");
    await user.click(exportConfirmBtn);
  });

  it("should handle resetting the coupons", async () => {
    renderWithProviders(<Coupons />, { store });

    const refreshBtn = await screen.findByTestId("coupons-refresh-btn");
    await user.click(refreshBtn);

    await waitFor(() => {
      const state = store.getState().coupons;
      expect(state.coupons).toEqual([]);
    });

    // Fetch the data again to test the other components
    (getCoupons as Mock).mockResolvedValue(getCouponsResp);
    const searchBtn = await screen.findByTestId("date-picker-search-btn");
    await user.click(searchBtn);
  });

  // Filters tests
  it("should handle setting the store number filter", async () => {
    renderWithProviders(<Coupons />, { store });
    const storeNumFilter = await screen.findByTestId(
      "coupons-table-filter-store"
    );
    await user.click(storeNumFilter);

    const submitBtn = await screen.findByTestId(
      "coupon-filter-modal-submit-btn"
    );
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockedToastWarn).toHaveBeenCalledWith(
        "Filter value cannot be empty"
      );
    });

    const input = await screen.findByTestId("text-filter-input");
    await user.type(input, "1");

    await user.click(submitBtn);

    await waitFor(() => {
      const state = store.getState().coupons;
      expect(state.gridCoupons.length).toBe(4);
    });
  });

  it("should handle setting the product code filter", async () => {
    renderWithProviders(<Coupons />, { store });
    const upcFilter = await screen.findByTestId("coupons-table-filter-upc");
    await user.click(upcFilter);

    const input = await screen.findByTestId("text-filter-input");
    await user.type(input, "1");

    const submitBtn = await screen.findByTestId(
      "coupon-filter-modal-submit-btn"
    );
    await user.click(submitBtn);

    await waitFor(() => {
      const state = store.getState().coupons;
      expect(state.gridCoupons.length).toBe(4);
    });
  });

  it("should handle setting the product description filter", async () => {
    renderWithProviders(<Coupons />, { store });
    const descFilter = await screen.findByTestId("coupons-table-filter-desc");
    await user.click(descFilter);

    const input = await screen.findByTestId("text-filter-input");
    await user.type(input, "Meat");

    const submitBtn = await screen.findByTestId(
      "coupon-filter-modal-submit-btn"
    );
    await user.click(submitBtn);

    await waitFor(() => {
      const state = store.getState().coupons;
      expect(state.gridCoupons.length).toBe(1);
    });
  });

  // Now we reset the filters and test the customer id and amount filters
  it("should handle setting the customer id filter", async () => {
    renderWithProviders(<Coupons />, { store });

    const refreshBtn = await screen.findByTestId(
      "coupons-table-filter-refresh"
    );
    await user.click(refreshBtn);

    const customerIdFilter = await screen.findByTestId(
      "coupons-table-filter-customerid"
    );
    await user.click(customerIdFilter);

    const input = await screen.findByTestId("text-filter-input");
    await user.type(input, "1234");

    const submitBtn = await screen.findByTestId(
      "coupon-filter-modal-submit-btn"
    );
    await user.click(submitBtn);

    await waitFor(() => {
      const state = store.getState().coupons;
      expect(state.gridCoupons.length).toBe(1);
    });

    await user.click(refreshBtn);
  });

  it("should handle setting the less than coupon amount filter", async () => {
    renderWithProviders(<Coupons />, { store });

    const cpnAmountFilter = await screen.findByTestId(
      "coupons-table-filter-cpnamount"
    );
    await user.click(cpnAmountFilter);

    const lessThanCheck = await screen.findByTestId("check-0");
    await user.click(lessThanCheck);

    const input = await screen.findByTestId("amount-filter-input");
    await user.type(input, "6.99");

    const submitBtn = await screen.findByTestId(
      "coupon-filter-modal-submit-btn"
    );
    await user.click(submitBtn);
  });

  it("should handle setting the greater than coupon amount filter", async () => {
    renderWithProviders(<Coupons />, { store });

    const cpnAmountFilter = await screen.findByTestId(
      "coupons-table-filter-cpnamount"
    );
    await user.click(cpnAmountFilter);

    const greaterThanCheck = await screen.findByTestId("check-1");
    await user.click(greaterThanCheck);

    const input = await screen.findByTestId("amount-filter-input");
    await user.type(input, "6.99");

    const submitBtn = await screen.findByTestId(
      "coupon-filter-modal-submit-btn"
    );
    await user.click(submitBtn);

    await waitFor(() => {
      const state = store.getState().coupons;
      console.log(state);
    });
  });

  it("should handle setting the equal to coupon amount filter", async () => {
    renderWithProviders(<Coupons />, { store });

    const cpnAmountFilter = await screen.findByTestId(
      "coupons-table-filter-cpnamount"
    );
    await user.click(cpnAmountFilter);

    const equalToCheck = await screen.findByTestId("check-2");
    await user.click(equalToCheck);

    const input = await screen.findByTestId("amount-filter-input");
    await user.type(input, "6.99");

    const submitBtn = await screen.findByTestId(
      "coupon-filter-modal-submit-btn"
    );
    await user.click(submitBtn);

    const refreshBtn = await screen.findByTestId(
      "coupons-table-filter-refresh"
    );
    await user.click(refreshBtn);
  });

  // Testing the row click event

  it("should throw error when clicking on error if api fails", async () => {
    (getCashierTransaction as Mock).mockRejectedValueOnce(
      new Error("API Error")
    );
    renderWithProviders(<Coupons />, { store });

    const rows = await screen.findAllByRole("row");
    await user.click(rows[1]);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(
        "Error fetching transactions: API Error"
      );
    });
  });

  it("should handle clicking on a row to open the transaction modal", async () => {
    (getCashierTransaction as Mock).mockResolvedValueOnce(getTransResp);
    renderWithProviders(<Coupons />, { store });

    const rows = await screen.findAllByRole("row");
    await user.click(rows[1]);

    await waitFor(() => {
      const state = store.getState().cashier;
      expect(state.transactionDrillDown.length).toBeGreaterThan(0);
    });
    expect(await screen.findByTestId("modal")).toBeInTheDocument();
  });
});
