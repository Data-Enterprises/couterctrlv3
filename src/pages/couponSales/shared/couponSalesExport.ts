import type { CouponItem } from "../../../interfaces";
import type { GradingOptions } from "./couponGrading";
import type { Store } from "../../../interfaces";
import { fmtNum, rowsToCsv } from "../../../utils/csvExport";
import {
  couponValueOf,
  buildStoreRows,
  buildSubDeptRows,
  buildDateRows,
  buildCashierRows,
  buildTransactions,
  type CouponRow,
} from "./couponGrading";

/** What the export is grouped by. Mirrors the page's own breakdowns, so an
 *  exported file matches what was on screen when it was pulled. */
export type CouponPreset =
  | "stores"
  | "subdept"
  | "date"
  | "cashier"
  | "transactions"
  | "lines";

export const PRESET_OPTIONS: { key: CouponPreset; label: string; desc: string }[] = [
  { key: "stores", label: "Store grades", desc: "One row per store, graded" },
  { key: "subdept", label: "Sub dept grades", desc: "One row per sub department" },
  { key: "date", label: "Date grades", desc: "One row per day" },
  { key: "cashier", label: "Cashier grades", desc: "One row per cashier" },
  { key: "transactions", label: "Transactions", desc: "One row per transaction" },
  { key: "lines", label: "Coupon lines", desc: "Every raw coupon line" },
];

/** Graded rollups all share a shape, so they share a writer. The threshold is
 *  written into the file — a grade is meaningless without the number it was
 *  graded against, and the reader won't have the slider in front of them. */
const TIER_LABEL: Record<CouponRow["tier"], string> = {
  critical: "Critical",
  watch: "Watch",
  ok: "OK",
  ungraded: "Ungraded",
};

const gradedCsv = (
  rows: CouponRow[],
  labelHeader: string,
  opts: GradingOptions,
) => {
  const headers = [
    labelHeader,
    "Amount",
    "Qty",
    "Coupons",
    "Transactions",
    "Avg Coupon",
    "Baseline Avg",
    "Trend %",
    "Grade",
    "Over $ Threshold",
  ];
  const data = rows.map((r) => [
    r.label,
    fmtNum(r.amount),
    r.qty,
    r.lines,
    r.transactions,
    fmtNum(r.avgAmount),
    r.avgBaseline === null ? "" : fmtNum(r.avgBaseline),
    r.trendPct === null ? "" : fmtNum(r.trendPct),
    TIER_LABEL[r.tier],
    r.isOutlier ? "Yes" : "No",
  ]);
  return `Graded on average coupon vs prior 2 weeks, critical over +${fmtNum(opts.trendThreshold)}% — outlier flag at $${fmtNum(opts.threshold)}\n${rowsToCsv(headers, data)}`;
};

export const buildCouponPresetCsv = (
  preset: CouponPreset,
  coupons: CouponItem[],
  opts: GradingOptions,
  assignedStores: Store[] = [],
  groupStores: Store[] = [],
): string => {
  if (preset === "stores")
    return gradedCsv(
      buildStoreRows(coupons, opts, assignedStores, groupStores),
      "Store",
      opts,
    );
  if (preset === "subdept")
    return gradedCsv(buildSubDeptRows(coupons, opts), "Sub Dept", opts);
  if (preset === "date")
    return gradedCsv(buildDateRows(coupons, opts), "Date", opts);
  if (preset === "cashier")
    return gradedCsv(buildCashierRows(coupons, opts), "Cashier", opts);

  if (preset === "transactions") {
    const headers = [
      "Transaction",
      "Date",
      "Cashier #",
      "Cashier",
      "Terminal",
      "Amount",
      "Qty",
      "Coupons",
      "Avg Coupon",
      "Grade",
    ];
    const data = buildTransactions(coupons, opts.threshold).map((t) => [
      t.sale_id,
      t.sale_date,
      t.cashier_number,
      t.cashier_name,
      t.terminal,
      fmtNum(t.amount),
      t.qty,
      t.lines,
      fmtNum(t.avgAmount),
      t.tier === "critical" ? "Critical" : "OK",
    ]);
    return `Transactions flagged when the average coupon is over $${fmtNum(opts.threshold)}\n${rowsToCsv(headers, data)}`;
  }

  // Raw lines — no grading, since a single coupon line has no average.
  const headers = [
    "Store #",
    "Store",
    "Date",
    "Transaction",
    "Sub Dept",
    "Cashier #",
    "Cashier",
    "Terminal",
    "UPC",
    "Description",
    "Cpn Type",
    "Cpn Amt",
    "Qty",
    "Sales",
  ];
  const data = coupons.map((r) => [
    r.store_number,
    r.store_name,
    r.sale_date.split("T")[0],
    r.sale_id,
    r.sub_department_description,
    r.cashier_number,
    r.cashier_name,
    r.terminal,
    r.product_code ? String(Math.round(Number(r.product_code))) : "",
    r.product_description,
    r.coupon_type,
    fmtNum(couponValueOf(r)),
    r.qty,
    fmtNum(r.total_sales),
  ]);
  return rowsToCsv(headers, data);
};

/** Custom-mode dimensions. Same field names as the raw rows so the shared
 *  aggregateRows can group on them directly. */
export const CPN_SALES_DIMS = [
  { key: "store_name", label: "Store" },
  { key: "sub_department_description", label: "Sub Dept" },
  { key: "sale_date_only", label: "Date" },
  { key: "cashier_name", label: "Cashier" },
  { key: "coupon_type", label: "Cpn Type" },
  { key: "terminal", label: "Terminal" },
  { key: "product_description", label: "Description" },
];

export const CPN_SALES_METRICS = [
  { key: "coupon_amount", label: "Cpn Amt" },
  { key: "qty", label: "Qty" },
  { key: "total_sales", label: "Sales" },
];
