// Interfaces
import type { StoreWithActivity } from "../../../../../interfaces";

/** Quotes a CSV cell when it holds a comma, a quote or a line break. */
export const escCsv = (val: string | number | null | undefined) => {
  const s = String(val ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
};

/** A header row and data rows as CSV text. */
export const rowsToCsv = (
  headers: string[],
  rows: (string | number | null)[][],
): string => {
  const lines = [headers.map(escCsv).join(",")];
  for (const row of rows) lines.push(row.map(escCsv).join(","));
  return lines.join("\n");
};

/** The Store Activity export: one row per store with its activity figures. */
export const buildStoreActivityCsv = (stores: StoreWithActivity[], label: string) => {
  const headers = [
    "Store ID",
    "Store Name",
    "Total Days",
    "Active Days",
    "Days Missing",
  ];
  const rows = stores.map((s) => [
    s.storeid,
    s.store_name,
    s.total_days_in_range,
    s.active_days,
    s.inactive_or_missing_days,
  ]);
  return `${label}\n${rowsToCsv(headers, rows)}`;
};

/** Saves CSV text as a file through a temporary download link. */
export const downloadCsv = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
