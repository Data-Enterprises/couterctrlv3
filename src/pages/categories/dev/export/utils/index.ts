// Utils
import { coverageOf } from "../../../../../utils/grading";
import { fmtNum, rowsToCsv, type AggFn } from "../../../../../utils/csvExport";
import { calculateCogs } from "../../../../../utils/cogs";
import {
  buildItemRows,
  getItemSeverity,
  type ItemSeverity,
  type ItemGradingMetric,
} from "../../../../../utils/itemMargins";
import {
  getTier,
  tierOfDelta,
  pctChange,
  shiftIso,
  LW_OFFSET,
  LY_OFFSET,
  type CategoryMetric,
  type CategoryRow,
} from "../../utils";

// Interfaces
import type { CatItem, CatSalesHourly } from "../../../../../interfaces";
import type { CustomSource, GradedSev, MetricSelection } from "../interfaces";

export const netSales = (m: CatItem) => m.total_sales - m.total_tax;
export const itemCogs = (m: CatItem) =>
  calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight);

export const SEV_LABEL: Record<ItemSeverity, string> = {
  critical: "Critical",
  watch: "Watch",
  healthy: "Healthy",
  ungraded: "Ungraded",
};

export const TIER_LABEL: Record<string, string> = {
  critical: "Critical",
  watch: "Watch",
  healthy: "Healthy",
  ungraded: "Ungraded",
};

/* ── Preset builders ──────────────────────────────────────────────────────── */

/** Every category, graded, with both baselines. Uses the day-matched TW
 *  subtotals (`twNetForLW` / `twNetForLY`) rather than the raw week total —
 *  comparing a full week against a partial one is the bug those fields exist to
 *  prevent, and an export is exactly where it would go unnoticed. */
export const buildCategoriesCsv = (
  rows: CategoryRow[],
  metric: CategoryMetric,
  threshold: number,
  days: Set<string>,
) => {
  const isQty = metric === "qty";
  const headers = [
    "Category",
    "Description",
    "Grade",
    isQty ? "TY Qty" : "TY Net Sales",
    isQty ? "LW Qty" : "LW Net Sales",
    "vs LW %",
    isQty ? "LY Qty" : "LY Net Sales",
    "vs LY %",
  ];
  const wholeWeek = days.size === 0;
  const out: (string | number)[][] = [];

  for (const r of rows) {
    let tw: number, lw: number | null, ly: number | null;
    let twForLW: number, twForLY: number;

    if (wholeWeek) {
      tw = isQty ? r.twQty : r.twNet;
      lw = r.hasLW ? (isQty ? r.lwQty : r.lwNet) : null;
      ly = r.hasLY ? (isQty ? r.lyQty : r.lyNet) : null;
      twForLW = isQty ? r.twQtyForLW : r.twNetForLW;
      twForLY = isQty ? r.twQtyForLY : r.twNetForLY;
    } else {
      // A category with nothing on the chosen days is left out rather than
      // written as a row of zeroes — the screen doesn't show it either.
      const sel = r.days.filter((d) => days.has(d.date));
      if (sel.length === 0) continue;

      tw = sel.reduce((s, d) => s + (isQty ? d.twQty : d.twNet), 0);

      // Still day-matched, just over a subset: a day only contributes to a
      // comparison when both sides have it, and it contributes to *both*
      // sides or neither. Summing all seven TY days against three LY ones is
      // exactly the bug the whole-week subtotals exist to prevent.
      let lwSum = 0, twLW = 0, lwSeen = false;
      let lySum = 0, twLY = 0, lySeen = false;
      for (const d of sel) {
        const t = isQty ? d.twQty : d.twNet;
        const l = isQty ? d.lwQty : d.lwNet;
        const y = isQty ? d.lyQty : d.lyNet;
        if (l !== null) { lwSum += l; twLW += t; lwSeen = true; }
        if (y !== null) { lySum += y; twLY += t; lySeen = true; }
      }
      lw = lwSeen ? lwSum : null;
      ly = lySeen ? lySum : null;
      twForLW = twLW;
      twForLY = twLY;
    }

    const lwPct = lw === null || lw === 0 ? null : pctChange(twForLW, lw);
    const lyPct = ly === null || ly === 0 ? null : pctChange(twForLY, ly);
    // The whole week grades off the row; a subset grades off its own primary
    // delta, through the same boundaries.
    const grade = wholeWeek
      ? TIER_LABEL[getTier(r, threshold, metric)]
      : TIER_LABEL[tierOfDelta(lyPct ?? lwPct, threshold)];

    out.push([
      r.category,
      r.description ?? "Uncategorized",
      grade ?? "",
      fmtNum(tw),
      lw === null ? "" : fmtNum(lw),
      lwPct === null ? "" : fmtNum(lwPct),
      ly === null ? "" : fmtNum(ly),
      lyPct === null ? "" : fmtNum(lyPct),
    ]);
  }
  return rowsToCsv(headers, out);
};

