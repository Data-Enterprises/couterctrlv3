// Utils
import { fmtNum, rowsToCsv } from "../../../../../utils/csvExport";

// Interfaces
import type { TransactionOverview } from "../../../../../interfaces";
import type { CashierGrade, CashierSeverity } from "../../interfaces";
import type { DimDef, MetricDef } from "../interfaces";
import type { AggFn } from "../../../../../utils/csvExport";

/** A yyyy-mm-dd date as mm/dd/yyyy. */
export const fmtDate = (iso: string) => {
  const d = iso.split("T")[0].split("-");
  return `${d[1]}/${d[2]}/${d[0]}`;
};

/** The Transactions preset as CSV, one row per transaction. */
export const buildTransactionsCsv = (rows: TransactionOverview[]) => {
  const headers = ["Trans ID", "Date", "Cashier #", "Cashier Name", "Store #", "Sale Type", "Items", "Total Sales"];
  const data = rows.map((o) => [
    o.transaction_id,
    fmtDate(o.sale_date),
    o.cashier_number,
    o.cashier_name,
    o.store_number,
    o.sale_type,
    o.qty,
    fmtNum(o.total_sales),
  ]);
  return rowsToCsv(headers, data);
};

/** The Cashiers preset as CSV, one row per graded cashier in the chosen severities. */
export const buildCashiersCsv = (grades: CashierGrade[], sevs: Set<CashierSeverity>) => {
  const headers = ["Cashier #", "Cashier Name", "Store #", "Severity", "Transactions", "Items", "Total Sales", "Avg Ticket"];
  const data = grades.filter((g) => sevs.has(g.severity)).map((g) => [
    g.cashier_number,
    g.cashier_name,
    g.store_number,
    g.severity,
    g.trans.value,
    g.qty.value,
    fmtNum(g.sales.value),
    fmtNum(g.avgTicket.value),
  ]);
  return rowsToCsv(headers, data);
};

/** The dimensions a custom transactions export can group by. */
export const TRANS_DIMS: DimDef[] = [
  { key: "cashier_name",  label: "Cashier Name" },
  { key: "cashier_number", label: "Cashier #" },
  { key: "sale_date",     label: "Date" },
  { key: "sale_type",     label: "Sale Type" },
  { key: "store_number",  label: "Store #" },
];

/** The figures a custom transactions export can total. */
export const TRANS_METRICS: MetricDef[] = [
  { key: "qty",         label: "Items" },
  { key: "total_sales", label: "Total Sales" },
];

/** The dimensions a custom cashiers export can group by. */
export const CASHIER_DIMS: DimDef[] = [
  { key: "cashier_name",  label: "Cashier Name" },
  { key: "severity",      label: "Severity" },
  { key: "store_number",  label: "Store #" },
];

/** The figures a custom cashiers export can total. */
export const CASHIER_METRICS: MetricDef[] = [
  { key: "trans_value",      label: "Transactions" },
  { key: "qty_value",        label: "Items" },
  { key: "sales_value",      label: "Total Sales" },
  { key: "avgTicket_value",  label: "Avg Ticket" },
];

/** How a custom export combines a figure: sum, average, min, max or count. */
export const AGG_OPTIONS: { value: AggFn; label: string }[] = [
  { value: "sum",   label: "Sum" },
  { value: "avg",   label: "Avg" },
  { value: "min",   label: "Min" },
  { value: "max",   label: "Max" },
  { value: "count", label: "Count" },
];

/** How many rows the custom preview shows. */
export const PREVIEW_ROWS = 5;
