// Interfaces
import type { CouponItem } from "../../../../../interfaces";

/** Which mobile screen is showing. */
export type Screen = "entry" | "stores" | "overview" | "detail";

/** One use of a coupon, from a receipt line. */
export type AggUse = {
  sale_id: number;
  sale_date: string;
  cashier_name: string;
  terminal: string;
  storeid: number;
  amount: number;
  row: CouponItem;
};

/** A coupon's uses, grouped by product. */
export type AggRow = {
  product_code: string;
  product_description: string;
  count: number;
  total: number;
  uses: AggUse[];
};
