import type { TopItemRow } from "../../../../api/topItems";
import { amountOf, amountUnit, deptName, weighed } from "./topItems";

/**
 * Two stores' top 200, joined.
 *
 * The question the Monday review asked for: which items are big here and not
 * there, and where the two stores really differ. No React in it, so the
 * arithmetic can be held to by tests rather than read off a screen.
 *
 * **What a row may claim, and what it may not.** Each store's list is its own
 * top 200 by sales. An item in one list and not the other is *not in the
 * other's top 200* — it is NOT "they do not carry it", because it could be
 * their #250. Nothing here reports absence as a zero; `only` says which side
 * is unknown and the caller resolves it with `sales/item_detail` if the
 * reader asks. The naming follows that: `onlyMine` and `onlyTheirs`, never
 * `missing`.
 */

/** Share is of each store's OWN top-200 sales.
 *
 *  Not of the store's whole week, which would be the truer "how much of this
 *  store is this item" — but the counterpart's week total is not on this
 *  panel, and a half-plumbed denominator is worse than a stated one. The
 *  label on screen says "share of top 200" for exactly that reason, and the
 *  two denominators differ in character between stores: a store whose top 200
 *  is a bigger slice of its week will read lower here throughout. */
export interface ComparedTopItem {
  code: string;
  description: string;
  dept: string;
  mine: TopItemRow | null;
  theirs: TopItemRow | null;
  /** Sales each side. Zero where the row is absent, which is not a measured
   *  zero — read `only` before using it as one. */
  mineSales: number;
  theirsSales: number;
  /** Percent of that store's top-200 sales. Null where absent. */
  mineShare: number | null;
  theirsShare: number | null;
  /**
   * Points between the two shares, and only when BOTH are known.
   *
   * Null on a one-sided row rather than "share minus zero": the other store's
   * share is unknown, not nought, and subtracting an unknown produces a
   * figure that looks measured and is not.
   */
  shareGap: number | null;
  /** The pair's combined sales — what a paired bar is drawn against. */
  pair: number;
  /** Which side holds it when only one does. */
  only: "mine" | "theirs" | null;
  /**
   * The two stores ring it in different units — one on the scale, one as a
   * pack.
   *
   * Rare and real: `qty` counts rings and `weight` counts pounds, and a
   * product code can be set up either way store to store. Amounts must not be
   * compared across it; sales and share still can, because dollars are
   * dollars.
   */
  unitsDisagree: boolean;
  /** `lb` or `units` for each side, for labelling the amount. */
  mineUnit: "lb" | "units" | null;
  theirsUnit: "lb" | "units" | null;
}

export interface CompareTotals {
  /** In both lists. */
  both: number;
  onlyMine: number;
  onlyTheirs: number;
  /** Sales of the items in both lists, each side. */
  sharedMineSales: number;
  sharedTheirsSales: number;
  onlyMineSales: number;
  onlyTheirsSales: number;
  /** Each store's whole top-200 sales — the share denominators. */
  mineTotal: number;
  theirsTotal: number;
}

const salesOf = (r: TopItemRow | null): number => (r ? r.total_sales : 0);

const shareOf = (r: TopItemRow | null, total: number): number | null =>
  r === null || total <= 0 ? null : (r.total_sales / total) * 100;

const unitOf = (r: TopItemRow | null): "lb" | "units" | null =>
  r === null ? null : amountUnit(r);

/**
 * Join on product code.
 *
 * Codes come back as strings and are compared as strings — `normalizeProductCode`
 * is the item report's concern, and these two lists come from one endpoint in
 * one shape, so a code that differs here differs at the register too.
 */
export const compareTopItems = (
  mineRows: TopItemRow[],
  theirsRows: TopItemRow[],
): ComparedTopItem[] => {
  const mineTotal = mineRows.reduce((t, r) => t + r.total_sales, 0);
  const theirsTotal = theirsRows.reduce((t, r) => t + r.total_sales, 0);

  const byCode = new Map<string, { mine?: TopItemRow; theirs?: TopItemRow }>();
  // Insertion order is mine-then-theirs, so an all-mine list keeps the
  // endpoint's own ranking until the caller sorts it.
  for (const r of mineRows) byCode.set(r.product_code, { mine: r });
  for (const r of theirsRows) {
    const held = byCode.get(r.product_code);
    if (held) held.theirs = r;
    else byCode.set(r.product_code, { theirs: r });
  }

  const out: ComparedTopItem[] = [];
  for (const [code, pair] of byCode) {
    const mine = pair.mine ?? null;
    const theirs = pair.theirs ?? null;
    const present = mine ?? theirs!;

    out.push({
      code,
      description: present.product_description,
      dept: deptName(present),
      mine,
      theirs,
      mineSales: salesOf(mine),
      theirsSales: salesOf(theirs),
      mineShare: shareOf(mine, mineTotal),
      theirsShare: shareOf(theirs, theirsTotal),
      shareGap:
        mine && theirs
          ? shareOf(mine, mineTotal)! - shareOf(theirs, theirsTotal)!
          : null,
      pair: salesOf(mine) + salesOf(theirs),
      only: mine && theirs ? null : mine ? "mine" : "theirs",
      unitsDisagree: !!mine && !!theirs && weighed(mine) !== weighed(theirs),
      mineUnit: unitOf(mine),
      theirsUnit: unitOf(theirs),
    });
  }
  return out;
};

