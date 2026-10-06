import { useMemo } from "react";
import { formatCurrency2, formatBigNumber } from "../../../../utils";
import { applyStoreNumberToName } from "../shared/ledgerUtils";
import {
  compareStores,
  groupDays,
  scopeToDay,
  DEFAULT_BANDS,
  type ComparisonRow,
  type Excluded,
  type Verdict,
} from "../shared/storeComparison";
import PopupDaySidebar from "./PopupDaySidebar";
import SortHeader, { PERF_SORT_HEADER } from "../../../../components-dev/SortHeader";
import { useTriStateSort } from "../../../../utils/useTriStateSort";
import type { LedgerRowData } from "./LedgerRow";
import type { GradingMetric } from "../../../../features/dev/devSalesLedgerSlice";

/**
 * Where every store stands inside the group that was searched.
 *
 * The right panel's resting state. It is shown when nothing is selected, which
 * is the state the panel has always had and has always spent on an empty
 * prompt — so this is not a new surface, it is the one that was already there
 * saying nothing.
 *
 * All of the arithmetic is in `shared/storeComparison`; nothing is computed
 * here. Selecting a day re-asks the whole question of that day by handing
 * `scopeToDay`'s rows to the same function.
 */

type Col =
  | "ty"
  | "contribution"
  | "shareDelta"
  | "expected"
  | "gap"
  | "gapPct"
  | "ownPct";

interface Props {
  rows: LedgerRowData[];
  gradingMetric: GradingMetric;
  /** The page's own threshold, so the comparison bands move with the control
   *  the severity dot already answers to. */
  threshold: number;
  /** Shared with the store popup — picking Saturday here keeps Saturday when
   *  a store is opened. */
  selectedDate: string | null;
  onSelectDay: (date: string | null) => void;
  onSelectStore: (row: LedgerRowData) => void;
}

const VERDICT_LABEL: Record<Verdict, string> = {
  rising: "Rising",
  consistent: "Consistent",
  falling: "Falling",
};

/** Tone, not grade: these say which way, and the page's severity dots say how
 *  badly. Through the delta tokens, never a Tailwind palette. */
const VERDICT_CLASS: Record<Verdict, string> = {
  rising: "bg-delta_positive_bg text-delta_positive_text",
  consistent: "bg-gray-100 text-content/85",
  falling: "bg-delta_negative_bg text-delta_negative_text",
};

const EXCLUDED_LABEL: Record<Excluded, string> = {
  "no-last-year": "No last year",
  "partial-week": "Short week",
  "nothing-last-year": "Nothing last year",
};

const EXCLUDED_WHY: Record<Excluded, string> = {
  "no-last-year": "No matching week last year, so there is no usual share to compare against.",
  "partial-week":
    "Last year covers only part of this week. A partial week understates the store's usual share, which would make a bad week look like a win.",
  "nothing-last-year":
    "The store recorded nothing last year, so its usual share cannot be worked out.",
};

const pct1 = (v: number | null) =>
  v === null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

