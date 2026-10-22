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
