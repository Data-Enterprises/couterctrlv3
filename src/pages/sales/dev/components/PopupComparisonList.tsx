import { useMemo } from "react";
import { formatCurrencyCompact, formatBigNumber } from "../../../../utils";
import { applyStoreNumberToName } from "../shared/ledgerUtils";
import {
  compareForView,
  type ComparisonRow,
  type Excluded,
  type Verdict,
} from "../shared/storeComparison";
import SortHeader, { PERF_SORT_HEADER } from "../../../../components-dev/SortHeader";
import { useTriStateSort } from "../../../../utils/useTriStateSort";
import type { LedgerRowData } from "./LedgerRow";
import type { GradingMetric } from "../../../../features/dev/devSalesLedgerSlice";

/**
 * The Comparison tab: every other store in the search, against this one.
 *
 * Sits beside Sub dept and Hourly because it is the same kind of thing — a
 * breakdown of the store that is open. The open store is pinned at the top as
 * the line everything else is measured from, so the column of differences has
 * something visible to be a difference from.
 *
 * The difference is in POINTS, because both sides are already percentages and
 * subtracting two percentages never gives a percentage.
 */

type Col = "shareTy" | "gapPct" | "ownPct" | "vsOpen";

const COLS = "minmax(140px,1fr) 88px 72px 76px 76px 76px";
const GRID_MIN = 620;

const HEAD =
  "sticky top-0 z-10 bg-custom-white grid items-center gap-2.5 px-2 py-1.5 border-b border-brand_navy/15";

const VERDICT_LABEL: Record<Verdict, string> = {
  rising: "Rising",
  consistent: "Consistent",
  falling: "Falling",
};

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

const pct1 = (v: number | null) =>
  v === null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

const points1 = (v: number | null) =>
  v === null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(1)} pt`;

const share1 = (v: number | null) => (v === null ? "—" : `${(v * 100).toFixed(1)}%`);

const toneOf = (v: number | null) =>
  v === null || v === 0
    ? "text-content"
    : v > 0
      ? "text-delta_positive_text"
      : "text-delta_negative_text";

interface Props {
  rows: LedgerRowData[];
  storeid: number;
  storeNumber: string;
  gradingMetric: GradingMetric;
  threshold: number;
  selectedDate: string | null;
}

const PopupComparisonList = ({
  rows,
  storeid,
  storeNumber,
  gradingMetric,
  threshold,
  selectedDate,
}: Props) => {
  const { sort, handleSort, applySort } = useTriStateSort<Col>();
  const isQty = gradingMetric === "qty";
  const fmt = (v: number | null) =>
    v === null ? "—" : isQty ? formatBigNumber(v, 0) : formatCurrencyCompact(v);

  const group = useMemo(
    () => compareForView(rows, gradingMetric, threshold, selectedDate),
    [rows, gradingMetric, threshold, selectedDate],
  );

  const keyOf = (r: ComparisonRow) => `${r.storeid}__${r.storeNumber}`;
  const open = group.rows.find(
    (r) => r.storeid === storeid && r.storeNumber === storeNumber,
  );

  if (!open) {
    return (
      <div className="h-full flex items-center justify-center px-4 text-center text-[12.5px] text-content/85">
        This store is not in the current search.
      </div>
    );
  }

  const others = group.rows.filter((r) => keyOf(r) !== keyOf(open));

  /** How far this store's own movement is from the open store's, in points. */
  const vsOpen = (r: ComparisonRow) =>
    r.ownPct === null || open.ownPct === null ? null : r.ownPct - open.ownPct;

  const sorted = applySort(others, (row, col) =>
    col === "shareTy"
      ? row.shareTy
      : col === "gapPct"
        ? row.gapPct
        : col === "ownPct"
          ? row.ownPct
          : vsOpen(row),
  );

  const nameOf = (r: ComparisonRow) =>
    applyStoreNumberToName(r.storeName, r.storeNumber, r.storeNumbersForId);

  const cells = (r: ComparisonRow, isOpen: boolean) => (
    <>
      <span className="min-w-0 truncate font-medium">
        {nameOf(r)}
        {r.rank !== null && (
          <span className="ml-1.5 text-[11px] text-content/85">#{r.rank}</span>
        )}
      </span>

      <span className="min-w-0">
        {r.verdict ? (
          <span
            className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded ${VERDICT_CLASS[r.verdict]}`}
          >
            {VERDICT_LABEL[r.verdict]}
          </span>
        ) : (
          <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded bg-severity_watch_bg text-severity_watch_text truncate max-w-full">
            {r.excluded ? EXCLUDED_LABEL[r.excluded] : "—"}
          </span>
        )}
      </span>

      <span className="text-right tabular-nums">{share1(r.shareTy)}</span>
      <span className="text-right tabular-nums">
        {fmt(r.gapValue)}
        <span className="block text-[11px] text-content/85">{pct1(r.gapPct)}</span>
      </span>
      <span className="text-right tabular-nums">{pct1(r.ownPct)}</span>
      <span
        className={`text-right tabular-nums font-semibold ${isOpen ? "text-content/85" : toneOf(vsOpen(r))}`}
      >
        {isOpen ? "—" : points1(vsOpen(r))}
      </span>
    </>
  );

  return (
    <div className="h-full overflow-auto thin-scrollbar">
      <div style={{ minWidth: GRID_MIN }}>
        <div className={HEAD} style={{ gridTemplateColumns: COLS }}>
          <span className="text-[11.5px] font-semibold uppercase tracking-wide text-content/85">
            Store
          </span>
          <span className="text-[11.5px] font-semibold uppercase tracking-wide text-content/85">
            Standing
          </span>
          <SortHeader col="shareTy" label="Share" sort={sort} onSort={handleSort} className={`${PERF_SORT_HEADER} justify-end`} />
          <SortHeader col="gapPct" label="Gap" sort={sort} onSort={handleSort} className={`${PERF_SORT_HEADER} justify-end`} />
          <SortHeader
            col="ownPct"
            label={open.basis === "LW" ? "vs LW" : "vs LY"}
            sort={sort}
            onSort={handleSort}
            className={`${PERF_SORT_HEADER} justify-end`}
          />
          <SortHeader col="vsOpen" label="vs open" sort={sort} onSort={handleSort} className={`${PERF_SORT_HEADER} justify-end`} />
        </div>

        {/* The open store, pinned. Everything in the last column is a distance
            from this row, so it has to be on screen. */}
        <div
          className="grid gap-2.5 items-center px-2 py-[7px] border-b-2 border-brand_navy/25 bg-row_selected text-[13px] text-content"
          style={{ gridTemplateColumns: COLS }}
        >
          {cells(open, true)}
        </div>

        {sorted.map((r) => (
          <div
            key={keyOf(r)}
            className="grid gap-2.5 items-center px-2 py-[7px] border-b border-brand_navy/15 last:border-b-0 even:bg-row_stripe hover:bg-gray-50 text-[13px] text-content"
            style={{ gridTemplateColumns: COLS }}
          >
            {cells(r, false)}
          </div>
        ))}

        {sorted.length === 0 && (
          <div className="px-3 py-6 text-center text-[12.5px] text-content/85">
            No other stores in this search.
          </div>
        )}
      </div>
    </div>
  );
};

export default PopupComparisonList;
