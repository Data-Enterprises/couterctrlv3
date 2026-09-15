import { useMemo, useState } from "react";
import ResizableModalShell from "../../../../components/modals/ResizableModalShell";
import { ArrowDownTrayIcon, XMarkIcon } from "@heroicons/react/20/solid";
import {
  buildSaleTypeBreakdown,
  computeMargin,
  dayMarginPct,
  dayUnitCost,
} from "../lookupMetrics";
import type { DayBucket } from "../lookupMetrics";
import type { QueueItem } from "../../../../features/itemLookupSlice";
import { rowsToCsv, downloadCsv } from "../../../../utils/csvExport";

interface LookupExportModalProps {
  queue: QueueItem[];
  selectedDescription: string;
  /** The timeline on screen — Sale, or whichever type is selected. */
  buckets: DayBucket[];
  selectedSaleType: string;
  /** Current item sells by weight — the daily Weight column is filled. */
  weighed: boolean;
  onClose: () => void;
}

type ModalMode = "presets" | "custom";
type Preset = "batch" | "daily" | "saleTypes";
type BatchColKey =
  | "upc"
  | "description"
  | "marginPct"
  | "avgSoldAt"
  | "listPrice"
  | "caseCost"
  | "totalQty"
  | "daysSold";
type DailyColKey =
  | "date"
  | "saleType"
  | "qty"
  | "weight"
  | "revenue"
  | "cost"
  | "caseCost"
  | "listPrice"
  | "marginPct";

interface ColDef {
  key: string;
  label: string;
  defaultOn: boolean;
}

const BATCH_COLS: { key: BatchColKey; label: string; defaultOn: boolean }[] = [
  { key: "upc", label: "UPC", defaultOn: true },
  { key: "description", label: "Description", defaultOn: true },
  { key: "marginPct", label: "Margin %", defaultOn: true },
  { key: "avgSoldAt", label: "Avg sold at", defaultOn: false },
  { key: "listPrice", label: "List price", defaultOn: false },
  { key: "caseCost", label: "Cost / unit", defaultOn: false },
  { key: "totalQty", label: "Total units / lb", defaultOn: false },
  { key: "daysSold", label: "Days sold", defaultOn: false },
];

const DAILY_COLS: { key: DailyColKey; label: string; defaultOn: boolean }[] = [
  { key: "date", label: "Date", defaultOn: true },
  { key: "saleType", label: "Sale type", defaultOn: true },
  { key: "qty", label: "Qty", defaultOn: true },
  { key: "weight", label: "Weight (lb)", defaultOn: true },
  { key: "revenue", label: "Amount", defaultOn: true },
  { key: "cost", label: "Cost", defaultOn: false },
  { key: "caseCost", label: "Cost / unit", defaultOn: false },
  { key: "listPrice", label: "List price", defaultOn: false },
  { key: "marginPct", label: "Margin %", defaultOn: true },
];

type SaleTypeColKey =
  | "upc"
  | "description"
  | "saleType"
  | "days"
  | "revenue"
  | "qty"
  | "weight"
  | "pctOfSales";

const SALE_TYPE_COLS: { key: SaleTypeColKey; label: string; defaultOn: boolean }[] = [
  { key: "upc", label: "UPC", defaultOn: true },
  { key: "description", label: "Description", defaultOn: true },
  { key: "saleType", label: "Sale type", defaultOn: true },
  { key: "days", label: "Days", defaultOn: true },
  { key: "revenue", label: "Amount", defaultOn: true },
  { key: "qty", label: "Qty", defaultOn: true },
  { key: "weight", label: "Weight (lb)", defaultOn: true },
  { key: "pctOfSales", label: "% of sales", defaultOn: true },
];

interface SaleTypeRow {
  upc: string;
  description: string;
  saleType: string;
  days: number;
  revenue: number;
  qty: number;
  /** Null on an each-priced item, which has no weight to report. */
  weight: number | null;
  /** Null on the Sale row itself. */
  pctOfSales: number | null;
}

/** One row per loaded item per sale type, Sale first. Built from every line
 *  type, not the Sale-only history the batch summary uses. */
