/**
 * The dollar value of a coupon row, and how to total a set of them.
 *
 * Some backends return `coupon_amount` as null and carry the figure in
 * `store_coupon` / `vendor_coupon` instead — whichever of the two is greater
 * than zero; it is one or the other, never both. `CouponItem` types the field
 * non-null, so nothing catches this at compile time, and summing null coerces
 * to 0 in JS rather than NaN. The result is a silent $0.00 total.
 *
 * Shared between the Coupons page and Coupon Sales so the two can't drift.
 */

/** Only the fields the value depends on — keeps this usable from anywhere,
 *  including the mobile rollups that pass narrowed row shapes around. */
export type CouponValueRow = {
  coupon_amount: number | null;
  /** Present on coupons/ rows. Receipt lines from LP's transaction endpoint
   *  don't carry them, so the fallback simply doesn't apply there. */
  store_coupon?: number;
  vendor_coupon?: number;
  /** Number on coupons/ rows, a composite string on receipt lines — only ever
   *  used for identity when deduping. */
  sale_id: number | string;
};

export const couponValueOf = (r: CouponValueRow): number => {
  if (r.coupon_amount != null) return r.coupon_amount;
  if ((r.store_coupon ?? 0) > 0) return r.store_coupon as number;
  if ((r.vendor_coupon ?? 0) > 0) return r.vendor_coupon as number;
  return 0;
};

/**
 * True when this row's value came from the store_coupon/vendor_coupon
 * fallback rather than its own coupon_amount.
 *
 * This matters because those fallback fields are a TRANSACTION-level figure
 * repeated on every line of the sale, so they can only be counted once per
 * sale_id. Summing them per row reported $38.97 of coupon against a $29.97
 * basket on transaction 7352085.
 */
export const usesFallbackValue = (r: CouponValueRow): boolean =>
  r.coupon_amount == null;

/**
 * Total coupon dollars across rows. Rows carrying their own coupon_amount add
 * up per line; rows on the fallback are counted once per sale_id. Use this
 * anywhere a `.reduce((s, c) => s + c.coupon_amount, 0)` used to be.
 */
export const sumCouponAmount = (rows: CouponValueRow[]): number => {
  let total = 0;
  const countedSales = new Set<number | string>();
  for (const r of rows) {
    if (!usesFallbackValue(r)) {
      total += r.coupon_amount as number;
      continue;
    }
    if (countedSales.has(r.sale_id)) continue;
    countedSales.add(r.sale_id);
    total += couponValueOf(r);
  }
  return total;
};

/**
 * Per-row amounts with the transaction-level fallback attributed to the first
 * line of each sale and zeroed on the rest. For grids and CSV exports, where
 * someone will sum the column themselves and expect it to match the header.
 */
export const withResolvedCouponAmount = <T extends CouponValueRow>(
  rows: T[],
): (T & { coupon_amount: number })[] => {
  const seenSales = new Set<number | string>();
  return rows.map((r) => {
    let amount = couponValueOf(r);
    if (usesFallbackValue(r)) {
      if (seenSales.has(r.sale_id)) amount = 0;
      else seenSales.add(r.sale_id);
    }
    return { ...r, coupon_amount: amount };
  });
};
