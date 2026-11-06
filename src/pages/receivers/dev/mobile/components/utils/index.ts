// Utils
import {
  rowsToCsv,
  downloadCsv,
  fmtNum,
} from "../../../../../../utils/csvExport";

// Interfaces
import type {
  ReceiverDetailsItem,
  ReceiverDetailsTotals,
  ReceiverListItem,
} from "../../../../../../interfaces";

export const groupByOptions = (
  receivers: ReceiverListItem[],
  totalItems: number,
  uniqueVendors: number,
  uniqueOperators: number,
): { label: string; value: string }[] => {
  return [
    { label: "Receivers", value: String(receivers.length) },
    { label: "Items", value: String(totalItems) },
    { label: "Vendors", value: String(uniqueVendors) },
    { label: "Operators", value: String(uniqueOperators) },
  ];
};

export const fmtDate = (dateStr: string) => {
  if (!dateStr) return "";
  const trimmed = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  return new Date(`${trimmed}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export const toApiDate = (dateStr: string) => {
  const trimmed = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const [y, m, d] = trimmed.split("-");
  return `${parseInt(m)}/${parseInt(d)}/${y}`;
};

export const gmColor = (gm: number) => {
  if (gm >= 30) return "text-emerald-600";
  if (gm >= 25) return "text-amber-600";
  return "text-red-500";
};

export const handleExport = (
  details: ReceiverDetailsItem[],
  totals: ReceiverDetailsTotals | null,
  selectedReceiver: ReceiverListItem,
) => {
  if (!details.length || !selectedReceiver) return;
  const headers = [
    "Line #",
    "UPC",
    "Description",
    "Cases",
    "Units",
    "Ext Cost",
    "Ext Retail",
    "GM%",
  ];
  const rows = [
    ...details.map((r) => [
      r.line_number,
      r.product_code,
      r.product_description,
      r.cases,
      r.units,
      fmtNum(r.ext_cost),
      fmtNum(r.ext_retail),
      fmtNum(r.gm),
    ]),
    [],
    [
      "",
      "",
      "TOTALS",
      totals?.cases ?? "",
      totals?.units ?? "",
      totals?.ext_cost != null ? fmtNum(totals.ext_cost) : "",
      totals?.ext_retail != null ? fmtNum(totals.ext_retail) : "",
      "",
    ],
  ];
  const csv = rowsToCsv(headers, rows);
  const filename = `receiver_${selectedReceiver.vendorid}_${selectedReceiver.invoice_date}.csv`;
  downloadCsv(csv, filename);
};
