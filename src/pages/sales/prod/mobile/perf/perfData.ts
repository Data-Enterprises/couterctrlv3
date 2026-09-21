import type {
  HourlySale,
  SubDeptMargin,
  SubSale,
  WeeklySale,
} from "../../../../../interfaces";
import {
  buildDays as buildDaysCore,
  dayOf,
  inScope,
  lyDateFor,
  matchWeek,
  netOf,
  pairBy,
  storeKeyOf,
  sumFor,
  type DayMatch,
  type PerfDay,
  type PerfPair,
} from "../../../../../utils/perfPairs";

export { lyDateFor, storeKeyOf };
export {
  dirOf,
  isPartialMatch,
  noLyHistory,
  pairChangePct,
  sortPairs,
  type PairSort,
} from "../../../../../utils/perfPairs";
export type { DayMatch, PerfDay, PerfPair };

/**
 * A change against last year, as a signed percentage.
 *
 * A true minus sign rather than a hyphen: at 12px a hyphen reads as a dash
 * joining the number to whatever precedes it. Neutral by design — there is no
 * grading on mobile Performance, so this is a figure and never a verdict.
 */
export const fmtChange = (pct: number) =>
  `${pct > 0 ? "+" : pct < 0 ? "−" : ""}${Math.abs(pct).toFixed(1)}%`;

/** "3 of 7 days matched" — why last year is short of a full week. The same
 *  wording desktop Sales uses. */
export const matchedNote = (p: { days?: number | null; lyDays?: number | null }) =>
  `${p.lyDays} of ${p.days} days matched`;

/**
 * The week's day matching for a scope — one store, or every store in the
 * search. Read off the weekly rows, which carry store identity and are what
 * says whether the store traded on a date at all. Subs, hours and items reuse
 * it for their scope: their own rows can't tell a gap from a quiet department.
 */
export const scopeMatch = (
  weekTy: WeeklySale[],
  weekLy: WeeklySale[],
  store: string | null,
): DayMatch =>
  matchWeek(
    weekTy.filter((r) => inScope(r, null, store)),
    weekLy.filter((r) => inScope(r, null, store)),
  );

/** The four coupon channels, kept split rather than summed so the card can
 *  show the mix. Keys match COUPON_COLORS and COUPON_LABELS. */
export interface CouponSplit {
  digital: number;
  elecStore: number;
  elecInstore: number;
  store: number;
}

export interface PerfTotals {
  /** This year, every day in scope — the headline figure. */
  sales: number;
  /** This year over only the days last year matched — what the TY/LY bars
   *  compare. Equal to `sales` inside a day or on a complete week. */
  salesForLy: number;
  /** Last year on the matched dates only. */
  salesLy: number;
  /** Days this year has, and how many matched last year. Null inside a day. */
  days: number | null;
  lyDays: number | null;
  transactions: number;
  tax: number;
  coupons: number;
  couponSplit: CouponSplit;
  avgBasket: number;
}

/**
 * The totals card.
 *
 * Sales and tax come from the weekly rows, transactions and basket from the
 * hourly rows — the weekly payload carries no transaction count — and coupons
 * from the sub-department rows, which are the only place the four channels
 * appear. Three sources, one card.
 */
export const buildTotals = (
  weekTy: WeeklySale[],
  weekLy: WeeklySale[],
  hourlyTy: HourlySale[],
  subsTy: SubSale[],
  day: string | null,
  store: string | null,
): PerfTotals => {
  const lyDay = day ? lyDateFor(day) : null;

  // Weekly is the only endpoint whose group response carries store identity,
  // so it is the only one filtered here. The hourly and sub rows arrive
  // already scoped — the caller hands over the group bundle or that store's
  // bundle, because a group response has no store dimension to filter on.
  const sales = sumFor(weekTy, day, store, netOf);
  // A single day names its one LY date. The whole week sums only matched
  // dates on both sides — never every LY row fetched, which around a holiday
  // includes dates that match nothing (see DayMatch).
  const match = day ? null : scopeMatch(weekTy, weekLy, store);
  const salesForLy = match
    ? sumFor(weekTy.filter((r) => match.tyDates.has(dayOf(r))), null, store, netOf)
    : sales;
  const salesLy = match
    ? sumFor(weekLy.filter((r) => match.lyDates.has(dayOf(r))), null, store, netOf)
    : sumFor(weekLy, lyDay, store, netOf);
  const tax = sumFor(weekTy, day, store, (r) => r.total_tax);
  const transactions = sumFor(hourlyTy, day, null, (r) => r.transactions);

  const couponSplit: CouponSplit = {
    digital: sumFor(subsTy, day, null, (r) => r.digital_coupons),
    elecStore: sumFor(subsTy, day, null, (r) => r.elec_store_coupons),
    elecInstore: sumFor(subsTy, day, null, (r) => r.elec_instore_coupons),
    store: sumFor(subsTy, day, null, (r) => r.store_coupon),
  };
  const coupons =
    couponSplit.digital +
    couponSplit.elecStore +
    couponSplit.elecInstore +
    couponSplit.store;

  return {
    sales,
    salesForLy,
    salesLy,
    days: match ? match.days : null,
    lyDays: match ? match.lyDays : null,
    transactions,
    tax,
    coupons,
    couponSplit,
    // Guarded: a day with no transactions would otherwise render NaN rather
    // than an empty figure.
    avgBasket: transactions > 0 ? sales / transactions : 0,
  };
};

