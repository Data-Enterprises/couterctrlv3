import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { setupStore } from "../../../store";
import LookupItemReport from "./LookupItemReport";
import type { DayBucket, MarginResult, TrendResult } from "./lookupMetrics";
import type { ItemLookupHistory } from "../../../features/itemLookupSlice";

const bucket = (date: string, revenue: number, units: number): DayBucket => ({
  date,
  label: new Date(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8)),
  ).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  qty: 0,
  units,
  revenue,
  cost: 0,
  listPrice: 7.99,
  hasSale: units > 0,
  hasCost: false,
});

/** Picadeli Salad Bar: sells by weight, rings qty 0, no cost on file. */
const BUCKETS: DayBucket[] = [
  bucket("2026-09-11", 316.65, 39.63),
  bucket("2026-09-12", 274.08, 34.3),
  bucket("2026-09-13", 343.0, 42.93),
  bucket("2026-09-14", 399.03, 49.94),
  bucket("2026-09-15", 480.71, 60.16),
  bucket("2026-09-16", 0, 0),
];

const MARGIN: MarginResult = {
  totalCost: 0,
  marginPct: null,
  avgSoldAt: 7.99,
  totalUnits: 226.96,
  weighed: true,
  listPrice: 7.99,
  unitCost: 0,
  costMissing: true,
};

const TREND: TrendResult = {
  firstHalfUnits: 116.86,
  secondHalfUnits: 110.1,
  isSlowing: true,
};

const row = (
  sale_date: string,
  total_sales: number,
  weight: number,
  sale_type?: string,
) =>
  ({
    casecost: 0,
    category_description: "DELI",
    extended_cost: 0,
    price: 7.99,
    product_code: "70417",
    product_description: "Picadeli Salad Bar",
    qty: 0,
    sale_date,
    sale_type,
    store_name: "FG CAPE GIRARDEAU MO",
    store_number: "545",
    storeid: 545,
    total_sales,
    weight,
    net_cost: 0,
  }) as ItemLookupHistory;

const HISTORY: ItemLookupHistory[] = [
  row("2026-09-15T00:00:00", 480.71, 60.16),
  row("2026-09-14T00:00:00", 399.03, 49.94),
  row("2026-09-13T00:00:00", 31.96, 0, "Cancelled"),
];

const renderReport = () =>
  render(
    <Provider store={setupStore()}>
      <LookupItemReport
        description="Picadeli Salad Bar"
        productCode="70417"
        categoryDescription="DELI"
        storeName="545 - FG CAPE GIRARDEAU MO"
        storeNumbers={[]}
        selectedStoreNumber={null}
        onStoreNumberChange={() => {}}
        onBack={() => {}}
        onSelectRecent={() => {}}
        margin={MARGIN}
        historyAll={HISTORY}
        buckets={BUCKETS}
        trend={TREND}
      />
    </Provider>,
  );

describe("LookupItemReport", () => {
  it("opens on the whole window", () => {
    renderReport();
    // 316.65 + 274.08 + 343.00 + 399.03 + 480.71
    const headline = screen.getByTestId("lookup-headline");
    expect(within(headline).getByText("$1,813.47")).toBeInTheDocument();
    expect(screen.getByText("Sold · 5 of 6 days")).toBeInTheDocument();
  });

  it("says a missing cost once, not once per row", () => {
    renderReport();
    expect(screen.getAllByText(/No cost on file/i)).toHaveLength(1);
    // The table this replaces printed "No cost" in a column on every row.
    expect(screen.queryAllByText(/^No cost$/)).toHaveLength(0);
  });

  it("carries the page's own header rows inside the header card", () => {
    renderReport();
    const headline = screen.getByTestId("lookup-header");
    // The item is the title; the store, window, code and category are the
    // small print that qualifies it — all in one block, so these are
    // substring matches rather than whole nodes.
    expect(within(headline).getByText("Picadeli Salad Bar")).toBeInTheDocument();
    expect(
      within(headline).getByText(/545 - FG CAPE GIRARDEAU MO/),
    ).toBeInTheDocument();
    expect(within(headline).getByText(/70417/)).toBeInTheDocument();
    expect(within(headline).getByText(/DELI/)).toBeInTheDocument();
    expect(
      within(headline).getByRole("button", { name: "What this page shows" }),
    ).toBeInTheDocument();
    expect(
      within(headline).getByRole("button", { name: "New search" }),
    ).toBeInTheDocument();
  });

  it("shows pounds and never a quantity of zero", () => {
    renderReport();
    expect(screen.getByText("226.96 lb")).toBeInTheDocument();
    expect(screen.queryByText("Qty")).not.toBeInTheDocument();
  });

  it("puts the sale-type lens above the figures it drives", () => {
    renderReport();
    // The lens is chosen first, so it lives in the header card rather than in
    // one of its own below the numbers it changes.
    const header = screen.getByTestId("lookup-header");
    expect(within(header).getByTestId("lookup-sale-types")).toBeInTheDocument();
    expect(within(header).getByText("By sale type")).toBeInTheDocument();
    expect(within(header).getByText("Cancelled")).toBeInTheDocument();
  });

  it("keeps the other cards on screen when a day is scoped", async () => {
    const user = userEvent.setup();
    renderReport();

    await user.click(screen.getByRole("button", { name: "Sep 15" }));

    // The headline narrows to that day. Scoped to the card, because the day
    // list below still shows the same figure — which is the whole point.
    const headline = screen.getByTestId("lookup-headline");
    expect(within(headline).getByText("$480.71")).toBeInTheDocument();
    expect(within(headline).getByText("Tue, Sep 15")).toBeInTheDocument();
    expect(
      screen.getByText(/Tap the selected day again for the whole window/i),
    ).toBeInTheDocument();

    // ...and the two cards below it stay exactly where they were.
    expect(screen.getByText("By sale type")).toBeInTheDocument();
    expect(screen.getByText("Day by day")).toBeInTheDocument();
  });

  it("returns to the whole window when the same day is tapped again", async () => {
    const user = userEvent.setup();
    renderReport();
    const bar = screen.getByRole("button", { name: "Sep 15" });

    await user.click(bar);
    expect(screen.queryByText("Sold · 5 of 6 days")).not.toBeInTheDocument();

    await user.click(bar);
    expect(screen.getByText("Sold · 5 of 6 days")).toBeInTheDocument();
    expect(
      within(screen.getByTestId("lookup-headline")).getByText("$1,813.47"),
    ).toBeInTheDocument();
  });

  it("does not offer a day that never sold", () => {
    renderReport();
    expect(screen.getByRole("button", { name: /Sep 16, no sales/ })).toBeDisabled();
  });

  it("gives Sale no percentage of itself", () => {
    renderReport();
    const saleTypes = screen.getByText("By sale type").closest("section")!;
    expect(within(saleTypes).getByText(/% of sales/)).toHaveTextContent(
      /of sales/,
    );
    // One row carries it — Cancelled — not both.
    expect(within(saleTypes).getAllByText(/% of sales/)).toHaveLength(1);
  });
});
