import { calculateCogs } from "../subDepts";
import type { SubDeptMargin, TransactionListItem } from "../../interfaces";

/**
 * Estimated vs actual price points for one item.
 *
 * Two readings of the same fortnight from opposite ends of the pipe:
 *
 *   Estimated — `subs/subs` daily roll-ups, already in hand. A price is
 *   *inferred* by dividing dollars by units, so a day that sold at two prices
 *   collapses into one blended figure that may match neither.
 *
 *   Actual — individual register lines. A single-unit transaction is the price
 *   a customer really paid; nothing is inferred.
 *
 * Where they disagree is the point of the page. Estimated showing $7.99 while
 * actual shows six transactions at $7.99 and five averaging $7.29 means the
 * item is moving in multiples at a break — invisible in the roll-up.
 */

const round2 = (n: number) => Math.round(n * 100) / 100;

/* ---------------------------------------------------------------- estimated */

export interface EstimatedPricePoint {
  price: number;
  priceType: string;
  qty: number;
  units: number;
  sales: number;
  netSales: number;
  /** Distinct days this price was seen — a price on one day is a promotion, on
   *  twelve it's the shelf price. */
  daysSeen: number;
  marginPct: number;
  /** Gross profit on one unit at this price. What the suggestion multiplies by
   *  velocity to answer whether moving more actually earns more. */
  marginPerUnit: number;
  /** yyyy-mm-dd of the last day this price was seen. The most recent one across
   *  all points is what the item is selling at now. */
  lastSeen: string;
}

/**
 * Spec §5.1, against `SubDeptMargin` rows for one product_code.
 *
 * Negative-sales rows are coupons and discounts posted as their own lines.
 * Including them would produce negative "prices" that bucket separately and
 * make the table nonsense, so they're dropped — which is also why an item's
 * price points can total less than its Sub Dept Margins sales figure.
 */
export const estimatedPricePoints = (
  rows: SubDeptMargin[],
): EstimatedPricePoint[] => {
  const sales = rows.filter(
    (r) => r.sale_type === "Sale" && r.total_sales >= 0,
  );
  const isWeighted = sales.some((r) => r.weight > 0);

  interface Bucket extends Omit<
    EstimatedPricePoint,
    "daysSeen" | "marginPct" | "marginPerUnit" | "lastSeen"
  > {
    costTotal: number;
    dates: Set<string>;
  }
  const buckets = new Map<string, Bucket>();

  sales.forEach((r) => {
    const units = isWeighted && r.weight > 0 ? r.weight : r.qty;
    const price = units > 0 ? round2(r.net_sales / units) : round2(r.net_sales);
    const priceType = r.price_type || "REG";
    const key = `${price}|${priceType}`;

    const cogs = calculateCogs(
      r.net_cost,
      r.cost,
      r.case_size,
      r.qty,
      r.weight,
    );
    const found = buckets.get(key);
    if (found) {
      found.qty += r.qty;
      found.units += units;
      found.sales += r.total_sales;
      found.netSales += r.net_sales;
      found.costTotal += cogs;
      found.dates.add(r.sale_date.slice(0, 10));
    } else {
      buckets.set(key, {
        price,
        priceType,
        qty: r.qty,
        units,
        sales: r.total_sales,
        netSales: r.net_sales,
        costTotal: cogs,
        dates: new Set([r.sale_date.slice(0, 10)]),
      });
    }
  });

  return [...buckets.values()]
    .map((b) => ({
      price: b.price,
      priceType: b.priceType,
      qty: b.qty,
      units: b.units,
      sales: b.sales,
      netSales: b.netSales,
      daysSeen: b.dates.size,
      marginPct:
        b.netSales > 0 ? ((b.netSales - b.costTotal) / b.netSales) * 100 : 0,
      marginPerUnit: b.units > 0 ? (b.netSales - b.costTotal) / b.units : 0,
      lastSeen: [...b.dates].sort().at(-1) ?? "",
    }))
    .sort((a, b) => b.sales - a.sales);
};

/* ------------------------------------------------------------------- actual */

/**
 * Whether a register line is a weighed sale.
 *
 * The spec tests `weight > 0`, but `transaction_list` doesn't return a weight
 * column — scale items come back as a **fractional qty** instead, which is
 * documented on the Cashiers explorer. So the discriminator is integer-ness.
 *
 * This is weaker than the spec's, in one specific way worth knowing: an item
 * that happens to weigh exactly 1.00 lb reads as a single each-priced unit and
 * lands in the exact table. That is the right *price* either way — one pound at
 * $/lb is the same arithmetic — so the number on screen is never wrong; only
 * the exact/averaged split can misfile a row. A whole item is judged weighed by
 * whether *any* of its lines is fractional, so a genuine scale item with one
 * round ring still classifies correctly.
 */