const buildSaleTypeRows = (queue: QueueItem[]): SaleTypeRow[] =>
  queue
    .filter((q) => q.status === "loaded" && q.history)
    .flatMap((q) => {
      const { weighed } = computeMargin(q.history!, q.totalSales ?? 0, q.totalQty ?? 0);
      const types = buildSaleTypeBreakdown(q.historyAll ?? q.history!);
      const saleDollars = types.find((t) => t.saleType === "Sale")?.sales ?? 0;
      return types.map((t) => ({
        upc: q.upc,
        description: q.description ?? "",
        saleType: t.saleType,
        days: t.days,
        revenue: t.sales,
        qty: t.qty,
        weight: weighed ? t.units : null,
        pctOfSales:
          t.saleType === "Sale" || saleDollars <= 0 ? null : (t.sales / saleDollars) * 100,
      }));
    });

const saleTypeCell = (row: SaleTypeRow, key: SaleTypeColKey): string | number => {
  switch (key) {
    case "upc":
      return row.upc;
    case "description":
      return row.description;
    case "saleType":
      return row.saleType;
    case "days":
      return row.days;
    case "revenue":
      return row.revenue.toFixed(2);
    case "qty":
      return row.qty;
    case "weight":
      return row.weight !== null ? row.weight.toFixed(2) : "";
    case "pctOfSales":
      return row.pctOfSales !== null ? row.pctOfSales.toFixed(2) : "";
  }
};

const PREVIEW_ROWS = 5;

interface BatchRow {
  upc: string;
  description: string;
  marginPct: number | null;
  avgSoldAt: number;
  listPrice: number;
  caseCost: number;
  totalQty: number;
  daysSold: number;
}

const buildBatchRows = (queue: QueueItem[]): BatchRow[] =>
  queue
    .filter((q) => q.status === "loaded" && q.history)
    .map((q) => {
      const margin = computeMargin(
        q.history!,
        q.totalSales ?? 0,
        q.totalQty ?? 0,
      );
      return {
        upc: q.upc,
        description: q.description ?? "",
        marginPct: margin.marginPct,
        avgSoldAt: margin.avgSoldAt,
        listPrice: margin.listPrice,
        caseCost: margin.unitCost,
        // Priced units: pounds for a scale item, whose ring count is 0.
        totalQty: margin.weighed ? margin.totalUnits : (q.totalQty ?? 0),
        daysSold: q.daysSold ?? 0,
      };
    });

const batchCell = (row: BatchRow, key: BatchColKey): string | number => {
  switch (key) {
    case "upc":
      return row.upc;
    case "description":
      return row.description;
    case "marginPct":
      return row.marginPct !== null ? row.marginPct.toFixed(2) : "";
    case "avgSoldAt":
      return row.avgSoldAt.toFixed(2);
    case "listPrice":
      return row.listPrice.toFixed(2);
    case "caseCost":
      return row.caseCost.toFixed(2);
    case "totalQty":
      return row.totalQty;
    case "daysSold":
      return row.daysSold;
  }
};

const dailyCell = (
  b: DayBucket,
  key: DailyColKey,
  saleType: string,
  weighed: boolean,
): string | number => {
  if (key === "date") return b.label;
  if (key === "saleType") return saleType;
  if (!b.hasSale) return "";
  // An each-priced item has no weight; blank rather than a copy of qty.
  if (key === "weight") return weighed ? Number(b.units.toFixed(2)) : "";
  // Cost and margin don't apply to a voided or restored line.
  if (saleType !== "Sale" && (key === "cost" || key === "caseCost" || key === "marginPct")) {
    return "";
  }
  switch (key) {
    case "qty":
      return b.qty;
    case "revenue":
      return b.revenue.toFixed(2);
    case "cost":
      return b.hasCost ? b.cost.toFixed(2) : "";
    case "caseCost": {
      const c = dayUnitCost(b);
      return c !== null ? c.toFixed(2) : "";
    }
    case "listPrice":
      return b.listPrice.toFixed(2);
    case "marginPct": {
      const pct = dayMarginPct(b);
      return pct !== null ? pct.toFixed(2) : "";
    }
  }
};