/** Items in the open category, this week, aggregated per UPC. */
export const buildItemsCsv = (rows: CatItem[]) => {
  const headers = [
    "Product Code",
    "Description",
    "Vendor",
    "Net Sales",
    "Qty",
    "COGS",
    "Margin %",
  ];
  const grouped = new Map<
    string,
    { desc: string; vendor: string; sales: number; qty: number; cogs: number }
  >();
  for (const m of rows) {
    const e = grouped.get(m.product_code);
    if (e) {
      e.sales += netSales(m);
      e.qty += m.qty;
      e.cogs += itemCogs(m);
    } else {
      grouped.set(m.product_code, {
        desc: m.product_description,
        vendor: m.vendor_name,
        sales: netSales(m),
        qty: m.qty,
        cogs: itemCogs(m),
      });
    }
  }
  const out = Array.from(grouped.entries()).map(([code, v]) => [
    code,
    v.desc,
    v.vendor,
    fmtNum(v.sales),
    v.qty,
    fmtNum(v.cogs),
    fmtNum(v.sales > 0 ? ((v.sales - v.cogs) / v.sales) * 100 : 0),
  ]);
  return rowsToCsv(headers, out);
};

/** Items graded against LW and LY, filtered to the chosen severities.
 *  Grading runs through the same shared `getItemSeverity` the Items tab uses,
 *  at the same threshold, so a "Critical" row in the file is a red dot on the
 *  screen and not an approximation of one. */
export const buildItemsGradedCsv = (
  items: { tw: CatItem[]; lw: CatItem[]; ly: CatItem[] },
  threshold: number,
  gradingMetric: ItemGradingMetric,
  sevs: Set<GradedSev>,
) => {
  const headers = [
    "Product Code",
    "Description",
    "Grade",
    "TY Net Sales",
    "LW Net Sales",
    "vs LW %",
    "LY Net Sales",
    "vs LY %",
    "TY Qty",
    "LW Qty",
    "LY Qty",
    "TY Margin %",
    "LW Margin %",
    "LY Margin %",
    "Contribution %",
  ];
  // Matched and graded exactly as the item table on screen: coverage of the
  // exported days, taken on the store's dates, and each comparison over only
  // the days that matched.
  const dayOf = (r: { sale_date: string }) => r.sale_date.split("T")[0];
  const twDays = new Set(items.tw.map(dayOf));
  const built = buildItemRows(items.tw, items.lw, items.ly, {
    lwOf: (d) => shiftIso(d, LW_OFFSET),
    lyOf: (d) => shiftIso(d, LY_OFFSET),
    coverage: coverageOf(
      twDays,
      {
        tw: twDays,
        lw: new Set(items.lw.map(dayOf)),
        ly: new Set(items.ly.map(dayOf)),
      },
      (d) => shiftIso(d, LW_OFFSET),
      (d) => shiftIso(d, LY_OFFSET),
    ),
  });
  const out: (string | number)[][] = [];
  for (const r of built) {
    const sev = getItemSeverity(r, threshold, gradingMetric);
    if (sev === "ungraded" || !sevs.has(sev)) continue;
    out.push([
      r.productCode,
      r.description,
      SEV_LABEL[sev],
      fmtNum(r.netSales),
      r.lwNetSales === null ? "" : fmtNum(r.lwNetSales),
      r.lwSalesPct === null ? "" : fmtNum(r.lwSalesPct),
      r.lyNetSales === null ? "" : fmtNum(r.lyNetSales),
      r.lySalesPct === null ? "" : fmtNum(r.lySalesPct),
      r.qty,
      r.lwQty === null ? "" : r.lwQty,
      r.lyQty === null ? "" : r.lyQty,
      fmtNum(r.tyMarginPct),
      r.lwMarginPct === null ? "" : fmtNum(r.lwMarginPct),
      r.lyMarginPct === null ? "" : fmtNum(r.lyMarginPct),
      fmtNum(r.tyContributionPct),
    ]);
  }
  return rowsToCsv(headers, out);
};

