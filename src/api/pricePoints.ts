import axios from "axios";

/**
 * One price an item rang at over a window, aggregated on the server.
 *
 * `POST /cashiers/price_points` (backend 22 Oct). It reads every receipt line
 * for the item — no cap — and returns one row per price, price type and
 * single/multi ring, where the browser used to download up to 400 receipts
 * and bucket them itself.
 *
 * `unit_price` is per pound when `weighed`. A weighed line that rang at the
 * shelf price within what rounding can explain reports the shelf price
 * exactly; anything outside that reports what was paid. `receipts` counts
 * distinct receipts, on the same key `transaction_list` builds.
 */
export interface ServerPricePoint {
  price_type: string;
  /** Rung as a multiple (qty > 1) rather than one at a time. */
  multi: boolean;
  unit_price: number;
  receipts: number;
  units: number;
  /** Pounds. 0 on an unweighed item. */
  weight: number;
  sales: number;
  days_seen: number;
  /** yyyy-mm-dd. */
  last_seen: string;
  weighed: boolean;
}

export interface PricePointsResp {
  error: number;
  success: boolean;
  count: number;
  price_points: ServerPricePoint[];

  /**
   * The receipt counts behind "Package deal" (backend 23 Oct, finding D).
   *
   * Package deal is the item at two prices on ONE receipt, which no price
   * list can show -- the signal is which prices land in a basket together.
   * The browser used to get it by downloading every receipt; the server
   * counts them now, on the same lines it already reads.
   *
   * Optional, so a deploy against the older API still renders. The pattern
   * is then judged without them, which is what it did before they existed.
   */

  /** Distinct receipts the item appeared on. NOT the sum of `receipts` across
   *  the price points: one receipt can sit in two of those rows -- penny
   *  twins, or a price rung both singly and as a multiple -- so that sum
   *  over-counts, and by exactly the receipts this feature is about. */
  receipts_total?: number;

  /**
   * Of those, how many rang the item at more than one price.
   *
   * "More than one price" means more than a CENT apart. A 3-for-$10 rings
   * $3.33, $3.33, $3.34, and counting raw distinct prices made 64 of the 85
   * two-price receipts at store 695 penny-apart rounding -- three in every
   * four "package deals" would have been false. The price list already folds
   * penny twins; this is the same rule applied to the count, and the two
   * must stay in step.
   *
   * `null` on a weighed item. Two packs of chicken in one basket usually
   * compute to different prices per pound because the total is rounded to
   * the cent and the weight to the hundredth of a pound, and a BOGO is rung
   * on packages rather than pounds, so the question does not apply.
   */
  multi_price_receipts?: number | null;

  /** Widest gap inside one multi-price receipt. `null` on a weighed item,
   *  for the same reason. Printed, never used to decide. */
  max_price_spread?: number | null;

  msg?: string;
}

export const getPricePoints = (
  url: string,
  token: string,
  body: {
    storeid: number;
    productCode: string;
    /** yyyy-mm-dd */
    startDate: string;
    endDate: string;
  },
) =>
  axios<PricePointsResp>({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "cashiers/price_points",
    data: body,
  });
