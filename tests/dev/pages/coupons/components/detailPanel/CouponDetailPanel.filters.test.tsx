// Hooks
import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";

// Redux
import { Provider } from "react-redux";
import { setCoupons, setIsFetching } from "@/features/dev/devCouponSlice";

// Utils
import { setupStore } from "@/store";
import { render, screen, fireEvent, within } from "@testing-library/react";

// Interfaces
import type { CouponItem } from "@/interfaces";

// Components
import CouponDetailPanel from "@/pages/coupons/dev/components/detailPanel/CouponDetailPanel";

vi.mock("@/api/lossPrevention", () => ({ getCashierTransaction: vi.fn() }));
vi.mock("@/components/toasts/hooks/useToast", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
}));

const row = (over: Partial<CouponItem>): CouponItem => ({
  storeid: 1,
  sale_id: 1,
  sale_date: "2026-11-02T10:00:00",
  store_name: "Store One",
  store_number: "1",
  product_code: "1111111111",
  product_description: "APPLE JUICE COUPON",
  is_coupon: 1,
  coupon_amount: 1,
  vendor_coupon: 0,
  store_coupon: 1,
  coupon_type: "S",
  sale_type: "Sale",
  line_number: 1,
  cashier_number: 1,
  cashier_name: "Pat",
  employee_number: null,
  terminal: "1",
  qty: 1,
  total_sales: 0,
  sub_department: 1,
  sub_department_description: "DAIRY",
  category: 1,
  category_description: "FOOD",
  customer_id: "",
  customer_name: "",
  ...over,
});

const rows = [
  row({ sale_id: 1, product_code: "1111111111", product_description: "APPLE JUICE COUPON" }),
  row({ sale_id: 2, product_code: "2222222222", product_description: "BREAD COUPON" }),
  row({ sale_id: 3, product_code: "3333333333", product_description: "CEREAL COUPON" }),
];

const seededStore = () => {
  const store = setupStore();
  store.dispatch(setCoupons(rows));
  store.dispatch(setIsFetching(false));
  return store;
};

const renderPanel = (store: ReturnType<typeof setupStore>) =>
  render(
    <Provider store={store}>
      <CouponDetailPanel selectedKey="" sortMetric="amount" />
    </Provider>,
  );

// Opens a column's filter, types, and presses Apply, as a person would.
const applyFilter = (label: string, placeholder: string, text: string) => {
  fireEvent.click(screen.getByRole("button", { name: label }));
  fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: /apply/i }));
};

describe("Coupons detail grid: applied column filters", () => {
  it("keeps a UPC filter after the page is left and opened again", () => {
    const store = seededStore();
    const first = renderPanel(store);
    expect(screen.getByText("BREAD COUPON")).toBeTruthy();

    applyFilter("UPC", "Search UPC…", "2222");
    expect(screen.getByText("BREAD COUPON")).toBeTruthy();
    expect(screen.queryByText("APPLE JUICE COUPON")).toBeNull();
    expect(screen.queryByText("CEREAL COUPON")).toBeNull();

    first.unmount();
    renderPanel(store);

    expect(screen.getByText("BREAD COUPON")).toBeTruthy();
    expect(screen.queryByText("APPLE JUICE COUPON")).toBeNull();
    expect(screen.queryByText("CEREAL COUPON")).toBeNull();
    // The header shows the applied value as a chip.
    const header = screen.getByRole("columnheader", { name: /UPC/ });
    expect(within(header).getByText("2222")).toBeTruthy();
  });

  it("keeps a Product filter after the page is left and opened again", () => {
    const store = seededStore();
    const first = renderPanel(store);

    applyFilter("Product", "Search product…", "cereal");
    expect(screen.getByText("CEREAL COUPON")).toBeTruthy();
    expect(screen.queryByText("BREAD COUPON")).toBeNull();

    first.unmount();
    renderPanel(store);

    expect(screen.getByText("CEREAL COUPON")).toBeTruthy();
    expect(screen.queryByText("BREAD COUPON")).toBeNull();
    expect(screen.queryByText("APPLE JUICE COUPON")).toBeNull();
    const header = screen.getByRole("columnheader", { name: /Product/ });
    expect(within(header).getByText("cereal")).toBeTruthy();
  });

  it("starts the filter box's typed value from the applied value on return", () => {
    const store = seededStore();
    const first = renderPanel(store);
    applyFilter("UPC", "Search UPC…", "2222");

    first.unmount();
    renderPanel(store);

    fireEvent.click(screen.getByRole("button", { name: "UPC" }));
    const box = screen.getByPlaceholderText("Search UPC…") as HTMLInputElement;
    expect(box.value).toBe("2222");
  });

  it("clears the filters when a new search starts", () => {
    const store = seededStore();
    const first = renderPanel(store);
    applyFilter("UPC", "Search UPC…", "2222");
    expect(screen.queryByText("APPLE JUICE COUPON")).toBeNull();

    first.unmount();
    // A new search sets isFetching, then its results arrive.
    store.dispatch(setIsFetching(true));
    store.dispatch(setCoupons(rows));
    store.dispatch(setIsFetching(false));
    renderPanel(store);

    expect(screen.getByText("APPLE JUICE COUPON")).toBeTruthy();
    expect(screen.getByText("BREAD COUPON")).toBeTruthy();
    expect(screen.getByText("CEREAL COUPON")).toBeTruthy();
    const header = screen.getByRole("columnheader", { name: /UPC/ });
    expect(within(header).queryByText("2222")).toBeNull();
  });

  it("keeps the filter under StrictMode, which runs mount effects twice", () => {
    const store = seededStore();
    const strict = () =>
      render(
        <StrictMode>
          <Provider store={store}>
            <CouponDetailPanel selectedKey="" sortMetric="amount" />
          </Provider>
        </StrictMode>,
      );
    const first = strict();
    applyFilter("UPC", "Search UPC…", "2222");
    first.unmount();
    strict();
    expect(screen.getByText("BREAD COUPON")).toBeTruthy();
    expect(screen.queryByText("APPLE JUICE COUPON")).toBeNull();
  });

  it("still clears the filters when another section is picked", () => {
    const store = seededStore();
    renderPanel(store);
    applyFilter("UPC", "Search UPC…", "2222");
    expect(screen.queryByText("APPLE JUICE COUPON")).toBeNull();
    fireEvent.click(screen.getAllByText("DAIRY")[0]);
    expect(store.getState().dev.coupons.gridFilters.upc).toBe("");
  });
});
