// Utils
import { shiftIso } from "../../../../../utils/grading";
import { formatGoliathDate, sameWeekDayLastYear } from "../../../../../utils";

// Interfaces
import type { GradingMetric } from "../../../../../features/salesLedgerSlice";
import type { LedgerRowData } from "../../interfaces";
import type { SevFilter } from "../../utils";

/** The ledger threshold a reset goes back to. */
export const THRESHOLD_DEFAULT = 9;

/**
 * The searched week and its two baselines, as yyyy-mm-dd ranges.
 *
 * Shifting just the two week endpoints breaks when one of them lands on a
 * fixed-date holiday (e.g. July 4th) — that endpoint gets snapped to the exact
 * holiday date last year while the other gets a plain weekday-preserving
 * shift, desyncing the range from the per-day lookups in buildLedgerRows.
 * Shifting every day in the week and taking the min/max keeps it correct.
 */
export const weekRanges = (date: string) => {
  const twEnd = formatGoliathDate(date);
  const twStart = shiftIso(twEnd, -6);
  const lwEnd = shiftIso(twEnd, -7);
  const lwStart = shiftIso(twEnd, -13);
  const twWeekDates = Array.from({ length: 7 }, (_, i) => shiftIso(twStart, i));
  const lyWeekDates = twWeekDates
    .map((d) => sameWeekDayLastYear(d).date)
    .sort();
  const lyStart = lyWeekDates[0];
  const lyEnd = lyWeekDates[lyWeekDates.length - 1];
  return { twStart, twEnd, lwStart, lwEnd, lyStart, lyEnd };
};

/** The ledger header's week, e.g. "11/3 – 11/9/2026". */
export const weekRangeLabel = (twStart: string, twEnd: string) => {
  const start = new Date(twStart + "T12:00:00");
  const end = new Date(twEnd + "T12:00:00");
  const fmtD = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmtD(start)} – ${fmtD(end)}/${end.getFullYear()}`;
};

/** The ledger's rows by grade, for the chips' counts and their filters. */
export const severityBuckets = (rows: LedgerRowData[]) => ({
  critical: rows.filter((r) => r.severity === "critical"),
  watch: rows.filter((r) => r.severity === "watch"),
  healthy: rows.filter((r) => r.severity === "healthy"),
});

/**
 * The rows the list shows: the chip's grade, then the store filter.
 *
 * "All" is every row, not the three graded buckets concatenated. A store
 * whose comparisons are both short of a full week grades to null — a real
 * fourth outcome, not a severity — and enumerating the other three dropped it
 * from the list entirely while the header still counted its sales. `rows` is
 * already in grade order with ungraded sunk to the bottom, so this preserves
 * the ordering the concat produced.
 */
export const filterLedgerRows = (
  rows: LedgerRowData[],
  buckets: ReturnType<typeof severityBuckets>,
  sevFilter: SevFilter,
  storeFilter: string,
) => {
  const bySev = sevFilter === "all" ? rows : buckets[sevFilter];
  const q = storeFilter.trim().toLowerCase();
  return q
    ? bySev.filter(
        (row) =>
          row.store_name.toLowerCase().includes(q) ||
          row.store_number.toLowerCase().includes(q),
      )
    : bySev;
};

/**
 * The header's figures, summed over every row.
 *
 * Each pill divides by the TW subtotal for ITS OWN comparison, not by the
 * week total above it. This used to put the full seven-day TW figure over a
 * day-matched LY one. Store 590 has three of seven LY days, so the same screen
 * carried "+127.28%" up here and "-12.07%" in the row below — the second being
 * right. The gap is not a rounding difference, it is 199,279 / 87,680 against
 * 77,094 / 87,680, and the reader has no way to tell which is which.
 *
 * Summing the per-store subtotals rather than averaging the per-store
 * percentages keeps a group weighted by size: twenty stores where the big one
 * has full LY history and the small ones have none should read as the big one.
 */
export const ledgerHeadline = (
  rows: LedgerRowData[],
  metric: GradingMetric,
) => {
  const sum = (pick: (r: LedgerRowData) => number) =>
    rows.reduce((acc, r) => acc + pick(r), 0);
  const isQty = metric === "qty";
  const gradeLY = isQty ? sum((r) => r.lyQty) : sum((r) => r.lyTotal);
  const gradeLW = isQty ? sum((r) => r.lwQty) : sum((r) => r.lwTotal);
  const gradeTWForLY = isQty
    ? sum((r) => r.twQtyForLY)
    : sum((r) => r.twTotalForLY);
  const gradeTWForLW = isQty
    ? sum((r) => r.twQtyForLW)
    : sum((r) => r.twTotalForLW);
  return {
    twTotal: sum((r) => r.twTotal),
    twQty: sum((r) => r.twQty),
    vsLYPct: gradeLY ? ((gradeTWForLY - gradeLY) / gradeLY) * 100 : 0,
    vsLWPct: gradeLW ? ((gradeTWForLW - gradeLW) / gradeLW) * 100 : 0,
    hasLY: gradeLY > 0,
    hasLW: gradeLW > 0,
    // How much of the week each comparison actually covers, across every
    // store in the result. Drives whether the pill is presented as a verdict.
    dayCount: sum((r) => r.dayCount),
    lyDayCount: sum((r) => r.lyDayCount),
    lwDayCount: sum((r) => r.lwDayCount),
  };
};
