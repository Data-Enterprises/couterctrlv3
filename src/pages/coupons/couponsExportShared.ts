import type { CouponItem } from "../../interfaces";
import { fmtNum, rowsToCsv } from "../../utils/csvExport";
import type { AggFn } from "../../utils/csvExport";

export const buildPresetCsv = (rows: CouponItem[], label: string) => {
  const headers = ["Store #", "Store", "Date", "Trans", "Cpn Type", "Cpn Amt", "UPC", "Description", "Cashier #", "Cashier", "Customer ID", "Sub Dept"];
  const data = rows.map((r) => [
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
  { key: "store_name",                 label: "Store" },
  { key: "sub_department_description", label: "Sub Dept" },
  { key: "coupon_type",                label: "Cpn Type" },
  { key: "cashier_name",               label: "Cashier" },
  { key: "product_description",        label: "Description" },
  { key: "customer_id",                label: "Customer ID" },
];

export const METRICS = [
  { key: "coupon_amount", label: "Cpn Amt" },
  { key: "qty",           label: "Qty" },
];

export const AGG_OPTIONS: { value: AggFn; label: string }[] = [
  { value: "sum", label: "Sum" }, { value: "avg", label: "Avg" },
  { value: "min", label: "Min" }, { value: "max", label: "Max" },
  { value: "count", label: "Count" },
];
