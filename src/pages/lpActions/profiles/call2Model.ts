import type { CashierBenchmark, CashierProfile } from "../../../interfaces";

/**
 * Call 2, summarised for one store and one exception.
 *
 * The store panel used to say nothing call 2 knew. Call 1 answers "who is out
 * of line at this store" — it is the whole population, so it carries the store
 * and group averages the roster is split on. Call 2 answers a different
 * question that call 1 cannot: how far out, in which weeks, and whether the
 * same person keeps coming back. That is what these figures are.
 *
 * Nothing here compares a week to a baseline. The baseline is the left panel's
 * job, and printing it twice in two shapes is how two numbers that mean the
 * same thing end up disagreeing.
 *
 * The one thing to know about the input: with `includeUnflagged: false` the
 * response carries only the cashiers past the enrichment threshold, and their
 * `weekly[]` holds only their FLAGGED weeks. So "flagged" here means exactly
 * that, and a store with nobody past the threshold returns an empty list
 * rather than a zero — which is a real answer and is said as one.
 */

/** One cashier at this store, as call 2 graded them. */
export interface FlaggedCashier {
  cashierNumber: number;
  cashierName: string;
  lines: number;
  receipts: number;
  sales: number;
  /** How many times the peer average they ran. Null when the measure could
   *  not be graded — a peer average of zero indexes to nothing. */
  index: number | null;
  weeksPresent: number;
  weeksFlagged: number;
  persistent: boolean;
  multiType: boolean;
}

/** Everyone lands in exactly one bucket, so the three add up to the list. */
export type FlagReason = "persistent" | "multiType" | "oneWeek";

export interface FlaggedWeek {
  /** yyyy-mm-dd, the block's first day. */
  start: string;
  /** How many of this store's cashiers were flagged in it. */
  cashiers: number;
  lines: number;
}

export interface StoreCall2 {
  flagged: FlaggedCashier[];
  peer: CashierBenchmark | null;
  /** Furthest out, by index. */
  worst: FlaggedCashier | null;
  /** Most weeks any one of them was flagged. */
  maxWeeksFlagged: number;
  reasons: Record<FlagReason, number>;
  weeks: FlaggedWeek[];
}

/**
 * Persistent beats several-types beats one week.
 *
 * A partition rather than a tally of characteristics. Overlapping counts that
 * add up to more than the list is exactly the kind of arithmetic a reader
 * stops trusting, and the priority is the order anyone would act in: the same
 * exception every week is a bigger thing than several in one.
 */
export const reasonOf = (c: FlaggedCashier): FlagReason =>
  c.persistent ? "persistent" : c.multiType ? "multiType" : "oneWeek";

export const REASON_LABEL: Record<FlagReason, string> = {
  persistent: "Same exception, week after week",
  multiType: "Several exceptions at once",
  oneWeek: "One week only",
};

export const buildStoreCall2 = (
  profiles: CashierProfile[],
  benchmarks: Record<string, CashierBenchmark>,
  storeid: number,
  saleType: string,
): StoreCall2 => {
  const flagged: FlaggedCashier[] = [];
  const weekLines = new Map<string, { cashiers: number; lines: number }>();

  for (const p of profiles) {
    if (p.storeid !== storeid) continue;
    const e = p.exceptions?.[saleType];
    if (!e) continue;

    flagged.push({
      cashierNumber: p.cashier_number,
      cashierName: p.cashier_name,
      lines: Math.abs(e.line_count),
      receipts: e.transaction_count,
      // Refunds and voids sum negative; a bigger refund should read as the
      // bigger number, not the smaller one.
      sales: Math.abs(e.total_sales ?? 0),
      index: e.lines_index,
      weeksPresent: e.weeks_present,
      weeksFlagged: e.weeks_flagged ?? 0,
      persistent: p.persistent === true,
      multiType: p.multi_type === true,
    });

    for (const w of e.weekly ?? []) {
      // `investigate` ABSENT means the week was never evaluated, which is not
      // the same as evaluated-and-clean — so only an explicit true counts.
      if (w.investigate !== true) continue;
      const at = weekLines.get(w.week_start) ?? { cashiers: 0, lines: 0 };
      at.cashiers += 1;
      at.lines += Math.abs(w.line_count);
      weekLines.set(w.week_start, at);
    }
  }

  flagged.sort((a, b) => (b.index ?? 0) - (a.index ?? 0) || b.lines - a.lines);

  const reasons: Record<FlagReason, number> = {
    persistent: 0,
    multiType: 0,
    oneWeek: 0,
  };
  for (const c of flagged) reasons[reasonOf(c)] += 1;

  return {
    flagged,
    peer: benchmarks[saleType] ?? null,
    worst: flagged[0] ?? null,
    maxWeeksFlagged: flagged.reduce((a, c) => Math.max(a, c.weeksFlagged), 0),
    reasons,
    weeks: [...weekLines.entries()]
      .map(([start, v]) => ({ start, ...v }))
      .sort((a, b) => a.start.localeCompare(b.start)),
  };
};