export const compareTotals = (rows: ComparedTopItem[]): CompareTotals => {
  const t: CompareTotals = {
    both: 0,
    onlyMine: 0,
    onlyTheirs: 0,
    sharedMineSales: 0,
    sharedTheirsSales: 0,
    onlyMineSales: 0,
    onlyTheirsSales: 0,
    mineTotal: 0,
    theirsTotal: 0,
  };
  for (const r of rows) {
    t.mineTotal += r.mineSales;
    t.theirsTotal += r.theirsSales;
    if (r.only === null) {
      t.both += 1;
      t.sharedMineSales += r.mineSales;
      t.sharedTheirsSales += r.theirsSales;
    } else if (r.only === "mine") {
      t.onlyMine += 1;
      t.onlyMineSales += r.mineSales;
    } else {
      t.onlyTheirs += 1;
      t.onlyTheirsSales += r.theirsSales;
    }
  }
  return t;
};

/**
 * How far apart the two stores are on this item, in points of share.
 *
 * On a one-sided row the true gap is unknown — the other store's share is
 * somewhere between nought and its own #200's — so this returns the known
 * side's share, which is the gap's **lower bound**. Sorting on it is honest;
 * printing it as the gap is not, which is why `shareGap` stays null and the
 * caller marks these rows as "at least".
 */
export const divergence = (r: ComparedTopItem): number => {
  if (r.shareGap !== null) return Math.abs(r.shareGap);
  return r.mineShare ?? r.theirsShare ?? 0;
};

/** Signed, for a chip that says which way. Positive means bigger here. */
export const divergenceSigned = (r: ComparedTopItem): number => {
  if (r.shareGap !== null) return r.shareGap;
  return r.only === "mine" ? (r.mineShare ?? 0) : -(r.theirsShare ?? 0);
};

export type CompareFilter = "all" | "both" | "mine" | "theirs";

export const filterCompared = (
  rows: ComparedTopItem[],
  filter: CompareFilter,
  text: string,
  /** Departments to keep. Empty means every one, the way the control reads. */
  depts: string[] = [],
): ComparedTopItem[] => {
  const needle = text.trim().toLowerCase();
  const keep = new Set(depts);
  return rows.filter((r) => {
    if (keep.size > 0 && !keep.has(r.dept)) return false;
    if (filter === "both" && r.only !== null) return false;
    if (filter === "mine" && r.only !== "mine") return false;
    if (filter === "theirs" && r.only !== "theirs") return false;
    if (!needle) return true;
    // Description and code only. Department has its own picker, and matching
    // it here too meant typing "meat" quietly did the dropdown's job -- two
    // controls answering one question, neither showing what the other had
    // done.
    return (
      r.description.toLowerCase().includes(needle) ||
      r.code.toLowerCase().includes(needle)
    );
  });
};

/**
 * Every department present across both lists, commonest first.
 *
 * Counted over ALL rows, not just one-sided ones -- this feeds a filter, and
 * a department you can see in the list has to be pickable even when the two
 * stores agree about it. `divergenceByDept` is the other question and counts
 * differently on purpose.
 */
export const deptsPresent = (
  rows: ComparedTopItem[],
): { dept: string; count: number }[] => {
  const tally = new Map<string, number>();
  for (const r of rows) tally.set(r.dept, (tally.get(r.dept) ?? 0) + 1);
  return [...tally]
    .map(([dept, count]) => ({ dept, count }))
    .sort((a, b) => b.count - a.count || a.dept.localeCompare(b.dept));
};

export type CompareSort = "divergence" | "sales";

export const sortCompared = (
  rows: ComparedTopItem[],
  sort: CompareSort,
): ComparedTopItem[] =>
  [...rows].sort((a, b) =>
    sort === "sales" ? b.pair - a.pair : divergence(b) - divergence(a),
  );

/**
 * Where the difference concentrates, by department.
 *
 * The outline the review asked for: eighty-eight differing items is a list,
 * "mostly Meat and Beer" is an answer. Counted over one-sided rows only —
 * an item both stores carry is not where they differ in stocking, however
 * far apart the sizes are.
 */
export const divergenceByDept = (
  rows: ComparedTopItem[],
): { dept: string; count: number }[] => {
  const tally = new Map<string, number>();
  for (const r of rows) {
    if (r.only === null) continue;
    tally.set(r.dept, (tally.get(r.dept) ?? 0) + 1);
  }
  return [...tally]
    .map(([dept, count]) => ({ dept, count }))
    .sort((a, b) => b.count - a.count || a.dept.localeCompare(b.dept));
};

/** The amount with its unit, or null where that side has no row. */
export const amountTextOf = (r: TopItemRow | null): string | null =>
  r === null
    ? null
    : `${amountOf(r).toLocaleString(undefined, {
        minimumFractionDigits: weighed(r) ? 1 : 0,
        maximumFractionDigits: weighed(r) ? 1 : 0,
      })} ${amountUnit(r)}`;