export const buildDays = (
  weekTy: WeeklySale[],
  weekLy: WeeklySale[],
  store: string | null,
) => buildDaysCore(weekTy, weekLy, store, netOf);

/** The store list is never narrowed by store — selecting one highlights it in
 *  place rather than reducing the list to a single row. */
export const buildStorePairs = (
  weekTy: WeeklySale[],
  weekLy: WeeklySale[],
  day: string | null,
  /** How a store is named. Passed in rather than read off the row: the name
   *  the user knows comes from their assigned stores, never from a payload. */
  nameOf: (storeid: number, fallback?: string) => string,
) => {
  // Each store matches on its own dates: one store missing last year's
  // weekend says nothing about the store beside it.
  const matches = new Map<string, DayMatch>();
  const matchOf = (key: string) => {
    if (!matches.has(key)) matches.set(key, scopeMatch(weekTy, weekLy, key));
    return matches.get(key);
  };
  return pairBy(
    weekTy,
    weekLy,
    day,
    null,
    storeKeyOf,
    (r) => nameOf(r.storeid, r.store_name),
    netOf,
    matchOf,
  );
};

/** Rows arrive already scoped to the group or to one store, so there is no
 *  store filter here — see buildTotals. `match` is that scope's (scopeMatch). */
export const buildSubPairs = (
  subsTy: SubSale[],
  subsLy: SubSale[],
  day: string | null,
  match?: DayMatch,
) =>
  pairBy(
    subsTy,
    subsLy,
    day,
    null,
    (r) => String(r.sub_department),
    (r) => r.sub_department_description,
    netOf,
    match,
  );

/** 14 becomes "2pm – 3pm". Midnight and noon are spelled rather than rendered
 *  as 0pm and 12am, which read as bugs. */
const hourLabel = (h: number) => {
  const fmt = (n: number) => {
    if (n === 0) return "12am";
    if (n === 12) return "12pm";
    return n < 12 ? `${n}am` : `${n - 12}pm`;
  };
  return `${fmt(h)} – ${fmt((h + 1) % 24)}`;
};

export const buildHourPairs = (
  hourlyTy: HourlySale[],
  hourlyLy: HourlySale[],
  day: string | null,
  match?: DayMatch,
) =>
  pairBy(
    hourlyTy,
    hourlyLy,
    day,
    null,
    (r) => String(r.hour),
    (r) => hourLabel(r.hour),
    netOf,
    match,
  )
    // Hours read as a timeline, not a ranking, once you are inside a single
    // day. Re-sorted here rather than in pairBy so the other lists keep size
    // order.
    .sort((a, b) => Number(a.key) - Number(b.key));

/**
 * One sub department's items, this year against last year.
 *
 * Rows arrive already scoped to one store (see SalesPerfMobile), so there is
 * no store filter. Keyed on product_code as a string — the endpoint sends it as
 * a number on some rows.
 */
export const buildItemPairs = (
  itemsTy: SubDeptMargin[],
  itemsLy: SubDeptMargin[],
  day: string | null,
  match?: DayMatch,
) =>
  pairBy(
    itemsTy,
    itemsLy,
    day,
    null,
    (r) => String(r.product_code),
    (r) => r.product_description || String(r.product_code),
    netOf,
    match,
  );

/** Items whose description or UPC contains the query, ignoring case. The UPC
 *  also matches with its leading zeros dropped, so "4900" finds "0004900". */
export const filterItemPairs = (pairs: PerfPair[], query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return pairs;
  const qCode = q.replace(/^0+/, "");
  return pairs.filter(
    (p) =>
      p.label.toLowerCase().includes(q) ||
      p.key.includes(q) ||
      (qCode !== "" && p.key.replace(/^0+/, "").includes(qCode)),
  );
};
