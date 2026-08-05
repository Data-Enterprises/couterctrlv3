import { getSubDepts } from "../../api/subMargins";
import { fetchAllPages } from "../../utils/paging";
import { fetchSubDeptRowsSafe } from "../../utils/marginRows";
import { LW_OFFSET, LY_OFFSET, shiftIso } from "../../utils/grading";
import type { SubDeptMargin, SubSale, SubSalesJsonResp } from "../../interfaces";

/**
 * Fetching for the Vendors page.
 *
 * `subs/subs` is the only endpoint that puts `vendor_id` on a row, and it takes
 * one sub department per call. So a store's vendor picture is a two-step chain:
 * ask `subs/sub_sales` which departments exist, then walk them.
 *
 *   sub_sales x1                     -> the department list
 *   subs/subs x (depts x 3 periods)  -> item rows carrying vendor_id
 *
 * Which makes this the most expensive Performance page to load, and why the
 * search names its two steps rather than showing one undifferentiated spinner.
 *
 * Two flags are fixed and never exposed: `useGroups: 0`, `singleStore: 1`.
 * Vendors is examined one store at a time, like Sub Dept Margins and
 * Categories.
 */

const USE_GROUPS = 0;
const SINGLE_STORE = 1;

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

/** The sub departments that actually sold in a period. Paged — a large store's
 *  department list can exceed one page, and reading only page 1 would silently
 *  drop whole departments' vendors from the grade. */
export const fetchSubDeptIds = async (
  scope: VendorScope,
  range: PeriodRange,
): Promise<number[]> => {
  const call = (page: number) =>
    getSubDepts(
      scope.url,
      scope.token,
      range.start,
      range.end,
      USE_GROUPS,
      scope.storeid,
      SINGLE_STORE,
      0, // consolidated — 0 keeps sale_date
      0, // displayHourly
      page,
    );

  const first = await call(1);
  const body: SubSalesJsonResp = first.data;
  if (body.error !== 0) return [];

  const all = await fetchAllPages(body, body.subs ?? [], async (page) => {
    try {
      const r = await call(page);
      const j: SubSalesJsonResp = r.data;
      return j.error === 0 ? (j.subs ?? []) : [];
    } catch {
      return [];
    }
  });

  return [...new Set(all.map((s: SubSale) => s.sub_department))].sort(
    (a, b) => a - b,
  );
};

/** Every item row for one period, across all of the given sub departments.
 *
 *  Departments go out together rather than in sequence — the endpoint is per
 *  department, so serialising would multiply latency by the department count
 *  for no benefit. */
export const fetchPeriodRows = async (
  scope: VendorScope,
  range: PeriodRange,
  subDeptIds: number[],
): Promise<SubDeptMargin[]> => {
  const results = await Promise.all(
    subDeptIds.map((id) =>
      fetchSubDeptRowsSafe(
        scope.url,
        scope.token,
        id,
        range.start,
        range.end,
        USE_GROUPS,
        scope.storeid,
        SINGLE_STORE,
      ),
    ),
  );
  return results.flat();
};

/**
 * The whole search: department list from this week, then all three periods.
 *
 * The department list comes from TW only. A department that sold last year and
 * not this one contributes nothing to a TW-rooted comparison, and asking for it
 * would add a call per dead department to every search.
 */
export const fetchVendorPeriods = async (
  scope: VendorScope,
  twStart: string,
  twEnd: string,
  /** Fired once the department list is in and the row fetch begins. No counts:
   *  the only number available here is departments x periods, which reads as a
   *  vendor count and is not one. */
  onRowsStart?: () => void,
) => {
  const ranges = periodRanges(twStart, twEnd);
  const subDeptIds = await fetchSubDeptIds(scope, ranges.tw);
  if (subDeptIds.length === 0) return { tw: [], lw: [], ly: [], subDeptIds };

  onRowsStart?.();

  const [tw, lw, ly] = await Promise.all([
    fetchPeriodRows(scope, ranges.tw, subDeptIds),
    fetchPeriodRows(scope, ranges.lw, subDeptIds),
    fetchPeriodRows(scope, ranges.ly, subDeptIds),
  ]);

  return { tw, lw, ly, subDeptIds };
};
