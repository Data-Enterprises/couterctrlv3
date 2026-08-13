import { useMemo, useState } from "react";
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
import { ACTION_TONE } from "./actionTone";
import InfoButton from "../../components/InfoButton";
import InfoPopover from "../../components/InfoPopover";
import { ITEM_REPORT_INFO } from "./itemReportInfo";
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
 * The action chip is the answer; the reasoning behind it lives in the detail
 * panel's CTA strip and in the export's evidence column. It used to sit under
 * every row, which put a paragraph between each row's figures and cost the list
 * a third of its height — the numbers lost their vertical rhythm and the list
 * stopped being scannable, which is the one thing a sheet has to be.
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
  receivingComplete: boolean;
  receivingProgress: string;
}

/** Chip and rule colour per action. Kept to one place so the strip, the row
 *  marker and the chip can't disagree about what "reorder" looks like. */

/** Operational problems first, then pricing, then the clean rows. Someone
 *  working down the sheet should hit what's costing them soonest. */
/** The chip row. "pending" is deliberately absent — it is not a pile anyone
 *  works through, and a chip for it would invite filtering to a set that empties
 *  itself a few seconds later. The progress strip below already says what is
 *  happening. */
const ORDER: ActionKind[] = [
  "investigate",
  "reorder",
  "reprice",
  "vendor",
  "insufficient",
  "none",
];

/**
 * Action | Item | Units | vs LW | vs LY | Recv | Net | Last | Sales.
 *
 * Action is 92px — 4% off its original 96 — and Units 49px, 5% off its 52. Both
 * lots of slack go to Item, the only `1fr` track, which is what the description
 * and its UPC line actually need.
 *
 * Action has little left to give: "Call vendor" in a 12px semibold pill with
 * `px-2` needs roughly 84. Recv and Net stay at 52 despite matching Units'
 * original width — they carry signed values, so they need the extra character.
 */
const COLS = "92px 1fr 49px 74px 74px 52px 52px 48px 60px";

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
  // Popover open/closed — ephemeral, and the same shape LedgerHeader uses.
  const [infoOpen, setInfoOpen] = useState(false);

  // Row 1 is the three-slot panel header the graded pages use: the entity on
  // the left, what you are looking at in the centre, controls on the right.
  //
  // The centre names the page, not the source. A list can span many departments
  // — a vendor's range routinely does, and an uploaded file almost always does —
  // so a single department name in the title would be wrong more often than
  // right. Where the list came from is on row 2, next to the rule that cut it.
  const centreLabel = ["Item Actions", dateLabel].filter(Boolean).join(" · ");

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
      <div className="bg-custom-white rounded-xl shadow-sm flex flex-col h-full">
        {/* Two rows split by a hairline, matching LedgerHeader: identity and
            the headline count above, the controls that change them below. */}
        <div className="flex-shrink-0 bg-[#1e2a4a] rounded-t-xl px-4 pt-1 pb-2.5 flex flex-col gap-0">
          {/* Row 1: store | what you are looking at | count + export */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 min-h-[26px]">
            <span className="text-custom-white font-semibold text-[13px] truncate justify-self-start">
              {storeName}
            </span>
            <span className="text-custom-white font-semibold text-[13px] justify-self-center truncate">
              {centreLabel}
            </span>
            <div className="flex items-center gap-2 justify-self-end">
              <span className="text-[14px] font-semibold text-custom-white tabular-nums">
                {rows.length} items
              </span>
              <HeaderIconButton onClick={onExportOpen} title="Export CSV">
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
              </HeaderIconButton>
            </div>
          </div>

          {/* Row 2: search + export | scope | grading basis | about */}
          <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-custom-white/[0.08]">
            <HeaderIconButton onClick={onSearchOpen} title="New search">
              <MagnifyingGlassIcon className="w-3.5 h-3.5" />
            </HeaderIconButton>
            <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />

            {/* Which population. Sits where Sales puts its Sales/Qty toggle,
                because it does the same job: it decides what everything to the
                right of it is counted over. */}
            <div
              className="flex items-center flex-shrink-0 rounded overflow-hidden"
              style={{ height: 22 }}
            >
              {SCOPE_OPTS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => dispatch(setItemReportScope(key))}
                  className="px-2.5 text-[10px] text-custom-white font-medium transition-colors h-full"
                  style={{
                    background:
                      scope === key
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(255,255,255,0.07)",
                  }}
                >
                  {label}{" "}
                  <span className="tabular-nums">
                    {key === "uploaded" ? uploadedCount : allCount}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex-1" />

            {/* What every row is built from, and how far back the delivery
                side reaches — the question "Last" and "Recv" always raise.
                Register lines are deliberately not named here: they load per
                item on the right, and no action on this side depends on them. */}
            <span className="text-[11px] text-custom-white font-medium flex-shrink-0 truncate">
              Sales vs Receivers · 90 days
            </span>

            <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />

            <div className="relative flex-shrink-0">
              <InfoButton onClick={() => setInfoOpen((prev) => !prev)} />
              {infoOpen && (
                <InfoPopover
                  title={ITEM_REPORT_INFO.title}
                  purpose={ITEM_REPORT_INFO.purpose}
                  glossary={ITEM_REPORT_INFO.glossary}
                  onClose={() => setInfoOpen(false)}
                  /* 20% wider than the shared default (260/500). This page has
                     six actions to define plus their evidence columns, and at
                     the standard width every entry wrapped to four lines. */
                  className="min-w-[312px] max-w-[600px]"
                />
              )}
            </div>
          </div>
        </div>

        {/* The piles. Clicking one narrows the sheet, but the sheet is already
            complete — this is for working one kind of problem at a time. The
            scope toggle these counts are computed over lives in the header, one
            level up, which is the order the two are actually applied in. */}
        <div className="flex-shrink-0 px-3 py-2 border-b border-gray-100 flex items-center gap-1.5 flex-wrap">
          {ORDER.map((action) => (
            <button
              key={action}
              onClick={() =>
                dispatch(
                  setItemReportActionFilter(only === action ? null : action),
                )
              }
              className={`text-[12px] font-semibold px-2 py-1 rounded-full transition-shadow ${ACTION_TONE[action].chip} ${
                only === action
                  ? `ring-2 shadow-sm ${ACTION_TONE[action].ring}`
                  : ""
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

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar rounded-b-xl">
          {visible.length === 0 && (
            <div className="py-8 text-center text-[12px] text-content/85">
              No items matched
            </div>
          )}

          {visible.map(({ item, verdict }) => {
            const isSel = item.productCode === selectedUpc;
            const receipts = receiptsByUpc[item.productCode] ?? [];
            const lastDays = receipts[0] ? daysSince(receipts[0].date) : null;
            const tone = ACTION_TONE[verdict.action];
            return (
              <button
                key={item.productCode}
                onClick={() => onSelect({ item, verdict })}
                className={`w-full text-left border-b border-gray-100 border-l-2 transition-colors ${
                  isSel ? "bg-blue-50" : "even:bg-row_stripe hover:bg-gray-50"
                } ${tone.rule}`}
              >
                <div
                  // Symmetric now that nothing sits beneath it. The evidence
                  // line used to carry the bottom padding, so removing it left
                  // every row top-padded and flush against its own border.
                  className="grid gap-3 px-3 py-2.5 items-center"
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
                    <span className="block text-[12px] font-medium text-content/85 truncate">
                      {item.productCode} · {item.department} · {item.vendorName}
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
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ItemReportSheet;
