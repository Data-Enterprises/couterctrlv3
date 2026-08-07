import { useMemo, useState } from "react";
import { ArrowDownTrayIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useAppSelector } from "../../../hooks";
import ResizableModalShell from "../../../components/modals/ResizableModalShell";
import { exportData } from "../../../utils/export";
import { formatCurrency2 } from "../../../utils";
import type { ForecastOutlierRow } from "../../../features/forecastSlice";
import { rankRows, TIER_LABEL, type Tier } from "./forecastRanking";
import type { RankEntry } from "./forecastRanking";

/** A row plus its ranking, flattened so `exportData` can read them as fields. */
type RankedRow = ForecastOutlierRow & {
  rank: number | "";
  tier: string;
  sharePct: string;
};

/**
 * The grid's whole organising idea is the ranking, so a CSV that drops it
 * arrives as an unordered list of items. Rows are sorted by contribution and
 * carry their rank, band and share.
 */
const withRank = (
  rows: ForecastOutlierRow[],
  ranks: Map<string, RankEntry>,
): RankedRow[] =>
  [...rows]
    .sort((a, b) => b.fcstTotal - a.fcstTotal)
    .map((row) => {
      const entry = ranks.get(row.upc);
      return {
        ...row,
        rank: entry?.rank ?? "",
        tier: entry ? TIER_LABEL[entry.tier] : "",
        sharePct: entry ? (entry.share * 100).toFixed(1) : "",
      };
    });

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
  | "rank"
  | "tier"
  | "sharePct"
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
  { key: "rank", label: "Rank" },
  { key: "tier", label: "Band" },
  { key: "sharePct", label: "Share %" },
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
const CUSTOM_CHECKBOX = "accent-[#1e2a4a] h-3.5 w-3.5 rounded flex-shrink-0";
const CUSTOM_RADIO = "accent-[#1e2a4a] h-3.5 w-3.5";
const SECTION_LABEL =
  "text-[10px] font-semibold uppercase tracking-wide text-content mb-2";
const DOWNLOAD_BTN =
  "flex items-center gap-1.5 bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors";

const cell = (row: RankedRow, key: ColKey) => {
  switch (key) {
    case "rank":
      return String(row.rank);
    case "tier":
      return row.tier;
    case "sharePct":
      return `${row.sharePct}%`;
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
  const {
    rowData,
    checkedUpcs,
    notFoundUpcs,
    adListRows,
    storeids,
    tierFilter,
  } = useAppSelector((s) => s.forecastDev);
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
                ? "bg-[#1e2a4a] border-[#1e2a4a] text-custom-white"
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

            {/* Contribution scope. Sits above the datasets because it changes
                what every one of them contains — cleared means all tiers,
                rather than an extra toggle that could contradict them. */}
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
