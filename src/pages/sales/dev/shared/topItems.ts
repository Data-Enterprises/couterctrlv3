import type {
  TopItemRow,
  TopItemPricePoint,
} from "../../../../api/topItems";

/**
 * Top items — the arithmetic, with no React in it.
 *
 * The endpoint ranks by units and this tab ranks by sales, so the reordering
 * lives here rather than in the component: it is the difference between two
 * different lists of two hundred items, not a display detail.
 */

/**
 * A nullable count as a number.
 *
 * The four `qty_*` fields are `SUM(qty) FILTER (WHERE …)`, and Postgres
 * returns NULL rather than 0 when nothing matches — so an item that only ever
 * sold at regular price arrives with `qty_promo: null`. Null and zero mean
 * the same thing here (no units rang that way), so they collapse, but every
 * read has to go through this: a raw `.toLocaleString()` on one of them
 * crashes the panel.
 */
export const count = (n: number | null | undefined): number => n ?? 0;

/** Units sold at a price the POS did not call regular. */
export const promoUnits = (r: TopItemRow) => count(r.qty_promo);

/** The share of an item's units that moved off regular price, 0–1. Deal items
 *  count: for the stores that sell them, the deal IS the item. */
export const promoShare = (r: TopItemRow): number => {
  const known =
    count(r.qty_regular) + count(r.qty_promo) + count(r.qty_deal_item);
  if (known <= 0) return 0;
  return (count(r.qty_promo) + count(r.qty_deal_item)) / known;
};

/**
 * What a unit actually fetched, averaged over everything that rang.
 *
 * Blended across regular and promo deliberately — it is the number that
 * belongs beside cost, because it is what the week really earned. The
 * individual prices are in `price_points` and the panel shows those too.
 */
export const avgPrice = (r: TopItemRow): number | null =>
  r.qty > 0 ? r.total_sales / r.qty : null;

/** Sales less cost. Null when the cost is not trustworthy, on the same rule
 *  the server uses to null the margin. */
export const grossProfit = (r: TopItemRow): number | null =>
  r.margin === null ? null : r.total_sales - count(r.ext_cost);

/**
 * The top `shown` items by sales.
 *
 * Ties break on units and then product code, so the list cannot reorder
 * itself between two renders of the same data.
 */
export const rankBySales = (items: TopItemRow[], shown: number): TopItemRow[] =>
  [...items]
    .sort(
      (a, b) =>
        b.total_sales - a.total_sales ||
        b.qty - a.qty ||
        a.product_code.localeCompare(b.product_code),
    )
    .slice(0, shown);

/**
 * The prices one item rang at, biggest first.
 *
 * Grouped by price across stores, because a single-store call cannot return
 * the same price twice — and grouping anyway means the group view can reuse
 * this untouched.
 */
export const pointsFor = (
  points: TopItemPricePoint[],
  productCode: string,
): { price: number; units: number; netSales: number }[] => {
  const byPrice = new Map<number, { units: number; netSales: number }>();
  points
    .filter((p) => p.product_code === productCode)
    .forEach((p) => {
      const seen = byPrice.get(p.price);
      if (seen) {
        seen.units += p.units;
        seen.netSales += p.net_sales;
      } else {
        byPrice.set(p.price, { units: p.units, netSales: p.net_sales });
      }
    });
  return [...byPrice.entries()]
    .map(([price, v]) => ({ price, ...v }))
    .sort((a, b) => b.units - a.units || b.price - a.price);
};

export type ItemTone = "critical" | "watch" | "healthy" | "unknown";

export interface ItemInsight {
  tone: ItemTone;
  label: string;
  detail: string;
}

