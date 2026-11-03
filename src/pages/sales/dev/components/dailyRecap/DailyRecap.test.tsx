import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { setupStore } from "../../../../../store";
import {
  setLedgerSelectedDate,
  setRawHourly,
  setRawSubs,
} from "../../../../../features/dev/devSalesLedgerSlice";
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

/** Renders the tab against a store, re-rendering as the picked day changes,
 *  the way the popup passes `selectedDate` down from the slice. */
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
  store.dispatch(setLedgerSelectedDate(selectedDate));
  const view = () => (
    <Provider store={store}>
      <DailyRecap
        storeId={942}
        storeNumber="942"
        dates={dates}
        days={[dot("2026-10-29", 500, 30), dot("2026-10-30", 1000, 60)]}
        selectedDate={store.getState().dev.salesLedger.selectedDate}
      />
    </Provider>
  );
  const r = render(view());
  return { store, container: r.container, rerender: () => r.rerender(view()) };
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

  it("lists every day and points to the day cards to pick one", () => {
    setup();
    expect(screen.getByText("Thu")).toBeTruthy();
    expect(screen.getByText("Fri")).toBeTruthy();
    expect(screen.getByText(/Pick a day in the cards above/)).toBeTruthy();
  });

  it("leaves picking to the day cards: a row is not a control", () => {
    const { store } = setup();
    expect(screen.queryByRole("button")).toBeNull();
    fireEvent.click(screen.getByText("Fri"));
    expect(store.getState().dev.salesLedger.selectedDate).toBeNull();
  });

  it("reads every day's items so the Items column fills in", async () => {
    setup();
    await waitFor(() => expect(fetchRows).toHaveBeenCalledTimes(2));
    expect(fetchRows.mock.calls.map((c) => c[3]).sort()).toEqual(dates);
  });

  it("shows a picked day's full recap in place of the week", async () => {
    setup("2026-10-30");
    expect(screen.queryByRole("region", { name: "This week" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Thu 10\/29/ })).toBeNull();
    expect(screen.getByRole("heading", { name: "Friday 10/30" })).toBeTruthy();
    expect(screen.getByText(/All week in the cards above/)).toBeTruthy();

    const money = screen.getByRole("region", { name: "Money" });
    expect(within(money).getByText("$1,080.00")).toBeTruthy();
    expect(within(money).getByText("$80.00")).toBeTruthy();
    expect(within(money).queryByText(/Coupon/)).toBeNull();

    const baskets = screen.getByRole("region", { name: "Baskets" });
    expect(within(baskets).getByText("qty")).toBeTruthy();
    expect(within(baskets).getByText("items")).toBeTruthy();
    expect(within(baskets).queryByText("avg basket")).toBeNull();

    const averages = screen.getByRole("region", { name: "Averages" });
    expect(within(averages).getByText("avg basket")).toBeTruthy();
    expect(within(averages).getByText("$10.00")).toBeTruthy();

    expect(screen.getByRole("img", { name: /busiest 12 PM – 1 PM/ })).toBeTruthy();
    const mix = screen.getByRole("region", { name: "Refunds and price mix" });
    await waitFor(() => expect(within(mix).getByText("Not reported.")).toBeTruthy());
    expect(within(mix).getByText("$6.00")).toBeTruthy();
    expect(fetchRows.mock.calls[0][3]).toBe("2026-10-30");
  });

  it("shows an hour's figures in a tip that follows the mouse", () => {
    const { container } = setup("2026-10-30");
    const bar = container.querySelector('[data-hour="12"]') as HTMLElement;
    fireEvent.mouseMove(bar, { clientX: 100, clientY: 120 });
    const tip = screen.getByRole("tooltip");
    expect(within(tip).getByText("12 PM – 1 PM")).toBeTruthy();
    expect(within(tip).getByText("$550.00")).toBeTruthy();
    expect(within(tip).getByText("52.4%")).toBeTruthy();
    expect(within(tip).getByText("50")).toBeTruthy();
    fireEvent.mouseLeave(bar.parentElement as HTMLElement);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("goes back to the week when the day is cleared", () => {
    const { store, rerender } = setup("2026-10-30");
    store.dispatch(setLedgerSelectedDate(null));
    rerender();
    expect(screen.getByRole("region", { name: "This week" })).toBeTruthy();
  });

  it("grades nothing and compares to nothing", () => {
    setup("2026-10-30");
    expect(screen.queryByText(/Crit|Watch|vs LW|vs LY|Last week|Last year/)).toBeNull();
  });
});
