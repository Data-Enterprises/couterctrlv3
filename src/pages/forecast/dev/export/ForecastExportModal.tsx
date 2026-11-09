// Hooks
import { useMemo, useState } from "react";
import { useAppSelector } from "../../../../hooks";

// Utils
import { exportData } from "../../../../utils/export";
import { rankRows, TIER_LABEL } from "../utils/forecastRanking";
import {
  cell,
  CHECKBOX,
  COLS,
  CUSTOM_CHECKBOX,
  CUSTOM_RADIO,
  DOWNLOAD_BTN,
  NOT_FOUND_HEADERS,
  PREVIEW_ROWS,
  SECTION_LABEL,
  withRank,
} from "./utils";

// Interfaces
import type { ColKey, ModalMode, PresetId } from "./interfaces";
import type { Tier } from "../interfaces";
import type { ForecastOutlierRow } from "../../../../features/dev/devForecastSlice";

// Components
import { ArrowDownTrayIcon, XMarkIcon } from "@heroicons/react/24/outline";
import ResizableModalShell from "../../../../components-dev/modals/ResizableModalShell";

/**
 * Forecast export, with the other export modals' shell and Presets/Custom
 * split. Presets are multi-select: each ticked one downloads as its own file.
 */
const ForecastExportModal = ({ onClose }: { onClose: () => void }) => {
  const {
    rowData,
    checkedUpcs,
    notFoundUpcs,
    adListRows,
    storeids,
    tierFilter,
  } = useAppSelector((s) => s.dev.forecastDev);
  const singleDate = useAppSelector((s) => s.search.singleDate);

  const [mode, setMode] = useState<ModalMode>("presets");
  const [selected, setSelected] = useState<Set<PresetId>>(
    () => new Set<PresetId>(["selected"]),
  );
  const [cols, setCols] = useState<Set<ColKey>>(
    () => new Set(COLS.map((c) => c.key)),
  );
  const [customScope, setCustomScope] = useState<"selected" | "all">(
    "selected",
  );
  /** Seeded from the grid, then editable here — the download should match what
   *  you were looking at, without being locked to it. */
  const [tiers, setTiers] = useState<Tier[]>(tierFilter);

  const toggleTier = (tier: Tier) =>
    setTiers((prev) =>
      prev.includes(tier) ? prev.filter((x) => x !== tier) : [...prev, tier],
    );

  const ticked = useMemo(
    () => rowData.filter((r) => checkedUpcs.includes(r.upc)),
    [rowData, checkedUpcs],
  );

  /** Ranked over the ticked set, exactly as the grid does, so a tier means the
   *  same thing in both places. */
  const ranks = useMemo(() => rankRows(ticked), [ticked]);

  const inTier = useMemo(
    () => (row: ForecastOutlierRow) => {
      if (tiers.length === 0) return true;
      const tier = ranks.get(row.upc)?.tier;
      return tier ? tiers.includes(tier) : false;
    },
    [ranks, tiers],
  );

  const selectedRows = useMemo(
    () => withRank(ticked.filter(inTier), ranks),
    [ticked, inTier, ranks],
  );

  const allRows = useMemo(() => {
    // Ranked over everything, not over the ticked subset — "All items" is a
    // different population, so a row's band can legitimately differ here.
    const allRanks = rankRows(rowData);
    const inScope =
      tiers.length === 0
        ? rowData
        : rowData.filter((r) => {
            const tier = allRanks.get(r.upc)?.tier;
            return tier ? tiers.includes(tier) : false;
          });
    return withRank(inScope, allRanks);
  }, [rowData, tiers]);

  const tierCountsFor = useMemo(() => {
    const out: Record<Tier, number> = { A: 0, B: 0, C: 0 };
    for (const entry of ranks.values()) out[entry.tier] += 1;
    return out;
  }, [ranks]);

  const tierChips = (
    <div className="flex items-center gap-1.5 flex-wrap">
      {(["A", "B", "C"] as const).map((tier) => {
        const on = tiers.includes(tier);
        return (
          <button
            key={tier}
            onClick={() => toggleTier(tier)}
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
              on
                ? "bg-brand_navy border-brand_navy text-custom-white"
                : "bg-custom-white border-gray-200 text-content"
            }`}
          >
            {TIER_LABEL[tier]} ({tierCountsFor[tier]})
          </button>
        );
      })}
      <span className="text-[10px] text-content">
        {tiers.length === 0 ? "All tiers" : `${tiers.join(" + ")} only`}
      </span>
    </div>
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
  const customRows = customScope === "selected" ? selectedRows : allRows;
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
      description: `Everything the search returned (${allRows.length})`,
      disabled: allRows.length === 0,
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
      exportData(allRows, allHeaders, `forecast_all_${stamp}.csv`);
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
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-brand_navy">
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
                  ? "bg-custom-white text-brand_navy"
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

            {/* Contribution scope, above the datasets because it changes
                what each contains; cleared means all tiers. */}
            {tierChips}

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
                  <p className="text-[13px] font-medium text-content group-hover:text-brand_navy transition-colors">
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
                <p className={SECTION_LABEL}>Tiers</p>
                {tierChips}
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
