// Utils
import { fmtNum, rowsToCsv, type AggFn } from "../../../../../utils/csvExport";

// Interfaces
import type { AllOrder } from "../../../../../interfaces";
import type { DimDef, MetricDef } from "../interfaces";

export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${m}/${d}/${y}`;
};

export const buildOrdersCsv = (orders: AllOrder[], label: string) => {
  const headers = [
    "Store #", "Store Name", "Date", "Order #", "Seq #", "UPC", "Description", "Sub Dept", "Vendor",
    "Qty", "Case Size", "Cost",
    "Retail", "Ext Retail", "Ext Cost", "Profit", "Margin %", "Weight", "Edited",
  ];
  const rows = orders.map((o) => {
    const profit = o.e_ret - o.cogs;
    const margin = o.e_ret > 0 ? (profit / o.e_ret) * 100 : 0;
    return [
      o.storenumber, o.storename, fmtDate(o.order_date), o.order_id, o.line_number, o.product_code, o.description,
      o.sub_department_description, o.vendor_name,
      o.qty, o.casesize,
      o.casesize > 0 ? fmtNum(o.base_cost / o.casesize) : "—",
      fmtNum(o.active_retail_price),
      fmtNum(o.e_ret), fmtNum(o.cogs),
      fmtNum(profit), fmtNum(margin), o.weight ?? "", o.edited ? "Yes" : "No",
    ];
  });
  return `${label}\n${rowsToCsv(headers, rows)}`;
};

export const DIMS: DimDef[] = [
  { key: "storenumber",               label: "Store #" },
  { key: "order_id",                  label: "Order #" },
  { key: "sub_department_description", label: "Sub Dept" },
  { key: "vendor_name",               label: "Vendor" },
  { key: "description",               label: "Description" },
  { key: "edited_label",              label: "Edited" },
];

export const METRICS: MetricDef[] = [
  { key: "qty",                label: "Qty" },
  { key: "e_ret",              label: "Ext Retail" },
  { key: "cogs",               label: "Ext Cost" },
  { key: "active_retail_price", label: "Retail Price" },
  { key: "profit",             label: "Profit" },
  { key: "margin",             label: "Margin %" },
  { key: "weight",             label: "Weight" },
];

export const AGG_OPTIONS: { value: AggFn; label: string }[] = [
  { value: "sum",   label: "Sum" },
  { value: "avg",   label: "Avg" },
  { value: "min",   label: "Min" },
  { value: "max",   label: "Max" },
  { value: "count", label: "Count" },
];

/** The sunken navy fill of an order's chips. */
export const chipStyle = {
  background: "rgb(var(--color-brand-navy) / 0.06)",
  boxShadow: "inset 0 1px 2px rgb(var(--color-brand-navy) / 0.08)",
};

/** How many sub department chips a row shows before +N. */
export const MAX_CHIPS = 3;

/** An order date as mm/dd/yyyy for the export. */
export const fmtExportDate = (iso: string) => {
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${m}/${d}/${y}`;
};