const isFractional = (qty: number) => !Number.isInteger(qty);

export interface ActualPricePoint {
  price: number;
  priceType: string;
  /** Transactions, not units — the count that says how many separate customers
   *  met this price. */
  trans: number;
  qty: number;
  sales: number;
  /** Distinct days this price was rung. Velocity needs a denominator, and a
   *  price seen once can't be compared to one seen all fortnight on totals. */
  daysSeen: number;
  /** yyyy-mm-dd of the last day it was rung. The latest across all points is
   *  what the item is selling at now. */
  lastSeen: string;
  /** Price less the item's blended unit cost. Register lines carry no cost of
   *  their own, so this comes from the `subs/subs` rows — the same cost every
   *  other margin on the page is computed from. */
  marginPerUnit: number;
  marginPct: number;
  /** The register lines this bucket was built from, newest first.
   *
   *  Carried here rather than re-filtered by the view: the bucket key depends
   *  on rounding and on whether the price was divided by quantity, and a second
   *  implementation of that in a component would drift from this one the first
   *  time either changed. */
  lines: TransactionListItem[];
}

export interface ActualPricePoints {
  /** Single-unit rings. The price a customer actually paid, unaveraged. */
  exact: ActualPricePoint[];
  /** Multi-unit rings, `netSales / qty`. A $2-off-3 deal shows up here and
   *  nowhere else. */
  averaged: ActualPricePoint[];
  exactCount: number;
  averagedCount: number;
  isWeighted: boolean;
}

const emptyActual: ActualPricePoints = {
  exact: [],
  averaged: [],
  exactCount: 0,
  averagedCount: 0,
  isWeighted: false,
};

/** Qty is optional on a transaction line; absent means one ring. */
const lineQty = (t: TransactionListItem) => t.qty ?? 1;

/**
 * Spec §5.2. Register lines for one product_code into exact and averaged
 * buckets.
 *
 * A weighed item has no averaged table: every line is already $/lb, so there is
 * nothing to average and splitting them by ring count would say nothing about
 * pricing.
 *
 * `unitCost` comes from the `subs/subs` rows because register lines carry no
 * cost. It is the item's blended cost across the window, so margin here answers
 * "what would this price have earned per unit", not "what did this exact
 * receipt earn" — close enough to rank prices by, and the only cost there is.
 */
export const actualPricePoints = (
  lines: TransactionListItem[],
  unitCost: number,
): ActualPricePoints => {
  if (lines.length === 0) return emptyActual;

  const isWeighted = lines.some((t) => isFractional(lineQty(t)));
  const sold = lines.filter((t) => t.net_sales > 0);

  const exactRows = isWeighted ? sold : sold.filter((t) => lineQty(t) === 1);
  const avgRows = isWeighted ? [] : sold.filter((t) => lineQty(t) > 1);

  const bucket = (rows: TransactionListItem[], divide: boolean) => {
    interface B extends Omit<ActualPricePoint, "daysSeen" | "lastSeen"> {
      dates: Set<string>;
    }
    const map = new Map<string, B>();
    rows.forEach((t) => {
      const qty = lineQty(t);
      const price =
        divide || isWeighted ? round2(t.net_sales / qty) : round2(t.net_sales);
      const priceType = t.price_type || "REG";
      const key = `${price}|${priceType}`;
      const date = t.sale_date.slice(0, 10);
      const found = map.get(key);
      if (found) {
        found.trans += 1;
        found.qty += qty;
        found.sales += t.net_sales;
        found.dates.add(date);
        found.lines.push(t);
      } else {
        map.set(key, {
          price,
          priceType,
          trans: 1,
          qty,
          sales: t.net_sales,
          marginPerUnit: price - unitCost,
          marginPct: price > 0 ? ((price - unitCost) / price) * 100 : 0,
          dates: new Set([date]),
          lines: [t],
        });
      }
    });
    return [...map.values()]
      .map(({ dates, ...rest }) => ({
        ...rest,
        daysSeen: dates.size,
        lastSeen: [...dates].sort().at(-1) ?? "",
        // Newest first — the reader opening a price wants the most recent ring
        // at that price, not the oldest.
        lines: [...rest.lines].sort((a, b) =>
          b.sale_date.localeCompare(a.sale_date),
        ),
      }))
      .sort((a, b) => b.trans - a.trans);
  };

  return {
    exact: bucket(exactRows, false),
    averaged: bucket(avgRows, true),
    exactCount: exactRows.length,
    averagedCount: avgRows.length,
    isWeighted,
  };
};

/* --------------------------------------------------------------- suggestion */

export interface PricePointPerformance {
  point: ActualPricePoint;
  /** Units a day while this price was live. */
  velocity: number;
  /** Gross profit a day while this price was live. */
  profitPerDay: number;
}

