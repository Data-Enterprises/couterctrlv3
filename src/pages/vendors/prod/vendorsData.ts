import { fetchSubDeptRowsSafe } from "../../../utils/marginRows";
import { LW_OFFSET, LY_OFFSET, shiftIso } from "../../../utils/grading";
import type { SubDeptMargin } from "../../../interfaces";

/**
 * Fetching for the Vendors page.
 *
 * `subs/subs` is the only endpoint that puts `vendor_id` on a row, so every
 * figure here comes from it. Two paginated reads cover the whole search:
 *
 *   subs/subs [lw.start .. tw.end]  -> this week and last week, split by date
 *   subs/subs [ly.start .. ly.end]  -> last year
 *
 * This used to be a two-step chain — `subs/sub_sales` to learn which
 * departments exist, then `subs/subs` once per department per period. That is
 * `1 + (depts x 3)` paginated calls, every department firing at once, which
 * made Vendors the most expensive page in the app to load.
 *
 * Two things removed it. `sub_department: 0` asks `subs/subs` for every
 * department in one read, and each row carries its own `sub_department`, so the
 * department list falls out of the rows instead of needing its own call. And
 * last week is this week shifted seven days, so the two spans are contiguous
 * and one range covers both — on a 28-day window that is 35 days of rows rather
 * than 56, fewer calls and a smaller download at once.
 *
 * Two flags are fixed and never exposed: `useGroups: 0`, `singleStore: 1`.
 * Vendors is examined one store at a time, like Sub Dept Margins and
 * Categories.
 */

const USE_GROUPS = 0;
const SINGLE_STORE = 1;

/**
 * The `sub_department` argument that asks for every department at once.
 *
 * Named because 0 is also a real department number in the response — as a
 * request argument it means "all", as a row value it means that department.
 */
const ALL_SUB_DEPTS = 0;

export interface VendorScope {
  url: string;
  token: string;
  storeid: number;
}

export interface PeriodRange {
  start: string;
  end: string;
}

/** The three ranges, derived from this week's. Offsets are shared so the fetch
 *  and the day-alignment can't drift apart. */
export const periodRanges = (twStart: string, twEnd: string) => ({
  tw: { start: twStart, end: twEnd },
  lw: { start: shiftIso(twStart, LW_OFFSET), end: shiftIso(twEnd, LW_OFFSET) },
  ly: { start: shiftIso(twStart, LY_OFFSET), end: shiftIso(twEnd, LY_OFFSET) },
});

/**
 * Rows falling inside a date window, bounds inclusive.
 *
 * Dates are `yyyy-mm-dd`, so a string compare is a date compare — no parsing
 * and no timezone to get wrong.
 */
const inRange = (rows: SubDeptMargin[], start: string, end: string) =>
  rows.filter((r) => {
    const d = r.sale_date.split("T")[0];
    return d >= start && d <= end;
  });

/** Every item row in a range, across every department, paginated. */
const fetchRange = (scope: VendorScope, range: PeriodRange) =>
  fetchSubDeptRowsSafe(
    scope.url,
    scope.token,
    ALL_SUB_DEPTS,
    range.start,
    range.end,
    USE_GROUPS,
    scope.storeid,
    SINGLE_STORE,
  );

/**
 * The whole search.
 *
 * `subDeptIds` still comes from this week only. A department that sold last
 * year and not this one contributes nothing to a this-week-rooted comparison,
 * and the callers use this list to decide whether the search found anything at
 * all.
 */
export const fetchVendorPeriods = async (
  scope: VendorScope,
  twStart: string,
  twEnd: string,
) => {
  const ranges = periodRanges(twStart, twEnd);

  const [span, ly] = await Promise.all([
    fetchRange(scope, { start: ranges.lw.start, end: ranges.tw.end }),
    fetchRange(scope, ranges.ly),
  ]);

  // A row in the overlap belongs to both sets — on a window longer than a week
  // the two spans genuinely share days, and these filters are independent
  // rather than a partition, which is what the two separate reads produced.
  const tw = inRange(span, ranges.tw.start, ranges.tw.end);
  const lw = inRange(span, ranges.lw.start, ranges.lw.end);

  const subDeptIds = [...new Set(tw.map((r) => r.sub_department))].sort(
    (a, b) => a - b,
  );

  return { tw, lw, ly, subDeptIds };
};
