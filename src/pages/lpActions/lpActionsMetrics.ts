import type { CashierTransaction } from "../../interfaces";

/**
 * How an exception is graded, and how the weeks are cut.
 *
 * Everything here is pure. The rule is the one LP asked for and it is not a
 * leaderboard: an exception is judged against **its own recent history**, not
 * against other stores or other cashiers. Twelve voids is unremarkable for
 * someone who always does eleven and alarming for someone who always does four,
 * and only the second is worth a manager's morning.
 */

export type LpSeverity = "investigate" | "watch" | "steady";

/** Below this, a week is too thin to read a trend from. Two occurrences
 *  becoming six is +200% and means nothing; the floor stops the list filling
 *  with arithmetic noise. */
export const MIN_LATEST = 5;

/** Percent above the baseline that earns each verdict. */
export const INVESTIGATE_PCT = 75;
export const WATCH_PCT = 25;

export interface WeekWindow {
  /** yyyy-mm-dd, inclusive. */
  start: string;
  end: string;
}

export interface WeekBucket extends WeekWindow {
  count: number;
}

export interface CashierMovement {
  cashierNumber: number;
  cashierName: string;
  /** Occurrences in the most recent week. */
  latest: number;
  /** Mean per week across the earlier weeks — their own normal. */
  baseline: number;
}

/**
 * Who a cashier is.
 *
 * Never the number on its own. Cashier numbers are issued per store, so
 * "cashier 19" is a different person at every store in a group — scoping a
 * case by number alone silently pools them into one impossible operator.
 */
export interface CashierRef {
  storeid: number;
  cashierNumber: number;
}

/**
 * The register a row was rung on.
 *
 * Accepts either spelling. `cashier_table` was typed into `CashierTransaction`
 * as `termainal`, and no other screen in the app reads it — so if the backend
 * ever spelled it correctly, or fixes the typo, every lane would silently
 * collapse into one "unknown" bucket with nothing to flag it.
 */
export const laneOf = (row: {
  termainal?: string;
  terminal?: string;
}): string => String(row.termainal ?? row.terminal ?? "").trim();

/** True when a walked row belongs to that one operator. */
export const isCashier = (
  row: { storeid: number; cashier_number: number },
  ref: CashierRef,
) => row.storeid === ref.storeid && row.cashier_number === ref.cashierNumber;

export interface ExceptionRow {
  /** storeid + sale type. A void spike at one store says nothing about
   *  another, so they are never pooled. */
  id: string;
  storeid: number;
  storeName: string;
  saleType: string;
  weeks: WeekBucket[];
  latest: number;
  baseline: number;
  /** Null when there is no baseline to compare against — a first sighting. */
  changePct: number | null;
  severity: LpSeverity;
  cashiers: CashierMovement[];
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * `count` seven-day windows ending on `endDate`, oldest first.
 *
 * Oldest first because the last element is the week being judged, and every
 * consumer — the bars, the columns, the grading — wants it in that position.
 */
export const weekWindows = (endDate: string, count: number): WeekWindow[] => {
  const [y, m, d] = endDate.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const offset = (count - 1 - i) * 7;
    const end = new Date(Date.UTC(y, m - 1, d - offset));
    const start = new Date(Date.UTC(y, m - 1, d - offset - 6));
    return { start: iso(start), end: iso(end) };
  });
};

export const gradeChange = (
  latest: number,
  baseline: number,
): { changePct: number | null; severity: LpSeverity } => {
  // Too few to read. Deliberately checked before the percentage, so a jump
  // from one to four never reaches the list.
  if (latest < MIN_LATEST) return { changePct: null, severity: "steady" };

  // No history to compare against. New behaviour at real volume is worth a
  // look precisely because there is nothing to say it is normal.
  if (baseline <= 0) return { changePct: null, severity: "investigate" };

  const changePct = ((latest - baseline) / baseline) * 100;
  const severity: LpSeverity =
    changePct >= INVESTIGATE_PCT
      ? "investigate"
      : changePct >= WATCH_PCT
        ? "watch"
        : "steady";
  return { changePct, severity };
};

export const SEVERITY_RANK: Record<LpSeverity, number> = {
  investigate: 0,
  watch: 1,
  steady: 2,
};

/** A stable key for one store's take on one exception type. */
export const exceptionId = (storeid: number, saleType: string) =>
  `${storeid}__${saleType}`;

/**
 * Transactions, already bucketed by week, into graded rows.
 *
 * `rowsByWeek` is parallel to the windows: index 0 is the oldest week. Each
 * entry is every exception transaction that week, across all types and stores,
 * because `cashier_table` takes the whole sale-type list in one request.
 */
