import { isCompleteCoverage } from "../../../../utils/grading";
import type { GradingMetric } from "../../../../features/dev/devSalesLedgerSlice";
import type { DayDot, StoreSelection } from "../../../../interfaces";
import type { LedgerRowData } from "../components/LedgerRow";

/**
 * Where each store stands inside the group it was searched with.
 *
 * Pure arithmetic over the ledger rows the page already has — no fetch, no
 * component, no slice. The UI reads these figures; it does not compute them.
 *
 * The question is "did this store pull its weight", and the answer is built
 * from how big the store normally is rather than from the group average. A
 * store that is 8% of its group every year is not failing because it is not
 * 1/12th of it.
 */

/** A store's standing. `null` is the fourth state — see `ComparisonRow`. */
export type Verdict = "rising" | "consistent" | "falling";

/** Why a store has no verdict. Named, because "Not comparable" with no reason
 *  invites the reader to assume the page is broken. */
export type Excluded =
  | "no-last-year"
  | "partial-week"
  | "nothing-last-year";

export interface Bands {
  /**
   * The gap and the store's own movement, as a percentage (9 means 9%).
   *
   * One number for both: they are the same kind of claim — a percentage move
   * against a baseline — and the page already has a threshold control for it,
   * which is what the severity dot grades on.
   */
  pct: number;
  /** Share, in percentage POINTS. A different unit, so a different band. */
  sharePoints: number;
}

export const DEFAULT_BANDS: Bands = { pct: 9, sharePoints: 0.5 };

export interface ComparisonRow {
  storeid: number;
  storeName: string;
  storeNumber: string;
  storeNumbersForId: string[];

  /**
   * This store's figures, on the matched-day base.
   *
   * `twTotalForLY`, not `twTotal`: the week against the days that actually
   * have a counterpart last year. Mixing a seven-day store with a three-day
   * one is how a short week reads as lost share.
   */
  ty: number;
  ly: number;

  /** Share of the group now, and the share it normally holds. 0–1. */
  contribution: number | null;
  usualShare: number | null;
  /** contribution − usualShare, in percentage POINTS. */
  shareDelta: number | null;

  /** What this store should have done, given the group's week and its own
   *  usual size. */
  expected: number | null;
  gapValue: number | null;
  /** gapValue / expected, as a percentage. */
  gapPct: number | null;

  /** The store against its own last year. The one figure on this row that no
   *  sibling can move — see `verdictOf`. */
  ownPct: number;

  /** Position by the active metric among counted stores, 1-based. Null in a
   *  group too small for a rank to say anything. */
  rank: number | null;

  verdict: Verdict | null;
  excluded: Excluded | null;
}

export interface GroupComparison {
  rows: ComparisonRow[];
  /** Sums over counted stores only. */
  groupTy: number;
  groupLy: number;
  /** The group against last year, as a sum of sums — never a mean of rates. */
  groupVsLyPct: number | null;
  counted: number;
  /** Stores set aside, by reason, so the KPI tile can say why. */
  excludedBy: Record<Excluded, number>;
  /** Of counted stores, by the active metric. */
  low: number | null;
  high: number | null;
  median: number | null;
  rising: number;
  consistent: number;
  falling: number;
  /** The counted store furthest below its expected, if any is. */
  biggestShortfall: ComparisonRow | null;
}

/**
 * A rank only means something with enough stores to rank among.
 *
 * Under this, store-vs-group is nearly store-vs-store and "2nd of 2" reads as
 * a finding when it is a restatement of the search.
 */
export const MIN_STORES_FOR_RANK = 4;

const pick = (dollars: number, qty: number, metric: GradingMetric) =>
  metric === "qty" ? qty : dollars;

/**
 * Why this store is not comparable, or null if it is.
 *
 * Order matters: a store with no last year at all is a different message from
 * one whose week is short, and the first test that matches is the one worth
 * printing.
 */
export const exclusionOf = (
  row: Pick<
    LedgerRowData,
    "hasLY" | "lyDayCount" | "dayCount" | "lyTotal" | "lyQty"
  >,
  metric: GradingMetric,
): Excluded | null => {
  if (!row.hasLY) return "no-last-year";
  if (!isCompleteCoverage(row.lyDayCount, row.dayCount)) return "partial-week";
  // Dividing by this is how a store with no history last year takes an
  // infinite share of the group.
  if (pick(row.lyTotal, row.lyQty, metric) <= 0) return "nothing-last-year";
  return null;
};

/**
 * The verdict, from three inputs in a deliberate order.
 *
 * **The gap decides the band.** It is absolute: what this store should have
 * done given the group's week and its own usual size.
 *
 * **Own movement confirms it.** Without this, one sibling's bad week reads as
 * growth for every other store — a collapse lowers the group total, which
 * lowers everyone's `expected`, which lifts everyone's gap. Twelve stores, A
 * flat at $100k, B down from $100k to nothing: A's expected falls to $91,667
 * and its gap reads +9.1%, above the band, with its share up 0.76 points. Both
 * of the other two signals say Rising and A did not move at all. `ownPct` is
 * the only figure on the row a sibling cannot touch.
 *
 * **Share explains it, and does not vote.** Shares total 100% by construction,
 * so a store's share moves when a sibling moves. It answers "did this store
 * gain or lose ground", which is worth a column and worth saying in words — it
 * just cannot decide anything on its own.
 */
