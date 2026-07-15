import type { AllOrder } from "../../../interfaces";
import { fmtNum, rowsToCsv } from "../../../utils/csvExport";
import type { AggFn } from "../../../utils/csvExport";

interface DimDef { key: string; label: string }
interface MetricDef { key: string; label: string }

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${m}/${d}/${y}`;
};

export const buildOrdersCsv = (orders: AllOrder[], label: string) => {
  const headers = [
    "Store #", "Store Name", "Date", "Order #", "Line #", "UPC", "Description", "Sub Dept", "Vendor",
    "Status", "Qty", "Case Size", "Unit Cost", "Net Cost",
    "Retail Price", "Ext Retail", "COGS", "Revenue",
  ];
  const rows = orders.map((o) => [
    o.storenumber, o.storename, fmtDate(o.order_date), o.order_id, o.line_number, o.product_code, o.description,
    o.sub_department_description, o.vendor_name, o.status,
    o.qty, o.casesize,
    o.casesize > 0 ? fmtNum(o.base_cost / o.casesize) : "—",
    fmtNum(o.net_cost), fmtNum(o.active_retail_price),
    fmtNum(o.e_ret), fmtNum(o.cogs), fmtNum(o.rev),
  ]);
  return `${label}\n${rowsToCsv(headers, rows)}`;
};

export const DIMS: DimDef[] = [
  { key: "order_id",                  label: "Order #" },
  { key: "sub_department_description", label: "Sub Dept" },
  { key: "vendor_name",               label: "Vendor" },
  { key: "status",                    label: "Status" },
  { key: "description",               label: "Description" },
];

export const METRICS: MetricDef[] = [
  { key: "qty",                label: "Qty" },
  { key: "e_ret",              label: "Ext Retail" },
  { key: "cogs",               label: "COGS" },
  { key: "rev",                label: "Revenue" },
  { key: "active_retail_price", label: "Retail Price" },
  { key: "net_cost",           label: "Net Cost" },
];

export const AGG_OPTIONS: { value: AggFn; label: string }[] = [
  { value: "sum",   label: "Sum" },
  { value: "avg",   label: "Avg" },
  { value: "min",   label: "Min" },
  { value: "max",   label: "Max" },
  { value: "count", label: "Count" },
];
