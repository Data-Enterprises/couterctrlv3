// Utils
import { fmtNum, rowsToCsv } from "../../../../utils/csvExport";
import {
  couponValueOf,
  withResolvedCouponAmount,
} from "../../../../utils/couponValue";

// Interfaces
import type { CouponItem, TransactionListItem } from "../../../../interfaces";
import type { GroupTab } from "../interfaces";

export const buildPresetCsv = (rows: CouponItem[], label: string) => {
  // coupon_amount can be null with the figure in store_coupon/vendor_coupon
  // (a transaction-level fallback); resolved here so the file matches the page.
  const resolved = withResolvedCouponAmount(rows);
  const headers = [
    "Store #",
    "Store",
    "Date",
    "Trans",
    "Cpn Type",
    "Cpn Amt",
    "UPC",
    "Description",
    "Cashier #",
    "Cashier",
    "Customer ID",
    "Sub Dept",
  ];
  const data = resolved.map((r) => [
    r.store_number,
    r.store_name,
    r.sale_date.split("T")[0],
    r.sale_id,
    r.coupon_type,
    fmtNum(r.coupon_amount),
    r.product_code ? String(Math.round(Number(r.product_code))) : "",
    r.product_description,
    r.cashier_number,
    r.cashier_name,
    r.customer_id,
    r.sub_department_description,
  ]);
  return `${label}\n${rowsToCsv(headers, data)}`;
};

export const DIMS = [
  { key: "store_name", label: "Store" },
  { key: "sub_department_description", label: "Sub Dept" },
  { key: "coupon_type", label: "Cpn Type" },
  { key: "cashier_name", label: "Cashier" },
  { key: "product_description", label: "Description" },
  { key: "customer_id", label: "Customer ID" },
];

export const METRICS = [
  { key: "coupon_amount", label: "Cpn Amt" },
  { key: "qty", label: "Qty" },
];

// Moved to utils/csvExport beside AggFn; re-exported for this page's files.
export { AGG_OPTIONS } from "../../../../utils/csvExport";

/** The three ways the coupons are grouped, desktop and phone alike. */
export const GROUP_TABS: { key: GroupTab; label: string }[] = [
  { key: "subdept", label: "Sub dept" },
  { key: "date", label: "Date" },
  { key: "cashier", label: "Cashier" },
];

/** The searched m/d/yyyy range as "11/3 – 11/9/2026". */
export const fmtDateRange = (startMdy: string, endMdy: string) => {
  const part = (mdy: string, withYear = false) => {
    const [m, d, y] = mdy.split("/");
    return withYear ? `${+m}/${+d}/${y}` : `${+m}/${+d}`;
  };
  return `${part(startMdy)} – ${part(endMdy, true)}`;
};

/** A coupon line's sale id: store-sale-terminal-month-day-year. */
export const buildSaleId = (
  row: Pick<CouponItem, "storeid" | "sale_id" | "terminal" | "sale_date">,
) => {
  const [y, m, d] = row.sale_date.split("T")[0].split("-");
  return `${row.storeid}-${row.sale_id}-${row.terminal}-${+m}-${+d}-${y}`;
};

/** A receipt's totals: gross over its sale lines, less its coupons, plus tax. */
export const receiptTotals = (lines: TransactionListItem[]) => {
  const saleLines = lines.filter(
    (r) => r.sale_type === "Sale" && r.is_coupon !== 1,
  );
  const couponLines = lines.filter((r) => r.is_coupon === 1);
  const txGross = saleLines.reduce(
    (s: number, r) => s + (r.total_sales ?? 0),
    0,
  );
  const txCoupons = couponLines.reduce(
    (s: number, r) => s + couponValueOf(r),
    0,
  );
  const txTax = saleLines.reduce(
    (s: number, r) => s + (r.total_rounded_tax ?? 0),
    0,
  );
  const txNet = txGross - txCoupons;
  const txTotal = txNet + txTax;
  return { txGross, txCoupons, txTax, txNet, txTotal };
};
