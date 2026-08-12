import { useMemo } from "react";
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../hooks";
import {
  setItemReportScope,
  setItemReportActionFilter,
  setItemReportTextFilter,
} from "../../features/itemReportSlice";
import type { ItemScope } from "../../features/itemReportSlice";
import { formatCurrencyCompact } from "../../utils";
import { formatPct, pillClass } from "../../utils/severity";
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

/** Scope precedes action in the filter row because it picks the population the
 *  action counts are counted over. Labelled "All found", never "All" — the wider
 *  set is bounded by what the receiving walk turned up, and a control promising
 *  everything would be read as a guarantee it can't keep. */
const SCOPE_OPTS: { key: ItemScope; label: string }[] = [
  { key: "uploaded", label: "Uploaded" },
  { key: "all", label: "All found" },
];

interface Props {
  rows: SheetRow[];
  counts: Record<ActionKind, number>;
  uploadedCount: number;
  allCount: number;
  receiptsByUpc: Record<string, ReceiptLine[]>;
  selectedUpc: string | null;
  onSelect: (row: SheetRow) => void;
  onSearchOpen: () => void;
  onExportOpen: () => void;
  storeName: string;
  dateLabel: string;
  /** Set when the list arrived from a graded page rather than a file. Naming
   *  the source and the grading basis is what stops the same department
   *  producing a different list next week with nothing on screen to explain
   *  it. */
  sourceLabel: string;
  basisLabel: string;
  receivingComplete: boolean;
  receivingProgress: string;
}

/** Chip and rule colour per action. Kept to one place so the strip, the row
 *  marker and the chip can't disagree about what "reorder" looks like. */
