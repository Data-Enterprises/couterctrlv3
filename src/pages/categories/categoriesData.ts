import { getCats } from "../../api/sales";
import { fetchAllPages, pageCount } from "../../utils/paging";
import type { CatSalesDaily, CatSalesHourly, CatSalesResponse } from "../../interfaces";
import { LW_OFFSET, LY_OFFSET, shiftIso } from "./categoriesUtils";

/** Fetching for the Categories page.
 *
 *  Separated from both the component and the aggregation so the three concerns
 *  stay independent: this knows about the endpoint, categoriesUtils knows about
 *  the maths, the panel knows about neither.
 *
 *  Two flags are fixed for this page and never exposed: `useGroups: 0` and
 *  `singleStore: 1`. Categories are only ever examined one store at a time.
 */

const USE_GROUPS = 0;
const SINGLE_STORE = 1;

export interface CategoryScope {
  url: string;
  token: string;
  /** storeid — the page never searches by group. */
  storeid: number;
}

export interface PeriodRange {
  start: string;
  end: string;
}

/** The three ranges, derived from this week's. Offsets live in
 *  categoriesUtils so the fetch and the day-alignment can't drift apart. */
export const periodRanges = (twStart: string, twEnd: string) => ({
  tw: { start: twStart, end: twEnd },
  lw: { start: shiftIso(twStart, LW_OFFSET), end: shiftIso(twEnd, LW_OFFSET) },
  ly: { start: shiftIso(twStart, LY_OFFSET), end: shiftIso(twEnd, LY_OFFSET) },
});

/** Every ISO date in a range, inclusive. Drives the day-matching — this week's
 *  days are the spine everything else is aligned onto. */
export const datesInRange = (start: string, end: string): string[] => {
  const out: string[] = [];
  let cur = start;
  // Guard rather than while(true): a malformed range shouldn't spin forever.
  for (let i = 0; i < 400 && cur <= end; i++) {
    out.push(cur);
    cur = shiftIso(cur, 1);
  }
  return out;
};

/**
 * One period, every page.
 *
 * Page 1 reports `total_pages`; the remainder go out together, so a ten-page
 * store costs one round trip rather than ten. A page that fails resolves to an
 * empty array — losing one page of a category list is far better than losing
 * the nine that arrived, and the shortfall shows up as a lower total rather
 * than a broken screen.
 */
export const fetchPeriod = async (
  scope: CategoryScope,
  range: PeriodRange,
  onPages?: (total: number) => void,
): Promise<CatSalesDaily[]> => {
  const call = (page: number) =>
    getCats(
      scope.url,
      scope.token,
      range.start,
      range.end,
      USE_GROUPS,
      scope.storeid,
      SINGLE_STORE,
      0, // consolidated — 0 keeps sale_date, which day-matching needs
      0, // displayHourly — the hourly shape is fetched separately, on demand
      page,
    );

  const first = await call(1);
  const body = first.data as CatSalesResponse<CatSalesDaily>;
  if (body.error !== 0) return [];

  onPages?.(pageCount(body));

  return fetchAllPages(body, body.subs ?? [], async (page) => {
    try {
      const resp = await call(page);
      const j = resp.data as CatSalesResponse<CatSalesDaily>;
      return j.error === 0 ? (j.subs ?? []) : [];
    } catch {
      return [];
    }
  });
};

/** All three periods at once. They're independent, so they run together. */
export const fetchAllPeriods = async (
  scope: CategoryScope,
  twStart: string,
  twEnd: string,
  onPages?: (total: number) => void,
) => {
  const ranges = periodRanges(twStart, twEnd);
  let pages = 0;
  const track = (n: number) => {
    pages += n;
    onPages?.(pages);
  };

  const [tw, lw, ly] = await Promise.all([
    fetchPeriod(scope, ranges.tw, track),
    fetchPeriod(scope, ranges.lw, track),
    fetchPeriod(scope, ranges.ly, track),
  ]);

  return { tw, lw, ly, twDates: datesInRange(ranges.tw.start, ranges.tw.end) };
};

/**
 * Hourly rows for one category — the drill-down.
 *
 * Deliberately not part of the initial load. `displayHourly=1` returned ten
 * pages for a single store-week in testing, so pulling it for three periods up
 * front would be thirty requests to populate a tab most visits never open.
 *
 * The endpoint has no category parameter, so the filter happens here. That is
 * wasteful and worth revisiting if a category filter is ever added server-side.
 */
export const fetchHourly = async (
  scope: CategoryScope,
  range: PeriodRange,
  category?: number,
): Promise<CatSalesHourly[]> => {
  const call = (page: number) =>
    getCats(
      scope.url,
      scope.token,
      range.start,
      range.end,
      USE_GROUPS,
      scope.storeid,
      SINGLE_STORE,
      0,
      1, // displayHourly
      page,
    );

  const first = await call(1);
  const body = first.data as CatSalesResponse<CatSalesHourly>;
  if (body.error !== 0) return [];

  const all = await fetchAllPages(body, body.subs ?? [], async (page) => {
    try {
      const resp = await call(page);
      const j = resp.data as CatSalesResponse<CatSalesHourly>;
      return j.error === 0 ? (j.subs ?? []) : [];
    } catch {
      return [];
    }
  });

  return category === undefined
    ? all
    : all.filter((r) => r.category === category);
};

/**
 * Hourly across all three periods.
 *
 * An hour on its own says nothing — 4pm being the busiest hour is a fact about
 * every grocery store. What matters is 4pm against *the same hour last week and
 * last year*, so all three are fetched and graded like everything else.
 *
 * The cost is real: displayHourly returned ten pages for one store-week, so
 * this is thirty-odd requests. That is exactly why it sits behind the tab and
 * never runs on load.
 */
export const fetchHourlyPeriods = async (
  scope: CategoryScope,
  twStart: string,
  twEnd: string,
  category?: number,
) => {
  const ranges = periodRanges(twStart, twEnd);
  const [tw, lw, ly] = await Promise.all([
    fetchHourly(scope, ranges.tw, category),
    fetchHourly(scope, ranges.lw, category),
    fetchHourly(scope, ranges.ly, category),
  ]);
  return { tw, lw, ly };
};