export const verdictOf = (
  gapPct: number | null,
  ownPct: number,
  bands: Bands,
): Verdict | null => {
  if (gapPct === null) return null;
  if (gapPct < -bands.pct) return "falling";
  if (gapPct > bands.pct && ownPct > bands.pct) return "rising";
  return "consistent";
};

/** The median of an already-sorted ascending list. */
const medianOf = (sorted: number[]): number | null => {
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
};

/**
 * One store's figures against the group it was searched with.
 *
 * Counted stores are those with a whole matched week last year and something
 * to compare against. Everything else keeps its row, gets a reason, and is
 * left out of the group totals — a store that only exists in one of the two
 * windows otherwise shifts every other store's usual share by its own weight,
 * and the shares stop summing to 100%.
 */
export const compareStores = (
  rows: LedgerRowData[],
  metric: GradingMetric,
  bands: Bands = DEFAULT_BANDS,
): GroupComparison => {
  const excludedBy: Record<Excluded, number> = {
    "no-last-year": 0,
    "partial-week": 0,
    "nothing-last-year": 0,
  };

  const graded = rows.map((r) => {
    const excluded = exclusionOf(r, metric);
    if (excluded) excludedBy[excluded] += 1;
    return {
      row: r,
      excluded,
      // The matched-day base on both sides, so the two are the same week.
      ty: pick(r.twTotalForLY, r.twQtyForLY, metric),
      ly: pick(r.lyTotal, r.lyQty, metric),
    };
  });

  const counted = graded.filter((g) => g.excluded === null);
  const groupTy = counted.reduce((acc, g) => acc + g.ty, 0);
  const groupLy = counted.reduce((acc, g) => acc + g.ly, 0);

  // Sums, never a mean of rates: one small store up 300% must not move the
  // group's figure.
  const groupVsLyPct =
    groupLy > 0 ? ((groupTy - groupLy) / groupLy) * 100 : null;

  // Rank runs over counted stores by the active metric, biggest first.
  const order = [...counted].sort((a, b) => b.ty - a.ty);
  const rankByStore = new Map<number, number>();
  if (order.length >= MIN_STORES_FOR_RANK) {
    order.forEach((g, i) => rankByStore.set(g.row.storeid, i + 1));
  }

  const out: ComparisonRow[] = graded.map(({ row, excluded, ty, ly }) => {
    const comparable = excluded === null && groupTy > 0 && groupLy > 0;

    const contribution = comparable ? ty / groupTy : null;
    const usualShare = comparable ? ly / groupLy : null;
    const shareDelta =
      contribution !== null && usualShare !== null
        ? (contribution - usualShare) * 100
        : null;

    const expected = usualShare !== null ? groupTy * usualShare : null;
    const gapValue = expected !== null ? ty - expected : null;
    const gapPct =
      expected !== null && expected > 0 && gapValue !== null
        ? (gapValue / expected) * 100
        : null;

    return {
      storeid: row.storeid,
      storeName: row.store_name,
      storeNumber: row.store_number,
      storeNumbersForId: row.storeNumbersForId,
      ty,
      ly,
      contribution,
      usualShare,
      shareDelta,
      expected,
      gapValue,
      gapPct,
      ownPct: row.vsLYPct,
      rank: rankByStore.get(row.storeid) ?? null,
      verdict: verdictOf(gapPct, row.vsLYPct, bands),
      excluded,
    };
  });

  const tys = counted.map((g) => g.ty).sort((a, b) => a - b);
  const verdicts = out.map((r) => r.verdict);

  const shortfalls = out.filter(
    (r) => r.gapValue !== null && r.gapValue < 0,
  );
  const biggestShortfall = shortfalls.length
    ? shortfalls.reduce((worst, r) =>
        (r.gapValue as number) < (worst.gapValue as number) ? r : worst,
      )
    : null;

  return {
    rows: out,
    groupTy,
    groupLy,
    groupVsLyPct,
    counted: counted.length,
    excludedBy,
    low: tys.length ? tys[0] : null,
    high: tys.length ? tys[tys.length - 1] : null,
    median: medianOf(tys),
    rising: verdicts.filter((v) => v === "rising").length,
    consistent: verdicts.filter((v) => v === "consistent").length,
    falling: verdicts.filter((v) => v === "falling").length,
    biggestShortfall,
  };
};

