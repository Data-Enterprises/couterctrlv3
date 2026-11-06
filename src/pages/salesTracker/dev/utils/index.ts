// Utils
import { sameWeekDayLastYear } from "../../../../utils";

// Interfaces
import type { DayPair, TrackerBasis, WeekBucket, WindowPlan } from "../interfaces";

/**
 * Week bucketing for the tracker, and the TY-to-LY day pairing under it. Two
 * rules:
 *
 * 1. **A row belongs to the week its own date falls in** (never by position).
 * 2. **A TY day is paired with its LY partner by date**, so one missing day
 *    can't desync the rest.
 *
 * Everything downstream indexes through the maps built here.
 */

/**
 * Shifts a `yyyy-mm-dd` string by whole days, entirely in UTC. Not the shared
 * `addDays`, which mixes UTC parsing with local setters and comes back a day
 * early in the US.
 */
export const shiftDays = (date: string, days: number): string => {
  const [y, m, d] = date.split("T")[0].split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().split("T")[0];
};

/**
 * `yyyy-mm-dd` to the search slice's `m/d/yyyy`, by string surgery. Not the
 * shared `formatDate`, which parses UTC and reads local, a day early in the US.
 */
export const isoToDisplay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${m}/${d}/${y}`;
};

/** The same thing in prose. The label itself is the basis — "LY Sales",
 *  "vs LW" — so only sentences need this. */
export const basisWord = (basis: TrackerBasis) =>
  basis === "LW" ? "last week" : "last year";

/**
 * How a TY day finds its partner: last year snaps a holiday to its real date
 * (Thanksgiving against Thanksgiving); last week is the same weekday seven days
 * ago, so it never collides.
 */
const partnerOf = (tyDate: string, basis: TrackerBasis) =>
  basis === "LW" ? shiftDays(tyDate, -7) : sameWeekDayLastYear(tyDate).date;

/** The start date giving `weeks` whole weeks ending on `endDate`, for the
 *  entry card's presets. */
export const rangeForWeeks = (endDate: string, weeks: number) =>
  shiftDays(endDate, -(weeks * 7 - 1));

/**
 * The range's week buckets, oldest first, chunked forward from the start date,
 * so the last bucket is the short one. A bucket holds one to seven dates;
 * nothing downstream may assume seven.
 */
export const buildWeekBuckets = (
  startDate: string,
  endDate: string,
): WeekBucket[] => {
  const start = startDate.split("T")[0];
  const end = endDate.split("T")[0];

  const dates: string[] = [];
  for (let d = start; d <= end; d = shiftDays(d, 1)) {
    dates.push(d);
    // A reversed or malformed range would otherwise spin forever.
    if (dates.length > 400) break;
  }

  const buckets: WeekBucket[] = [];
  for (let i = 0; i < dates.length; i += 7) {
    const chunk = dates.slice(i, i + 7);
    buckets.push({
      index: buckets.length,
      start: chunk[0],
      end: chunk[chunk.length - 1],
      dates: chunk,
    });
  }
  return buckets;
};

/**
 * The full fetch-and-compare plan for a window. The LY range is the min and
 * max of every shifted day, not the two endpoints shifted alone (which breaks
 * when an end is a holiday, as Sales found on July 4th).
 */
export const buildWindowPlan = (
  startDate: string,
  endDate: string,
  basis: TrackerBasis = "LY",
): WindowPlan => {
  const buckets = buildWeekBuckets(startDate, endDate);

  const pairs: DayPair[] = [];
  const byTyDate = new Map<string, DayPair>();
  const byLyDate = new Map<string, DayPair[]>();

  for (const bucket of buckets) {
    bucket.dates.forEach((tyDate, slot) => {
      const pair: DayPair = {
        tyDate,
        lyDate: partnerOf(tyDate, basis),
        weekIndex: bucket.index,
        slot,
      };
      pairs.push(pair);
      byTyDate.set(tyDate, pair);
      const sharing = byLyDate.get(pair.lyDate);
      if (sharing) sharing.push(pair);
      else byLyDate.set(pair.lyDate, [pair]);
    });
  }

  const collisions = [...byLyDate.values()]
    .filter((group) => group.length > 1)
    .flatMap((group) => group.map((p) => p.tyDate));

  const lyDates = [...byLyDate.keys()].sort();

  return {
    basis,
    weeks: buckets,
    pairs,
    tyStart: buckets[0].start,
    tyEnd: buckets[buckets.length - 1].end,
    lyStart: lyDates[0],
    lyEnd: lyDates[lyDates.length - 1],
    byTyDate,
    byLyDate,
    collisions,
  };
};

/**
 * Buckets dated rows by their own date. `dateOf` slices because `getWeekly`
 * returns both bare dates and timestamps. Rows outside the plan are dropped.
 */
export const bucketByDate = <T>(
  rows: T[],
  dateOf: (row: T) => string,
  index: Map<string, DayPair>,
): Map<number, T[]> => {
  const out = new Map<number, T[]>();
  for (const row of rows) {
    const pair = index.get(dateOf(row).split("T")[0]);
    if (!pair) continue;
    const found = out.get(pair.weekIndex);
    if (found) found.push(row);
    else out.set(pair.weekIndex, [row]);
  }
  return out;
};
