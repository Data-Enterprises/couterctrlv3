import { useState } from "react";
import { ArrowDownTrayIcon, XMarkIcon } from "@heroicons/react/20/solid";
import ResizableModalShell from "../../../components/modals/ResizableModalShell";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { downloadCsv, rowsToCsv } from "../../../utils/csvExport";
import { buildBranches, FACETS } from "./facetModel";
import { buildFacetRows, FACET_HEADERS, facetFileName } from "./facetExport";
import type { FacetKey } from "./facetModel";
import type { WeekWindow } from "../lpActionsMetrics";
import type {
  CashierTransaction,
  TransactionListItem,
} from "../../../interfaces";

/**
 * Export the drill, one cut per selection.
 *
 * Presets are the questions a reader already had on screen; custom is the
 * same six pills with nothing pre-chosen. They write the identical file, so
 * the preset is a shortcut rather than a different export — a reader who
 * picks "Time patterns" and a reader who ticks day, week and hour by hand get
 * the same three cuts, and neither has to learn which mode is the real one.
 */
type Mode = "presets" | "custom";

interface Preset {
  id: string;
  label: string;
  description: string;
  facets: FacetKey[];
}

const PRESETS: Preset[] = [
  {
    id: "time",
    label: "Time patterns",
    description:
      "Day of week, week and hour — whether this is a habit, a spike or a shift.",
    facets: ["dow", "week", "hour"],
  },
  {
    id: "place",
    label: "Register and payment",
    description:
      "Lane and tender type — where it happened and how it was paid.",
    facets: ["lane", "tender"],
  },
  {
    id: "items",
    label: "Items",
    description: "Every item behind these exceptions, by units and amount.",
    facets: ["item"],
  },
  {
    id: "everything",
    label: "Everything",
    description: "All six cuts in one file, stacked and labelled by cut.",
    facets: ["dow", "week", "lane", "hour", "item", "tender"],
  },
];

interface Props {
  onClose: () => void;
  rows: CashierTransaction[];
  lines: TransactionListItem[];
  windows: WeekWindow[];
  saleType: string;
  cashierName: string;
  cashierNumber: number;
  storeName: string;
  /** The facet on screen, so "current view" starts where the reader is. */
  currentFacet: FacetKey;
  linesLoading: boolean;
}

const DrillExportModal = ({
  onClose,
  rows,
  lines,
  windows,
  saleType,
  cashierName,
  cashierNumber,
  storeName,
  currentFacet,
  linesLoading,
}: Props) => {
  const toast = useToast();
  const [mode, setMode] = useState<Mode>("presets");
  const [presets, setPresets] = useState<Set<string>>(new Set(["time"]));
  const [custom, setCustom] = useState<Set<FacetKey>>(new Set([currentFacet]));

  const chosen: FacetKey[] =
    mode === "presets"
      ? [
          ...new Set(
            PRESETS.filter((p) => presets.has(p.id)).flatMap((p) => p.facets),
          ),
        ]
      : [...custom];

  // Ordered as the pills are, so two selections of the same cuts produce
  // byte-identical files whichever mode built them.
  const ordered = FACETS.map((f) => f.key).filter((k) => chosen.includes(k));

  const rowCount = ordered.reduce(
    (acc, key) =>
      acc + buildBranches(rows, lines, windows, saleType, key).length,
    0,
  );

  const download = () => {
    if (ordered.length === 0) return;
    const body = buildFacetRows({
      rows,
      lines,
      windows,
      saleType,
      facets: ordered,
      cashierName,
      cashierNumber,
      storeName,
    });
    if (body.length === 0) {
      toast.warn("Nothing to export for those cuts.");
      return;
    }
    downloadCsv(
      rowsToCsv(FACET_HEADERS, body),
      `${facetFileName(saleType, ordered, windows)}.csv`,
    );
    toast.success("Export successful");
    onClose();
  };

  const togglePreset = (id: string) =>
    setPresets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleFacet = (key: FacetKey) =>
    setCustom((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:lp-drill"
      defaultWidth={620}
      defaultHeight={520}
      minWidth={460}
      minHeight={380}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-[#1e2a4a]">
        <div className="min-w-0">
          <p className="text-custom-white text-[13px] font-semibold truncate">
            Export {saleType}
          </p>
          <p className="text-custom-white text-[10px] mt-0.5 truncate">
            {cashierName} &middot; Cashier {cashierNumber} &middot; {storeName}
          </p>
        </div>
        <div className="flex items-center gap-0.5 bg-custom-white/10 rounded-md p-0.5">
          {(["presets", "custom"] as Mode[]).map((m) => (
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
          className="text-custom-white/85 hover:text-custom-white transition-colors justify-self-end"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar px-4 pt-4 pb-2">
        {mode === "presets" ? (
          <div className="space-y-3">
            <p className="text-[11px] text-content uppercase tracking-wide font-medium">
              Select data to include
            </p>
            {PRESETS.map((p) => (
              <label
                key={p.id}
                className="flex items-start gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={presets.has(p.id)}
                  onChange={() => togglePreset(p.id)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] cursor-pointer flex-shrink-0"
                />
                <div>
                  <p className="text-[13px] font-medium text-content group-hover:text-[#1e2a4a] transition-colors">
                    {p.label}
                  </p>
                  <p className="text-[11px] text-content mt-0.5">
                    {p.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <div>
            <p className="text-[11px] text-content uppercase tracking-wide font-medium mb-2">
              Cut by
            </p>
            <div className="flex flex-wrap gap-1.5">
              {FACETS.map((f) => {
                const on = custom.has(f.key);
                return (
                  <button
                    key={f.key}
                    onClick={() => toggleFacet(f.key)}
                    className={`text-[12px] px-2.5 py-1 rounded-full border transition-colors ${
                      on
                        ? "border-[#1e2a4a] bg-[#1e2a4a] text-custom-white"
                        : "border-gray-200 text-content hover:bg-gray-50"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-content/85 mt-3 leading-relaxed">
              One row per value, with the cut named in its own column — six cuts
              stack into one sheet rather than six. Share of occurrences is
              included, because a count without its denominator is the one thing
              a spreadsheet cannot recover.
            </p>
          </div>
        )}

        {ordered.some(
          (k) => FACETS.find((f) => f.key === k)?.needsLines && linesLoading,
        ) && (
          <p className="text-[11.5px] text-severity_watch_text mt-3">
            Still reading the receipts — hour, item and tender will be
            incomplete until that finishes.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <span className="text-[11.5px] text-content/85">
          {ordered.length === 0
            ? "Nothing selected"
            : `${rowCount} ${rowCount === 1 ? "row" : "rows"} across ${ordered.length} ${ordered.length === 1 ? "cut" : "cuts"}`}
        </span>
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="text-[12px] text-content transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={download}
            disabled={ordered.length === 0 || rowCount === 0}
            className="flex items-center gap-1.5 bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
            Download CSV
          </button>
        </div>
      </div>
    </ResizableModalShell>
  );
};

export default DrillExportModal;
