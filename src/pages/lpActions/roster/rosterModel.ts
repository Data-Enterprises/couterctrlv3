import type { CashierTransaction } from "../../../interfaces";
import {
  gradeChange,
  SEVERITY_RANK,
  weekIndexOf,
  type CashierRef,
  type LpSeverity,
  type WeekWindow,
} from "../lpActionsMetrics";

/**
 * The roster: who moved, and where.
 *
 * LP Actions used to root its list on the exception type, with stores
 * underneath. The case file that opens on the right answers for one **person**,
 * so the list that leads to it is rooted on the person too — store first when
 * the search covered a group, and cashiers under it.
 *
 * Nothing here fetches. The walk already downloaded every exception
 * transaction across every week, so the whole roster is a single pass over
 * `rawRows` and re-rooting the list costs no requests at all.
 *
 * Grading is unchanged and stays [[project_lp_grading_concept]]'s: a cashier is
 * judged against their **own** earlier weeks, never against the other people on
 * the roster. Twelve voids is unremarkable for someone who always does eleven.
 */

/** Which exception types a cashier touched, biggest first — the swatches on
 *  the row. Rooting on the person loses "which type moved" unless the row
 *  carries it, and this is the cheapest way to keep it. */
export interface RosterType {
  saleType: string;
  count: number;
}

export interface RosterCashier extends CashierRef {
  /** `storeid__cashierNumber`. Cashier numbers are issued per store, so the
   *  number alone would pool two different people into one impossible
   *  operator — see `CashierRef`. */
  id: string;
  cashierName: string;
  storeName: string;
  /** Exceptions per week, oldest first, parallel to `windows`. */
  weeks: number[];
  /** The most recent week. */
  latest: number;
  /** Their own mean across the earlier weeks. */
  baseline: number;
  /** `latest / baseline`, or null when there is no baseline to divide by. */
  multiple: number | null;
  changePct: number | null;
  severity: LpSeverity;
  types: RosterType[];
}

export interface RosterStore {
  storeid: number;
  storeName: string;
  /** Summed across the store's cashiers, so the collapsed row still grades. */
  weeks: number[];
  latest: number;
  baseline: number;
  multiple: number | null;
  changePct: number | null;
  severity: LpSeverity;
  investigateCount: number;
  cashiers: RosterCashier[];
}

const meanOfEarlier = (weeks: number[]) =>
  weeks.length < 2
    ? 0
    : weeks.slice(0, -1).reduce((acc, n) => acc + n, 0) / (weeks.length - 1);

/** Latest over baseline. Null rather than Infinity when there is no history —
 *  a first sighting is not an infinite increase, it is an unknown one. */
const multipleOf = (latest: number, baseline: number) =>
  baseline > 0 ? latest / baseline : null;

const gradeSeries = (weeks: number[]) => {
  const latest = weeks[weeks.length - 1] ?? 0;
  const baseline = meanOfEarlier(weeks);
  return {
    latest,
    baseline,
    multiple: multipleOf(latest, baseline),
    ...gradeChange(latest, baseline),
  };
};

/** Worst wins. A store is only as calm as its least calm operator. */
const worstOf = (severities: LpSeverity[]): LpSeverity =>
  severities.reduce<LpSeverity>(
    (worst, s) => (SEVERITY_RANK[s] < SEVERITY_RANK[worst] ? s : worst),
    "steady",
  );

export const rosterCashierId = (ref: CashierRef) =>
  `${ref.storeid}__${ref.cashierNumber}`;

/**
 * One pass over the walked transactions, out the other side as stores.
 *
 * Sorted worst first at both levels, so the row a manager should open leads
 * without anyone having to sort it themselves.
 */
export const buildRoster = (
  rows: CashierTransaction[],
  windows: WeekWindow[],
): RosterStore[] => {
  if (windows.length === 0) return [];

  interface Acc {
    ref: CashierRef;
    cashierName: string;
    storeName: string;
    weeks: number[];
    types: Map<string, number>;
  }

  const byCashier = new Map<string, Acc>();

  for (const row of rows) {
    const wi = weekIndexOf(windows, row.sale_date);
    if (wi < 0) continue;

    const ref = { storeid: row.storeid, cashierNumber: row.cashier_number };
    const id = rosterCashierId(ref);
    let acc = byCashier.get(id);
    if (!acc) {
      acc = {
        ref,
        cashierName: row.cashier_name,
        storeName: row.store_name,
        weeks: Array(windows.length).fill(0),
        types: new Map(),
      };
      byCashier.set(id, acc);
    }
    acc.weeks[wi] += 1;
    acc.types.set(row.sale_type, (acc.types.get(row.sale_type) ?? 0) + 1);
  }

  const cashiers: RosterCashier[] = [...byCashier.entries()].map(
    ([id, acc]) => ({
      id,
      storeid: acc.ref.storeid,
      cashierNumber: acc.ref.cashierNumber,
      cashierName: acc.cashierName,
      storeName: acc.storeName,
      weeks: acc.weeks,
      types: [...acc.types.entries()]
        .map(([saleType, count]) => ({ saleType, count }))
        .sort((a, b) => b.count - a.count),
      ...gradeSeries(acc.weeks),
    }),
  );

  const byStore = new Map<number, RosterCashier[]>();
  for (const c of cashiers) {
    const list = byStore.get(c.storeid);
    if (list) list.push(c);
    else byStore.set(c.storeid, [c]);
  }

  return [...byStore.entries()]
    .map(([storeid, list]) => {
      const weeks = windows.map((_, i) =>
        list.reduce((acc, c) => acc + (c.weeks[i] ?? 0), 0),
      );
      const sorted = [...list].sort(
        (a, b) =>
          SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
          b.latest - b.baseline - (a.latest - a.baseline) ||
          b.latest - a.latest,
      );
      return {
        storeid,
        storeName: list[0]?.storeName ?? `Store ${storeid}`,
        weeks,
        ...gradeSeries(weeks),
        // The store's own grade is its aggregate movement, but the dot has to
        // agree with the rows underneath it — a store showing steady over a
        // cashier marked investigate reads as a bug.
        severity: worstOf(list.map((c) => c.severity)),
        investigateCount: list.filter((c) => c.severity === "investigate")
          .length,
        cashiers: sorted,
      };
    })
    .sort(
      (a, b) =>
        SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
        b.investigateCount - a.investigateCount ||
        b.latest - a.latest,
    );
};

/**
 * Severity narrows first, then the text within what is left — AND, not OR.
 * Matching the same rule the graded pages already filter by.
 */
export const filterRoster = (
  stores: RosterStore[],
  severity: LpSeverity | "all",
  query: string,
): RosterStore[] => {
  const q = query.trim().toLowerCase();
  if (severity === "all" && q === "") return stores;

  return stores
    .map((store) => ({
      ...store,
      cashiers: store.cashiers.filter((c) => {
        if (severity !== "all" && c.severity !== severity) return false;
        if (q === "") return true;
        return (
          c.cashierName.toLowerCase().includes(q) ||
          String(c.cashierNumber).includes(q)
        );
      }),
    }))
    .filter((store) => store.cashiers.length > 0);
};
