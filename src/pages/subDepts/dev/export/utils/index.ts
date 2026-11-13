// Utils
import { calculateCogs, hasNoUsableCost } from "../../../../../utils/cogs";
import { fmtNum, rowsToCsv, type AggFn } from "../../../../../utils/csvExport";
import { gradedDelta, type ItemGradingMetric } from "../../../../../utils/itemMargins";

// Interfaces
import type { SubDeptMargin } from "../../../../../interfaces";
import type { GradedItem, ItemSev } from "../../utils/gradedItems";
import type { DimDef, MetricDef } from "../interfaces";

export const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

export const netSales = (m: SubDeptMargin) => m.total_sales - m.total_tax;
export const itemCogs = (m: SubDeptMargin) => calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight);

// ─── Preset CSV builders ──────────────────────────────────────────────────────

export const buildItemsCsv = (margins: SubDeptMargin[]) => {
  const headers = ["Product Code", "Description", "Net Sales", "Qty", "COGS", "Margin %"];
  const grouped = new Map<string, { desc: string; sales: number; qty: number; cogs: number }>();
  for (const m of margins) {
    const existing = grouped.get(m.product_code);
    if (existing) {
      existing.sales += netSales(m);
      existing.qty += m.qty;
      existing.cogs += itemCogs(m);
    } else {
      grouped.set(m.product_code, {
        desc: m.product_description,
        sales: netSales(m),
        qty: m.qty,
        cogs: itemCogs(m),
      });
    }
  }
  const rows = Array.from(grouped.entries()).map(([code, v]) => {
    const marginPct = v.sales > 0 ? ((v.sales - v.cogs) / v.sales) * 100 : 0;
    return [code, v.desc, fmtNum(v.sales), v.qty, fmtNum(v.cogs), fmtNum(marginPct)];
  });
  return rowsToCsv(headers, rows);
};

export const SEV_LABEL: Record<ItemSev, string> = { critical: "Critical", watch: "Watch", healthy: "Healthy" };

export const getMarginPtsSeverity = (pts: number, threshold: number): ItemSev => {
  if (pts < -threshold) return "critical";
  if (pts < 0) return "watch";
  return "healthy";
};

export const buildItemsVsLyCsv = (ty: SubDeptMargin[], ly: SubDeptMargin[], threshold: number, sevs: Set<ItemSev>) => {
  const headers = ["Product Code", "Description", "Severity", "TY Net Sales", "LY Net Sales", "TY Margin %", "LY Margin %", "Margin Pts Δ"];
  const agg = (src: SubDeptMargin[]) => {
    const map = new Map<string, { desc: string; sales: number; cogs: number }>();
    for (const m of src) {
      const e = map.get(m.product_code);
      if (e) { e.sales += netSales(m); e.cogs += itemCogs(m); }
      else map.set(m.product_code, { desc: m.product_description, sales: netSales(m), cogs: itemCogs(m) });
    }
    return map;
  };
  const tyMap = agg(ty);
  const lyMap = agg(ly);
  const allCodes = new Set([...tyMap.keys(), ...lyMap.keys()]);
  const rows: (string | number)[][] = [];
  allCodes.forEach((code) => {
    const t = tyMap.get(code);
    const l = lyMap.get(code);
    const tySales = t?.sales ?? 0;
    const tyCogs = t?.cogs ?? 0;
    const lySales = l?.sales ?? 0;
    const lyCogs = l?.cogs ?? 0;
    const tyMpct = tySales > 0 ? ((tySales - tyCogs) / tySales) * 100 : 0;
    const lyMpct = lySales > 0 ? ((lySales - lyCogs) / lySales) * 100 : 0;
    const pts = tyMpct - lyMpct;
    const sev = getMarginPtsSeverity(pts, threshold);
    if (!sevs.has(sev)) return;
    rows.push([code, t?.desc ?? l?.desc ?? "", SEV_LABEL[sev], fmtNum(tySales), fmtNum(lySales), fmtNum(tyMpct), fmtNum(lyMpct), fmtNum(pts)]);
  });
  return rowsToCsv(headers, rows);
};

export const buildCostCsv = (margins: SubDeptMargin[]) => {
  const headers = ["Product Code", "Description", "Cost", "Net Cost", "Case Size", "Calculated Cost", "Total COGS", "Qty"];
  const grouped = new Map<string, { desc: string; cost: number; netCost: number; caseSize: number; calcCost: number; totalCogs: number; qty: number }>();
  for (const m of margins) {
    const e = grouped.get(m.product_code);
    if (e) {
      e.qty += m.qty;
      e.totalCogs += itemCogs(m);
    } else {
      grouped.set(m.product_code, {
        desc: m.product_description,
        cost: m.cost,
        netCost: m.net_cost,
        caseSize: m.case_size,
        calcCost: m.calculated_cost,
        totalCogs: itemCogs(m),
        qty: m.qty,
      });
    }
  }
  const rows = Array.from(grouped.entries()).map(([code, v]) =>
    [code, v.desc, fmtNum(v.cost, 4), fmtNum(v.netCost, 4), v.caseSize, fmtNum(v.calcCost, 4), fmtNum(v.totalCogs), v.qty]
  );
  return rowsToCsv(headers, rows);
};

