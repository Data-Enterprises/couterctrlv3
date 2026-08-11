import { useMemo, useState } from "react";
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/20/solid";
import { formatCurrencyCompact } from "../../utils";
import TextFilter from "../../components/filters/TextFilter";
import HeaderIconButton from "../../components/HeaderIconButton";
import {
  ACTION_LABEL,
  ACTION_RANK,
  daysSince,
  type ActionKind,
  type ReportItem,
  type Verdict,
} from "./itemReportMetrics";
import type { ReceiptLine } from "./itemReportData";

/**
 * The report itself: one row per item, its action, and the evidence for it.
 *
 * A spreadsheet on purpose. The people reading this live in Excel, and the
 * value isn't in replacing that with a dashboard — it's in a sheet that has
 * already done the reading. Columns stay aligned and scannable; what's added is
 * that every row states what to do and why, so scanning down the page is the
 * diagnosis rather than the input to one.
 *
 * Rows stay neutral and the action chip carries the colour. Tinting whole rows
 * by action turns a 300-row sheet into a rainbow and destroys the one thing a
 * spreadsheet is good at.
 *
 * Nothing here requires interaction. The work was done on the performance pages
 * upstream; arriving here, the answer should already be on the page. The
 * filters and the row selection are conveniences, not steps.
 */

export interface SheetRow {
  item: ReportItem;
  verdict: Verdict;
}

interface Props {
  rows: SheetRow[];
  counts: Record<ActionKind, number>;
  receiptsByUpc: Map<string, ReceiptLine[]>;
  selectedUpc: string | null;
  onSelect: (row: SheetRow) => void;
  onSearchOpen: () => void;
  onExportOpen: () => void;
  storeName: string;
  dateLabel: string;
  receivingComplete: boolean;
  receivingProgress: string;
}

/** Chip and rule colour per action. Kept to one place so the strip, the row
 *  marker and the chip can't disagree about what "reorder" looks like. */
const TONE: Record<ActionKind, { chip: string; rule: string }> = {
  investigate: { chip: "bg-red-50 text-red-900", rule: "border-red-500" },
  reorder: { chip: "bg-blue-50 text-blue-900", rule: "border-blue-500" },
  reprice: { chip: "bg-amber-50 text-amber-900", rule: "border-amber-500" },
  vendor: { chip: "bg-violet-50 text-violet-900", rule: "border-violet-500" },
  none: { chip: "bg-emerald-50 text-emerald-900", rule: "border-emerald-500" },
  insufficient: {
    chip: "bg-gray-100 text-content/70",
    rule: "border-gray-300",
  },
};

/** Operational problems first, then pricing, then the clean rows. Someone
 *  working down the sheet should hit what's costing them soonest. */
const ORDER: ActionKind[] = [
  "investigate",
  "reorder",
  "reprice",
  "vendor",
  "insufficient",
  "none",
];

const COLS = "84px 1fr 62px 50px 50px 56px";

const pct = (v: number | null) =>
  v === null ? "—" : `${v > 0 ? "+" : ""}${Math.round(v)}%`;

const pctTone = (v: number | null) => {
  if (v === null) return "text-content/40";
  if (v <= -25) return "text-red-700";
  if (v <= -10) return "text-amber-700";
  if (v >= 10) return "text-emerald-700";
  return "text-content/70";
};

