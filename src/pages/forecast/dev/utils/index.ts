// Utils
import { fitLinearDemand, predictQty, forecastUnits } from "../../../../utils/forecastCalc";

// Interfaces
import type { PriceHistoryResult } from "../../../../interfaces";
import type { ForecastOutlierRow } from "../../../../features/dev/devForecastDevSlice";
import type { SortCol } from "../interfaces";

export const formatRowData = (data: PriceHistoryResult[]) => {
  return data.map((item) => {
    const prices = item.price_history
      .map((p) => [parseFloat(p.price), p.qty])
      .sort((a, b) => b[1] - a[1]);

    const linear = fitLinearDemand(prices);
    const predictedQty = predictQty(prices[0][0], linear, prices);
    const price = prices[0][0];
    const daysAtPrice = item.price_history.find(
      (p) => parseFloat(p.price) === price
    )!.days_active;

    const units = forecastUnits(
      price, // 9.99
      item.qty, // overall units sold in period
      predictedQty, // 120 => from last 90 days
      item.days_active, // total selling days
      90, // on 90 day period
      daysAtPrice, // days at price => based on the price history => 3
      7, // forecastwindow
      prices // price history to get qty at price
      // adDays === undefined
    );

    // (reg retail - fcst prcie) * fcst qty = markdown dollars
    const markdownDollars = (item.regular_retail_price - price) * units;

    return {
      upc: item.upc,
      description: item.description,
      qtySold: prices[0][1],
      daysActive: item.days_active, // active total
      daysAtPrice: daysAtPrice, // active days at price
      calcNow: 0 as 0 | 1,
      adFcst: units,
      fcstPrice: price,
      fcstTotal: price * units,
      forecastWindow: 7,
      adDays: 0, // this show as "" for 0 until user input
      markdownDollars: markdownDollars,
    };
  });
};

export const formatSinglePriceRowData = (data: PriceHistoryResult[]) => {
  return data.map((item) => {
    const ph = item.price_history[0];
    const price = parseFloat(ph.price);
    const units = forecastUnits(
      price,
      ph.qty,
      ph.qty,
      item.days_active,
      90,
      ph.days_active,
      7,
      [[price, ph.qty]]
    );
    const markdownDollars = (item.regular_retail_price - price) * units;
    return {
      upc: item.upc,
      description: item.description,
      qtySold: ph.qty,
      daysActive: item.days_active,
      daysAtPrice: ph.days_active,
      calcNow: 0 as 0 | 1,
      adFcst: units,
      fcstPrice: price,
      fcstTotal: price * units,
      forecastWindow: 7,
      adDays: 0,
      markdownDollars,
      singlePrice: true as const,
    };
  });
};

/** The entry card's small outlined buttons. */
export const PILL =
  "px-3 py-1 text-[11px] font-medium rounded border border-content/20 text-content/95 hover:text-content hover:border-content/35 transition-colors";

/** The UPCs in pasted text: split on any separator, digits only. */
export const parseUpcs = (text: string): string[] =>
  text
    .split(/[\n,;\r\t ]+/)
    .map((u) => u.trim())
    .filter((u) => u.length > 0 && /^\d+$/.test(u));

/** Item | notes | qty | active | at price | forecast | ad days | price | fcst | total | share | markdown */
export const COLS = "1fr 109px 66px 58px 58px 62px 58px 64px 58px 80px 50px 80px";

/** The forecast grid's sticky header row. */
export const HEAD =
  "sticky top-0 z-10 bg-custom-white grid items-center gap-2.5 px-2 py-1.5 border-b border-brand_navy/15";

/** The value a grid row sorts by in a column. */
export const sortValue = (row: ForecastOutlierRow, col: SortCol) => row[col];

/** One list drives the header row so every cell — sortable or not — is built
 *  from the same class, in the same order as the row beneath it. */
export const HEAD_CELLS: { col?: SortCol; label: string }[] = [
  { label: "Item" },
  { label: "Notes" },
  { col: "qtySold", label: "Qty sold" },
  { label: "Active" },
  { label: "At price" },
  { label: "Forecast" },
  { label: "Ad days" },
  { col: "fcstPrice", label: "Price" },
  { col: "adFcst", label: "Ad fcst" },
  { col: "fcstTotal", label: "Total" },
  { label: "Share" },
  { col: "markdownDollars", label: "Markdown" },
];

/** The API takes 500 UPCs at a time; a longer list is split so the first page
 *  of results is on screen while the rest is still in flight. */
export const BATCH_SIZE = 500;