export const buildExceptionRows = (
  windows: WeekWindow[],
  rowsByWeek: CashierTransaction[][],
): ExceptionRow[] => {
  const byKey = new Map<
    string,
    {
      storeid: number;
      storeName: string;
      saleType: string;
      perWeek: number[];
      cashierPerWeek: Map<number, { name: string; counts: number[] }>;
    }
  >();

  const weekCount = windows.length;

  rowsByWeek.forEach((rows, weekIndex) => {
    for (const t of rows) {
      const key = exceptionId(t.storeid, t.sale_type);
      let entry = byKey.get(key);
      if (!entry) {
        entry = {
          storeid: t.storeid,
          storeName: t.store_name,
          saleType: t.sale_type,
          perWeek: Array(weekCount).fill(0),
          cashierPerWeek: new Map(),
        };
        byKey.set(key, entry);
      }
      entry.perWeek[weekIndex] += 1;

      let cashier = entry.cashierPerWeek.get(t.cashier_number);
      if (!cashier) {
        cashier = { name: t.cashier_name, counts: Array(weekCount).fill(0) };
        entry.cashierPerWeek.set(t.cashier_number, cashier);
      }
      cashier.counts[weekIndex] += 1;
    }
  });

  const meanOfEarlier = (counts: number[]) =>
    counts.length < 2
      ? 0
      : counts.slice(0, -1).reduce((acc, n) => acc + n, 0) /
        (counts.length - 1);

  return [...byKey.entries()]
    .map(([id, e]) => {
      const latest = e.perWeek[e.perWeek.length - 1] ?? 0;
      const baseline = meanOfEarlier(e.perWeek);
      const { changePct, severity } = gradeChange(latest, baseline);

      const cashiers: CashierMovement[] = [...e.cashierPerWeek.entries()]
        .map(([cashierNumber, c]) => ({
          cashierNumber,
          cashierName: c.name,
          latest: c.counts[c.counts.length - 1] ?? 0,
          baseline: meanOfEarlier(c.counts),
        }))
        // Whoever moved most against their own normal leads, not whoever rang
        // the most — the same rule the row itself is graded on.
        .sort((a, b) => b.latest - b.baseline - (a.latest - a.baseline));

      return {
        id,
        storeid: e.storeid,
        storeName: e.storeName,
        saleType: e.saleType,
        weeks: windows.map((w, i) => ({ ...w, count: e.perWeek[i] ?? 0 })),
        latest,
        baseline,
        changePct,
        severity,
        cashiers,
      };
    })
    .sort((a, b) => {
      const rank = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
      if (rank !== 0) return rank;
      return (b.changePct ?? Infinity) - (a.changePct ?? Infinity);
    });
};

/**
 * The same exception across every store in a group, rolled up.
 *
 * A group search produces stores x types rows, which is too many to read flat —
 * seven stores and six exception types is forty-two lines with no shape. The
 * type is the unit a loss-prevention manager thinks in ("voids are up"), and
 * the stores underneath are where it is happening.
 *
 * The roll-up is graded on its own summed weeks, not on its children's
 * verdicts. One store doubling inside a group that is otherwise flat is a
 * store-level finding, and saying the whole group is up would be wrong — the
 * header stays calm and the row underneath carries the colour.
 */
export interface TypeGroup {
  saleType: string;
  weeks: WeekBucket[];
  latest: number;
  baseline: number;
  changePct: number | null;
  severity: LpSeverity;
  /** How many stores under this type warrant a look, for the collapsed row. */
  investigateCount: number;
  stores: ExceptionRow[];
}

export const buildTypeGroups = (
  rows: ExceptionRow[],
  windows: WeekWindow[],
): TypeGroup[] => {
  const byType = new Map<string, ExceptionRow[]>();
  for (const r of rows) {
    const found = byType.get(r.saleType);
    if (found) found.push(r);
    else byType.set(r.saleType, [r]);
  }

  return [...byType.entries()]
    .map(([saleType, stores]) => {
      const perWeek = windows.map((_, i) =>
        stores.reduce((acc, r) => acc + (r.weeks[i]?.count ?? 0), 0),
      );
      const latest = perWeek[perWeek.length - 1] ?? 0;
      const baseline =
        perWeek.length < 2
          ? 0
          : perWeek.slice(0, -1).reduce((acc, n) => acc + n, 0) /
            (perWeek.length - 1);
      const { changePct, severity } = gradeChange(latest, baseline);

      return {
        saleType,
        weeks: windows.map((w, i) => ({ ...w, count: perWeek[i] ?? 0 })),
        latest,
        baseline,
        changePct,
        severity,
        investigateCount: stores.filter((s) => s.severity === "investigate")
          .length,
        // Worst store first, so expanding lands on the reason.
        stores: [...stores].sort((a, b) => {
          const rank = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
          if (rank !== 0) return rank;
          return (b.changePct ?? Infinity) - (a.changePct ?? Infinity);
        }),
      };
    })
    .sort((a, b) => {
      // A type with a flat total but a store on fire outranks a calm one.
      const rank = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
      if (rank !== 0) return rank;
      if (a.investigateCount !== b.investigateCount)
        return b.investigateCount - a.investigateCount;
      return (b.changePct ?? -Infinity) - (a.changePct ?? -Infinity);
    });
};