const points1 = (v: number | null) =>
  v === null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(1)} pt`;

const share1 = (v: number | null) => (v === null ? "—" : `${(v * 100).toFixed(1)}%`);

const GroupComparisonPanel = ({
  rows,
  gradingMetric,
  threshold,
  selectedDate,
  onSelectDay,
  onSelectStore,
}: Props) => {
  const { sort, handleSort, applySort } = useTriStateSort<Col>();
  const isQty = gradingMetric === "qty";

  const fmt = (v: number | null) =>
    v === null ? "—" : isQty ? formatBigNumber(v, 0) : formatCurrency2(v);

  const days = useMemo(() => groupDays(rows), [rows]);

  // A day selection narrows the rows before any of the comparison runs, so
  // every share, expectation and verdict below belongs to that day alone.
  const scoped = useMemo(
    () => (selectedDate ? scopeToDay(rows, selectedDate) : rows),
    [rows, selectedDate],
  );

  const group = useMemo(
    () =>
      compareStores(scoped, gradingMetric, {
        // One day against one day is a far thinner baseline than a week
        // against a week. The same cut that reads well over seven days
        // colours the grid on noise over one, so it widens while a day is
        // selected.
        pct: selectedDate ? threshold * 2 : threshold,
        sharePoints: selectedDate
          ? DEFAULT_BANDS.sharePoints * 2
          : DEFAULT_BANDS.sharePoints,
      }),
    [scoped, gradingMetric, threshold, selectedDate],
  );

  const sorted = applySort(group.rows, (row, col) =>
    col === "ty"
      ? row.ty
      : col === "contribution"
        ? row.contribution
        : col === "shareDelta"
          ? row.shareDelta
          : col === "expected"
            ? row.expected
            : col === "gap"
              ? row.gapValue
              : col === "gapPct"
                ? row.gapPct
                : row.ownPct,
  );

  const excludedTotal = Object.values(group.excludedBy).reduce((a, b) => a + b, 0);
  const excludedReasons = (Object.keys(group.excludedBy) as Excluded[])
    .filter((k) => group.excludedBy[k] > 0)
    .map((k) => `${group.excludedBy[k]} ${EXCLUDED_LABEL[k].toLowerCase()}`)
    .join(" · ");

  const worst = group.biggestShortfall;

  const tile = (label: string, value: string, sub?: string, title?: string) => (
    <div className="px-3 py-2.5 min-w-0" title={title}>
      <div className="text-[10px] font-bold uppercase tracking-wide text-content/85">
        {label}
      </div>
      <div className="text-[14px] font-bold text-content truncate mt-0.5">
        {value}
      </div>
      {sub && <div className="text-[10.5px] text-content/85 truncate">{sub}</div>}
    </div>
  );

  return (
    <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 px-4 py-3 flex-shrink-0 bg-brand_navy">
        <p className="text-custom-white text-[13px] font-bold leading-tight">
          Where each store stands
        </p>
        <span className="text-custom-white/85 text-[11.5px]">
          {selectedDate
            ? `${new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })} only`
            : "The whole window"}
        </span>
      </div>

      {/* KPI tiles — every one recomputes when a day is picked, which is why
          the header above says which window they cover. */}
      <div className="grid grid-cols-5 divide-x divide-brand_navy/15 border-b border-gray-100 bg-gray-50 flex-shrink-0">
        {tile(
          "Group total",
          fmt(group.groupTy),
          `${pct1(group.groupVsLyPct)} vs LY`,
          "Summed over counted stores, then compared — never an average of each store's percentage.",
        )}
        {tile(
          "Stores counted",
          String(group.counted),
          excludedTotal ? `${excludedTotal} set aside · ${excludedReasons}` : "all comparable",
          excludedTotal
            ? "A store missing from either window would shift every other store's usual share by its own weight."
            : undefined,
        )}
        {tile(
          "Range",
          group.low === null ? "—" : `${fmt(group.low)}–${fmt(group.high)}`,
          group.median === null ? undefined : `${fmt(group.median)} median`,
        )}
        {tile(
          "Biggest shortfall",
          worst ? fmt(worst.gapValue) : "none",
          worst
            ? applyStoreNumberToName(
                worst.storeName,
                worst.storeNumber,
                worst.storeNumbersForId,
              )
            : "no store is under its expected",
        )}
        {tile(
          "Standing",
          `${group.falling} falling`,
          `${group.consistent} consistent · ${group.rising} rising`,
        )}
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* The same day selector the store popup uses, one level up: these are
            the group's seven days rather than one store's. */}
        <div className="flex-shrink-0 overflow-y-auto thin-scrollbar border-r border-gray-100">
          <PopupDaySidebar
            days={days}
            selectedDate={selectedDate}
            gradingMetric={gradingMetric}
            onSelect={onSelectDay}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-100 flex-shrink-0">
            <span className="text-[11.5px] font-semibold uppercase tracking-wide text-content/85 flex-1 min-w-0">
              Store
            </span>
            <SortHeader col="ty" label="TY" sort={sort} onSort={handleSort} width={70} className={`${PERF_SORT_HEADER} justify-end`} />
            <SortHeader col="contribution" label="Share" sort={sort} onSort={handleSort} width={64} className={`${PERF_SORT_HEADER} justify-end`} />
            <SortHeader col="shareDelta" label="Δ pts" sort={sort} onSort={handleSort} width={56} className={`${PERF_SORT_HEADER} justify-end`} />
            <SortHeader col="expected" label="Expected" sort={sort} onSort={handleSort} width={74} className={`${PERF_SORT_HEADER} justify-end`} />
            <SortHeader col="gap" label="Gap" sort={sort} onSort={handleSort} width={74} className={`${PERF_SORT_HEADER} justify-end`} />
            <SortHeader col="gapPct" label="Gap %" sort={sort} onSort={handleSort} width={60} className={`${PERF_SORT_HEADER} justify-end`} />
            <SortHeader col="ownPct" label="vs LY" sort={sort} onSort={handleSort} width={60} className={`${PERF_SORT_HEADER} justify-end`} />
            <span className="w-[86px] text-[11.5px] font-semibold uppercase tracking-wide text-content/85 text-right">
              Standing
            </span>
          </div>

          <div className="flex-1 overflow-y-auto thin-scrollbar">
            {sorted.map((r) => (
              <Row
                key={`${r.storeid}__${r.storeNumber}`}
                row={r}
                fmt={fmt}
                onSelect={() => {
                  const original = rows.find(
                    (x) =>
                      x.storeid === r.storeid && x.store_number === r.storeNumber,
                  );
                  if (original) onSelectStore(original);
                }}
              />
            ))}
            {sorted.length === 0 && (
              <div className="px-3 py-6 text-center text-[12.5px] text-content/85">
                Nothing to compare in this search.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Row = ({
  row,
  fmt,
  onSelect,
}: {
  row: ComparisonRow;
  fmt: (v: number | null) => string;
  onSelect: () => void;
}) => {
  const name = applyStoreNumberToName(
    row.storeName,
    row.storeNumber,
    row.storeNumbersForId,
  );

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-2 px-3 py-2 border-b border-gray-50 text-left hover:bg-row_selected transition-colors"
    >
      <span className="flex-1 min-w-0 truncate text-[12.5px] font-medium text-content">
        {name}
        {row.rank !== null && (
          <span className="ml-1.5 text-[10.5px] text-content/85">#{row.rank}</span>
        )}
      </span>

      <span className="w-[70px] text-right text-[12.5px] tabular-nums text-content">
        {fmt(row.ty)}
      </span>

      <span className="w-[64px] text-right text-[12.5px] tabular-nums text-content">
        {share1(row.contribution)}
        {/* The share it normally holds, under the one it holds now — the two
            only mean anything beside each other. */}
        <span className="block text-[10px] text-content/85">
          {share1(row.usualShare)}
        </span>
      </span>

      <span className="w-[56px] text-right text-[12px] tabular-nums text-content/85">
        {points1(row.shareDelta)}
      </span>

      <span className="w-[74px] text-right text-[12.5px] tabular-nums text-content/85">
        {fmt(row.expected)}
      </span>

      <span className="w-[74px] text-right text-[12.5px] tabular-nums text-content">
        {fmt(row.gapValue)}
      </span>

      <span className="w-[60px] text-right text-[12.5px] tabular-nums text-content">
        {pct1(row.gapPct)}
      </span>

      {/* Its own movement, in its own column. It is the one figure on the row
          a sibling cannot move, so anyone arguing with the standing wants to
          see it without opening anything. */}
      <span className="w-[60px] text-right text-[12.5px] tabular-nums text-content">
        {pct1(row.ownPct)}
      </span>

      <span className="w-[86px] flex justify-end">
        {row.verdict ? (
          <span
            className={`text-[10.5px] font-semibold px-2 py-0.5 rounded ${VERDICT_CLASS[row.verdict]}`}
          >
            {VERDICT_LABEL[row.verdict]}
          </span>
        ) : (
          <span
            className="text-[10.5px] font-semibold px-2 py-0.5 rounded bg-severity_watch_bg text-severity_watch_text"
            title={row.excluded ? EXCLUDED_WHY[row.excluded] : undefined}
          >
            {row.excluded ? EXCLUDED_LABEL[row.excluded] : "—"}
          </span>
        )}
      </span>
    </button>
  );
};

export default GroupComparisonPanel;
