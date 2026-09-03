import type {
  CashierTransaction,
  TransactionListItem,
} from "../../../interfaces";

/**
 * `cashier_table`'s rows, rebuilt from `transaction_list`'s.
 *
 * The case file was written against the walk's leftovers — every exception row
 * the overview had already downloaded. The rollup does not carry those, so on
 * the dev backend the case has to fetch its own, and the only thing that can
 * answer "one cashier's exception rows" is `transaction_ids` then
 * `transaction_list`. That returns receipt LINES, one per raw sale line, where
 * everything downstream expects `cashier_table` rows.
 *
 * The two differ in exactly one way, and it is reproducible: `cashier_table`
 * groups by `product_description` within a basket, so an item scanned twice on
 * one receipt is ONE row there and TWO lines here. Collapsing on
 * `(sale_id, product_description)` and summing `total_sales` is that GROUP BY,
 * done client-side.
 *
 * Getting this wrong is not cosmetic: every count in the case — the weekly
 * columns, the per-type totals, the store share — is a row count, so leaving
 * the lines unmerged would inflate a repeated item into a trend.
 */
export const rowsFromLines = (
  lines: TransactionListItem[],
  wantedTypes: Set<string>,
): CashierTransaction[] => {
  const byGroup = new Map<string, CashierTransaction>();

  for (const l of lines) {
    // `transaction_list` returns the whole receipt when asked for one type's
    // baskets, so the Sale and Tender lines arrive alongside the exception —
    // the same over-return the overview filters twice.
    if (!wantedTypes.has(l.sale_type)) continue;

    const key = `${l.sale_id}__${l.sale_type}__${l.product_description ?? ""}`;
    // `item_total`, NOT `total_sales`. This endpoint's `total_sales` is
    // `total_sales + tax - store_coupon`, while `cashier_table` sums the raw
    // column — so using it here made every rebuilt case read high, and the
    // missing `store_coupon` term means it cannot be reversed on this side.
    const amount = l.item_total ?? l.total_sales ?? 0;
    const found = byGroup.get(key);
    if (found) {
      found.total_sales += amount;
      continue;
    }

    byGroup.set(key, {
      storeid: l.storeid,
      store_name: l.store_name,
      store_number: l.store_number,
      sale_type: l.sale_type,
      sale_date: l.sale_date,
      sale_id: l.sale_id,
      terminal: l.terminal,
      cashier_number: l.cashier_number,
      cashier_name: l.cashier_name,
      total_sales: amount,
    });
  }

  return [...byGroup.values()];
};

/**
 * The exception types this cashier appears under, read off the graded rows.
 *
 * Saves a round trip: the overview already knows which types produced a row for
 * this store, and which cashiers moved within each. Asking the backend again
 * would only re-derive what is on screen.
 */
export const typesForCashier = (
  rows: {
    storeid: number;
    saleType: string;
    cashiers: { cashierNumber: number }[];
  }[],
  ref: { storeid: number; cashierNumber: number },
): string[] => [
  ...new Set(
    rows
      .filter(
        (r) =>
          r.storeid === ref.storeid &&
          r.cashiers.some((c) => c.cashierNumber === ref.cashierNumber),
      )
      .map((r) => r.saleType),
  ),
];

/** The storeid a basket id belongs to — it is the first segment of
 *  `storeid-saleid-terminal-M-D-Y`. A group search returns every store's
 *  baskets for that cashier number, and cashier numbers are per store, so this
 *  is what keeps two people from being read as one. */
export const storeIdOf = (transactionId: string): number =>
  Number(transactionId.split("-")[0]);
