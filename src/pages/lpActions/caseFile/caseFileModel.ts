import type { CashierTransaction } from "../../../interfaces";
import {
  gradeChange,
  isCashier,
  laneOf,
  weekIndexOf,
  type CashierRef,
  type LpSeverity,
  type WeekWindow,
} from "../lpActionsMetrics";
import { typeOrder } from "../typeColour";

/**
 * The case file's own numbers: one card per exception type, plus the headline
 * that sits above them.
 *
 * Built from `rawRows` alone, so opening a case costs nothing at the network.
 * The receipt-level detail — items, tender, hour — is a separate read and
 * belongs to the transactions half of the panel.
 *
 * Two rules worth knowing before changing anything here:
 *
 *  - **Every type in scope gets a card, including the ones at zero.** A card
 *    reading `No Sale · 0` is an answer, not an empty slot: it says this
 *    operator's problem is specific rather than general, and it is half of
 *    what lets someone put a case down quickly. It also keeps the grid the
 *    same shape for every cashier, so the eye learns one layout.
 *  - **The comparison is always to the operator's own earlier weeks.** Never
 *    to the other people on the roster. Fifteen no-sales is on trend for
 *    someone who always does fourteen, and peer ranking would flag them while
 *    missing the person who went from two to eight.
 */

export interface CaseCard {
  saleType: string;
  /** Occurrences in the most recent week. */
  count: number;
  /** Distinct receipts those occurrences fell on. Can be far below `count` —
   *  nineteen cancels across two receipts is a different story from nineteen
   *  across nineteen. */
  receipts: number;
  /** Signed. Refunds are negative, and no-sales ring nothing at all. */
  total: number;
  /** Per occurrence, or 0 when nothing rang. */
  average: number;
  /** Days this type occurred on, over days the operator worked at all. */
  daysActive: number;
  daysWorked: number;
  /** Their own mean across the earlier weeks. */
  baseline: number;
  multiple: number | null;
  changePct: number | null;
  severity: LpSeverity;
}

export interface CaseHeadline {
  cashierName: string;
  cashierNumber: number;
  storeName: string;
  /** Lanes worked in the latest week, in the order first seen. */
  lanes: string[];
  latest: number;
  baseline: number;
  multiple: number | null;
  severity: LpSeverity;
  /** Sum of |value| across every exception in the latest week. */
  exceptionValue: number;
  daysActive: number;
  daysWorked: number;
  typesTouched: number;
  typesInScope: number;
  /** The types carrying the movement, worst first — for the sentence. */
  drivers: string[];
}

export interface CaseFile {
  headline: CaseHeadline;
  cards: CaseCard[];
}

/** Every exception type the walk saw anywhere in scope, so a cashier's card
 *  grid covers the types they did NOT touch as well as the ones they did. */
export const typesInScope = (rows: CashierTransaction[]): string[] =>
  [...new Set(rows.map((r) => r.sale_type))].sort(
    (a, b) => typeOrder(a) - typeOrder(b),
  );

const meanOfEarlier = (weeks: number[]) =>
  weeks.length < 2
    ? 0
    : weeks.slice(0, -1).reduce((acc, n) => acc + n, 0) / (weeks.length - 1);

const dayOf = (saleDate: string) => saleDate.slice(0, 10);

export const buildCaseFile = (
  rows: CashierTransaction[],
  windows: WeekWindow[],
  ref: CashierRef,
): CaseFile | null => {
  const mine = rows.filter((r) => isCashier(r, ref));
  if (mine.length === 0 || windows.length === 0) return null;

  const latestWindow = windows[windows.length - 1];
  const inLatest = (r: CashierTransaction) => {
    const day = dayOf(r.sale_date);
    return day >= latestWindow.start && day <= latestWindow.end;
  };

  const latestRows = mine.filter(inLatest);
  const daysWorked = new Set(latestRows.map((r) => dayOf(r.sale_date))).size;

  const scope = typesInScope(rows);

  const cards: CaseCard[] = scope.map((saleType) => {
    const perWeek = Array<number>(windows.length).fill(0);
    for (const r of mine) {
      if (r.sale_type !== saleType) continue;
      const wi = weekIndexOf(windows, r.sale_date);
      if (wi >= 0) perWeek[wi] += 1;
    }

    const ofType = latestRows.filter((r) => r.sale_type === saleType);
    const count = perWeek[perWeek.length - 1] ?? 0;
    const baseline = meanOfEarlier(perWeek);
    const total = ofType.reduce((acc, r) => acc + r.total_sales, 0);

    return {
      saleType,
      count,
      receipts: new Set(ofType.map((r) => r.sale_id)).size,
      total,
      average: count > 0 ? total / count : 0,
      daysActive: new Set(ofType.map((r) => dayOf(r.sale_date))).size,
      daysWorked,
      baseline,
      // Null rather than Infinity with no history to divide by. A first
      // sighting is an unknown increase, not an infinite one.
      multiple: baseline > 0 ? count / baseline : null,
      ...gradeChange(count, baseline),
    };
  });

  // Every type together, week by week. Counted from the rows rather than
  // summed off the cards, which only carry the latest week.
  const allWeeks = Array<number>(windows.length).fill(0);
  for (const r of mine) {
    const wi = weekIndexOf(windows, r.sale_date);
    if (wi >= 0) allWeeks[wi] += 1;
  }

  const latest = allWeeks[allWeeks.length - 1] ?? 0;
  const baseline = meanOfEarlier(allWeeks);
  const first = mine[0];

  return {
    headline: {
      cashierName: first.cashier_name,
      cashierNumber: ref.cashierNumber,
      storeName: first.store_name,
      // Through `laneOf`, never off the field directly — the payload spells
      // it `termainal` and reading it raw would silently blank every lane if
      // the backend ever fixed the typo.
      lanes: [...new Set(latestRows.map(laneOf).filter(Boolean))],
      latest,
      baseline,
      multiple: baseline > 0 ? latest / baseline : null,
      ...gradeChange(latest, baseline),
      exceptionValue: latestRows.reduce(
        (acc, r) => acc + Math.abs(r.total_sales),
        0,
      ),
      daysActive: daysWorked,
      daysWorked,
      typesTouched: cards.filter((c) => c.count > 0).length,
      typesInScope: scope.length,
      // What the sentence names as the cause: the types that actually moved,
      // biggest gap over baseline first. Nothing to say if none moved.
      drivers: cards
        .filter((c) => c.severity !== "steady" && c.count > 0)
        .sort((a, b) => b.count - b.baseline - (a.count - a.baseline))
        .slice(0, 2)
        .map((c) => c.saleType),
    },
    cards,
  };
};

export type CardSort = "deviation" | "volume" | "value";

/**
 * Card order. Zero-count types always sink to the end regardless of the sort —
 * they are context, and letting one lead because it sorts high on an empty
 * value would put the least useful card first.
 */
export const sortCards = (cards: CaseCard[], by: CardSort): CaseCard[] =>
  [...cards].sort((a, b) => {
    if (a.count === 0 !== (b.count === 0)) return a.count === 0 ? 1 : -1;
    if (by === "volume") return b.count - a.count;
    if (by === "value") return Math.abs(b.total) - Math.abs(a.total);
    // Deviation: an unmeasurable multiple still outranks a measured calm one,
    // because "new at volume" is the case worth opening.
    const am = a.multiple ?? (a.count > 0 ? Infinity : -1);
    const bm = b.multiple ?? (b.count > 0 ? Infinity : -1);
    return bm - am;
  });