export const buildNoCostCsv = (margins: SubDeptMargin[]) => {
  const headers = ["Product Code", "Description", "Qty", "Cost", "Net Cost", "Case Size"];
  const seen = new Set<string>();
  const rows: (string | number)[][] = [];
  for (const m of margins) {
    if (!seen.has(m.product_code) && hasNoUsableCost(m)) {
      seen.add(m.product_code);
      rows.push([m.product_code, m.product_description, m.qty, fmtNum(m.cost, 4), fmtNum(m.net_cost, 4), m.case_size]);
    }
  }
  return rowsToCsv(headers, rows);
};


/**
 * Every graded item in every department, filtered to the chosen severities.
 *
 * The one export on this page that isn't scoped to the open department. It
 * costs nothing extra: grading already fetched each department's TY/LW/LY item
 * rows and parked them on the grade, so this is a re-read of data the page is
 * holding rather than a store-wide fan-out.
 *
 * Severity is computed with the same `buildItemRows` + `getItemSeverity` the
 * items table renders from, and on the same Margin/Sales toggle — a row that
 * reads Critical here is the row that reads Critical on screen. (The older
 * `Items vs Last Year` preset above predates that helper and grades LY-only,
 * which is why the two can disagree on an item with no LY counterpart.)
 *
 * Ungraded items — no LW or LY to compare against — are dropped. They can't be
 * critical, and listing them with a blank severity in a file whose whole point
 * is severity invites them being read as healthy.
 */
export const METRIC_LABEL: Record<ItemGradingMetric, string> = {
  margin: "Margin pts vs LY",
  sales: "Sales % vs LY",
  qty: "Qty % vs LY",
};

export const buildAllDeptsCsv = (items: GradedItem[], gradingMetric: ItemGradingMetric) => {
  const headers = [
    "Sub Department",
    "Product Code",
    "Description",
    "Severity",
    "Graded On",
    "Graded Δ",
    "TY Net Sales",
    "Qty",
    "TY Margin %",
    "LW Margin %",
    "LY Margin %",
    "Sales Δ%",
    "Qty Δ%",
  ];
  const rows = items.map(({ dept, row, sev }) => {
    const delta = gradedDelta(row, gradingMetric);
    return [
      dept,
      row.productCode,
      row.description,
      SEV_LABEL[sev],
      METRIC_LABEL[gradingMetric],
      delta === null ? "" : fmtNum(delta),
      fmtNum(row.netSales),
      row.qty,
      fmtNum(row.tyMarginPct),
      row.lwMarginPct === null ? "" : fmtNum(row.lwMarginPct),
      row.lyMarginPct === null ? "" : fmtNum(row.lyMarginPct),
      row.salesTrendPct === null ? "" : fmtNum(row.salesTrendPct),
      row.qtyTrendPct === null ? "" : fmtNum(row.qtyTrendPct),
    ];
  });
  return rowsToCsv(headers, rows);
};

/** The same item set as above with everything but the UPC dropped — a list to
 *  paste or upload into another page, not a report to read. Deduped because the
 *  same UPC can be reached twice and an uploader would count it twice. */
export const buildUpcListCsv = (items: GradedItem[]) => {
  const seen = new Set<string>();
  const rows: (string | number)[][] = [];
  for (const { row } of items) {
    if (seen.has(row.productCode)) continue;
    seen.add(row.productCode);
    rows.push([row.productCode]);
  }
  return rowsToCsv(["UPC"], rows);
};

// ─── Config ───────────────────────────────────────────────────────────────────

export const ITEM_DIMS: DimDef[] = [
  { key: "sale_date",               label: "Date" },
  { key: "product_code",            label: "Product Code" },
  { key: "product_description",     label: "Description" },
];

export const ITEM_METRICS: MetricDef[] = [
  { key: "net_sales_calc",  label: "Net Sales" },
  { key: "qty",             label: "Qty" },
  { key: "cogs_calc",       label: "COGS" },
  { key: "total_tax",       label: "Total Tax" },
];

export const AGG_OPTIONS: { value: AggFn; label: string }[] = [
  { value: "sum",   label: "Sum" },
  { value: "avg",   label: "Avg" },
  { value: "min",   label: "Min" },
  { value: "max",   label: "Max" },
  { value: "count", label: "Count" },
];

export const PREVIEW_ROWS = 5;

export const SEV_CHIP: { sev: ItemSev; label: string; activeClass: string }[] = [
  { sev: "critical", label: "Critical", activeClass: "bg-brand_danger border-brand_danger text-custom-white" },
  { sev: "watch",    label: "Watch",    activeClass: "bg-amber-500 border-amber-500 text-custom-white" },
  { sev: "healthy",  label: "Healthy",  activeClass: "bg-emerald-600 border-emerald-600 text-custom-white" },
];