/**
 * The same rows, narrowed to one day of the week.
 *
 * Selecting a day re-asks the whole question of that day: every share, every
 * expectation and every verdict comes from that day's figures alone.
 *
 * `lyNet` is `null` rather than `0` on a day with no counterpart, which is the
 * distinction that keeps a day-scoped verdict honest — "traded nothing" and
 * "nothing to compare against" are different answers, and only the second one
 * is Not comparable. A day a store genuinely rang $0 is a real reading.
 *
 * Bands want widening before this is shown: one day against one day is a far
 * thinner baseline than a week against a week, and the same cut that reads
 * well over seven days will colour the grid on noise over one.
 */
export const scopeToDay = (
  rows: LedgerRowData[],
  saleDate: string,
): LedgerRowData[] => {
  // `selectedDate` in the slice is a bare YYYY-MM-DD, which is what
  // PopupDaySidebar emits. Trimming both sides means a caller holding the
  // full ISO still matches rather than silently finding no day.
  const wanted = saleDate.split("T")[0];
  return rows.map((r) => {
    const day = r.days.find((d) => d.sale_date.split("T")[0] === wanted);
    const hasLY = day?.lyNet !== null && day?.lyNet !== undefined;

    const twNet = day?.twNet ?? 0;
    const twQty = day?.twQty ?? 0;
    const lyNet = hasLY ? (day?.lyNet as number) : 0;
    const lyQty = hasLY ? (day?.lyQty ?? 0) : 0;

    return {
      ...r,
      days: day ? [day] : [],
      twTotal: twNet,
      twQty,
      lyTotal: lyNet,
      lyQty,
      // On a single day the matched base and the day itself are the same
      // figure — there is only one day to match.
      twTotalForLY: hasLY ? twNet : 0,
      twQtyForLY: hasLY ? twQty : 0,
      // A day the store has no row for at all is not a day it is short on;
      // it is a day outside the window. Either way there is nothing to
      // compare, which `hasLY` already says.
      dayCount: day ? 1 : 0,
      lyDayCount: hasLY ? 1 : 0,
      hasLY,
      vsLYPct: hasLY && lyNet > 0 ? ((twNet - lyNet) / lyNet) * 100 : 0,
      vsLYDollar: hasLY ? twNet - lyNet : 0,
    };
  });
};

/**
 * The group's week as one set of days, for the day card.
 *
 * Summed across stores per date. `lyNet` stays `null` only when no store had a
 * counterpart for that date at all — otherwise it is the sum over the stores
 * that did, which is the same matched-day treatment
 * `computeDayMatchedTotals` applies one level down. A date one store cannot
 * compare on is still a real comparison for the rest of the group.
 */
export const groupDays = (rows: LedgerRowData[]): DayDot[] => {
  const byDate = new Map<string, DayDot>();

  for (const row of rows) {
    for (const d of row.days) {
      const key = d.sale_date.split("T")[0];
      const at = byDate.get(key);
      if (!at) {
        byDate.set(key, { ...d, sale_date: key });
        continue;
      }
      at.twNet += d.twNet;
      at.twQty += d.twQty;
      if (d.lyNet !== null) at.lyNet = (at.lyNet ?? 0) + d.lyNet;
      if (d.lyQty !== null) at.lyQty = (at.lyQty ?? 0) + d.lyQty;
      if (d.lwNet !== null) at.lwNet = (at.lwNet ?? 0) + d.lwNet;
      if (d.lwQty !== null) at.lwQty = (at.lwQty ?? 0) + d.lwQty;
    }
  }

  return [...byDate.values()].sort((a, b) =>
    a.sale_date.localeCompare(b.sale_date),
  );
};

/**
 * The selection a ledger row opens with.
 *
 * Extracted from `LedgerRow`'s own click handler so the group comparison can
 * open a store the same way the ledger does. Two constructions of this would
 * drift, and the detail panel reads every field — a selection built slightly
 * differently is a detail panel showing a slightly different week.
 */
export const selectionFor = (row: LedgerRowData): StoreSelection => {
  const sortedDays = [...row.days].sort((a, b) =>
    a.sale_date.localeCompare(b.sale_date),
  );
  return {
    storeId: row.storeid,
    storeName: row.store_name,
    storeNumber: row.store_number,
    storeNumbersForId: row.storeNumbersForId,
    start: sortedDays[0]?.sale_date.split("T")[0] ?? "",
    end: sortedDays[sortedDays.length - 1]?.sale_date.split("T")[0] ?? "",
    mode: "weekly",
    days: sortedDays,
    severity: row.severity,
  };
};

/**
 * The comparison as a view asks for it: scoped to the selected day, if any,
 * with the bands the scope deserves.
 *
 * Shared so the group view and a store's own comparison cannot disagree about
 * what the same search means. The doubling is a starting value, not a measured
 * one — see the plan's open decisions.
 */
export const compareForView = (
  rows: LedgerRowData[],
  metric: GradingMetric,
  threshold: number,
  selectedDate: string | null,
): GroupComparison =>
  compareStores(selectedDate ? scopeToDay(rows, selectedDate) : rows, metric, {
    pct: selectedDate ? threshold * 2 : threshold,
    sharePoints: selectedDate
      ? DEFAULT_BANDS.sharePoints * 2
      : DEFAULT_BANDS.sharePoints,
  });
