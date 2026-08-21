import type { CashierTransaction } from "../../interfaces";
import type { LpSeverity, WeekWindow } from "./lpActionsMetrics";
import { gradeChange } from "./lpActionsMetrics";

/**
 * One cashier's whole exception picture, built from rows already in hand.
 *
 * The walk fetches every exception type for every week to grade the ledger, so
 * a cashier's complete profile — every type they touched, every lane, every
 * receipt — is already downloaded. This derives it rather than asking again.
 *
 * The chart is worth drawing because of what **converges**, not what radiates.
 * A cashier joined to their own types and lanes is a fan with extra steps; the
 * finding is a lane two operators both spike on, or a type only one person in
 * the store produces. So every node carries how many *other* cashiers reach it,
 * and that is what the chart weights.
 */
export interface JourneyType {
  name: string;
  count: number;
  perWeek: number[];
  latest: number;
  baseline: number;
  severity: LpSeverity;
  /** Other cashiers in scope who also produced this exception type. */
  sharedWith: number;
}

export interface JourneyTerminal {
  name: string;
  count: number;
  /** Other cashiers who also produced exceptions on this lane. Two people
   *  spiking on one lane is the classic link-analysis finding. */
  sharedWith: number;
}

export interface JourneyLink {
  type: string;
  terminal: string;
  count: number;
}

export interface CashierJourney {
  cashierNumber: number;
  cashierName: string;
  storeName: string;
  total: number;
  types: JourneyType[];
  terminals: JourneyTerminal[];
  links: JourneyLink[];
}

/** The endpoint spells it `termainal`; kept in one place so the typo doesn't
 *  spread. Blank lanes become "unknown" rather than an empty node. */
const lane = (t: CashierTransaction) => String(t.termainal || "").trim() || "—";

const weekIndexOf = (windows: WeekWindow[], saleDate: string) => {
  const day = saleDate.slice(0, 10);
  return windows.findIndex((w) => day >= w.start && day <= w.end);
};

export const buildCashierJourney = (
  rows: CashierTransaction[],
  windows: WeekWindow[],
  cashierNumber: number,
): CashierJourney | null => {
  const mine = rows.filter((r) => r.cashier_number === cashierNumber);
  if (mine.length === 0) return null;

  // Who else reaches each type and lane, across everyone in scope.
  const othersByType = new Map<string, Set<number>>();
  const othersByLane = new Map<string, Set<number>>();
  for (const r of rows) {
    if (r.cashier_number === cashierNumber) continue;
    const t = othersByType.get(r.sale_type) ?? new Set<number>();
    t.add(r.cashier_number);
    othersByType.set(r.sale_type, t);
    const l = othersByLane.get(lane(r)) ?? new Set<number>();
    l.add(r.cashier_number);
    othersByLane.set(lane(r), l);
  }

  const typeAgg = new Map<string, number[]>();
  const laneAgg = new Map<string, number>();
  const linkAgg = new Map<string, number>();

  for (const r of mine) {
    const wi = weekIndexOf(windows, r.sale_date);
    const counts = typeAgg.get(r.sale_type) ?? Array(windows.length).fill(0);
    if (wi >= 0) counts[wi] += 1;
    typeAgg.set(r.sale_type, counts);

    laneAgg.set(lane(r), (laneAgg.get(lane(r)) ?? 0) + 1);
    const key = `${r.sale_type}__${lane(r)}`;
    linkAgg.set(key, (linkAgg.get(key) ?? 0) + 1);
  }

  const meanOfEarlier = (counts: number[]) =>
    counts.length < 2
      ? 0
      : counts.slice(0, -1).reduce((a, n) => a + n, 0) / (counts.length - 1);

  const types: JourneyType[] = [...typeAgg.entries()]
    .map(([name, perWeek]) => {
      const latest = perWeek[perWeek.length - 1] ?? 0;
      const baseline = meanOfEarlier(perWeek);
      return {
        name,
        count: perWeek.reduce((a, n) => a + n, 0),
        perWeek,
        latest,
        baseline,
        severity: gradeChange(latest, baseline).severity,
        sharedWith: othersByType.get(name)?.size ?? 0,
      };
    })
    .sort((a, b) => b.count - a.count);

  const terminals: JourneyTerminal[] = [...laneAgg.entries()]
    .map(([name, count]) => ({
      name,
      count,
      sharedWith: othersByLane.get(name)?.size ?? 0,
    }))
    .sort((a, b) => b.count - a.count);

  const links: JourneyLink[] = [...linkAgg.entries()]
    .map(([key, count]) => {
      const [type, terminal] = key.split("__");
      return { type, terminal, count };
    })
    .sort((a, b) => b.count - a.count);

  const first = mine[0];
  return {
    cashierNumber,
    cashierName: first.cashier_name,
    storeName: first.store_name,
    total: mine.length,
    types,
    terminals,
    links,
  };
};
