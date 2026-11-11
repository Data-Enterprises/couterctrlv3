// Hooks
import { useMemo, useState } from "react";

// Utils
import { rowsToCsv, downloadCsv } from "../../../../../utils/csvExport";
import {
  batchCell,
  buildBatchRows,
  buildSaleTypeRows,
  COLS,
  dailyCell,
  defaultsFor,
  PREVIEW_ROWS,
  saleTypeCell,
} from "../utils";

// Interfaces
import type { DayBucket } from "../../interfaces";
import type {
  BatchColKey,
  DailyColKey,
  ModalMode,
  Preset,
  SaleTypeColKey,
} from "../interfaces";
import type { QueueItem } from "../../../../../features/dev/devItemLookupSlice";

// Components
import { ArrowDownTrayIcon, XMarkIcon } from "@heroicons/react/20/solid";
import ResizableModalShell from "../../../../../components-dev/modals/ResizableModalShell";

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

/** The Item lookup CSV export pop-up. Presets offers the batch summary, the current item's daily breakdown and the
 *  by-sale-type rows; Custom picks a source and its columns with a live preview. */
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
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-brand_navy">
          <p className="cc-navy-title text-[13px]">
            Export CSV
          </p>
          <div className="flex items-center gap-0.5 bg-custom-white/10 rounded-md p-0.5">
            {(["presets", "custom"] as ModalMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  mode === m
                    ? "bg-custom-white text-brand_navy"
                    : "text-custom-white/95 hover:text-custom-white"
                }`}
              >
                {m === "presets" ? "Presets" : "Custom"}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="cc-navy-link justify-self-end"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {mode === "presets" ? (
          <div className="p-4">
            <p className="text-[11px] text-content/95 uppercase tracking-wide font-medium mb-2">
              Select data to include
            </p>
            {presetOptions.map((o, i) => (
              <label
                key={o.key}
                className={`flex items-start gap-2.5 py-2.5 cursor-pointer ${
                  i < presetOptions.length - 1 ? "border-b border-line_hair" : ""
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
                  <p className="text-[11px] text-content/95 mt-0.5">{o.detail}</p>
                </div>
              </label>
            ))}
            <button
              onClick={handleDownload}
              disabled={!canDownload}
              className="w-full mt-3 flex items-center justify-center gap-1.5 cc-btn-primary hover:bg-brand_navy/85 text-[12px]"
            >
              <ArrowDownTrayIcon className="w-3.5 h-3.5" />
              Download CSV
            </button>
          </div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: "200px 1fr" }}>
            <div className="p-3.5 border-r border-line_hair">
              <p className="text-[10px] cc-caps mb-2">
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

              <p className="text-[10px] cc-caps mb-2">
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
              <p className="text-[10px] cc-caps mb-2">
                Preview
              </p>
              <div className="border border-line_hair rounded-md overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-fill_soft border-b border-line_hair">
                      {custom.cols.map((c) => (
                        <th
                          key={c.key}
                          className="text-left px-2.5 py-1.5 text-content/95 font-semibold whitespace-nowrap"
                        >
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {custom.rows.slice(0, PREVIEW_ROWS).map((row, ri) => (
                      <tr key={ri} className="border-b border-line_faint">
                        {row.map((cell, ci) => (
                          <td
                            key={custom.cols[ci].key}
                            className="px-2.5 py-1 text-content/95 whitespace-nowrap"
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
                          className="px-2.5 py-1.5 text-[10px] text-content/95 italic"
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
                  className="text-[12px] cc-muted-link"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!canDownload}
                  className="flex items-center gap-1.5 cc-btn-primary hover:bg-brand_navy/85 text-[12px]"
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