export interface PriceSuggestion {
  /** The price that moved the most, by velocity. */
  best: PricePointPerformance;
  /** What the item is selling at now — the point rung most recently. Null when
   *  that is already `best`, so there is nothing to suggest a change from. */
  current: PricePointPerformance | null;
  /** Profit a day gained by moving to `best`. Negative when the faster price
   *  earns less despite selling more, which is the case worth catching. */
  profitDelta: number;
  /** `best` is also the cheapest price rung. Nearly always true, and worth
   *  saying out loud rather than dressing a discount up as an insight. */
  isCheapest: boolean;
  /** `best` is what the item already sells at. Nothing to do. */
  isCurrent: boolean;
}

const perf = (p: ActualPricePoint): PricePointPerformance => {
  const velocity = p.daysSeen > 0 ? p.qty / p.daysSeen : 0;
  return { point: p, velocity, profitPerDay: velocity * p.marginPerUnit };
};

/**
 * Which price moved the most product.
 *
 * Reads **actual** price points only — the exact ones, prices a customer really
 * paid at a register. The estimated table divides a day's dollars by a day's
 * units, so a day that rang nineteen at $13.99 and one at $12.99 produces a
 * "price" of $13.88 that nobody was ever charged. Recommending a shelf price
 * that never existed is worse than recommending nothing, so the estimated side
 * informs the reader and never the suggestion.
 *
 * Averaged points are excluded for the same reason one step down: a multi-unit
 * ring divided by its quantity is still a derived figure, not a shelf price.
 * An item that only ever sells in multiples therefore gets no suggestion, which
 * is the honest answer — there is no single-unit price to observe.
 *
 * Ranked by units **per day**, not units outright. A price that ran twelve days
 * will out-sell one that ran a single day on raw quantity almost regardless of
 * what either price was, so ranking on the total would just nominate whichever
 * price happened to be live longest.
 *
 * Deliberately *not* ranked by profit per day, even though that figure is
 * carried alongside. The request is for the price that moves the most, and a
 * page that silently optimised for margin instead would be answering a question
 * nobody asked. `profitDelta` is there so the cost of taking the suggestion is
 * visible next to it — moving 40% more units at a 30% worse margin is a
 * decision, not an improvement, and the reader gets to make it.
 */
export const suggestPrice = (
  actual: ActualPricePoints,
): PriceSuggestion | null => {
  const points = actual.exact;
  // One price is not a comparison, and inventing one would be noise.
  if (points.length < 2) return null;

  const ranked = points.map(perf);
  const best = ranked.reduce((a, b) => (b.velocity > a.velocity ? b : a));

  // "Current" is the most recently rung price, not the best-selling one — the
  // baseline a suggestion is measured against is what's on the shelf today.
  const current = ranked.reduce((a, b) =>
    b.point.lastSeen > a.point.lastSeen ? b : a,
  );

  const cheapest = Math.min(...points.map((p) => p.price));

  return {
    best,
    current: current.point === best.point ? null : current,
    profitDelta: best.profitPerDay - current.profitPerDay,
    isCheapest: best.point.price === cheapest,
    isCurrent: current.point === best.point,
  };
};

/* --------------------------------------------------------------- mixed price */

export interface MixedPriceInsight {
  /** Receipts carrying this item at more than one price. */
  mixedTxns: number;
  uniqueTxns: number;
  /** The widest spread seen within a single receipt, in dollars. */
  maxSpread: number;
}

/**
 * Spec §5.3's `mixedPriceInsight`. The same item at two prices on one receipt
 * is the signature of a package deal or a break — two rung at $3.49 and a third
 * at $0.02 to make three-for-$6.99.
 */
export const mixedPriceInsight = (
  lines: TransactionListItem[],
): MixedPriceInsight => {
  const bySale = new Map<string, number[]>();
  lines
    .filter((t) => t.net_sales > 0)
    .forEach((t) => {
      const price = round2(t.net_sales / lineQty(t));
      const found = bySale.get(t.sale_id);
      if (found) found.push(price);
      else bySale.set(t.sale_id, [price]);
    });

  let mixedTxns = 0;
  let maxSpread = 0;
  bySale.forEach((prices) => {
    if (new Set(prices).size > 1) {
      mixedTxns += 1;
      maxSpread = Math.max(
        maxSpread,
        Math.max(...prices) - Math.min(...prices),
      );
    }
  });

  return { mixedTxns, uniqueTxns: bySale.size, maxSpread: round2(maxSpread) };
};

/* ----------------------------------------------------------- classification */

/**
 * Transactions needed before the volatility branch is allowed an opinion.
 *
 * `distinctPrices / totalTrans` is degenerate on a small sample: one sale at
 * one price scores 100%, two sales at two prices score 100%, and both trip the
 * >90% test that accuses the store of a scale or PLU fault. Five is the point
 * at which a price genuinely repeating starts to separate from a price that
 * simply hasn't rung twice yet.
 */
