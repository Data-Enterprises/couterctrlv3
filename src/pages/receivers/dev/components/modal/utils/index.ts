import type {
  ReceiverDetailsItem,
  ReceiverDetailsTotals,
} from "../../../../../../interfaces";
import { fmtNum, rowsToCsv, type AggFn } from "../../../../../../utils/csvExport";
import type { DimDef, MetricDef } from "../interfaces";

/**
 *
 * @param details
 * @param label
 * @param totals
 * @returns
 */
export const buildDetailsCsv = (
  details: ReceiverDetailsItem[],
  label: string,
  totals: ReceiverDetailsTotals | null,
) => {
  const headers = [
    "Line #",
    "UPC",
    "Description",
    "Cases",
    "Units",
    "U Cost",
    "Ext Cost",
    "Retail",
    "Ext Retail",
    "GM",
    "Free",
    "Return",
  ];
  const rows = details.map((d) => [
    d.line_number,
    d.product_code,
    d.product_description,
    d.cases,
    d.units,
    fmtNum(d.ucost),
    fmtNum(d.ext_cost),
    fmtNum(d.retail),
    fmtNum(d.ext_retail),
    fmtNum(d.gm),
    d.free,
    d.return,
  ]);
  if (totals) {
    rows.push([]);
    rows.push([
      "",
      "",
      "TOTALS",
      totals.cases,
      totals.units,
      fmtNum(totals.ucost),
      fmtNum(totals.ext_cost),
      fmtNum(totals.retail),
      fmtNum(totals.ext_retail),
      "",
      "",
      "",
    ]);
  }
  return `${label}\n${rowsToCsv(headers, rows)}`;
};

// Config utils
export const DIMS: DimDef[] = [
  { key: "product_code", label: "UPC" },
  { key: "product_description", label: "Description" },
];

export const METRICS: MetricDef[] = [
  { key: "cases", label: "Cases" },
  { key: "units", label: "Units" },
  { key: "ucost", label: "U Cost" },
  { key: "ext_cost", label: "Ext Cost" },
  { key: "retail", label: "Retail" },
  { key: "ext_retail", label: "Ext Retail" },
  { key: "gm", label: "GM" },
];

export const AGG_OPTIONS: { value: AggFn; label: string }[] = [
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Avg" },
  { value: "min", label: "Min" },
  { value: "max", label: "Max" },
  { value: "count", label: "Count" },
];

export const PREVIEW_ROWS = 5;
