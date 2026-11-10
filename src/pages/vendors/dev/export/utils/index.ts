// Utils
import { fmtNum, rowsToCsv, type AggFn } from "../../../../../utils/csvExport";
import { calculateCogs } from "../../../../../utils/cogs";
import {
  buildItemRows,
  getItemSeverity,
  type ItemSeverity,
  type ItemGradingMetric,
} from "../../../../../utils/itemMargins";
import {
  LW_OFFSET,
  LY_OFFSET,
  isoOf,
  shiftIso,
  coverageOf,
  pctChange,
  tierOfDelta,
} from "../../../../../utils/grading";
import { getVendorTier, marginPct, type VendorMetric, type VendorRow } from "../../utils";

// Interfaces
import type { SubDeptMargin } from "../../../../../interfaces";
import type { GradedItem, GradedSev } from "../../interfaces";
import type { CustomSource, MetricSelection } from "../interfaces";

export const netSales = (m: SubDeptMargin) => m.total_sales - m.total_tax;
export const itemCogs = (m: SubDeptMargin) =>
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

/* ── preset builders ─────────────────────────────────────────────────────── */

/** Every vendor, graded, with both baselines. Uses the day-matched TW subtotals
 *  rather than the raw week total — comparing a full week against a partial one
 *  is the error those fields exist to prevent, and an export is exactly where it
 *  would go unnoticed. */
export const buildVendorsCsv = (
  rows: VendorRow[],
  metric: VendorMetric,
  threshold: number,
  days: Set<string>,
) => {
  const isMargin = metric === "margin";
  const headers = [
    "Vendor ID",
    "Vendor",
    "Grade",
    isMargin ? "TY Margin %" : "TY Net Sales",
    isMargin ? "LW Margin %" : "LW Net Sales",
    // Points, not percent — a 2-point margin move is not a 2% move, and
    // labelling it "%" in a spreadsheet is how that gets misread downstream.
    isMargin ? "vs LW pts" : "vs LW %",
    isMargin ? "LY Margin %" : "LY Net Sales",
    isMargin ? "vs LY pts" : "vs LY %",
  ];
  const wholeWeek = days.size === 0;
  const out: (string | number)[][] = [];

  type Pair = { net: number; cogs: number };
  const value = (p: Pair) => (isMargin ? marginPct(p.net, p.cogs) : p.net);
  const delta = (twP: Pair, base: Pair) =>
    isMargin
      ? marginPct(twP.net, twP.cogs) - marginPct(base.net, base.cogs)
      : pctChange(twP.net, base.net);

  for (const r of rows) {
    let tw: Pair, lw: Pair | null, ly: Pair | null;
    let twForLW: Pair, twForLY: Pair;

    if (wholeWeek) {
      tw = { net: r.twNet, cogs: r.twCogs };
      lw = r.hasLW ? { net: r.lwNet, cogs: r.lwCogs } : null;
      ly = r.hasLY ? { net: r.lyNet, cogs: r.lyCogs } : null;
      twForLW = { net: r.twNetForLW, cogs: r.twCogsForLW };
      twForLY = { net: r.twNetForLY, cogs: r.twCogsForLY };
    } else {
      const sel = r.days.filter((d) => days.has(d.date));
      if (sel.length === 0) continue;
      tw = sel.reduce(
        (a, d) => ({ net: a.net + d.twNet, cogs: a.cogs + d.twCogs }),
        { net: 0, cogs: 0 } as Pair,
      );
      // Still day-matched over a subset: a day only joins a comparison when
      // both sides have it, and it joins both sides or neither. COGS travels
      // with the net or the margin gets taken over a different set of days
      // than the cost it is measured against.
      const lwSum: Pair = { net: 0, cogs: 0 };
      const twLW: Pair = { net: 0, cogs: 0 };
      const lySum: Pair = { net: 0, cogs: 0 };
      const twLY: Pair = { net: 0, cogs: 0 };
      let lwSeen = false, lySeen = false;
      for (const d of sel) {
        if (d.lwNet !== null) {
          lwSum.net += d.lwNet; lwSum.cogs += d.lwCogs ?? 0;
          twLW.net += d.twNet; twLW.cogs += d.twCogs;
          lwSeen = true;
        }
        if (d.lyNet !== null) {
          lySum.net += d.lyNet; lySum.cogs += d.lyCogs ?? 0;
          twLY.net += d.twNet; twLY.cogs += d.twCogs;
          lySeen = true;
        }
      }
      lw = lwSeen ? lwSum : null;
      ly = lySeen ? lySum : null;
      twForLW = twLW;
      twForLY = twLY;
    }

    const lwPct = lw === null || lw.net === 0 ? null : delta(twForLW, lw);
    const lyPct = ly === null || ly.net === 0 ? null : delta(twForLY, ly);
    const grade = wholeWeek
      ? TIER_LABEL[getVendorTier(r, threshold, metric)]
      : TIER_LABEL[tierOfDelta(lyPct ?? lwPct, threshold)];

    out.push([
      r.vendorId,
      r.vendorName,
      grade ?? "",
      fmtNum(value(tw)),
      lw === null ? "" : fmtNum(value(lw)),
      lwPct === null ? "" : fmtNum(lwPct),
      ly === null ? "" : fmtNum(value(ly)),
      lyPct === null ? "" : fmtNum(lyPct),
    ]);
  }
  return rowsToCsv(headers, out);
};