const money = (n: number) =>
  `$${Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const pct = (n: number) => `${Math.round(n * 100)}%`;

/**
 * The sentence the figures add up to.
 *
 * Ordered by what the reader can act on rather than by severity. Selling
 * under cost is the finding; whether a promotion caused it is what turns it
 * into something to do, so the promotion case is tested first and reads
 * differently — one is "stop the promotion", the other is "check the cost".
 *
 * Everything here comes off fields the endpoints return. Nothing is inferred
 * from a price the response does not carry.
 */
export const topItemInsight = (
  r: TopItemRow,
  points: { price: number; units: number }[],
): ItemInsight => {
  const share = promoShare(r);
  const avg = avgPrice(r);
  const gp = grossProfit(r);
  const unitCost = r.qty > 0 ? count(r.ext_cost) / r.qty : null;

  if (r.margin === null) {
    const cov = r.cost_coverage === null ? null : Math.round(r.cost_coverage);
    return {
      tone: "unknown",
      label: "Margin not known",
      detail:
        `${money(r.total_sales)} across ${r.qty.toLocaleString()} units, but ` +
        (cov === null
          ? "no line carried a cost"
          : `only ${cov}% of lines carried a cost`) +
        ", so there is no margin to trust here. Sales and movement are unaffected.",
    };
  }

  const underWater = r.margin < 0;

  if (underWater && share >= 0.8 && avg !== null && unitCost !== null) {
    return {
      tone: "critical",
      label: "Promotion under water",
      detail:
        `${pct(share)} of units moved off regular price, at an average ` +
        `${money(avg)} against a ${money(unitCost)} cost — about ` +
        `${money(gp ?? 0)} given away this week. The promotion is the thing ` +
        `to look at, not the item.`,
    };
  }

  if (underWater && avg !== null && unitCost !== null) {
    return {
      tone: "critical",
      label: "Selling below cost",
      detail:
        `An average ${money(avg)} against a ${money(unitCost)} cost, about ` +
        `${money(gp ?? 0)} down over ${r.qty.toLocaleString()} units. Only ` +
        `${pct(share)} of them were off regular price, so this is the cost ` +
        `rather than a promotion.`,
    };
  }

  if (share >= 0.95 && points.length > 0) {
    const top = points[0];
    return {
      tone: "watch",
      label: "Only sells on promo",
      detail:
        `Every unit rang at ${money(top.price)} or another off-regular ` +
        `price. It still makes ${r.margin.toFixed(1)}%, but nothing sold at ` +
        `the regular price this week.`,
    };
  }

  return {
    tone: "healthy",
    label: "Holding up",
    detail:
      `${money(r.total_sales)} at ${r.margin.toFixed(1)}% over ` +
      `${r.qty.toLocaleString()} units` +
      (share > 0 ? `, ${pct(share)} of them off regular price.` : "."),
  };
};

/** One item, with its two baselines beside it. */
export interface TopItemCompared {
  ty: TopItemRow;
  lw: TopItemRow | null;
  ly: TopItemRow | null;
  /** Percent change in SALES, the metric the list ranks on. Null when the
   *  baseline sold none — a rise from nothing is not a percentage. */
  vsLW: number | null;
  vsLY: number | null;
}

const pctChange = (now: number, before: number | undefined | null) =>
  before === undefined || before === null || before === 0
    ? null
    : ((now - before) / Math.abs(before)) * 100;

/**
 * Join the three windows on product code.
 *
 * `topitems` answers one window, so the tab asks three times and lines them
 * up here. Keyed on product code alone: a single-store call returns one row
 * per code, and the baselines are the same store by construction.
 *
 * An item absent from a baseline is a real answer — it did not sell that week
 * — and stays null rather than becoming a zero, because a zero would compute
 * a percentage and claim the item collapsed when it simply did not exist.
 */
export const compareWindows = (
  ty: TopItemRow[],
  lw: TopItemRow[],
  ly: TopItemRow[],
): TopItemCompared[] => {
  const byCode = (rows: TopItemRow[]) =>
    new Map(rows.map((r) => [r.product_code, r]));
  const lwBy = byCode(lw);
  const lyBy = byCode(ly);
  return ty.map((row) => {
    const l = lwBy.get(row.product_code) ?? null;
    const y = lyBy.get(row.product_code) ?? null;
    return {
      ty: row,
      lw: l,
      ly: y,
      vsLW: pctChange(row.total_sales, l?.total_sales),
      vsLY: pctChange(row.total_sales, y?.total_sales),
    };
  });
};

/** Percent change between two numbers, for the supporting table. Exposed so
 *  the component does not re-implement the null rule. */
export const deltaPct = (
  now: number | null,
  before: number | null | undefined,
): number | null =>
  now === null ? null : pctChange(now, before);

/** Margin moves in points, not percent: 22% to 11% is 11 points down, and
 *  calling it "-50%" invites someone to read it as half the sales. */
export const deltaPoints = (
  now: number | null,
  before: number | null | undefined,
): number | null =>
  now === null || before === null || before === undefined ? null : now - before;

/** What the Top items list can be ordered by. */
export type TopItemSortCol = "item" | "sales" | "vsLW" | "vsLY";
export interface TopItemSort {
  column: TopItemSortCol;
  direction: "asc" | "desc";
}

/** The list's resting order: biggest sales first, the way it arrives. */
export const DEFAULT_TOP_ITEM_SORT: TopItemSort = {
  column: "sales",
  direction: "desc",
};

/**
 * Clicking a column header.
 *
 * A new column starts descending — on every one of these, "most" is the
 * question being asked, and starting ascending would open on the smallest
 * numbers and read as broken. Clicking the column already sorted flips it.
 * `item` is the exception: a name sorts A–Z first.
 */
export const nextTopItemSort = (
  current: TopItemSort,
  column: TopItemSortCol,
): TopItemSort =>
  current.column === column
    ? { column, direction: current.direction === "desc" ? "asc" : "desc" }
    : { column, direction: column === "item" ? "asc" : "desc" };

/**
 * Sort the compared rows.
 *
 * A null comparison is not a small one: an item with no last year has not
 * fallen, it has no baseline. So nulls sink to the bottom in BOTH directions
 * rather than crowding whichever end the sort happens to be pointing at.
 */
export const sortTopItems = (
  rows: TopItemCompared[],
  sort: TopItemSort,
): TopItemCompared[] => {
  const dir = sort.direction === "asc" ? 1 : -1;
  const value = (r: TopItemCompared): number | null => {
    switch (sort.column) {
      case "sales":
        return r.ty.total_sales;
      case "vsLW":
        return r.vsLW;
      case "vsLY":
        return r.vsLY;
      default:
        return null;
    }
  };
  return [...rows].sort((a, b) => {
    if (sort.column === "item") {
      return (
        dir *
        a.ty.product_description.localeCompare(b.ty.product_description)
      );
    }
    const av = value(a);
    const bv = value(b);
    if (av === null && bv === null) {
      return a.ty.product_code.localeCompare(b.ty.product_code);
    }
    if (av === null) return 1;
    if (bv === null) return -1;
    return (
      dir * (av - bv) || a.ty.product_code.localeCompare(b.ty.product_code)
    );
  });
};

/** How an item's filing reads. Unknown rather than blank when the POS sent
 *  none: a nameless department is a real state, not a missing one. */
export const deptName = (r: TopItemRow): string =>
  r.sub_department_description?.trim() ||
  (r.sub_department === null ? "No department" : `Dept ${r.sub_department}`);

/**
 * The departments present in a list, for the filter.
 *
 * Built from the items actually on screen rather than the store's whole
 * catalogue: an option that can only ever empty the list is a dead end, and
 * this list is already cut to two hundred.
 */
export const deptOptions = (
  rows: TopItemCompared[],
): { value: string; label: string }[] => {
  const counts = new Map<string, number>();
  rows.forEach((r) => {
    const name = deptName(r.ty);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  });
  return [...counts.entries()]
    .map(([name, n]) => ({ value: name, label: `${name} (${n})` }))
    .sort((a, b) => a.value.localeCompare(b.value));
};
