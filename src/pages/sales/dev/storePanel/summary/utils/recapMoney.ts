// Utils
import { countedRows } from "../../../../../../utils/hashSubs";

// Interfaces
import type { SubSale } from "../../../../../../interfaces";
import type { RecapMoney } from "../interfaces/index";

/**
 * A day's or the week's money, as a sum the reader can check: with tax, less
 * tax, is net.
 *
 * Net is the day card's figure (All week's for the week), so the sum lands on
 * the number above it. The tax is the counted sub depts' tax for those days
 * (fuel, lottery and cash are
 * out, as they are out of the net), and "with tax" is the two added, which
 * keeps the arithmetic exact rather than two figures from two sources that
 * nearly agree.
 *
 * No coupon line. The POS nets coupons into the sales already, and the coupon
 * columns are second copies of that money (at Houchens a digital coupon sits
 * on both the item row and its discount row), so any coupon total would be
 * counted twice or wrong.
 */
export const moneyForDates = (subs: SubSale[], dates: string[], net: number): RecapMoney => {
  const wanted = new Set(dates);
  const tax = countedRows(subs.filter((s) => wanted.has(s.sale_date.split("T")[0]))).reduce(
    (t, s) => t + (s.total_tax || 0),
    0,
  );
  return { withTax: net + tax, tax, net };
};
