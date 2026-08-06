import { useMemo, useState } from "react";
import { ArrowDownTrayIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useAppSelector } from "../../../hooks";
import ResizableModalShell from "../../../components/modals/ResizableModalShell";
import { exportData } from "../../../utils/export";
import { formatCurrency2 } from "../../../utils";
import type { ForecastOutlierRow } from "../../../features/forecastSlice";

/**
 * Forecast export.
 *
 * Same shell, header and Presets/Custom split as the other export modals —
 * `CategoryExportModal` / `VendorExportModal` / `OrdersExportModal`. Presets are
 * multi-select: tick several and each downloads as its own file, which is why
 * they're checkboxes rather than radios. Custom is the `200px 1fr` split with a
 * live preview and its own footer.
 */

type ModalMode = "presets" | "custom";
type PresetId = "selected" | "all" | "notFound";
type ColKey =
  | "upc"
  | "description"
  | "notes"
  | "qtySold"
  | "daysActive"
  | "daysAtPrice"
  | "forecastWindow"
  | "adDays"
  | "fcstPrice"
  | "adFcst"
  | "fcstTotal"
  | "markdownDollars";

const COLS: { key: ColKey; label: string }[] = [
  { key: "upc", label: "UPC" },
  { key: "description", label: "Description" },
  { key: "notes", label: "Notes" },
  { key: "qtySold", label: "Qty sold" },
  { key: "daysActive", label: "Days active" },
  { key: "daysAtPrice", label: "Days at price" },
  { key: "forecastWindow", label: "Forecast" },
  { key: "adDays", label: "Ad days" },
  { key: "fcstPrice", label: "Price" },
  { key: "adFcst", label: "Ad fcst" },
  { key: "fcstTotal", label: "Total" },
  { key: "markdownDollars", label: "Markdown" },
];

const NOT_FOUND_HEADERS = [
  { headerName: "UPC", field: "upc" },
  { headerName: "Page Name", field: "pageName" },
  { headerName: "Feature Description", field: "featureDescription" },
  { headerName: "Feature Notes", field: "featureNotes" },
];

const PREVIEW_ROWS = 8;

const CHECKBOX =
  "mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] cursor-pointer flex-shrink-0 disabled:cursor-not-allowed";
const CUSTOM_CHECKBOX =
  "accent-[#1e2a4a] h-3.5 w-3.5 rounded flex-shrink-0";
const CUSTOM_RADIO = "accent-[#1e2a4a] h-3.5 w-3.5";
const SECTION_LABEL =
  "text-[10px] font-semibold uppercase tracking-wide text-content mb-2";
const DOWNLOAD_BTN =
  "flex items-center gap-1.5 bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors";

const cell = (row: ForecastOutlierRow, key: ColKey) => {
  switch (key) {
    case "notes":
      return row.notes ?? "";
    case "daysActive":
      return `${row.daysActive}/90`;
    case "daysAtPrice":
      return `${row.daysAtPrice}/${row.daysActive}`;
    case "adDays":
      return row.adDays === 0 ? "—" : String(row.adDays);
    case "fcstPrice":
      return formatCurrency2(row.fcstPrice);
    case "fcstTotal":
      return formatCurrency2(row.fcstTotal);
    case "markdownDollars":
      return formatCurrency2(Math.max(0, row.markdownDollars));
    default:
      return String(row[key] ?? "");
  }
};

