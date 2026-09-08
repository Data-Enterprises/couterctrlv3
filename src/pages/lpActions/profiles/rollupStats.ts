import type { CashierRollupRow } from "../../../interfaces";

/**
 * The list's arithmetic, from call 1's rollup.
 *
 * Deliberately not from the graded call. That one is filtered to the cashiers
 * past the enrichment threshold, and an average built from the people who
 * cleared a bar is the average of the outliers — every outlier then sits under
 * it. These rows are the whole population, so the averages are averages.
 *
 * Everything is per WEEK rather than per window, because presence varies. On
 * group 604 the Voided peer group is 194 cashiers across 578 cashier-weeks, so
 * the average person appears in three weeks and comparing window totals charges
 * whoever worked more. It reorders real people: seven refunds over four weeks is
 * above the group by total and below it by rate.
 *
 * The limit worth knowing: a week only has a row when the cashier rang that
 * exception, so "weeks" means weeks with activity, not weeks worked — there is
 * no roster in this data. Both sides of every comparison count the same way, so
 * it stays like-for-like, but it cannot tell a part-timer from a full-timer who
 * slipped twice.
 */

/** One cashier's standing on one exception, all of it from call 1. */
export interface CashierStanding {
  storeid: number;
  storeName: string;
  cashierNumber: number;
  cashierName: string;
  saleType: string;
  /** Every week of the window, oldest first. Absent weeks are zero — the rollup
   *  only has a row where something happened, and nothing happening is a real
   *  quiet week rather than missing data. */
  weeks: number[];
  total: number;
  totalSales: number;
  /** Weeks in which they rang this at all. The rate's denominator. */
  weeksActive: number;
  /** Their rate across the whole window — what the two averages are compared
   *  against, because those are window rates too. */
  perWeek: number;
  /**
   * Their rate BEFORE the graded week.
   *
   * The number a reader means by "their normal", and it must exclude the week
   * being judged: a baseline that contains the spike is inflated by the very
   * thing it exists to measure. Debra's 32 dragged her "normal" to 19.5 when
   * the weeks before it averaged 7.
   */
  priorPerWeek: number;
  /** The graded week itself, so movement is readable without re-deriving it. */
  latest: number;
  storePerWeek: number;
  groupPerWeek: number;
  overStore: boolean;
  overGroup: boolean;
  /** The same three, in money. Carried because the finding this page exists for
   *  is the cashier whose COUNT is ordinary and whose value is not — a handful
   *  of large refunds reads as clean on every count-based measure. */
  salesPerWeek: number;
  storeSalesPerWeek: number;
  groupSalesPerWeek: number;
  overStoreValue: boolean;
  overGroupValue: boolean;
}

const keyOf = (r: CashierRollupRow) =>
  `${r.storeid}__${r.cashier_number}__${r.sale_type}`;

/**
 * Everyone in the search, with both averages already applied.
 *
 * One pass for the group totals, one for the store totals, one to assemble —
 * cheap enough at a few thousand rows, and it keeps each average's definition
 * in one visible place rather than threaded through a single loop.
 */
