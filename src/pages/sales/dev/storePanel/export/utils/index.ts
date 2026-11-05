import { fmtNum, rowsToCsv } from "../../../../../../utils/csvExport";
import type { AggFn } from "../../../../../../utils/csvExport";
import type { SubSale, HourlySale } from "../../../../../../interfaces";
import type { DayDot } from "../../../components/LedgerRow";
import type { ExportSubDeptItem } from "../../../../../../features/dev/devSalesLedgerSlice";
import type { FinancialsRow } from "../../../../../../api/financials";
import type { DimDef, ItemSev, MetricDef } from "../types/index";

// ─── Formatting helpers ────────────────────────────────────────────────────────

export const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export const fmtHour = (h: number) => {
  const ampm = h < 12 ? "AM" : "PM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:00 ${ampm}`;
};

// ─── Preset CSV builders ──────────────────────────────────────────────────────

/**
 * Financials, as the POS holds them.
 *
 * Deliberately unformatted: no rounding, no derived columns, no totals. This
 * is the one export that exists because a customer asked for the records
 * themselves, and a figure tidied on the way out is a figure that disagrees
 * with whatever they are reconciling against.
 *
 * `weight` is null on anything not sold by weight, which becomes an empty
 * cell rather than a nought — nought pounds and not-weighed are different
 * facts and a spreadsheet will happily average the first.
 */
export const buildFinancialsCsv = (rows: FinancialsRow[]) => {
  const headers = [
    "Store #",
    "Store",
    "Date",
    "Bin",
    "Description",
    "Qty",
    "Weight",
    "Sales",
  ];
  return rowsToCsv(
    headers,
    rows.map((r) => [
      r.store_number,
      r.store_name ?? "",
      fmtDate(r.sale_date.split("T")[0]),
      r.bin,
      r.description,
      r.qty,
      r.weight ?? "",
      r.sales,
    ]),
  );
};

export const buildSubDeptCsv = (ty: SubSale[], lw: SubSale[], ly: SubSale[]) => {
  const headers = [
    "Date",
    "Sub Dept #",
    "Sub Dept",
    "Period",
    "Net Sales",
    "Qty",
    "Transactions",
    "Total Tax",
  ];
  const toRows = (subs: SubSale[], period: string) =>
    subs.map((s) => [
      fmtDate(s.sale_date.split("T")[0]),
      s.sub_department,
      s.sub_department_description,
      period,
      fmtNum(s.net_sales),
      s.qty,
      s.transaction_count,
      fmtNum(s.total_tax),
    ]);
  return rowsToCsv(headers, [
    ...toRows(ty, "This Year"),
    ...toRows(lw, "Last Week"),
    ...toRows(ly, "Last Year"),
  ]);
};

export const buildHourlyCsv = (
  ty: HourlySale[],
  lw: HourlySale[],
  ly: HourlySale[],
) => {
  const headers = [
    "Date",
    "Hour",
    "Period",
    "Net Sales",
    "Qty",
    "Transactions",
    "Basket Size ($)",
    "Basket Size (Qty)",
    "Avg Item Price",
  ];
  const toRows = (hourly: HourlySale[], period: string) =>
    hourly.map((h) => [
      fmtDate(h.sale_date.split("T")[0]),
      fmtHour(h.hour),
      period,
      fmtNum(h.net_sales),
      h.qty,
      h.transactions,
      fmtNum(h.basket_size_sales),
      fmtNum(h.basket_size_qty),
      fmtNum(h.avg_item_price),
    ]);
  return rowsToCsv(headers, [
    ...toRows(ty, "This Year"),
    ...toRows(lw, "Last Week"),
    ...toRows(ly, "Last Year"),
  ]);
};

export const buildSummaryCsv = (days: DayDot[]) => {
  const headers = ["Date", "TY Net Sales", "LW Net Sales", "LY Net Sales"];
  const rows = [...days]
    .sort((a, b) => a.sale_date.localeCompare(b.sale_date))
    .map((d) => [
      fmtDate(d.sale_date.split("T")[0]),
      fmtNum(d.twNet),
      d.lwNet !== null ? fmtNum(d.lwNet) : "",
      d.lyNet !== null ? fmtNum(d.lyNet) : "",
    ]);
  return rowsToCsv(headers, rows);
};

/**
 * Every sub department against every day of the week, as a grid.
 *
 * The long-format Sub Department preset above is one row per dept per day per
 * period — right for a pivot table, hard to read. This is the shape you hold
 * next to a printed day report: departments down the side, days across the top,
 * one number per cell, and totals on both edges so nothing has to be re-added
 * by hand.
 *
 * This week only, and `net_sales` deliberately — that is the field the register
 * report agrees with, since it already has tax and coupons taken out. LW/LY
 * belong to the other presets; this one exists to be checked against the
 * store's own paperwork.
 */
