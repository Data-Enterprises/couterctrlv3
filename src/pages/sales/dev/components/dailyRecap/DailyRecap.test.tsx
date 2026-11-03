import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { setupStore } from "../../../../../store";
import { setRawHourly, setRawSubs } from "../../../../../features/dev/devSalesLedgerSlice";
import type { DayDot, HourlySale, SubDeptMargin, SubSale } from "../../../../../interfaces";
import DailyRecap from "./DailyRecap";

const fetchRows = vi.fn();
vi.mock("../../../../../utils/marginRows", () => ({
  fetchSubDeptRowsOrEmpty: (...args: unknown[]) => fetchRows(...args),
}));

const dates = ["2026-10-29", "2026-10-30"];

const dot = (d: string, twNet: number, twQty: number): DayDot => ({
  sale_date: `${d}T00:00:00`,
  twNet,
  twQty,
  lwNet: null,
  lyNet: null,
  lwQty: null,
  lyQty: null,
});

const sub = (d: string, name: string, total: number, tax: number) =>
  ({
    sale_date: `${d}T00:00:00`,
    store_number: "942",
    sub_department: 1,
    sub_department_description: name,
    total_sales: total,
    total_tax: tax,
    qty: 3,
    weight: 0,
  }) as SubSale;

const hour = (d: string, h: number, net: number, transactions: number) =>
  ({
    sale_date: `${d}T00:00:00`,
    store_number: "942",
    hour: h,
    total_sales: net,
    total_tax: 0,
    transactions,
  }) as HourlySale;

const setup = (selectedDate: string | null = null) => {
  const store = setupStore();
  store.dispatch(setRawSubs([sub("2026-10-30", "Burgers", 1080, 80), sub("2026-10-29", "Burgers", 540, 40)]));
  store.dispatch(
    setRawHourly([
      hour("2026-10-30", 11, 300, 30),
      hour("2026-10-30", 12, 550, 50),
      hour("2026-10-30", 13, 200, 20),
      hour("2026-10-29", 12, 500, 50),
    ]),
  );
  render(
    <Provider store={store}>
      <DailyRecap
        storeId={942}
        storeNumber="942"
        dates={dates}
        days={[dot("2026-10-29", 500, 30), dot("2026-10-30", 1000, 60)]}
        selectedDate={selectedDate}
      />
    </Provider>,
  );
};

describe("Daily recap", () => {
  beforeEach(() => {
    fetchRows.mockReset();
    fetchRows.mockResolvedValue([
      { store_number: "942", sale_type: "Refund", price_type: "", total_sales: -6, total_tax: 0, qty: -2 } as SubDeptMargin,
    ]);
  });

  it("heads the week with what the panel does not already show", () => {
    setup();
    const band = screen.getByRole("region", { name: "This week" });
    expect(within(band).getByText("150")).toBeTruthy();
    expect(within(band).getByText("$10.00")).toBeTruthy();
    expect(within(band).getByText("Fri 10/30")).toBeTruthy();
    expect(within(band).queryByText(/Net sales/)).toBeNull();
  });

  it("lists every day and reads nothing until one is opened", () => {
    setup();
    expect(screen.getByRole("button", { name: /Thu 10\/29/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Fri 10\/30/ })).toBeTruthy();
    expect(fetchRows).not.toHaveBeenCalled();
  });

  it("opens a day to its shape, baskets, money and mix, not its items", async () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: /Fri 10\/30/ }));
    const money = screen.getByRole("region", { name: "Money" });
    expect(within(money).getByText("$1,080.00")).toBeTruthy();
    expect(within(money).getByText("$80.00")).toBeTruthy();
    expect(within(money).getByText("$1,000.00")).toBeTruthy();
    expect(within(money).queryByText(/Coupon/)).toBeNull();
    expect(screen.getByRole("img", { name: /busiest 12 PM – 1 PM/ })).toBeTruthy();
    const mix = screen.getByRole("region", { name: "Refunds and price mix" });
    await waitFor(() => expect(within(mix).getByText("Not reported.")).toBeTruthy());
    expect(within(mix).getByText("$6.00")).toBeTruthy();
    expect(fetchRows.mock.calls[0][3]).toBe("2026-10-30");
  });

  it("shows a picked day alone and open, with no week band", async () => {
    setup("2026-10-30");
    expect(screen.queryByRole("region", { name: "This week" })).toBeNull();
    expect(screen.queryByText("Thu")).toBeNull();
    expect(screen.getByRole("region", { name: "Baskets" })).toBeTruthy();
    await waitFor(() => expect(fetchRows).toHaveBeenCalledTimes(1));
  });

  it("grades nothing and compares to nothing", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: /Fri 10\/30/ }));
    expect(screen.queryByText(/Crit|Watch|vs LW|vs LY|Last week|Last year/)).toBeNull();
  });
});