export const buildItemsCsv = (rows: SubDeptMargin[]) => {
  const headers = [
    "Product Code",
    "Description",
    "Sub department",
    "Net Sales",
    "Qty",
    "COGS",
    "Margin %",
  ];
  const grouped = new Map<
    string,
    { desc: string; dept: string; sales: number; qty: number; cogs: number }
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
        dept: m.sub_department_description,
        sales: netSales(m),
        qty: m.qty,
        cogs: itemCogs(m),
      });
    }
  }
  const out = [...grouped.entries()].map(([code, v]) => [
    code,
    v.desc,
    v.dept,
    fmtNum(v.sales),
    v.qty,
    fmtNum(v.cogs),
    fmtNum(v.sales > 0 ? ((v.sales - v.cogs) / v.sales) * 100 : 0),
  ]);
  return rowsToCsv(headers, out);
};

/** Items graded against LW and LY, filtered to the chosen severities. Grading
 *  runs through the same shared `getItemSeverity` the Items tab uses, at the
 *  same threshold, so a "Critical" row in the file is a red dot on screen. */
export const buildItemsGradedCsv = (
  items: { tw: SubDeptMargin[]; lw: SubDeptMargin[]; ly: SubDeptMargin[] },
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

/**
 * The same graded item file, across every vendor rather than the open one.
 *
 * Costs nothing extra: the search already holds every vendor's TW/LW/LY rows,
 * so this is a regroup of data in hand rather than a fan-out. It's the only
 * dataset here that isn't scoped to the selected vendor, which is why the
 * vendor lands in a column instead of the filename.
 *
 * Vendors are walked in the left panel's order and their items graded exactly
 * as `buildItemsGradedCsv` does, so a row here matches the row that vendor's
 * own export would produce.
 */


export const buildAllVendorsCsv = (items: GradedItem[]) => {
  const headers = [
    "Vendor ID",
    "Vendor",
    "Product Code",
    "Description",
    "Sub department",
    "Grade",
    "TY Net Sales",
    "LW Net Sales",
    "vs LW %",
    "LY Net Sales",
    "vs LY %",
    "TY Qty",
    "TY Margin %",
    "LW Margin %",
    "LY Margin %",
  ];
  const out = items.map(({ vendorId, vendorName, dept, r, sev }) => [
    vendorId,
    vendorName,
    r.productCode,
    r.description,
    dept,
    SEV_LABEL[sev],
    fmtNum(r.netSales),
    r.lwNetSales === null ? "" : fmtNum(r.lwNetSales),
    r.lwSalesPct === null ? "" : fmtNum(r.lwSalesPct),
    r.lyNetSales === null ? "" : fmtNum(r.lyNetSales),
    r.lySalesPct === null ? "" : fmtNum(r.lySalesPct),
    r.qty,
    fmtNum(r.tyMarginPct),
    r.lwMarginPct === null ? "" : fmtNum(r.lwMarginPct),
    r.lyMarginPct === null ? "" : fmtNum(r.lyMarginPct),
  ]);
  return rowsToCsv(headers, out);
};

/** The same item set with everything but the UPC dropped — a list to feed
 *  another page, not a report to read. Deduped because an item carried by two
 *  vendors would otherwise be uploaded twice. */
export const buildUpcListCsv = (items: GradedItem[]) => {
  const seen = new Set<string>();
  const out: (string | number)[][] = [];
  for (const { r } of items) {
    if (seen.has(r.productCode)) continue;
    seen.add(r.productCode);
    out.push([r.productCode]);
  }
  return rowsToCsv(["UPC"], out);
};

/** TW rows to the chosen dates, LW/LY to the same dates shifted — the Items
 *  tab's narrowing, applied to whichever slice of the search it's handed. An
 *  empty set means the whole week and is returned untouched. */
export const narrowToDays = (
  src: { tw: SubDeptMargin[]; lw: SubDeptMargin[]; ly: SubDeptMargin[] },
  days: Set<string>,
) => {
  if (days.size === 0) return src;
  const lw = new Set([...days].map((d) => shiftIso(d, LW_OFFSET)));
  const ly = new Set([...days].map((d) => shiftIso(d, LY_OFFSET)));
  const on = (rows: SubDeptMargin[], keep: Set<string>) =>
    rows.filter((r) => keep.has(isoOf(r.sale_date)));
  return { tw: on(src.tw, days), lw: on(src.lw, lw), ly: on(src.ly, ly) };
};

/* ── custom mode ─────────────────────────────────────────────────────────── */

export const ITEM_DIMS = [
  { key: "sale_date", label: "Date" },
  { key: "product_code", label: "Product Code" },
  { key: "product_description", label: "Description" },
  { key: "sub_department_description", label: "Sub department" },
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

export const SEV_CHIP: { sev: GradedSev; label: string; activeClass: string }[] = [
  { sev: "critical", label: "Critical", activeClass: "bg-red-600 border-red-600 text-custom-white" },
  { sev: "watch", label: "Watch", activeClass: "bg-amber-500 border-amber-500 text-custom-white" },
  { sev: "healthy", label: "Healthy", activeClass: "bg-emerald-600 border-emerald-600 text-custom-white" },
];

export const SOURCE_LABEL: Record<CustomSource, string> = {
  tw: "This Week",
  lw: "Last Week",
  ly: "Last Year",
};
