import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { setupStore } from "../../../../../store";
import { setRawHourly, setRawSubs } from "../../../../../features/dev/devSalesLedgerSlice";
import type { DayDot, HourlySale, SubSale } from "../../../../../interfaces";
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

const sub = (d: string, id: number, name: string, total: number) =>
  ({
    sale_date: `${d}T00:00:00`,
    store_number: "942",
    sub_department: id,
    sub_department_description: name,
    total_sales: total,
    total_tax: 0,
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
  store.dispatch(
    setRawSubs([
      sub("2026-10-30", 1, "Burgers", 700),
      sub("2026-10-30", 2, "Hot Dogs", 300),
      sub("2026-10-29", 1, "Burgers", 500),
    ]),
  );
  store.dispatch(setRawHourly([hour("2026-10-30", 18, 1000, 100), hour("2026-10-29", 12, 500, 50)]));
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
    fetchRows.mockResolvedValue([]);
  });

  it("lists every day and a week row that adds them up", () => {
    setup();
    expect(screen.getByRole("button", { name: /Thu 10\/29/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Fri 10\/30/ })).toBeTruthy();
    const week = screen.getByText("Week").parentElement as HTMLElement;
    expect(within(week).getByText("$1,500.00")).toBeTruthy();
    expect(within(week).getByText("150")).toBeTruthy();
    expect(within(week).getByText("$10.00")).toBeTruthy();
  });

  it("reads nothing until a day is opened, then that day only", async () => {
    setup();
    expect(fetchRows).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Fri 10\/30/ }));
    expect(screen.getByRole("button", { name: /Burgers/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Hot Dogs/ })).toBeTruthy();
    await waitFor(() => expect(fetchRows).toHaveBeenCalledTimes(1));
    expect(fetchRows.mock.calls[0][3]).toBe("2026-10-30");
  });

  it("shows a picked day alone, as a band, with its sub depts adding up", async () => {
    setup("2026-10-30");
    expect(screen.queryByRole("button", { name: /Thu 10\/29/ })).toBeNull();
    expect(screen.getByText("Items sold")).toBeTruthy();
    const total = screen.getByText("All sub depts").parentElement as HTMLElement;
    expect(within(total).getByText("$1,000.00")).toBeTruthy();
    await waitFor(() => expect(fetchRows).toHaveBeenCalledTimes(1));
  });

  it("grades nothing", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: /Fri 10\/30/ }));
    expect(screen.queryByText(/Crit|Watch|vs LW|vs LY|Last week|Last year/)).toBeNull();
  });
});
