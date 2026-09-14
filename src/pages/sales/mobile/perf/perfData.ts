import type {
  HourlySale,
  SubDeptMargin,
  SubSale,
  WeeklySale,
} from "../../../../interfaces";
import {
  buildDays as buildDaysCore,
  lyDateFor,
  netOf,
  pairBy,
  storeKeyOf,
  sumFor,
  type PerfDay,
  type PerfPair,
} from "../../../../utils/perfPairs";

export { lyDateFor, storeKeyOf };
export {
  pairChangePct,
  sortPairs,
  type PairSort,
} from "../../../../utils/perfPairs";
export type { PerfDay, PerfPair };

/** The four coupon channels, kept split rather than summed so the card can
 *  show the mix. Keys match COUPON_COLORS and COUPON_LABELS. */
export interface CouponSplit {
  digital: number;
  elecStore: number;
  elecInstore: number;
  store: number;
}

export interface PerfTotals {
  sales: number;
  salesLy: number;
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
  const salesLy = sumFor(weekLy, lyDay, store, netOf);
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
    salesLy,
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
) =>
  pairBy(
    weekTy,
    weekLy,
    day,
    null,
    storeKeyOf,
    (r) => nameOf(r.storeid, r.store_name),
    netOf,
  );

/** Rows arrive already scoped to the group or to one store, so there is no
 *  store filter here — see buildTotals. */
export const buildSubPairs = (
  subsTy: SubSale[],
  subsLy: SubSale[],
  day: string | null,
) =>
  pairBy(
    subsTy,
    subsLy,
    day,
    null,
    (r) => String(r.sub_department),
    (r) => r.sub_department_description,
    netOf,
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
) =>
  pairBy(
    hourlyTy,
    hourlyLy,
    day,
    null,
    (r) => String(r.hour),
    (r) => hourLabel(r.hour),
    netOf,
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
) =>
  pairBy(
    itemsTy,
    itemsLy,
    day,
    null,
    (r) => String(r.product_code),
    (r) => r.product_description || String(r.product_code),
    netOf,
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