const TONE: Record<ActionKind, { chip: string; ring: string; rule: string }> = {
  investigate: {
    chip: "bg-severity_critical_bg text-severity_critical_text",
    ring: "ring-severity_critical_text/40",
    rule: "border-transparent",
  },
  reorder: {
    chip: "bg-blue-50 text-blue-900",
    ring: "ring-blue-900/40",
    rule: "border-blue-500",
  },
  reprice: {
    chip: "bg-severity_watch_bg text-severity_watch_text",
    ring: "ring-severity_watch_text/40",
    rule: "border-amber-500",
  },
  vendor: {
    chip: "bg-violet-50 text-violet-900",
    ring: "ring-violet-900/40",
    rule: "border-transparent",
  },
  none: {
    chip: "bg-severity_healthy_bg text-severity_healthy_text",
    ring: "ring-severity_healthy_text/40",
    rule: "border-emerald-500",
  },
  insufficient: {
    chip: "bg-gray-100 text-content/85",
    ring: "ring-content/30",
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

const COLS = "96px 1fr 52px 74px 74px 52px 52px 48px 60px";

/**
 * A comparison cell, in the app's list-row treatment — a filled pill rather
 * than coloured text, so the two baselines read as a pair of chips against the
 * plain figures either side of them.
 *
 * Graded on a threshold rather than Sales' binary red/green: a 2% dip is not a
 * crisis, and painting it as one is the false alarm this page exists to avoid.
 */
const DELTA_THRESHOLD = 10;

const DeltaPill = ({ pct }: { pct: number | null }) => (
  <span
    className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center whitespace-nowrap justify-self-end ${pillClass(pct, DELTA_THRESHOLD)}`}
  >
    {pct === null ? "—" : formatPct(pct)}
  </span>
);

const ItemReportSheet = ({
  rows,
  counts,
  uploadedCount,
  allCount,
  receiptsByUpc,
  selectedUpc,
  onSelect,
  onSearchOpen,
  onExportOpen,
  storeName,
  dateLabel,
  sourceLabel,
  basisLabel,
  receivingComplete,
  receivingProgress,
}: Props) => {
  const dispatch = useAppDispatch();
  // Filters live in the slice with everything else. A route change would
  // otherwise silently reset which pile someone was working through, and they
  // would come back to a sheet that looks the same but isn't.
  const filter = useAppSelector((s) => s.itemReport.textFilter);
  const only = useAppSelector((s) => s.itemReport.actionFilter);
  const scope = useAppSelector((s) => s.itemReport.itemScope);

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
              {sourceLabel ? `${sourceLabel} — critical items` : "Critical items report"}
            </div>
            <div className="text-[10px] mt-0.5 text-custom-white/85 truncate">
              {storeName} · {dateLabel} · {rows.length} items
              {basisLabel ? ` · ${basisLabel}` : ""}
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
          {/* Which population, before which pile. The action counts to the right
              are counted over whatever is selected here. */}
          <div
            className="flex items-center flex-shrink-0 rounded overflow-hidden"
            style={{ height: 26 }}
          >
            {SCOPE_OPTS.map(({ key, label }) => {
              const active = scope === key;
              return (
                <button
                  key={key}
                  onClick={() => dispatch(setItemReportScope(key))}
                  className={`px-2.5 h-full text-[12px] font-semibold transition-colors ${
                    active
                      ? "bg-[#1e2a4a] text-custom-white"
                      : "bg-[#1e2a4a]/10 text-content hover:bg-[#1e2a4a]/20"
                  }`}
                >
                  {label}{" "}
                  <span className="tabular-nums">
                    {key === "uploaded" ? uploadedCount : allCount}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="w-px self-stretch bg-gray-200 mx-1 flex-shrink-0" />

          {ORDER.map((action) => (
            <button
              key={action}
              onClick={() =>
                dispatch(
                  setItemReportActionFilter(only === action ? null : action),
                )
              }
              className={`text-[12px] font-semibold px-2 py-1 rounded-full transition-shadow ${TONE[action].chip} ${
                only === action ? `ring-2 shadow-sm ${TONE[action].ring}` : ""
              }`}
            >
              {ACTION_LABEL[action]}{" "}
              <span className="tabular-nums">{counts[action]}</span>
            </button>
          ))}
          <div className="flex-1 min-w-[140px]">
            <TextFilter
              value={filter}
              onChange={(v) => dispatch(setItemReportTextFilter(v))}
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
          className="flex-shrink-0 grid gap-3 px-3 py-1.5 border-b border-gray-100 bg-gray-50 text-[11.5px] font-semibold uppercase tracking-wide text-content/85"
          style={{ gridTemplateColumns: COLS }}
        >
          <span>Action</span>
          <span>Item</span>
          <span className="text-right">Units</span>
          <span className="text-right">vs LW</span>
          <span className="text-right">vs LY</span>
          <span
            className="text-right"
            title="Selling units received, last 14 days"
          >
            Recv
          </span>
          {/* Received less sold over the days both are known for. A change, not
              a level — there is no opening balance anywhere in the data. */}
          <span className="text-right" title="Received less sold, last 14 days">
            Net
          </span>
          <span className="text-right">Last</span>
          {/* Trailing and uncoloured on purpose. Money decides which of forty
              reorders gets done first, but it isn't what the row is about. */}
          <span className="text-right">Sales</span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
          {visible.length === 0 && (
            <div className="py-8 text-center text-[12px] text-content/85">
              No items matched
            </div>
          )}

          {visible.map(({ item, verdict }) => {
            const isSel = item.productCode === selectedUpc;
            const receipts = receiptsByUpc[item.productCode] ?? [];
            const lastDays = receipts[0] ? daysSince(receipts[0].date) : null;
            const tone = TONE[verdict.action];
            return (
              <button
                key={item.productCode}
                onClick={() => onSelect({ item, verdict })}
                className={`w-full text-left border-b border-gray-100 border-l-2 transition-colors ${
                  isSel ? "bg-blue-50" : "even:bg-row_stripe hover:bg-gray-50"
                } ${tone.rule}`}
              >
                <div
                  className="grid gap-3 px-3 pt-1.5 items-center"
                  style={{ gridTemplateColumns: COLS }}
                >
                  <span
                    className={`justify-self-start px-2 py-px rounded-full text-[12px] font-semibold ${tone.chip}`}
                  >
                    {ACTION_LABEL[verdict.action]}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-content truncate">
                      {item.description}
                    </span>
                    <span className="block text-[12px] text-content/85 truncate">
                      {item.department} · {item.vendorName}
                      {/* Says out loud that this row wasn't in the upload —
                          it has no sales, so no export could have contained
                          it. */}
                      {item.discovered && " · from receipts"}
                    </span>
                  </span>
                  {/* Priced selling units — the same basis as Recv and Net,
                      which is what lets the three be read across the row. */}
                  <span
                    className={`text-right text-[13px] font-semibold tabular-nums ${
                      item.ty.units > 0 ? "text-content" : "text-red-700"
                    }`}
                  >
                    {item.ty.units % 1 === 0
                      ? item.ty.units
                      : item.ty.units.toFixed(1)}
                  </span>
                  <DeltaPill pct={item.lwPct} />
                  <DeltaPill pct={item.lyPct} />
                  <span className="text-right text-[12px] font-medium tabular-nums text-content">
                    {item.movement === null ? "—" : item.movement.received}
                  </span>
                  <span
                    className={`text-right text-[12px] font-medium tabular-nums ${
                      item.movement === null
                        ? "text-content/85"
                        : item.movement.net > 0
                          ? "text-amber-700"
                          : "text-content/85"
                    }`}
                    title={
                      item.movement
                        ? `${item.movement.received} received, ${item.movement.sold} sold over ${item.movement.days} days`
                        : undefined
                    }
                  >
                    {item.movement === null
                      ? "—"
                      : `${item.movement.net > 0 ? "+" : ""}${item.movement.net}`}
                  </span>
                  <span
                    className={`text-right text-[12px] font-medium tabular-nums ${
                      lastDays === null
                        ? "text-content/85"
                        : lastDays > 21
                          ? "text-red-700"
                          : "text-content/85"
                    }`}
                  >
                    {lastDays === null
                      ? receivingComplete
                        ? "none"
                        : "…"
                      : `${lastDays}d`}
                  </span>
                  <span className="text-right text-[12px] font-medium tabular-nums text-content/85">
                    {item.ty.sales > 0
                      ? formatCurrencyCompact(item.ty.sales)
                      : "$0"}
                  </span>
                </div>
                <div className="pr-3 pb-2 pt-0.5 text-[12px] leading-relaxed text-content/85 pl-[120px]">
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