const ForecastExportModal = ({ onClose }: { onClose: () => void }) => {
  const { rowData, checkedUpcs, notFoundUpcs, adListRows, storeids } =
    useAppSelector((s) => s.forecastDev);
  const singleDate = useAppSelector((s) => s.search.singleDate);

  const [mode, setMode] = useState<ModalMode>("presets");
  const [selected, setSelected] = useState<Set<PresetId>>(
    () => new Set<PresetId>(["selected"]),
  );
  const [cols, setCols] = useState<Set<ColKey>>(
    () => new Set(COLS.map((c) => c.key)),
  );
  const [customScope, setCustomScope] = useState<"selected" | "all">("selected");

  const selectedRows = useMemo(
    () => rowData.filter((r) => checkedUpcs.includes(r.upc)),
    [rowData, checkedUpcs],
  );

  const togglePreset = (id: PresetId) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const toggleCol = (key: ColKey) =>
    setCols((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });

  const activeCols = COLS.filter((c) => cols.has(c.key));
  const customRows = customScope === "selected" ? selectedRows : rowData;
  const stamp = singleDate.replace(/\//g, "-");
  const allHeaders = COLS.map((c) => ({ headerName: c.label, field: c.key }));

  const presetDatasets: {
    id: PresetId;
    label: string;
    description: string;
    disabled: boolean;
  }[] = [
    {
      id: "selected",
      label: "Selected items",
      description: `One row per ticked item (${selectedRows.length})`,
      disabled: selectedRows.length === 0,
    },
    {
      id: "all",
      label: "All items",
      description: `Everything the search returned (${rowData.length})`,
      disabled: rowData.length === 0,
    },
    {
      id: "notFound",
      label: "No sales history",
      description:
        notFoundUpcs.length > 0
          ? `UPCs the stores returned nothing for (${notFoundUpcs.length})`
          : "Every UPC came back with history",
      disabled: notFoundUpcs.length === 0,
    },
  ];

  const handlePresetDownload = () => {
    if (selected.has("selected"))
      exportData(selectedRows, allHeaders, `forecast_selected_${stamp}.csv`);
    if (selected.has("all"))
      exportData(rowData, allHeaders, `forecast_all_${stamp}.csv`);
    if (selected.has("notFound"))
      exportData(
        notFoundUpcs.map((upc) => ({
          upc,
          pageName: adListRows[upc]?.pageName ?? "",
          featureDescription: adListRows[upc]?.featureDescription ?? "",
          featureNotes: adListRows[upc]?.featureNotes ?? "",
        })),
        NOT_FOUND_HEADERS,
        `forecast_no_history_${stamp}.csv`,
      );
    onClose();
  };

  const handleCustomDownload = () => {
    exportData(
      customRows,
      activeCols.map((c) => ({ headerName: c.label, field: c.key })),
      `forecast_custom_${stamp}.csv`,
    );
    onClose();
  };

  const scopeLabel = storeids.includes(",")
    ? `${storeids.split(",").length} stores`
    : `Store ${storeids}`;

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:forecast:v2"
      defaultWidth={1140}
      defaultHeight={760}
    >
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-[#1e2a4a]">
        <div>
          <p className="text-custom-white text-[13px] font-semibold">
            Export CSV
          </p>
          <p className="text-custom-white text-[10px] mt-0.5">
            {scopeLabel} · 90 days ending {singleDate}
          </p>
        </div>
        <div className="flex items-center gap-0.5 bg-custom-white/10 rounded-md p-0.5">
          {(["presets", "custom"] as ModalMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                mode === m
                  ? "bg-custom-white text-[#1e2a4a]"
                  : "text-custom-white"
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

      {/* ── PRESETS ── */}
      {mode === "presets" && (
        <>
          <div className="px-4 pt-4 pb-2 space-y-3 overflow-y-auto thin-scrollbar">
            <p className="text-[11px] text-content uppercase tracking-wide font-medium">
              Select data to include
            </p>

            {presetDatasets.map(({ id, label, description, disabled }) => (
              <label
                key={id}
                className={`flex items-start gap-3 group ${
                  disabled ? "opacity-40" : "cursor-pointer"
                }`}
              >
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={selected.has(id)}
                  onChange={() => togglePreset(id)}
                  className={CHECKBOX}
                />
                <div>
                  <p className="text-[13px] font-medium text-content group-hover:text-[#1e2a4a] transition-colors">
                    {label}
                  </p>
                  <p className="text-[11px] text-content mt-0.5">
                    {description}
                  </p>
                </div>
              </label>
            ))}

            <p className="text-[10px] text-content leading-relaxed">
              Prices, ad days and notes export as they stand on screen, not as
              they first loaded. Ticking more than one downloads a file each.
            </p>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-2">
            <button
              onClick={onClose}
              className="text-[12px] text-content transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePresetDownload}
              disabled={selected.size === 0}
              className={DOWNLOAD_BTN}
            >
              <ArrowDownTrayIcon className="w-3.5 h-3.5" />
              Download CSV
            </button>
          </div>
        </>
      )}

      {/* ── CUSTOM ── */}
      {mode === "custom" && (
        <>
          <div className="grid grid-cols-[200px_1fr] divide-x divide-gray-100 min-h-[360px] max-h-[calc(100vh-220px)]">
            <div className="overflow-y-auto no-scrollbar p-4 space-y-5">
              <div>
                <p className={SECTION_LABEL}>Rows</p>
                <div className="flex flex-col gap-1.5">
                  {(["selected", "all"] as const).map((s) => (
                    <label
                      key={s}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        checked={customScope === s}
                        onChange={() => setCustomScope(s)}
                        className={CUSTOM_RADIO}
                      />
                      <span className="text-[12px] text-content">
                        {s === "selected"
                          ? `Selected (${selectedRows.length})`
                          : `All items (${rowData.length})`}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-[10px] text-content mt-2 leading-relaxed">
                  Selected follows the ticks in the item panel.
                </p>
              </div>

              <div>
                <p className={SECTION_LABEL}>Columns</p>
                <div className="flex flex-col gap-1.5">
                  {COLS.map((c) => (
                    <label
                      key={c.key}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={cols.has(c.key)}
                        onChange={() => toggleCol(c.key)}
                        className={CUSTOM_CHECKBOX}
                      />
                      <span className="text-[12px] text-content">
                        {c.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
                <p className="text-[11px] font-semibold text-content uppercase tracking-wide">
                  Preview
                </p>
                <span className="text-[10px] text-content">
                  {activeCols.length === 0 || customRows.length === 0
                    ? "No data — select at least one column"
                    : `Showing ${Math.min(PREVIEW_ROWS, customRows.length)} of ${customRows.length} rows`}
                </span>
              </div>

              {activeCols.length === 0 || customRows.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-6 text-center">
                  <p className="text-[12px] text-content leading-relaxed">
                    {customRows.length === 0 ? (
                      <>
                        No rows in scope — tick items in the panel
                        <br />
                        or switch to All items.
                      </>
                    ) : (
                      <>Select at least one column to see a preview.</>
                    )}
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-auto thin-scrollbar">
                  <table className="min-w-full text-[11px] border-collapse">
                    <thead className="sticky top-0 bg-gray-50 z-10">
                      <tr>
                        {activeCols.map((c) => (
                          <th
                            key={c.key}
                            className="text-left px-3 py-2 text-content font-semibold border-b border-gray-100 whitespace-nowrap"
                          >
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {customRows.slice(0, PREVIEW_ROWS).map((r) => (
                        <tr key={r.upc} className="border-b border-gray-100">
                          {activeCols.map((c) => (
                            <td
                              key={c.key}
                              className="px-3 py-1.5 text-content whitespace-nowrap tabular-nums"
                            >
                              {cell(r, c.key)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <button
              onClick={onClose}
              className="text-[12px] text-content transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCustomDownload}
              disabled={!activeCols.length || !customRows.length}
              className={DOWNLOAD_BTN}
            >
              <ArrowDownTrayIcon className="w-3.5 h-3.5" />
              Download CSV
            </button>
          </div>
        </>
      )}
    </ResizableModalShell>
  );
};

export default ForecastExportModal;
