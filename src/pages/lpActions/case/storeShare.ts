import type { CashierTransaction } from "../../../interfaces";
import type { CashierRef, ExceptionRow, WeekWindow } from "../lpActionsMetrics";
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

/**
 * The same three numbers, off the graded rows instead of the transactions.
 *
 * The case's own rows are ONE cashier's — that is the whole point of fetching
 * them lazily — and this line is a claim about everybody else: what the store
 * did, and how many other people moved. Computing it from the cashier's own
 * rows produces a store that rose by exactly her amount and a confident "no
 * other cashier moved", which is not a rounding error but a false statement
 * about five other people.
 *
 * Nothing needs fetching to fix it. The overview already graded every cashier
 * at the store, and `latest - baseline` here is the same arithmetic
 * `increaseOf` does over the weekly counts.
 */
export const storeShareFromGraded = (
  gradedRows: ExceptionRow[],
  ref: CashierRef,
  saleType: string,
): StoreShare => {
  const mine = gradedRows.filter(
    (r) =>
      r.storeid === ref.storeid && (isAll(saleType) || r.saleType === saleType),
  );
  if (mine.length === 0)
    return { storeIncrease: 0, herIncrease: 0, otherMovers: 0 };

  const storeIncrease = mine.reduce(
    (acc, r) => acc + (r.latest - r.baseline),
    0,
  );

  // "All" pools the types, so a cashier's movement has to pool with it —
  // otherwise someone who rose on two types is counted as two movers.
  const byCashier = new Map<number, number>();
  for (const r of mine) {
    for (const c of r.cashiers) {
      byCashier.set(
        c.cashierNumber,
        (byCashier.get(c.cashierNumber) ?? 0) + (c.latest - c.baseline),
      );
    }
  }

  let otherMovers = 0;
  for (const [num, move] of byCashier) {
    // A whole extra occurrence, not a rounding wobble on a fractional mean —
    // the same threshold the transaction-derived version uses.
    if (num !== ref.cashierNumber && move >= 1) otherMovers += 1;
  }

  return {
    storeIncrease: Math.round(storeIncrease),
    herIncrease: Math.round(byCashier.get(ref.cashierNumber) ?? 0),
    otherMovers,
  };
};