/** Hours for the open category, folded across the week and compared to the
 *  same hour last week and last year — an hour in isolation says nothing. */
export const buildHoursCsv = (
  hourly: { tw: CatSalesHourly[]; lw: CatSalesHourly[]; ly: CatSalesHourly[] },
  metric: CategoryMetric,
) => {
  const isQty = metric === "qty";
  const headers = [
    "Hour",
    isQty ? "TY Qty" : "TY Net Sales",
    isQty ? "LW Qty" : "LW Net Sales",
    "vs LW %",
    isQty ? "LY Qty" : "LY Net Sales",
    "vs LY %",
    "Gross Sales",
    "Tax",
  ];
  const fold = (list: CatSalesHourly[]) => {
    const m = new Map<number, { v: number; gross: number; tax: number }>();
    for (const h of list) {
      const cur = m.get(h.hour) ?? { v: 0, gross: 0, tax: 0 };
      cur.v += isQty ? h.qty : h.net_sales;
      cur.gross += h.total_sales;
      cur.tax += h.total_tax;
      m.set(h.hour, cur);
    }
    return m;
  };
  const tw = fold(hourly.tw);
  const lw = fold(hourly.lw);
  const ly = fold(hourly.ly);

  const out = [...new Set([...tw.keys(), ...lw.keys(), ...ly.keys()])]
    .sort((a, b) => a - b)
    .map((hour) => {
      const t = tw.get(hour);
      const l = lw.get(hour);
      const y = ly.get(hour);
      const lwPct = !l || l.v === 0 ? null : pctChange(t?.v ?? 0, l.v);
      const lyPct = !y || y.v === 0 ? null : pctChange(t?.v ?? 0, y.v);
      return [
        `${String(hour).padStart(2, "0")}:00`,
        fmtNum(t?.v ?? 0),
        l ? fmtNum(l.v) : "",
        lwPct === null ? "" : fmtNum(lwPct),
        y ? fmtNum(y.v) : "",
        lyPct === null ? "" : fmtNum(lyPct),
        fmtNum(t?.gross ?? 0),
        fmtNum(t?.tax ?? 0),
      ];
    });
  return rowsToCsv(headers, out);
};

/* ── Custom-mode config ───────────────────────────────────────────────────── */

export const ITEM_DIMS = [
  { key: "sale_date", label: "Date" },
  { key: "product_code", label: "Product Code" },
  { key: "product_description", label: "Description" },
  { key: "vendor_name", label: "Vendor" },
  { key: "price_type", label: "Price Type" },
];

export const ITEM_METRICS = [
  { key: "net_sales_calc", label: "Net Sales" },
  { key: "qty", label: "Qty" },
  { key: "cogs_calc", label: "COGS" },
  { key: "total_tax", label: "Total Tax" },
];

export const AGG_OPTIONS: { value: AggFn; label: string }[] = [
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Avg" },
  { value: "min", label: "Min" },
  { value: "max", label: "Max" },
  { value: "count", label: "Count" },
];

export const freshMetrics = () =>
  new Map<string, MetricSelection>(
    ITEM_METRICS.map((m) => [m.key, { fn: "sum" as AggFn, enabled: false }]),
  );

export const PREVIEW_ROWS = 5;

export const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

/** The graded-items filter chips, coloured when picked. */
export const SEV_CHIP: { sev: GradedSev; label: string; activeClass: string }[] = [
  {
    sev: "critical",
    label: "Critical",
    activeClass: "bg-red-600 border-red-600 text-custom-white",
  },
  {
    sev: "watch",
    label: "Watch",
    activeClass: "bg-amber-500 border-amber-500 text-custom-white",
  },
  {
    sev: "healthy",
    label: "Healthy",
    activeClass: "bg-emerald-600 border-emerald-600 text-custom-white",
  },
];

export const SOURCE_LABEL: Record<CustomSource, string> = {
  tw: "This Week",
  lw: "Last Week",
  ly: "Last Year",
};