const COLS: Record<Preset, ColDef[]> = {
  batch: BATCH_COLS,
  daily: DAILY_COLS,
  saleTypes: SALE_TYPE_COLS,
};

const defaultsFor = (src: Preset) =>
  new Set(COLS[src].filter((c) => c.defaultOn).map((c) => c.key));

const LookupExportModal = ({
  queue,
  selectedDescription,
  buckets,
  selectedSaleType,
  weighed,
  onClose,
}: LookupExportModalProps) => {
  const [mode, setMode] = useState<ModalMode>("presets");
  const [preset, setPreset] = useState<Preset>("batch");
  const [source, setSource] = useState<Preset>("batch");
  const [chosenCols, setChosenCols] = useState<Record<Preset, Set<string>>>(() => ({
    batch: defaultsFor("batch"),
    daily: defaultsFor("daily"),
    saleTypes: defaultsFor("saleTypes"),
  }));

  const batchRows = useMemo(() => buildBatchRows(queue), [queue]);
  const saleTypeRows = useMemo(() => buildSaleTypeRows(queue), [queue]);
  const hasSelectedItem = buckets.length > 0;
  // Nothing but Sale — every response from an endpoint without sale_type.
  const hasSaleTypes = saleTypeRows.some((r) => r.saleType !== "Sale");
  const timelineName =
    selectedSaleType === "Sale" ? "sales" : selectedSaleType.toLowerCase();

  const available: Record<Preset, boolean> = {
    batch: batchRows.length > 0,
    daily: hasSelectedItem,
    saleTypes: hasSaleTypes,
  };

  const fileName: Record<Preset, string> = {
    batch: "item-lookup-batch-summary.csv",
    daily: `item-lookup-daily-${timelineName}.csv`,
    saleTypes: "item-lookup-sale-types.csv",
  };

  /** Header and rows for a source, limited to `only` when given. */
  const tableFor = (src: Preset, only?: Set<string>) => {
    const cols = COLS[src].filter((c) => !only || only.has(c.key));
    const rows =
      src === "batch"
        ? batchRows.map((r) => cols.map((c) => batchCell(r, c.key as BatchColKey)))
        : src === "daily"
          ? buckets.map((b) =>
              cols.map((c) =>
                dailyCell(b, c.key as DailyColKey, selectedSaleType, weighed),
              ),
            )
          : saleTypeRows.map((r) =>
              cols.map((c) => saleTypeCell(r, c.key as SaleTypeColKey)),
            );
    return { cols, rows };
  };

  const toggleCol = (src: Preset, key: string) => {
    setChosenCols((prev) => {
      const next = new Set(prev[src]);
      next.has(key) ? next.delete(key) : next.add(key);
      return { ...prev, [src]: next };
    });
  };

  const custom = tableFor(source, chosenCols[source]);

  const handleDownload = () => {
    const src = mode === "presets" ? preset : source;
    const { cols, rows } =
      mode === "presets" ? tableFor(src) : tableFor(src, chosenCols[src]);
    downloadCsv(rowsToCsv(cols.map((c) => c.label), rows), fileName[src]);
    onClose();
  };

  const canDownload =
    mode === "presets"
      ? available[preset]
      : available[source] && custom.cols.length > 0;

  const presetOptions: { key: Preset; title: string; detail: string }[] = [
    {
      key: "batch",
      title: "All items — batch summary",
      detail: `One row per loaded item (${batchRows.length})`,
    },
    {
      key: "daily",
      title: "Current item — daily breakdown",
      detail: hasSelectedItem
        ? `${selectedDescription} · ${timelineName} · one row per day`
        : "Select an item first",
    },
    {
      key: "saleTypes",
      title: "All items — by sale type",
      detail: hasSaleTypes
        ? "One row per loaded item per sale type — Sale, Backup, Cancelled, Voided"
        : "No sale types other than Sale in this batch",
    },
  ];

  const sourceLabels: Record<Preset, string> = {
    batch: "Batch summary",
    daily: "Current item (daily)",
    saleTypes: "By sale type",
  };

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:item-lookup:v2"
      defaultWidth={1140}
      defaultHeight={960}
    >
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-[#1e2a4a]">
          <p className="text-custom-white text-[13px] font-semibold">
            Export CSV
          </p>
          <div className="flex items-center gap-0.5 bg-custom-white/10 rounded-md p-0.5">
            {(["presets", "custom"] as ModalMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  mode === m
                    ? "bg-custom-white text-[#1e2a4a]"
                    : "text-custom-white/70 hover:text-custom-white"
                }`}
              >
                {m === "presets" ? "Presets" : "Custom"}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="text-custom-white/60 hover:text-custom-white transition-colors justify-self-end"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {mode === "presets" ? (
          <div className="p-4">
            <p className="text-[11px] text-content/50 uppercase tracking-wide font-medium mb-2">
              Select data to include
            </p>
            {presetOptions.map((o, i) => (
              <label
                key={o.key}
                className={`flex items-start gap-2.5 py-2.5 cursor-pointer ${
                  i < presetOptions.length - 1 ? "border-b border-gray-100" : ""
                } ${!available[o.key] ? "opacity-40" : ""}`}
              >
                <input
                  type="radio"
                  checked={preset === o.key}
                  onChange={() => setPreset(o.key)}
                  disabled={!available[o.key]}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-[13px] font-medium text-content">{o.title}</p>
                  <p className="text-[11px] text-content/50 mt-0.5">{o.detail}</p>
                </div>
              </label>
            ))}
            <button
              onClick={handleDownload}
              disabled={!canDownload}
              className="w-full mt-3 flex items-center justify-center gap-1.5 bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
            >
              <ArrowDownTrayIcon className="w-3.5 h-3.5" />
              Download CSV
            </button>
          </div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: "200px 1fr" }}>
            <div className="p-3.5 border-r border-gray-100">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-content/45 mb-2">
                Data source
              </p>
              {(Object.keys(sourceLabels) as Preset[]).map((src, i, all) => (
                <label
                  key={src}
                  className={`flex items-center gap-1.5 cursor-pointer ${
                    i === all.length - 1 ? "mb-3.5" : "mb-1.5"
                  } ${!available[src] ? "opacity-40" : ""}`}
                >
                  <input
                    type="radio"
                    checked={source === src}
                    onChange={() => setSource(src)}
                    disabled={!available[src]}
                  />
                  <span className="text-[11.5px] text-content">
                    {sourceLabels[src]}
                  </span>
                </label>
              ))}

              <p className="text-[10px] font-semibold uppercase tracking-wide text-content/45 mb-2">
                Columns
              </p>
              {COLS[source].map((c) => (
                <label
                  key={c.key}
                  className="flex items-center gap-1.5 mb-1.5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={chosenCols[source].has(c.key)}
                    onChange={() => toggleCol(source, c.key)}
                  />
                  <span className="text-[11.5px] text-content">{c.label}</span>
                </label>
              ))}
            </div>

            <div className="p-3.5 flex flex-col">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-content/45 mb-2">
                Preview
              </p>
              <div className="border border-gray-100 rounded-md overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {custom.cols.map((c) => (
                        <th
                          key={c.key}
                          className="text-left px-2.5 py-1.5 text-content/55 font-semibold whitespace-nowrap"
                        >
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {custom.rows.slice(0, PREVIEW_ROWS).map((row, ri) => (
                      <tr key={ri} className="border-b border-gray-50">
                        {row.map((cell, ci) => (
                          <td
                            key={custom.cols[ci].key}
                            className="px-2.5 py-1 text-content/80 whitespace-nowrap"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {custom.rows.length > PREVIEW_ROWS && (
                      <tr>
                        <td
                          colSpan={custom.cols.length}
                          className="px-2.5 py-1.5 text-[10px] text-content/35 italic"
                        >
                          +{custom.rows.length - PREVIEW_ROWS} more rows in download…
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex-1" />
              <div className="flex items-center justify-between mt-3.5">
                <button
                  onClick={onClose}
                  className="text-[12px] text-content/50 hover:text-content transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!canDownload}
                  className="flex items-center gap-1.5 bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
                >
                  <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                  Download CSV
                </button>
              </div>
            </div>
          </div>
        )}
    </ResizableModalShell>
  );
};

export default LookupExportModal;