export const buildDeptDayGridCsv = (subs: SubSale[], days: DayDot[]) => {
  const dates = [...days]
    .map((d) => d.sale_date.split("T")[0])
    .sort((a, b) => a.localeCompare(b));

  const deptName = new Map<number, string>();
  const cell = new Map<string, number>();
  for (const s of subs) {
    if (!deptName.has(s.sub_department))
      deptName.set(s.sub_department, s.sub_department_description ?? "");
    const key = `${s.sub_department}__${s.sale_date.split("T")[0]}`;
    cell.set(key, (cell.get(key) ?? 0) + s.net_sales);
  }

  const ids = [...deptName.keys()].sort((a, b) => a - b);
  const headers = [
    "Sub Dept #",
    "Sub Dept",
    ...dates.map(fmtDate),
    "Week Total",
  ];

  const rows: (string | number)[][] = ids.map((id) => {
    const values = dates.map((d) => cell.get(`${id}__${d}`) ?? 0);
    return [
      id,
      deptName.get(id) ?? "",
      ...values.map(fmtNum),
      fmtNum(values.reduce((acc, v) => acc + v, 0)),
    ];
  });

  // Column totals on the bottom row — the day figure to hold against the
  // store's day report without re-adding the column by hand.
  const dayTotals = dates.map((d) =>
    ids.reduce((acc, id) => acc + (cell.get(`${id}__${d}`) ?? 0), 0),
  );
  rows.push([
    "",
    "All Sub Depts",
    ...dayTotals.map(fmtNum),
    fmtNum(dayTotals.reduce((acc, v) => acc + v, 0)),
  ]);

  return rowsToCsv(headers, rows);
};

const SEV_LABEL: Record<ItemSev, string> = {
  critical: "Critical",
  watch: "Watch",
  healthy: "Healthy",
};

const fmtPctRaw = (pct: number | null) =>
  pct === null ? "" : `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;

export const buildItemsCsv = (items: ExportSubDeptItem[], sevs: Set<ItemSev>) => {
  // Ungraded items (neither comparison covers the week) go out only with the
  // full export — they don't belong under any one severity.
  const everything = sevs.size >= 3;
  const filtered = items.filter((i) =>
    i.sev === null ? everything : sevs.has(i.sev),
  );
  const headers = [
    "Product Code",
    "Description",
    "Severity",
    "TY Net",
    "TY Qty",
    "LW Net",
    "LW Qty",
    "LW vs %",
    "LY Net",
    "LY Qty",
    "LY vs %",
  ];
  const rows = filtered.map((i) => {
    const lwPct =
      i.lwNet !== null && i.lwNet > 0
        ? (((i.tyNetForLW ?? i.tyNet) - i.lwNet) / i.lwNet) * 100
        : null;
    const lyPct =
      i.lyNet !== null && i.lyNet > 0
        ? (((i.tyNetForLY ?? i.tyNet) - i.lyNet) / i.lyNet) * 100
        : null;
    return [
      i.productCode,
      i.desc,
      i.sev ? SEV_LABEL[i.sev] : "Not graded",
      fmtNum(i.tyNet),
      i.tyQty,
      i.lwNet !== null ? fmtNum(i.lwNet) : "",
      i.lwQty ?? "",
      fmtPctRaw(lwPct),
      i.lyNet !== null ? fmtNum(i.lyNet) : "",
      i.lyQty ?? "",
      fmtPctRaw(lyPct),
    ];
  });
  return rowsToCsv(headers, rows);
};

// ─── Config ───────────────────────────────────────────────────────────────────

export const SUBDEPT_DIMS: DimDef[] = [
  { key: "sale_date", label: "Date" },
  { key: "period", label: "Period" },
  { key: "sub_department", label: "Sub Dept #" },
  { key: "sub_department_description", label: "Sub Dept Name" },
];

export const SUBDEPT_METRICS: MetricDef[] = [
  { key: "net_sales", label: "Net Sales" },
  { key: "qty", label: "Qty" },
  { key: "transaction_count", label: "Transactions" },
  { key: "total_tax", label: "Total Tax" },
];

export const HOURLY_DIMS: DimDef[] = [
  { key: "sale_date", label: "Date" },
  { key: "period", label: "Period" },
  { key: "hour", label: "Hour" },
];

export const HOURLY_METRICS: MetricDef[] = [
  { key: "net_sales", label: "Net Sales" },
  { key: "qty", label: "Qty" },
  { key: "transactions", label: "Transactions" },
  { key: "basket_size_sales", label: "Basket Size ($)" },
  { key: "avg_item_price", label: "Avg Item Price" },
];

export const AGG_OPTIONS: { value: AggFn; label: string }[] = [
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Avg" },
  { value: "min", label: "Min" },
  { value: "max", label: "Max" },
  { value: "count", label: "Count" },
];

export const PREVIEW_ROWS = 5;