const ItemReportSheet = ({
  rows,
  counts,
  receiptsByUpc,
  selectedUpc,
  onSelect,
  onSearchOpen,
  onExportOpen,
  storeName,
  dateLabel,
  receivingComplete,
  receivingProgress,
}: Props) => {
  const [filter, setFilter] = useState("");
  const [only, setOnly] = useState<ActionKind | null>(null);

  const term = filter.trim().toLowerCase();
  const visible = useMemo(() => {
    const matched = rows.filter((r) => {
      if (only && r.verdict.action !== only) return false;
      if (!term) return true;
      return (
        r.item.description.toLowerCase().includes(term) ||
        r.item.productCode.includes(term) ||
        r.item.department.toLowerCase().includes(term) ||
        r.item.vendorName.toLowerCase().includes(term)
      );
    });
    // Action first, then money — the biggest loss inside the worst pile.
    return [...matched].sort(
      (a, b) =>
        ACTION_RANK[a.verdict.action] - ACTION_RANK[b.verdict.action] ||
        b.item.ty.sales - a.item.ty.sales,
    );
  }, [rows, only, term]);

  return (
    <div className="flex-1 min-w-0 shadow-lg">
      <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
        <div className="flex-shrink-0 px-4 py-[10px] flex items-center justify-between gap-3 bg-[#1e2a4a]">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-custom-white leading-tight truncate">
              Critical items report
            </div>
            <div className="text-[10px] mt-0.5 text-custom-white truncate">
              {storeName} · {dateLabel} · {rows.length} items
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <HeaderIconButton onClick={onExportOpen} title="Export CSV">
              <ArrowDownTrayIcon className="h-3 w-3" />
            </HeaderIconButton>
            <HeaderIconButton onClick={onSearchOpen} title="New search">
              <MagnifyingGlassIcon className="h-3 w-3" />
            </HeaderIconButton>
          </div>
        </div>

        {/* The piles. Clicking one narrows the sheet, but the sheet is already
            complete — this is for working one kind of problem at a time. */}
        <div className="flex-shrink-0 px-3 py-2 border-b border-gray-100 flex items-center gap-1.5 flex-wrap">
          {ORDER.map((action) => (
            <button
              key={action}
              onClick={() => setOnly(only === action ? null : action)}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${TONE[action].chip} ${
                only === action ? "ring-1 ring-inset ring-content/25" : ""
              } ${only && only !== action ? "opacity-45" : ""}`}
            >
              {ACTION_LABEL[action]}{" "}
              <span className="tabular-nums">{counts[action]}</span>
            </button>
          ))}
          <div className="flex-1 min-w-[140px]">
            <TextFilter
              value={filter}
              onChange={setFilter}
              placeholder="Filter items…"
            />
          </div>
        </div>

        {!receivingComplete && (
          <div className="flex-shrink-0 px-4 py-1.5 bg-amber-50 text-[11px] text-amber-900">
            Reading deliveries — {receivingProgress}. Actions that depend on
            receipts are provisional until this finishes.
          </div>
        )}

        <div
          className="flex-shrink-0 grid px-3 py-1.5 border-b border-gray-200 bg-gray-50 text-[9.5px] font-semibold uppercase tracking-wider text-content/50"
          style={{ gridTemplateColumns: COLS }}
        >
          <span>Action</span>
          <span>Item</span>
          <span className="text-right">Sales</span>
          <span className="text-right">vs LW</span>
          <span className="text-right">vs LY</span>
          <span className="text-right">Received</span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
          {visible.length === 0 && (
            <div className="py-8 text-center text-[12px] text-content/60">
              No items matched
            </div>
          )}

          {visible.map(({ item, verdict }) => {
            const isSel = item.productCode === selectedUpc;
            const receipts = receiptsByUpc.get(item.productCode) ?? [];
            const lastDays = receipts[0] ? daysSince(receipts[0].date) : null;
            const tone = TONE[verdict.action];
            return (
              <button
                key={item.productCode}
                onClick={() => onSelect({ item, verdict })}
                className={`w-full text-left border-b border-gray-100 border-l-2 transition-colors ${
                  isSel ? "bg-blue-50" : "hover:bg-gray-50"
                } ${tone.rule}`}
              >
                <div
                  className="grid px-3 pt-1.5 gap-1 items-baseline"
                  style={{ gridTemplateColumns: COLS }}
                >
                  <span
                    className={`justify-self-start px-1.5 py-px rounded text-[10px] font-medium ${tone.chip}`}
                  >
                    {ACTION_LABEL[verdict.action]}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12px] text-content truncate">
                      {item.description}
                    </span>
                    <span className="block text-[10.5px] text-content/50 truncate">
                      {item.department} · {item.vendorName}
                      {/* Says out loud that this row wasn't in the upload —
                          it has no sales, so no export could have contained
                          it. */}
                      {item.discovered && " · from receipts"}
                    </span>
                  </span>
                  <span className="text-right text-[11.5px] tabular-nums text-content">
                    {item.ty.sales > 0
                      ? formatCurrencyCompact(item.ty.sales)
                      : "$0"}
                  </span>
                  <span
                    className={`text-right text-[11.5px] tabular-nums ${pctTone(item.lwPct)}`}
                  >
                    {pct(item.lwPct)}
                  </span>
                  <span
                    className={`text-right text-[11.5px] tabular-nums ${pctTone(item.lyPct)}`}
                  >
                    {pct(item.lyPct)}
                  </span>
                  <span
                    className={`text-right text-[11.5px] tabular-nums ${
                      lastDays === null
                        ? "text-content/40"
                        : lastDays > 21
                          ? "text-red-700"
                          : "text-content/70"
                    }`}
                  >
                    {lastDays === null
                      ? receivingComplete
                        ? "none"
                        : "…"
                      : `${lastDays}d`}
                  </span>
                </div>
                <div className="px-3 pb-2 pt-0.5 text-[11px] leading-relaxed text-content/70 pl-[100px]">
                  {verdict.evidence}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ItemReportSheet;
