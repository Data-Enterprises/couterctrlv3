import { useMemo } from "react";
import { formatCurrencyCompact, formatBigNumber } from "../../../../utils";
import { applyStoreNumberToName } from "../shared/ledgerUtils";
import {
  compareForView,
  groupDays,
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

type Col = "shareTy" | "shareLw" | "shareLy";

/** The house desktop grid: a column template, gap-2.5, navy hairlines and a
 *  zebra stripe — the same shape ForecastRowsTable and the margin grids use. */
const COLS = "minmax(170px,1fr) 100px 132px 132px 132px";

/** What the columns need before the store name gets anything. Eleven of them
 *  do not fit a 52% panel on a laptop, so the grid scrolls sideways inside its
 *  own container rather than crushing the name — the page itself never does. */
const GRID_MIN = 666;

const HEAD =
  "sticky top-0 z-10 bg-custom-white grid items-center gap-2.5 px-2 py-1.5 border-b border-brand_navy/15";

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
  "no-baseline": "No baseline",
  "partial-week": "Short week",
  "nothing-to-compare": "Nothing to compare",
};

const EXCLUDED_WHY: Record<Excluded, string> = {
  "no-baseline":
    "Nothing on file for last year or last week, so there is no contribution this store can be said to usually make.",
  "partial-week":
    "Neither last year nor last week covers the whole week. A partial period understates the usual contribution, which would make a short week look like a win.",
  "nothing-to-compare":
    "The period this store would be measured against recorded nothing, so its usual contribution cannot be worked out.",
};

const pct1 = (v: number | null) =>
  v === null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

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
    v === null ? "—" : isQty ? formatBigNumber(v, 0) : formatCurrencyCompact(v);

  const days = useMemo(() => groupDays(rows), [rows]);

  // A day selection narrows the rows before any of the comparison runs, so
  // every contribution, expectation and verdict below belongs to that day alone —
  // with wider bands, because one day against one day is a thinner baseline.
  const group = useMemo(
    () => compareForView(rows, gradingMetric, threshold, selectedDate),
    [rows, gradingMetric, threshold, selectedDate],
  );

  const sorted = applySort(group.rows, (row, col) =>
    col === "shareTy"
      ? row.shareTy
      : col === "shareLw"
        ? row.shareLw
        : row.shareLy,
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
            ? "A store missing from either window would shift every other store's usual contribution by its own weight."
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

      {/* The same day selector the store popup uses, one level up: the group's
          seven days rather than one store's.

          Full width and above the grid, not beside it. Despite the name it is
          a horizontal strip — its cards are flex-1 and divide whatever width
          they are given, so a shrink-to-fit wrapper makes them sprawl. It also
          draws its own border-b. */}
      <div className="flex-shrink-0">
        <PopupDaySidebar
          days={days}
          selectedDate={selectedDate}
          gradingMetric={gradingMetric}
          onSelect={onSelectDay}
        />
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <div className="flex-1 min-w-0 overflow-auto thin-scrollbar">
          <div style={{ minWidth: GRID_MIN }}>
          <div className={HEAD} style={{ gridTemplateColumns: COLS }}>
            <span className="text-[11.5px] font-semibold uppercase tracking-wide text-content/85">
              Store
            </span>
            {/* Beside the name, because it is the answer and the two figures
                that follow are the working. */}
            <span className="text-[11.5px] font-semibold uppercase tracking-wide text-content/85">
              Standing
            </span>
            {/* One cell, read as a sentence: what it holds now, then what it
                usually holds. The period "usually" means is named here once
                rather than marked on every row. */}
            {/* One per period: the slice of the group this store was in each
                of them. Read across and the movement is the story. */}
            <SortHeader col="shareTy" label="Contribution → TY" sort={sort} onSort={handleSort} className={`${PERF_SORT_HEADER} justify-end`} />
            <SortHeader col="shareLw" label="Contribution → LW" sort={sort} onSort={handleSort} className={`${PERF_SORT_HEADER} justify-end`} />
            <SortHeader col="shareLy" label="Contribution → LY" sort={sort} onSort={handleSort} className={`${PERF_SORT_HEADER} justify-end`} />
          </div>

          <div>
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
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className="grid gap-2.5 items-center px-2 py-[11px] border-b border-brand_navy/15 last:border-b-0 even:bg-row_stripe hover:bg-gray-50 cursor-pointer text-[13px] text-content"
      style={{ gridTemplateColumns: COLS }}
    >
      <span className="min-w-0 truncate font-medium">
        {name}
        {row.rank !== null && (
          <span className="ml-1.5 text-[11px] text-content/85">#{row.rank}</span>
        )}
      </span>

      <span className="min-w-0">
        {row.verdict ? (
          <span
            className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded ${VERDICT_CLASS[row.verdict]}`}
          >
            {VERDICT_LABEL[row.verdict]}
          </span>
        ) : (
          <span
            className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded bg-severity_watch_bg text-severity_watch_text truncate max-w-full"
            title={row.excluded ? EXCLUDED_WHY[row.excluded] : undefined}
          >
            {row.excluded ? EXCLUDED_LABEL[row.excluded] : "—"}
          </span>
        )}
      </span>

      {/* Expected rides the tooltip: it is the working behind the standing,
          and nobody acts on the intermediate step. */}
      <span
        className="text-right tabular-nums font-semibold"
        title={
          row.expected === null
            ? undefined
            : `Expected ${fmt(row.expected)} — the group's week at this store's usual contribution`
        }
      >
        {share1(row.shareTy)}
      </span>
      <span className="text-right tabular-nums text-content/85">
        {share1(row.shareLw)}
      </span>
      <span className="text-right tabular-nums text-content/85">
        {share1(row.shareLy)}
      </span>

    </div>
  );
};

export default GroupComparisonPanel;
