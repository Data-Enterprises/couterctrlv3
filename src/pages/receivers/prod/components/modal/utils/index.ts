// Utils
import {
  fmtNum,
  rowsToCsv,
  type AggFn,
} from "../../../../../../utils/csvExport";

// Interfaces
import type {
  ReceiverDetailsItem,
  ReceiverDetailsTotals,
} from "../../../../../../interfaces";
import type {
  DimDef,
  MappedColumn,
  MetricDef,
  ModalMode,
  ActiveMetric,
  MetricSelection,
} from "../interfaces";

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

export const modalModes: ModalMode[] = ["presets", "custom"];

export const mapColumns = (
  dims: DimDef[],
  metrics: ActiveMetric[],
): MappedColumn[] => {
  const activeDims = dims.map((d) => ({ key: d.key, label: d.label }));

  const activeMetrics = metrics.map((m) => ({
    key: `${m.fn}__${m.key}`,
    label: `${m.fn.charAt(0).toUpperCase() + m.fn.slice(1)} ${m.label}`,
  }));

  return [...activeDims, ...activeMetrics];
};

export const defaultMetrics = new Map<string, MetricSelection>([
  ["cases", { fn: "sum", enabled: false }],
  ["units", { fn: "sum", enabled: false }],
  ["ucost", { fn: "avg", enabled: false }],
  ["ext_cost", { fn: "sum", enabled: false }],
  ["retail", { fn: "avg", enabled: false }],
  ["ext_retail", { fn: "sum", enabled: false }],
  ["gm", { fn: "avg", enabled: false }],
]);
