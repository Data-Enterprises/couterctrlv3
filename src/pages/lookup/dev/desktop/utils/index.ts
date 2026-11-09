// Utils
import {
  buildSaleTypeBreakdown,
  computeMargin,
  dayMarginPct,
  dayUnitCost,
} from "../../utils";

// Interfaces
import type {
  BatchColKey,
  BatchRow,
  ColDef,
  DailyColKey,
  Preset,
  SaleTypeColKey,
  SaleTypeRow,
} from "../interfaces";
import type { QueueItem } from "../../../../../features/dev/devItemLookupSlice";
import type { DayBucket } from "../../interfaces";

/** UPCs from pasted text, split on commas and line breaks, blanks dropped. */
export const parseUpcs = (raw: string): string[] =>
  raw
    .split(/[\n,]/)
    .map((u) => u.trim())
    .filter((u) => u.length > 0);

/** The Batch summary export's columns. */
export const BATCH_COLS: { key: BatchColKey; label: string; defaultOn: boolean }[] = [
  { key: "upc", label: "UPC", defaultOn: true },
  { key: "description", label: "Description", defaultOn: true },
  { key: "marginPct", label: "Margin %", defaultOn: true },
  { key: "avgSoldAt", label: "Avg sold at", defaultOn: false },
  { key: "listPrice", label: "List price", defaultOn: false },
  { key: "caseCost", label: "Cost / unit", defaultOn: false },
  { key: "totalQty", label: "Total units / lb", defaultOn: false },
  { key: "daysSold", label: "Days sold", defaultOn: false },
];

/** The Daily export's columns. */
export const DAILY_COLS: { key: DailyColKey; label: string; defaultOn: boolean }[] = [
  { key: "date", label: "Date", defaultOn: true },
  { key: "saleType", label: "Sale type", defaultOn: true },
  { key: "qty", label: "Qty", defaultOn: true },
  { key: "weight", label: "Weight (lb)", defaultOn: true },
  { key: "revenue", label: "Amount", defaultOn: true },
  { key: "cost", label: "Cost", defaultOn: false },
  { key: "caseCost", label: "Cost / unit", defaultOn: false },
  { key: "listPrice", label: "List price", defaultOn: false },
  { key: "marginPct", label: "Margin %", defaultOn: true },
];

/** The Sale types export's columns. */
export const SALE_TYPE_COLS: { key: SaleTypeColKey; label: string; defaultOn: boolean }[] = [
  { key: "upc", label: "UPC", defaultOn: true },
  { key: "description", label: "Description", defaultOn: true },
  { key: "saleType", label: "Sale type", defaultOn: true },
  { key: "days", label: "Days", defaultOn: true },
  { key: "revenue", label: "Amount", defaultOn: true },
  { key: "qty", label: "Qty", defaultOn: true },
  { key: "weight", label: "Weight (lb)", defaultOn: true },
  { key: "pctOfSales", label: "% of sales", defaultOn: true },
];

/** One row per loaded item per sale type, Sale first. Built from every line
 *  type, not the Sale-only history the batch summary uses. */
export const buildSaleTypeRows = (queue: QueueItem[]): SaleTypeRow[] =>
  queue
    .filter((q) => q.status === "loaded" && q.history)
    .flatMap((q) => {
      const { weighed } = computeMargin(q.history!, q.totalSales ?? 0, q.totalQty ?? 0);
      const types = buildSaleTypeBreakdown(q.historyAll ?? q.history!);
      const saleDollars = types.find((t) => t.saleType === "Sale")?.sales ?? 0;
      return types.map((t) => ({
        upc: q.upc,
        description: q.description ?? "",
        saleType: t.saleType,
        days: t.days,
        revenue: t.sales,
        qty: t.qty,
        weight: weighed ? t.units : null,
        pctOfSales:
          t.saleType === "Sale" || saleDollars <= 0 ? null : (t.sales / saleDollars) * 100,
      }));
    });

/** One sale-type row's value for one column. */
export const saleTypeCell = (row: SaleTypeRow, key: SaleTypeColKey): string | number => {
  switch (key) {
    case "upc":
      return row.upc;
    case "description":
      return row.description;
    case "saleType":
      return row.saleType;
    case "days":
      return row.days;
    case "revenue":
      return row.revenue.toFixed(2);
    case "qty":
      return row.qty;
    case "weight":
      return row.weight !== null ? row.weight.toFixed(2) : "";
    case "pctOfSales":
      return row.pctOfSales !== null ? row.pctOfSales.toFixed(2) : "";
  }
};

/** How many rows the export preview shows. */
export const PREVIEW_ROWS = 5;

/** The Batch summary's rows, one per loaded item. */
export const buildBatchRows = (queue: QueueItem[]): BatchRow[] =>
  queue
    .filter((q) => q.status === "loaded" && q.history)
    .map((q) => {
      const margin = computeMargin(
        q.history!,
        q.totalSales ?? 0,
        q.totalQty ?? 0,
      );
      return {
        upc: q.upc,
        description: q.description ?? "",
        marginPct: margin.marginPct,
        avgSoldAt: margin.avgSoldAt,
        listPrice: margin.listPrice,
        caseCost: margin.unitCost,
        // Priced units: pounds for a scale item, whose ring count is 0.
        totalQty: margin.weighed ? margin.totalUnits : (q.totalQty ?? 0),
        daysSold: q.daysSold ?? 0,
      };
    });

/** One batch row's value for one column. */
export const batchCell = (row: BatchRow, key: BatchColKey): string | number => {
  switch (key) {
    case "upc":
      return row.upc;
    case "description":
      return row.description;
    case "marginPct":
      return row.marginPct !== null ? row.marginPct.toFixed(2) : "";
    case "avgSoldAt":
      return row.avgSoldAt.toFixed(2);
    case "listPrice":
      return row.listPrice.toFixed(2);
    case "caseCost":
      return row.caseCost.toFixed(2);
    case "totalQty":
      return row.totalQty;
    case "daysSold":
      return row.daysSold;
  }
};

/** One day bucket's value for one column, for the chosen sale type. */
export const dailyCell = (
  b: DayBucket,
  key: DailyColKey,
  saleType: string,
  weighed: boolean,
): string | number => {
  if (key === "date") return b.label;
  if (key === "saleType") return saleType;
  if (!b.hasSale) return "";
  // An each-priced item has no weight; blank rather than a copy of qty.
  if (key === "weight") return weighed ? Number(b.units.toFixed(2)) : "";
  // Cost and margin don't apply to a voided or restored line.
  if (saleType !== "Sale" && (key === "cost" || key === "caseCost" || key === "marginPct")) {
    return "";
  }
  switch (key) {
    case "qty":
      return b.qty;
    case "revenue":
      return b.revenue.toFixed(2);
    case "cost":
      return b.hasCost ? b.cost.toFixed(2) : "";
    case "caseCost": {
      const c = dayUnitCost(b);
      return c !== null ? c.toFixed(2) : "";
    }
    case "listPrice":
      return b.listPrice.toFixed(2);
    case "marginPct": {
      const pct = dayMarginPct(b);
      return pct !== null ? pct.toFixed(2) : "";
    }
  }
};

/** Each export preset's columns. */
export const COLS: Record<Preset, ColDef[]> = {
  batch: BATCH_COLS,
  daily: DAILY_COLS,
  saleTypes: SALE_TYPE_COLS,
};

/** The keys of a preset's columns that start ticked. */
export const defaultsFor = (src: Preset) =>
  new Set(COLS[src].filter((c) => c.defaultOn).map((c) => c.key));

/** A date as a short label, e.g. Nov 9. */
export const fmtRangeDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
