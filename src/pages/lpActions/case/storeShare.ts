import type { CashierTransaction } from "../../../interfaces";
import type { WeekWindow } from "../lpActionsMetrics";
import { isAll, weekIndexOf } from "./caseModel";

/**
 * How much of the store's move belongs to this cashier.
 *
 * The line most likely to kill a case, which is why it is computed rather than
 * implied. If the store rose by 26 and one person accounts for 19 of them, that
 * is a person; if eight cashiers each rose a little, it is a promotion, a
 * policy change or a new prompt on the register, and nothing else in the report
 * matters.
 */
export interface StoreShare {
  storeIncrease: number;
  herIncrease: number;
  /** Other cashiers whose own count rose against their own baseline. */
  otherMovers: number;
}

const meanOfEarlier = (counts: number[]) =>
  counts.length < 2
    ? 0
    : counts.slice(0, -1).reduce((acc, n) => acc + n, 0) / (counts.length - 1);

export const buildStoreShare = (
  rows: CashierTransaction[],
  windows: WeekWindow[],
  storeid: number,
  cashierNumber: number,
  saleType: string,
): StoreShare => {
  const scoped = rows.filter(
    (r) =>
      r.storeid === storeid && (isAll(saleType) || r.sale_type === saleType),
  );

  const perCashier = new Map<number, number[]>();
  const storeWeeks = Array(windows.length).fill(0) as number[];

  for (const r of scoped) {
    const wi = weekIndexOf(windows, r.sale_date);
    if (wi < 0) continue;
    storeWeeks[wi] += 1;
    const counts =
      perCashier.get(r.cashier_number) ?? Array(windows.length).fill(0);
    counts[wi] += 1;
    perCashier.set(r.cashier_number, counts);
  }

  const increaseOf = (counts: number[]) =>
    (counts[counts.length - 1] ?? 0) - meanOfEarlier(counts);

  const mine = perCashier.get(cashierNumber) ?? [];
  let otherMovers = 0;
  for (const [num, counts] of perCashier) {
    // A whole extra occurrence, not a rounding wobble on a fractional mean.
    if (num !== cashierNumber && increaseOf(counts) >= 1) otherMovers += 1;
  }

  return {
    storeIncrease: Math.round(increaseOf(storeWeeks)),
    herIncrease: Math.round(increaseOf(mine)),
    otherMovers,
  };
};
