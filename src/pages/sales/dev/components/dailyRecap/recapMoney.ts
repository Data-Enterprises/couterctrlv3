import type { SubSale } from "../../../../../interfaces";
import { splitHash } from "../../../../../utils/hashSubs";
import type { RecapMoney } from "./recapTypes";

/**
 * A day's money, as a sum the reader can check: with tax, less tax, is net.
 *
 * Net is the day card's figure, so the sum lands on the number above it. The
 * tax is the counted sub depts' tax for the day, and "with tax" is the two
 * added, which keeps the arithmetic exact rather than two figures from two
 * sources that nearly agree.
 *
 * No coupon line. The POS nets coupons into the sales already, and the coupon
 * columns are second copies of that money (at Houchens a digital coupon sits
 * on both the item row and its discount row), so any coupon total would be
 * counted twice or wrong.
 *
 * Fuel, lottery and cash are out of net sales, as on the day cards, and listed
 * so their money is not lost.
 */
export const moneyForDay = (subs: SubSale[], date: string, net: number): RecapMoney => {
  const day = subs.filter((s) => s.sale_date.split("T")[0] === date);
  const { counted, hash } = splitHash(day);
  const tax = counted.reduce((t, s) => t + (s.total_tax || 0), 0);

  const leftBy = new Map<string, number>();
  for (const s of hash) {
    const name = s.sub_department_description;
    leftBy.set(name, (leftBy.get(name) ?? 0) + s.total_sales - s.total_tax);
  }
  const leftOut = [...leftBy]
    .map(([name, n]) => ({ name, net: n }))
    .filter((l) => l.net !== 0)
    .sort((a, b) => b.net - a.net);

  return { withTax: net + tax, tax, net, leftOut };
};
