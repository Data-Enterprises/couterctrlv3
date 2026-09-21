import { addDays, sameWeekDayLastYear } from ".";

/**
 * Grading primitives shared by the Performance pages.
 *
 * Every graded page asks the same question — how far is this week off its
 * baseline, and does that cross the threshold the user set — and until now each
 * page carried its own copy of the answer. This is that copy, once.
 *
 * Presentation lives in utils/severity.ts (pill classes, dots, chips). This
 * file is the maths: percentages, tiers, ranking, and the date offsets the
 * comparisons hang off.
 */

/** "ungraded" is a fourth state, not a severity — it means there was nothing to
 *  compare against, which is different from comparing well or badly. That's why
 *  it isn't in utils/severity.ts's `Severity`. */
export type Tier = "critical" | "watch" | "healthy" | "ungraded";

/** Sort order when no severity filter is active. Ungraded always sinks. */
export const TIER_RANK: Record<Tier, number> = {
  critical: 0,
  watch: 1,
  healthy: 2,
  ungraded: 3,
};

/* ── date offsets ──────────────────────────────────────────────────────────
   Both are whole weeks so the comparison lands on the same weekday. 364 rather
   than 365: a Monday must compare to a Monday, and grocery weeks are not
   calendar-aligned. */

export const LW_OFFSET = -7;
export const LY_OFFSET = -364;

export const isoOf = (saleDate: string) => saleDate.split("T")[0];

/** Shift a YYYY-MM-DD by whole days, in UTC. Local parsing shifts the date back
 *  a day for anyone west of Greenwich, which would misalign every comparison. */
export const shiftIso = (iso: string, days: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
};

/* ── comparison ───────────────────────────────────────────────────────────── */

/** Percent change against a matched prior period, or null when there is nothing
 *  to compare with. Null is not 0% — an unknown is not a flat week. */
export const pctChange = (current: number, prior: number): number | null => {
  if (prior === 0) return null;
  return ((current - prior) / prior) * 100;
};

/**
 * Delta to tier.
 *
 * Split from any one page's `getTier` so a figure that isn't a whole-week row —
 * a single day, a subset of weeks — grades on the same boundaries rather than a
 * second copy of them.
 */
export const tierOfDelta = (delta: number | null, threshold: number): Tier => {
  if (delta === null) return "ungraded";
  if (delta < -threshold) return "critical";
  if (delta < 0) return "watch";
  return "healthy";
};

/**
 * The single number a row is graded on: last year when it exists, last week
 * otherwise.
 *
 * The fallback matters — a row with no LY would otherwise render ungraded even
 * though the row beside it grades fine against LW. Both sides come from
 * day-matched subtotals, so a short prior period narrows the current side to
 * match rather than flattering it.
 */
export const gradeDelta = (row: {
  hasLY: boolean;
  hasLW: boolean;
  twForLY: number;
  twForLW: number;
  ly: number;
  lw: number;
}): number | null => {
  if (row.hasLY) return pctChange(row.twForLY, row.ly);
  if (row.hasLW) return pctChange(row.twForLW, row.lw);
  return null;
};

/* ── whole-week basis ─────────────────────────────────────────────────────────
   Which comparison a row is graded on. Last year, but only when it covers
   every day of the week; otherwise last week, when THAT covers every day;
   otherwise nothing.

   Before this, every Performance page graded on last year whenever any existed.
   Store 590 has last-year data for 3 of 7 days — both weekend days missing — and
   was graded Critical on that partial week while a complete last week put it at
   -1.20%. The partial comparison still shows, greyed; it just doesn't decide.

   Coverage is counted on the STORE's dates, never per row. A vendor that
   delivers three days a week, or a category that sold nothing on Tuesday, is a
   real zero — not a hole in the data. What makes a comparison incomplete is the
   store having no rows at all for a matched date. */

export interface Coverage {
  /** Days in the current week the store has data for. */
  dayCount: number;
  /** Of those, how many found a matching day last week / last year. */
  lwDayCount: number;
  lyDayCount: number;
}

export type GradeBasis = "LY" | "LW" | null;

/** Every day matched. A week with no days isn't complete. */
export const isCompleteCoverage = (matched: number, days: number) =>
  days > 0 && matched >= days;

