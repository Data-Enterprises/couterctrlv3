// Interfaces
import type { TransactionListItem } from "../../../../../interfaces";
import type { BasketLine, SaleSummary } from "../interfaces";

/**
 * A "DC <vendor>" line: the register's record of a discount, written as its
 * own row under the SAME product_code as the item it discounts. Bucketing on
 * product_code alone folds the discount into the item and reports the
 * difference as a price: SF BACON rang at $2.99 with a $1.00 discount beside
 * it, and the two collapsed to "$0.99".
 */
export const isDiscountLine = (l: TransactionListItem) =>
  (l.qty ?? 0) === 0 && l.is_discounted === 1;

/**
 * The basket's total from sale lines only — their `net_sales` already has the
 * discount applied. The DC row's own `net_sales` is doubled (-2.00 against a
 * real -1.00), so adding it would subtract the discount twice over: that made
 * receipt 111-177563 total $14.62 instead of $18.62.
 */
export const basketTotal = (basket: TransactionListItem[]) =>
  basket.filter((l) => !isDiscountLine(l)).reduce((s, l) => s + l.net_sales, 0);

/**
 * One row per transaction, not per scan: an item rung four times in one sale
 * was four rows all carrying the same receipt number, which read like four
 * customers. Quantity and net are summed so a row says what that customer
 * took and paid. Oldest first.
 */
export const groupSales = (lines: TransactionListItem[]): SaleSummary[] => {
  const bySale = new Map<string, SaleSummary>();
  for (const l of lines) {
    const found = bySale.get(l.sale_id);
    const q = l.qty ?? 1;
    if (found) {
      found.qty += q;
      found.net += l.net_sales;
      found.priceTypes.add(l.price_type);
    } else {
      bySale.set(l.sale_id, {
        sale: l,
        qty: q,
        net: l.net_sales,
        priceTypes: new Set([l.price_type]),
      });
    }
  }
  return [...bySale.values()].sort((a, b) =>
    a.sale.sale_date.localeCompare(b.sale.sale_date),
  );
};

/**
 * One row per product, not per scan, in the order the register rang them.
 *
 * Price type is kept as a set: two scans of the same item at different price
 * types is a genuine finding. An item and its own "DC" line stay two rows —
 * they share a product_code, and merging them reports a price nobody paid.
 */
export const groupBasket = (basket: TransactionListItem[]): BasketLine[] => {
  const byCode = new Map<string, BasketLine>();
  for (const l of basket) {
    const code = String(l.product_code);
    const discount = isDiscountLine(l);
    const key = `${code}|${discount ? "dc" : "item"}`;
    const found = byCode.get(key);
    // `qty` is optional on the line; a scan with none is one unit.
    const q = l.qty ?? 1;
    // `total_sales` on a DC row, `net_sales` on a sale row. The discount's
    // `net_sales` is double its real value — -2.00 where the item went 3.99
    // to 2.99 — while its `total_sales` is the amount that actually came off.
    const amount = discount ? l.total_sales : l.net_sales;
    if (found) {
      found.qty += q;
      found.net += amount;
      found.coupon += l.coupon_amount;
      found.priceTypes.add(l.price_type);
    } else {
      byCode.set(key, {
        code,
        discount,
        description: l.product_description,
        qty: q,
        net: amount,
        coupon: l.coupon_amount,
        priceTypes: new Set([l.price_type]),
        firstLine: l.line_number,
      });
    }
  }
  return [...byCode.values()].sort((a, b) => a.firstLine - b.firstLine);
};
