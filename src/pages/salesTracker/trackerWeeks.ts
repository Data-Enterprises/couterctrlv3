import { sameWeekDayLastYear } from "../../utils";

/**
 * Week bucketing for the tracker, and the TY-to-LY day pairing underneath it.
 *
 * Both of the legacy tracker's comparison bugs lived in this step, so the two
 * rules it exists to enforce are worth stating outright:
 *
 * 1. **A row belongs to the week its own date falls in.** The legacy
 *    `WeekCards` ran `chunkData` over a positional array of dates while the
 *    fetch concatenated pages in resolution order — any window wide enough to
 *    page put days in the wrong week, silently.
 * 2. **A TY day is paired with its LY partner by date.** The legacy code
 *    paired `lyWeekCards[idx]` against `tyWeekCards[idx]`, so one missing LY
 *    day desynced every week after it.
 *
 * Everything downstream indexes through the maps built here rather than
 * walking arrays in parallel, which makes both mistakes unavailable rather
 * than merely avoided.
 */

/**
 * Shifts a `yyyy-mm-dd` string by whole days, entirely in UTC.
 *
 * Deliberately not the shared `addDays`. That parses the string as UTC midnight
 * and then mutates it with `getDate`/`setDate`, which are **local** — so west
 * of Greenwich the date is already the previous day before any arithmetic
 * happens, and everything comes back a day early. That is what made the week
 * presets reach one day too far back.
 *
 * Parsing the parts and working through `Date.UTC` keeps the calendar date the
 * only thing in play, which is all a sales date ever is.
 */
export const shiftDays = (date: string, days: number): string => {
  const [y, m, d] = date.split("T")[0].split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().split("T")[0];
};

/**
 * `yyyy-mm-dd` to the `m/d/yyyy` the search slice holds, by string surgery.
 *
 * Deliberately not the shared `formatDate`. That does `new Date("2026-07-27")`,
 * which parses as UTC midnight, then reads it back with local `getDate()` —
 * west of Greenwich that is still the 26th, so every preset landed a day early.
 * Lives here beside `shiftDays` because both exist for the same reason and
 * anything that shifts a tracker date needs this on the way back out.
 */
export const isoToDisplay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${m}/${d}/${y}`;
};

export type WeekBucket = {
  index: number;
  start: string;
  end: string;
  /** The seven TY dates, ascending. */
  dates: string[];
};

export type DayPair = {
  tyDate: string;
  lyDate: string;
  weekIndex: number;
  /** 0-6 within the bucket. Fixed at build time so the Days grid keeps a
   *  stable column even where a holiday shifts the LY partner's weekday. */
  slot: number;
};

export type WindowPlan = {
  weeks: WeekBucket[];
  pairs: DayPair[];
  tyStart: string;
  tyEnd: string;
  lyStart: string;
  lyEnd: string;
  byTyDate: Map<string, DayPair>;
  /** Keyed by LY date. An array because a holiday can pull two TY days onto
   *  one LY date — see `collisions`. */
  byLyDate: Map<string, DayPair[]>;
  /**
   * TY dates sharing an LY partner with another TY date.
   *
   * `sameWeekDayLastYear` snaps a holiday to the actual holiday date last
   * year rather than shifting by weekday, so in a window containing one the
   * shifted neighbour can land on the same LY date. Both TY days would then
   * compare against the same LY figure, inflating one of them. The UI flags
   * these rather than silently averaging: the comparison is genuinely
   * ambiguous and the user is better placed to judge it.
   */
  collisions: string[];
};

/** The start date that gives `weeks` whole weeks ending on `endDate`. Used by
 *  the entry card's presets, which fill the two date inputs rather than
 *  bypassing them. */
export const rangeForWeeks = (endDate: string, weeks: number) =>
  shiftDays(endDate, -(weeks * 7 - 1));

/**
 * The range's week buckets, oldest first.
 *
 * Weeks are chunked forward from the start date, so the **last** bucket is the
 * one that comes up short on a range that isn't a multiple of seven. Chunking
 * backwards from the end would put the partial week first, which reads as a
 * missing week rather than an incomplete one — and would move every week
 * boundary the moment somebody nudged the start date by a day.
 *
 * A bucket therefore carries between one and seven dates. Nothing downstream
 * may assume seven.
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
 * The full fetch-and-compare plan for a window.
 *
 * The LY range is the min and max of every individually shifted day rather
 * than the two endpoints shifted on their own. Shifting only the endpoints
 * breaks whenever one of them is a holiday: that end snaps to the holiday's
 * real date last year while the other takes a plain weekday shift, and the
 * range no longer covers the days the pairing actually asks for. Sales hit
 * this on July 4th and fixed it the same way.
 */
export const buildWindowPlan = (
  startDate: string,
  endDate: string,
): WindowPlan => {
  const buckets = buildWeekBuckets(startDate, endDate);

  const pairs: DayPair[] = [];
  const byTyDate = new Map<string, DayPair>();
  const byLyDate = new Map<string, DayPair[]>();

  for (const bucket of buckets) {
    bucket.dates.forEach((tyDate, slot) => {
      const pair: DayPair = {
        tyDate,
        lyDate: sameWeekDayLastYear(tyDate).date,
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
 * Buckets dated rows by their own date.
 *
 * `dateOf` exists because the endpoints disagree about the shape: `getWeekly`
 * returns a bare `yyyy-mm-dd` on some rows and a full timestamp on others, so
 * every caller has to slice before comparing. Rows falling outside the plan
 * are dropped rather than forced into the nearest bucket — a date the plan
 * doesn't know about is a fetch that overran its window, not a week.
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