const MIN_TRANS_FOR_VOLATILITY = 5;

const formatPrice = (p: number | undefined) =>
  p === undefined ? "an unknown price" : `$${p.toFixed(2)}`;

export type PatternKind =
  | "package"
  | "multiBuy"
  | "byThePound"
  | "verifyMethod"
  | "subjective"
  | "stable";

export interface PricingPattern {
  kind: PatternKind;
  title: string;
  detail: string;
  /** Whether this wants the reader's attention or merely describes the item.
   *  By-the-pound variation is expected; the same variation without weight
   *  data is a scale or PLU fault. */
  concerning: boolean;
}

/**
 * Spec §5.3, thresholds as written.
 *
 * One verdict, not five stacked callouts — the checks are ordered so the most
 * specific explanation wins. An item that is both mixed-price and multi-qty is
 * a package deal, and saying so is more use than listing both.
 *
 * Nothing here is a grade. "Highly subjective pricing" means the prices vary
 * more than the data can explain, not that someone did something wrong; the
 * reader knows about the sale the page doesn't.
 */
export const classifyPattern = (
  actual: ActualPricePoints,
  mixed: MixedPriceInsight,
): PricingPattern => {
  const totalTrans = actual.exactCount + actual.averagedCount;
  if (totalTrans === 0) {
    return {
      kind: "stable",
      title: "No register data",
      detail: "No transactions matched this item in the window.",
      concerning: false,
    };
  }

  const distinctPrices = new Set(
    [...actual.exact, ...actual.averaged].map((p) => p.price),
  ).size;
  const volatilityPct = (distinctPrices / totalTrans) * 100;
  const mixedPct =
    mixed.uniqueTxns > 0 ? (mixed.mixedTxns / mixed.uniqueTxns) * 100 : 0;
  const multiQtyPct = (actual.averagedCount / totalTrans) * 100;
  // Across both tables. Reading `exact` alone made this 0 for any item that
  // only ever sells in multiples — which is precisely the shape multi-buy is
  // meant to describe, so the branch could never fire for its own best case.
  const allPoints = [...actual.exact, ...actual.averaged];
  const topPoint = allPoints.reduce<ActualPricePoint | null>(
    (a, b) => (a === null || b.trans > a.trans ? b : a),
    null,
  );
  const topPricePct = ((topPoint?.trans ?? 0) / totalTrans) * 100;

  if (mixedPct >= 30 && mixed.mixedTxns > 0) {
    return {
      kind: "package",
      title: "Package deal",
      detail: `${Math.round(mixedPct)}% of receipts ring this item at more than one price, spread up to ${mixed.maxSpread.toFixed(2)}.`,
      concerning: false,
    };
  }

  if (topPricePct >= 50 && multiQtyPct >= 50) {
    return {
      kind: "multiBuy",
      title: "Multi-buy",
      detail: `${Math.round(multiQtyPct)}% of transactions ring more than one unit, most at ${formatPrice(topPoint?.price)}.`,
      concerning: false,
    };
  }

  // Volatility is distinct prices over transactions, so it reads 100% whenever
  // an item has rung as many times as it has prices — one sale at one price is
  // "100% volatile" on the arithmetic, and would otherwise be accused of a
  // broken scale. Variation needs a sample before it means anything.
  if (totalTrans < MIN_TRANS_FOR_VOLATILITY) {
    return {
      kind: "stable",
      title: "Too few transactions to judge",
      detail: `${totalTrans} transaction${totalTrans === 1 ? "" : "s"} at ${distinctPrices} price${distinctPrices === 1 ? "" : "s"} — not enough to tell a pricing pattern from noise.`,
      concerning: false,
    };
  }

  if (volatilityPct > 50 && mixedPct < 30) {
    if (volatilityPct > 90) {
      return actual.isWeighted
        ? {
            kind: "byThePound",
            title: "Priced by weight",
            detail:
              "Nearly every transaction is a different total, which is expected on a scale item.",
            concerning: false,
          }
        : {
            kind: "verifyMethod",
            title: "Verify pricing method",
            detail:
              "Nearly every transaction is a different price, but no line rang as weighed. Check the scale or PLU setup.",
            concerning: true,
          };
    }
    return {
      kind: "subjective",
      title: "Highly variable pricing",
      detail: `${distinctPrices} distinct prices across ${totalTrans} transactions, without a package or multi-buy pattern to explain it.`,
      concerning: true,
    };
  }

  return {
    kind: "stable",
    title: "Consistent pricing",
    detail: `${distinctPrices} price${distinctPrices === 1 ? "" : "s"} across ${totalTrans} transactions.`,
    concerning: false,
  };
};
