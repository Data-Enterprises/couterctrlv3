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

const getExceptions = vi.fn();
vi.mock("../../../../../api/exceptionLines", () => ({
  getExceptionLines: (...args: unknown[]) => getExceptions(...args),
}));

const exceptionLine = (sale_type: string, sale_id: string, net_sales: number, qty = 1) => ({
  store_number: "942",
  sale_type,
  sale_date: "2026-10-30T00:00:00",
  sale_id,
  net_sales,
  qty,
});

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
    getExceptions.mockReset();
    getExceptions.mockResolvedValue({
      data: {
        error: 0,
        total_pages: 1,
        transactions: [
          exceptionLine("Voided", "a", 10),
          exceptionLine("Voided", "a", 5.5),
          exceptionLine("Voided", "b", -2),
          exceptionLine("No Sale", "c", 0),
        ],
      },
    });
    fetchRows.mockReset();
    // Thu sold a and b, Fri b and c: two items each day, three in the week.
    // b came from AWG on Thu and Pepsi on Fri.
    fetchRows.mockImplementation((...args: unknown[]) =>
      Promise.resolve(
        (args[3] === "2026-10-29"
          ? [["a", "Pepsi"], ["b", "AWG"]]
          : [["b", "Pepsi"], ["c", "AWG"]]
        ).map(
          ([product_code, vendor_name]) =>
            ({
              store_number: "942",
              product_code,
              product_description: `Item ${product_code}`,
              sub_department_description: "Drinks",
              vendor_name,
              sale_type: "Sale",
              price_type: "",
              total_sales: 5,
              total_tax: 0,
              qty: 1,
            }) as SubDeptMargin,
        ),
      ),
    );
  });

  it("shows the week in the same cards as a day, with the week's figures (board 16)", async () => {
    setup();
    const money = screen.getByRole("region", { name: "Money" });
    expect(within(money).getByText("$1,500.00")).toBeTruthy();
    expect(within(money).getByText("$1,620.00")).toBeTruthy();
    expect(within(money).getByText("$120.00")).toBeTruthy();

    const baskets = screen.getByRole("region", { name: "Baskets" });
    expect(within(baskets).getByText("150")).toBeTruthy();
    expect(within(baskets).getByText(/\$10\.00 avg basket/)).toBeTruthy();
    // Items is distinct across the week: a, b and c, not two days of two.
    await waitFor(() => expect(within(baskets).getByText("3")).toBeTruthy());

    // Each hour summed across the week; per hour over the 3 + 1 hours traded.
    const hours = screen.getByRole("region", { name: "Hourly" });
    expect(within(hours).getByText("$375.00")).toBeTruthy();
    expect(within(hours).getByText("37.5")).toBeTruthy();
    expect(within(hours).getByText("150 total")).toBeTruthy();
    expect(
      screen.getByRole("img", { name: /Net sales by hour across the week, busiest 12 PM – 1 PM/ }),
    ).toBeTruthy();

    const exceptions = screen.getByRole("region", { name: "Exceptions" });
    await waitFor(() => expect(within(exceptions).getByText("Voided")).toBeTruthy());
    expect(within(exceptions).getByText("transactions | $17.50")).toBeTruthy();
  });

  it("has no day table and no By day: hourly stays hourly", () => {
    setup();
    expect(screen.queryByRole("region", { name: "This week" })).toBeNull();
    expect(screen.queryByText("Thu")).toBeNull();
    expect(screen.queryByText(/By day|Busiest day/)).toBeNull();
    // Nothing on the tab picks a day: its one button opens the item view.
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["View items"]);
  });

  it("reads every day's items so the week's Items and price mix fill in", async () => {
    setup();
    await waitFor(() => expect(fetchRows).toHaveBeenCalledTimes(2));
    expect(fetchRows.mock.calls.map((c) => c[3]).sort()).toEqual(dates);
  });

  it("filters the same view to a picked day, as board 15 lays it out", async () => {
    setup("2026-10-30");
    // No heading line: the day card and Money already say it.
    expect(screen.queryByText(/All week in the cards above/)).toBeNull();

    const money = screen.getByRole("region", { name: "Money" });
    expect(within(money).getByText("$1,000.00")).toBeTruthy();
    expect(within(money).getByText("$1,080.00")).toBeTruthy();
    expect(within(money).getByText("$80.00")).toBeTruthy();
    expect(within(money).queryByText(/Coupon/)).toBeNull();
    await waitFor(() => expect(within(money).getByText("Price mix not reported")).toBeTruthy());

    const baskets = screen.getByRole("region", { name: "Baskets" });
    expect(within(baskets).getByText("100")).toBeTruthy();
    expect(within(baskets).getByText(/\$10\.00 avg basket/)).toBeTruthy();
    expect(within(baskets).getByText("2")).toBeTruthy();

    const hours = screen.getByRole("region", { name: "Hourly" });
    expect(within(hours).getByText("$333.33")).toBeTruthy();
    expect(within(hours).getByText("33.3")).toBeTruthy();
    expect(screen.getByRole("img", { name: /on Fri .*busiest 12 PM – 1 PM/ })).toBeTruthy();

    const exceptions = screen.getByRole("region", { name: "Exceptions" });
    await waitFor(() => expect(within(exceptions).getByText("Voided")).toBeTruthy());
    expect(within(exceptions).getByText("transactions | $17.50")).toBeTruthy();
    expect(within(exceptions).getByText("No sale")).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Averages" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Refunds and price mix" })).toBeNull();
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

  it("goes back to the week's figures when the day is cleared", () => {
    const { store, rerender } = setup("2026-10-30");
    const money = () => screen.getByRole("region", { name: "Money" });
    expect(within(money()).getByText("$1,000.00")).toBeTruthy();
    store.dispatch(setLedgerSelectedDate(null));
    rerender();
    expect(within(money()).getByText("$1,500.00")).toBeTruthy();
  });

  it("opens every item the week sold from View items, and goes back", async () => {
    setup();
    const baskets = screen.getByRole("region", { name: "Baskets" });
    await waitFor(() => expect(within(baskets).getByText("3")).toBeTruthy());
    fireEvent.click(within(baskets).getByRole("button", { name: "View items" }));

    const list = screen.getByRole("region", { name: "Items" });
    const rows = within(list).getAllByRole("row");
    // Net sales, biggest first: b sold on both days.
    expect(rows.map((r) => r.textContent?.slice(0, 1))).toEqual(["b", "a", "c"]);
    expect(within(rows[0]).getByText("$10.00")).toBeTruthy();
    expect(within(list).getByText("3 items")).toBeTruthy();
    expect(within(list).getByText("$20.00")).toBeTruthy();
    expect(within(list).getByText("1–3 of 3")).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Money" })).toBeNull();

    fireEvent.click(within(list).getByRole("button", { name: "Back to summary" }));
    expect(screen.getByRole("region", { name: "Money" })).toBeTruthy();
  });

  it("names the lead vendor, with +1 listing the others on hover", async () => {
    setup();
    await waitFor(() =>
      expect(within(screen.getByRole("region", { name: "Baskets" })).getByText("3")).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "View items" }));
    const [b] = within(screen.getByRole("region", { name: "Items" })).getAllByRole("row");
    fireEvent.mouseMove(within(b).getByText("+1"), { clientX: 10, clientY: 10 });
    const tip = screen.getByRole("tooltip");
    expect(within(tip).getByText("AWG")).toBeTruthy();
    expect(within(tip).getByText("Pepsi")).toBeTruthy();
  });

  it("says what View items will show, for the week or the day picked", () => {
    setup();
    fireEvent.mouseMove(screen.getByRole("button", { name: "View items" }), { clientX: 5, clientY: 5 });
    expect(screen.getByRole("tooltip").textContent).toBe("Shows all items sold this week");
  });

  it("follows a day card picked inside the item view, and goes back to that day", async () => {
    const { store, rerender } = setup();
    await waitFor(() =>
      expect(within(screen.getByRole("region", { name: "Baskets" })).getByText("3")).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "View items" }));
    store.dispatch(setLedgerSelectedDate("2026-10-30"));
    rerender();
    const list = screen.getByRole("region", { name: "Items" });
    expect(within(list).getAllByRole("row").map((r) => r.textContent?.slice(0, 1))).toEqual(["b", "c"]);
    expect(within(list).getByText("2 items")).toBeTruthy();

    fireEvent.click(within(list).getByRole("button", { name: "Back to summary" }));
    expect(within(screen.getByRole("region", { name: "Money" })).getByText("$1,000.00")).toBeTruthy();
    fireEvent.mouseMove(screen.getByRole("button", { name: "View items" }), { clientX: 5, clientY: 5 });
    expect(screen.getByRole("tooltip").textContent).toBe("Shows all items sold on Friday 10/30");
  });

  it("grades nothing and compares to nothing", () => {
    setup("2026-10-30");
    expect(screen.queryByText(/Crit|Watch|vs LW|vs LY|Last week|Last year/)).toBeNull();
  });
});
