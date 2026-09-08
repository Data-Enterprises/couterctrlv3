import { rowsToCsv } from "../../../utils/csvExport";
import { hourOf } from "./hourProfile";
import { isAll } from "./caseModel";
import type { TransactionListItem } from "../../../interfaces";

/**
 * The case's rows, as a file somebody can attach to it.
 *
 * The lines already in memory, written client-side — no endpoint, and nothing
 * derived. What is exported is exactly the table on screen, because the whole
 * point of handing it over is that a second reader can check the figures
 * without taking this page's word for them.
 *
 * One row per receipt line rather than per receipt: the item is the evidence.
 * A cancelled basket of eleven items where one of them is the expensive one is
 * a different conversation from eleven cheap ones, and a receipt-grain sheet
 * cannot tell them apart.
 */
export interface CaseExportScope {
  cashierName: string;
  cashierNumber: number;
  storeName: string;
  saleType: string;
  /** The week the evidence was scoped to, already formatted for a reader. */
  weekLabel: string;
}

export const CASE_HEADERS = [
  "Store",
  "Cashier",
  "Cashier number",
  "Exception",
  "Week",
  "Receipt",
  "Date",
  "Time",
  "Lane",
  "UPC",
  "Description",
  "Qty",
  "Amount",
];

/** `sale_start_time` is a bare clock string — "93240" is 09:32:40 — so it is
 *  padded before it is cut, not parsed as a date. */
export const clockOf = (t: TransactionListItem): string => {
  const raw = String(t.sale_start_time ?? "").trim();
  if (!raw) return "";
  const p = raw.length >= 6 ? raw : raw.padStart(6, "0");
  return `${p.slice(0, 2)}:${p.slice(2, 4)}:${p.slice(4, 6)}`;
};

/** The lines this case is actually about: the selected type, or every
 *  exception type on it when the reader is on All. */
export const caseLines = (
  lines: TransactionListItem[],
  saleType: string,
  types: string[],
): TransactionListItem[] => {
  const wanted = new Set(isAll(saleType) ? types : [saleType]);
  return lines
    .filter((l) => wanted.has(l.sale_type))
    .sort(
      (a, b) =>
        a.sale_date.localeCompare(b.sale_date) ||
        hourOf(a) - hourOf(b) ||
        a.sale_id.localeCompare(b.sale_id) ||
        a.line_number - b.line_number,
    );
};

export const caseCsv = (
  lines: TransactionListItem[],
  scope: CaseExportScope,
): string =>
  rowsToCsv(
    CASE_HEADERS,
    lines.map((l) => [
      l.store_name ?? scope.storeName,
      l.cashier_name ?? scope.cashierName,
      l.cashier_number ?? scope.cashierNumber,
      l.sale_type,
      scope.weekLabel,
      l.transaction_id ?? l.sale_id,
      l.sale_date.slice(0, 10),
      clockOf(l),
      l.terminal ?? "",
      l.product_code ?? "",
      l.product_description ?? "",
      l.qty ?? "",
      // `item_total`, not `total_sales`. This endpoint's `total_sales` carries
      // tax and nets off the store coupon, so a sheet built on it never adds
      // up to the figure in the header — which is summed from the raw column.
      (l.item_total ?? l.total_sales ?? 0).toFixed(2),
    ]),
  );

export const caseFilename = (scope: CaseExportScope): string =>
  ["lp", scope.storeName, scope.cashierName, scope.saleType, scope.weekLabel]
    .map((p) =>
      String(p)
        .replace(/[^A-Za-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    )
    .filter(Boolean)
    .join("_")
    .toLowerCase() + ".csv";