export const buildStandings = (
  rows: CashierRollupRow[],
  weekCount: number,
): CashierStanding[] => {
  // group: lines and cashier-weeks per sale type
  const groupLines = new Map<string, number>();
  const groupSales = new Map<string, number>();
  const groupWeeks = new Map<string, number>();
  // store: the same, per store and sale type
  const storeLines = new Map<string, number>();
  const storeSales = new Map<string, number>();
  const storeWeeks = new Map<string, number>();

  for (const r of rows) {
    const lines = Math.abs(r.line_count);
    const t = r.sale_type;
    const st = `${r.storeid}__${t}`;
    // Refunds and voids sum negative; absolute value keeps a bigger refund the
    // bigger number rather than the smaller one.
    const money = Math.abs(r.total_sales ?? 0);
    groupLines.set(t, (groupLines.get(t) ?? 0) + lines);
    groupSales.set(t, (groupSales.get(t) ?? 0) + money);
    groupWeeks.set(t, (groupWeeks.get(t) ?? 0) + 1);
    storeLines.set(st, (storeLines.get(st) ?? 0) + lines);
    storeSales.set(st, (storeSales.get(st) ?? 0) + money);
    storeWeeks.set(st, (storeWeeks.get(st) ?? 0) + 1);
  }

  const byCashier = new Map<string, CashierStanding>();
  for (const r of rows) {
    const key = keyOf(r);
    let entry = byCashier.get(key);
    if (!entry) {
      entry = {
        storeid: r.storeid,
        storeName: r.store_name,
        cashierNumber: r.cashier_number,
        cashierName: r.cashier_name,
        saleType: r.sale_type,
        weeks: Array(weekCount).fill(0),
        total: 0,
        totalSales: 0,
        weeksActive: 0,
        perWeek: 0,
        priorPerWeek: 0,
        latest: 0,
        storePerWeek: 0,
        groupPerWeek: 0,
        overStore: false,
        overGroup: false,
        salesPerWeek: 0,
        storeSalesPerWeek: 0,
        groupSalesPerWeek: 0,
        overStoreValue: false,
        overGroupValue: false,
      };
      byCashier.set(key, entry);
    }
    const lines = Math.abs(r.line_count);
    // A week outside the requested windows would mean the server bucketed
    // differently than the page did; dropping it makes that visible as a short
    // week rather than folding it into a neighbour.
    if (r.week_index >= 0 && r.week_index < weekCount) {
      entry.weeks[r.week_index] += lines;
    }
    entry.total += lines;
    entry.totalSales += Math.abs(r.total_sales ?? 0);
    entry.weeksActive += 1;
  }

  for (const entry of byCashier.values()) {
    const t = entry.saleType;
    const st = `${entry.storeid}__${t}`;
    entry.perWeek = entry.weeksActive > 0 ? entry.total / entry.weeksActive : 0;
    // Prior weeks only, and only the ones they were active in — dividing by
    // every week reads a cashier who worked one of four as quiet. A baseline
    // that contains the week it is the baseline for is inflated by the very
    // thing it exists to measure.
    const prior = entry.weeks.slice(0, -1);
    const priorActive = prior.filter((n) => n > 0).length;
    entry.priorPerWeek =
      priorActive > 0 ? prior.reduce((a, n) => a + n, 0) / priorActive : 0;
    entry.latest = entry.weeks[entry.weeks.length - 1] ?? 0;
    entry.storePerWeek =
      (storeWeeks.get(st) ?? 0) > 0
        ? (storeLines.get(st) ?? 0) / (storeWeeks.get(st) ?? 1)
        : 0;
    entry.groupPerWeek =
      (groupWeeks.get(t) ?? 0) > 0
        ? (groupLines.get(t) ?? 0) / (groupWeeks.get(t) ?? 1)
        : 0;
    entry.overStore = entry.perWeek > entry.storePerWeek;
    entry.overGroup = entry.perWeek > entry.groupPerWeek;

    const sw = storeWeeks.get(st) ?? 0;
    const gw = groupWeeks.get(t) ?? 0;
    entry.salesPerWeek =
      entry.weeksActive > 0 ? entry.totalSales / entry.weeksActive : 0;
    entry.storeSalesPerWeek = sw > 0 ? (storeSales.get(st) ?? 0) / sw : 0;
    entry.groupSalesPerWeek = gw > 0 ? (groupSales.get(t) ?? 0) / gw : 0;
    entry.overStoreValue = entry.salesPerWeek > entry.storeSalesPerWeek;
    entry.overGroupValue = entry.salesPerWeek > entry.groupSalesPerWeek;
  }

  return [...byCashier.values()];
};

/** Over both averages is a case; over one is a conversation. That is the only
 *  distinction anyone acts on differently, so it is the only one drawn. */
export type Band = "case" | "word" | "quiet";

/**
 * Below this a week is too thin to read anything from.
 *
 * Carried over from the movement grading, whose comment put it plainly: two
 * occurrences becoming six is +200% and means nothing. Without it a cashier
 * with three cancels clears "above the group" at a quiet store and outranks
 * someone with thirty-two — which is the list filling with arithmetic noise,
 * in nicer typography.
 */
export const MIN_WEEK = 5;

/** Their worst week, and which one it was — the number worth printing large.
 *  A window total says how much; the peak says how bad it got. */
export const peakWeek = (
  s: CashierStanding,
): { count: number; index: number } => {
  let count = 0;
  let index = 0;
  s.weeks.forEach((n, i) => {
    if (n > count) {
      count = n;
      index = i;
    }
  });
  return { count, index };
};

export const bandOf = (s: CashierStanding): Band => {
  // Value counts as being over. Someone with an ordinary number of refunds
  // worth four times the money is the finding this page exists for, and a
  // count-only rule never sees them.
  // Too thin to read, whatever the ratios say.
  if (peakWeek(s).count < MIN_WEEK) return "quiet";
  const over =
    Number(s.overStore || s.overStoreValue) +
    Number(s.overGroup || s.overGroupValue);
  return over === 2 ? "case" : over === 1 ? "word" : "quiet";
};

/** How far out they are, for ordering. The largest of the comparisons, since
 *  any one being extreme is what puts someone near the top. */
export const distanceOf = (s: CashierStanding): number =>
  Math.max(
    s.groupPerWeek > 0 ? s.perWeek / s.groupPerWeek : 0,
    s.storePerWeek > 0 ? s.perWeek / s.storePerWeek : 0,
    s.groupSalesPerWeek > 0 ? s.salesPerWeek / s.groupSalesPerWeek : 0,
  );

/** Which weeks were over the group's weekly line — what the bars mark. */
export const overWeeks = (s: CashierStanding): boolean[] =>
  s.weeks.map((n) => n > s.groupPerWeek);

/**
 * A register, not a person.
 *
 * Cashier numbers are issued per store, so a terminal is only identifiable by
 * how it is named and numbered — self-checkout lanes sit high, 2003 and 2004,
 * while people run 16 to 62 in the same group.
 *
 * A lane keeps its row: one behaving oddly is worth knowing. It just is not a
 * case about anybody, and saying so stops someone being asked to explain a
 * machine's behaviour.
 */
export const isTerminal = (s: CashierStanding): boolean =>
  /^\s*(sco|self.?check|lane|register|terminal|train)\b/i.test(s.cashierName) ||
  s.cashierNumber >= 1000;
