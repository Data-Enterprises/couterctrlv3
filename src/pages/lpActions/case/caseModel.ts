import type { CashierTransaction } from "../../../interfaces";
import type { CashierRef, LpSeverity, WeekWindow } from "../lpActionsMetrics";
import { gradeChange, isCashier, laneOf } from "../lpActionsMetrics";

/**
 * The core of one cashier's case: every exception type they touched, each
 * graded against their own history.
 *
 * Pure, and built from rows the exception walk already downloaded. The chips,
 * the week lines and the headline all come from here so they cannot disagree —
 * a multiplier on a chip and the same multiplier in the sentence beneath it
 * were two calculations before this file existed.
 */
export interface CaseType {
  saleType: string;
  /** Counts per week, oldest first — the week lines plot this directly. */
  perWeek: number[];
  latest: number;
  baseline: number;
  /** Null when there is no history to divide by: a first appearance. */
  multiplier: number | null;
  severity: LpSeverity;
}

/** The tab that reads the operator rather than one exception. Kept as a
 *  sentinel sale type so every builder below takes the same argument and
 *  simply skips its type filter, instead of growing a parallel set of
 *  "…across all types" functions that could drift from these. */
export const ALL_TYPES = "All";

export const isAll = (saleType: string) => saleType === ALL_TYPES;

export interface CaseCore {
  cashierNumber: number;
  cashierName: string;
  storeName: string;
  storeid: number;
  types: CaseType[];
  /** The same shape as one type, summed across every type — what the All tab
   *  is graded and written from. */
  all: CaseType;
  /** Profile facts — the operator across every type, not the case being read.
   *  They belong to the person, so they sit in the header while the panel
   *  below it changes with the tab. */
  latestTotal: number;
  lanes: string[];
}

const meanOfEarlier = (counts: number[]) =>
  counts.length < 2
    ? 0
    : counts.slice(0, -1).reduce((acc, n) => acc + n, 0) / (counts.length - 1);

export const weekIndexOf = (windows: WeekWindow[], saleDate: string) => {
  const day = saleDate.slice(0, 10);
  return windows.findIndex((w) => day >= w.start && day <= w.end);
};

export const buildCaseCore = (
  rows: CashierTransaction[],
  windows: WeekWindow[],
  ref: CashierRef,
): CaseCore | null => {
  const mine = rows.filter((r) => isCashier(r, ref));
  if (mine.length === 0) return null;

  const byType = new Map<string, number[]>();
  for (const r of mine) {
    const counts = byType.get(r.sale_type) ?? Array(windows.length).fill(0);
    const wi = weekIndexOf(windows, r.sale_date);
    if (wi >= 0) counts[wi] += 1;
    byType.set(r.sale_type, counts);
  }

  const types: CaseType[] = [...byType.entries()]
    .map(([saleType, perWeek]) => {
      const latest = perWeek[perWeek.length - 1] ?? 0;
      const baseline = meanOfEarlier(perWeek);
      return {
        saleType,
        perWeek,
        latest,
        baseline,
        multiplier: baseline > 0 ? latest / baseline : null,
        severity: gradeChange(latest, baseline).severity,
      };
    })
    // Biggest mover first — the chip a reader should look at leads.
    .sort((a, b) => b.latest - b.baseline - (a.latest - a.baseline));

  const allPerWeek = windows.map((_, i) =>
    types.reduce((acc, t) => acc + (t.perWeek[i] ?? 0), 0),
  );
  const allLatest = allPerWeek[allPerWeek.length - 1] ?? 0;
  const allBaseline = meanOfEarlier(allPerWeek);

  const last = windows[windows.length - 1];
  const latest = last
    ? mine.filter(
        (r) =>
          r.sale_date.slice(0, 10) >= last.start &&
          r.sale_date.slice(0, 10) <= last.end,
      )
    : [];

  const first = mine[0];
  return {
    all: {
      saleType: ALL_TYPES,
      perWeek: allPerWeek,
      latest: allLatest,
      baseline: allBaseline,
      multiplier: allBaseline > 0 ? allLatest / allBaseline : null,
      severity: gradeChange(allLatest, allBaseline).severity,
    },
    latestTotal: latest.length,
    lanes: [...new Set(latest.map((r) => laneOf(r) || "—"))].sort(),
    cashierNumber: ref.cashierNumber,
    cashierName: first.cashier_name,
    storeName: first.store_name,
    storeid: ref.storeid,
    types,
  };
};

export interface TypeFacts {
  occurrences: number;
  receipts: number;
  days: string[];
  value: number;
  average: number;
  largest: number;
  /** The busiest single day of the latest week, and how many fell on it. */
  peakDay: string;
  peakDayCount: number;
}

/** What the latest week looked like for one type — the numbers the finding
 *  sentence and the evidence lines are written from. */
export const latestWeekFacts = (
  rows: CashierTransaction[],
  windows: WeekWindow[],
  ref: CashierRef,
  saleType: string,
): TypeFacts => {
  const last = windows[windows.length - 1];
  const mine = rows.filter(
    (r) =>
      isCashier(r, ref) &&
      (isAll(saleType) || r.sale_type === saleType) &&
      r.sale_date.slice(0, 10) >= last.start &&
      r.sale_date.slice(0, 10) <= last.end,
  );
  const value = mine.reduce((acc, r) => acc + Math.abs(r.total_sales ?? 0), 0);

  const perDay = new Map<string, number>();
  for (const r of mine) {
    const day = r.sale_date.slice(0, 10);
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }
  const [peakDay = "", peakDayCount = 0] =
    [...perDay.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];

  return {
    peakDay,
    peakDayCount,
    occurrences: mine.length,
    receipts: new Set(mine.map((r) => r.sale_id)).size,
    days: [...new Set(mine.map((r) => r.sale_date.slice(0, 10)))].sort(),
    value,
    average: mine.length ? value / mine.length : 0,
    largest: mine.reduce(
      (acc, r) => Math.max(acc, Math.abs(r.total_sales ?? 0)),
      0,
    ),
  };
};