export const gradeBasis = (
  r: { hasLY: boolean; hasLW: boolean },
  c: Coverage,
): GradeBasis =>
  r.hasLY && isCompleteCoverage(c.lyDayCount, c.dayCount)
    ? "LY"
    : r.hasLW && isCompleteCoverage(c.lwDayCount, c.dayCount)
      ? "LW"
      : null;

/**
 * Coverage of a week from the dates each period has ANY row for.
 *
 * `lwOf`/`lyOf` map a current-week date to its counterpart, so each page keeps
 * its own matching (Sales matches holidays; the item pages use whole weeks).
 */
export const coverageOf = (
  twDates: Iterable<string>,
  present: { tw: Set<string>; lw: Set<string>; ly: Set<string> },
  lwOf: (iso: string) => string,
  lyOf: (iso: string) => string,
): Coverage => {
  let dayCount = 0;
  let lwDayCount = 0;
  let lyDayCount = 0;
  for (const d of twDates) {
    if (!present.tw.has(d)) continue;
    dayCount += 1;
    if (present.lw.has(lwOf(d))) lwDayCount += 1;
    if (present.ly.has(lyOf(d))) lyDayCount += 1;
  }
  return { dayCount, lwDayCount, lyDayCount };
};

/** Critical first, then by size within a tier — a 30% fall on a large row
 *  matters more than the same percentage on a rounding error. */
export const sortGraded = <T extends { tier: Tier }>(
  rows: T[],
  weight: (row: T) => number,
): T[] =>
  [...rows].sort((a, b) => {
    const rank = TIER_RANK[a.tier] - TIER_RANK[b.tier];
    if (rank !== 0) return rank;
    return weight(b) - weight(a);
  });

/**
 * Soft-fill pill colours for a delta against a comparison period, on the same
 * boundaries `tierOfDelta` grades on: past the threshold is critical, any
 * decline is watch, level or better is healthy.
 *
 * Null means there was no comparison to make — grey, never green. Every
 * Performance page had its own copy of this before it moved here.
 */
export const deltaPillClass = (
  delta: number | null,
  threshold: number,
): string => {
  if (delta === null) return "bg-gray-100 text-gray-500";
  if (delta < -threshold) return "bg-red-100 text-red-800";
  if (delta < 0) return "bg-amber-100 text-amber-800";
  return "bg-emerald-100 text-emerald-800";
};

/**
 * Split a dated row set into the TW rows each comparison may use, and count
 * coverage.
 *
 * For any list that aggregates dated rows by group — sub-departments, hours.
 * `lw` and `ly` must already be the matched-date rows (callers filter to the
 * matched date set first). A TW row is kept for a comparison only when its
 * date found a counterpart there.
 *
 * Coverage is counted on DATES across the whole row set, not per group. A
 * sub-department that sold nothing on a day it traded last year is a real
 * zero, not a gap; what makes a comparison incomplete is the store having no
 * rows for that date at all.
 */
export const matchDatedRows = <T extends { sale_date: string }>(
  tw: T[],
  lw: T[],
  ly: T[],
) => {
  const day = (r: { sale_date: string }) => r.sale_date.split("T")[0];
  const lwDates = new Set(lw.map(day));
  const lyDates = new Set(ly.map(day));
  const lyFor = new Map<string, string>();
  const twForLW: T[] = [];
  const twForLY: T[] = [];
  const twDays = new Set<string>();
  const lwHit = new Set<string>();
  const lyHit = new Set<string>();
  for (const r of tw) {
    const d = day(r);
    twDays.add(d);
    if (lwDates.has(addDays(new Date(d), -7).toISOString().split("T")[0])) {
      twForLW.push(r);
      lwHit.add(d);
    }
    let lyDate = lyFor.get(d);
    if (lyDate === undefined) {
      lyDate = sameWeekDayLastYear(d).date;
      lyFor.set(d, lyDate);
    }
    if (lyDates.has(lyDate)) {
      twForLY.push(r);
      lyHit.add(d);
    }
  }
  const coverage: Coverage = {
    dayCount: twDays.size,
    lwDayCount: lwHit.size,
    lyDayCount: lyHit.size,
  };
  return { twForLW, twForLY, coverage };
};
