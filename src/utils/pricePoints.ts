import { calculateCogs } from "./cogs";
import type { SubDeptMargin, TransactionListItem } from "../interfaces";
import type { ServerPricePoint } from "../api/pricePoints";

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
  /** A per-unit cost to hold every price against instead of each row's own.
   *  Price Opt passes the latest invoice cost here, so the left table's
   *  margins agree with the right table's and the header. Omitted, each row
   *  is costed from its own fields as before. */
  unitCostOverride?: number | null,
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

    const cogs =
      unitCostOverride != null
        ? units * unitCostOverride
        : calculateCogs(r.net_cost, r.cost, r.case_size, r.qty, r.weight);
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
 * `transaction_list` returns `weight` in pounds since 22 Oct, with Food
 * Giant's thousandths already divided on the server, so this reads the column
 * the spec always meant.
 *
 * It used to infer the answer from a fractional `qty`, because the column was
 * not there. That had one hole: an item weighing exactly 1.00 lb read as a
 * single each-priced unit and landed in the exact table. The price was right
 * either way — one pound at $/lb is the same arithmetic — but the exact and
 * averaged split could misfile a row. Reading the weight closes it.
 *
 * `weight` is optional on the type: an API that predates the change sends
 * none, and against one of those every line reports unweighed, which is what
 * the old code did for a round-quantity scale item anyway. A refund carries a
 * negative weight, so this tests for a non-zero magnitude rather than > 0.
 */
const isWeighedLine = (t: TransactionListItem) => Math.abs(t.weight ?? 0) > 0;

/**
 * The receipt a register line is on.
 *
 * Transactions are receipts, not lines. A customer who rings the same item
 * three times is one transaction, and counting lines made Price Opt's TRANS
 * read 375 for Ground Beef when 203 receipts were behind it (dev board review,
 * finding C). Item Actions already counted this way on its own; this puts the
 * rule where both read it.
 */
const receiptOf = (t: TransactionListItem) => t.sale_id || t.transaction_id;
const receiptsIn = (lines: TransactionListItem[]) =>
  new Set(lines.map(receiptOf)).size;

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
  /** Receipts behind each table. A receipt can sit in both, when an item was
   *  rung once alone and once in a multiple on the same sale. */
  exactCount: number;
  averagedCount: number;
  /** Distinct receipts across both tables: the item's transaction count. */
  receiptCount: number;
  isWeighted: boolean;
}

const emptyActual: ActualPricePoints = {
  exact: [],
  averaged: [],
  exactCount: 0,
  averagedCount: 0,
  receiptCount: 0,
  isWeighted: false,
};

/** Qty is optional on a transaction line; absent means one ring. */
/** Units on a register line. A missing `qty` is one unit, not zero — the field
 *  is absent on endpoints that only ever return single rings. */
export const lineQty = (t: TransactionListItem) => t.qty ?? 1;

/**
 * The per-unit price a register line rang at.
 *
 * The POS writes repeats two ways — as several single-unit rows, or as one
 * consolidated row with a high qty — so `net_sales` is the price on the first
 * shape and the whole basket on the second. Dividing handles both.
 *
 * Exported because the price-points table, its receipt count and the modal
 * behind it all have to agree on which lines sit at a price. They each had
 * their own comparison and every one of them missed the consolidated rows.
 */
export const unitPrice = (t: TransactionListItem) =>
  round2(t.net_sales / lineQty(t));

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
/**
 * Fold prices a cent apart into one.
 *
 * A multi-buy splits its total across lines to the penny: three for $10 rings
 * as $3.33, $3.33 and $3.34. Those are one price, but bucketed by the cent
 * they read as two -- COKE 6PK showed "PRICES 7" and a "moves fastest at
 * $3.34" over a twin of $3.33 (dev board review, finding B). Nobody sets two
 * shelf prices a cent apart, so a pair that close, under the same price type,
 * is folded into whichever of the two more receipts rang at.
 */
const foldPennyTwins = <T extends { price: number; priceType: string }>(
  points: T[],
  /** Which of two twins is the real price: the one more receipts rang at. */
  size: (p: T) => number,
  fold: (keep: T, other: T) => void,
): T[] => {
  const sorted = [...points].sort(
    (a, b) => a.priceType.localeCompare(b.priceType) || a.price - b.price,
  );
  const out: T[] = [];
  for (const p of sorted) {
    const prev = out[out.length - 1];
    if (
      prev &&
      prev.priceType === p.priceType &&
      Math.abs(p.price - prev.price) <= 0.011
    ) {
      const keep = size(p) > size(prev) ? p : prev;
      fold(keep, keep === p ? prev : p);
      out[out.length - 1] = keep;
    } else {
      out.push(p);
    }
  }
  return out;
};

const mergePennyTwins = <
  T extends {
    price: number;
    priceType: string;
    qty: number;
    sales: number;
    dates: Set<string>;
    receipts: Set<string>;
    lines: TransactionListItem[];
    trans: number;
  },
>(
  points: T[],
): T[] =>
  foldPennyTwins(
    points,
    (p) => p.receipts.size,
    (keep, fold) => {
      fold.dates.forEach((d) => keep.dates.add(d));
      fold.receipts.forEach((r) => keep.receipts.add(r));
      keep.qty += fold.qty;
      keep.sales += fold.sales;
      keep.lines.push(...fold.lines);
      keep.trans = keep.receipts.size;
    },
  );

export const actualPricePoints = (
  lines: TransactionListItem[],
  unitCost: number,
): ActualPricePoints => {
  if (lines.length === 0) return emptyActual;

  const isWeighted = lines.some(isWeighedLine);
  const sold = lines.filter((t) => t.net_sales > 0);

  const exactRows = isWeighted ? sold : sold.filter((t) => lineQty(t) === 1);
  const avgRows = isWeighted ? [] : sold.filter((t) => lineQty(t) > 1);

  const bucket = (rows: TransactionListItem[], divide: boolean) => {
    interface B extends Omit<ActualPricePoint, "daysSeen" | "lastSeen"> {
      dates: Set<string>;
      receipts: Set<string>;
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
        found.receipts.add(receiptOf(t));
        found.trans = found.receipts.size;
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
          receipts: new Set([receiptOf(t)]),
          lines: [t],
        });
      }
    });
    return mergePennyTwins([...map.values()])
      .map(({ dates, receipts: _receipts, ...rest }) => ({
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
    exactCount: receiptsIn(exactRows),
    averagedCount: receiptsIn(avgRows),
    receiptCount: receiptsIn(sold),
    isWeighted,
  };
};

/**
 * The same tables from `cashiers/price_points`, which buckets on the server.
 *
 * Price Opt reads this since 22 Oct rather than downloading receipts. Three
 * things it does that the browser's buckets could not:
 *
 *  - **Weighed items are priced per pound.** The receipts carried no weight,
 *    so a random-weight pack rang as qty 1 at its own total and became its
 *    own price (Ground Beef Fam Pak showed 146 of them; dev board review,
 *    finding A). Food Giant's scale items, rung at qty 0, fell out entirely.
 *    `qty` here is pounds on a weighed row, so velocity is pounds a day and
 *    the margin is held against a per-pound cost.
 *  - **Every receipt is read.** There was a 400-receipt cap.
 *  - **Half-cents round correctly.** 2 for $6.67 is $3.34 on the server and
 *    was $3.33 in floating point. The penny-twin fold still runs, because a
 *    multi-buy split to the penny still arrives as two prices.
 *
 * What it cannot do is name the receipts, so `lines` is empty on every point:
 * opening a price fetches them then (see `linesAtPrice`). Two counts are sums
 * where the browser had distinct receipts: folding a twin adds its receipts,
 * and `receiptCount` adds the two tables. Each can count one receipt twice,
 * only when it carried the item at two prices.
 */
export const pricePointsFromServer = (
  rows: ServerPricePoint[],
  unitCost: number,
): ActualPricePoints => {
  // Refund-only and zero buckets are not prices anyone set, as before.
  const sold = rows.filter((r) => r.sales > 0 && r.unit_price > 0);
  if (sold.length === 0) return emptyActual;

  const isWeighted = sold.some((r) => r.weighed);
  // A weighed row is per pound already, so it has no averaged form.
  const exactRows = sold.filter((r) => r.weighed || !r.multi);
  const avgRows = sold.filter((r) => !r.weighed && r.multi);

  const toPoint = (r: ServerPricePoint): ActualPricePoint => ({
    price: r.unit_price,
    priceType: r.price_type || "REG",
    trans: r.receipts,
    qty: r.weighed ? r.weight : r.units,
    sales: r.sales,
    daysSeen: r.days_seen,
    lastSeen: r.last_seen,
    marginPerUnit: r.unit_price - unitCost,
    marginPct:
      r.unit_price > 0 ? ((r.unit_price - unitCost) / r.unit_price) * 100 : 0,
    lines: [],
  });

  const table = (rs: ServerPricePoint[]) =>
    foldPennyTwins(
      rs.map(toPoint),
      (p) => p.trans,
      (keep, fold) => {
        keep.trans += fold.trans;
        keep.qty += fold.qty;
        keep.sales += fold.sales;
        // Days can overlap between twins, so the larger is the honest floor;
        // adding them could pass the 3-day minimum on one day twice.
        keep.daysSeen = Math.max(keep.daysSeen, fold.daysSeen);
        if (fold.lastSeen > keep.lastSeen) keep.lastSeen = fold.lastSeen;
      },
    ).sort((a, b) => b.trans - a.trans);

  const receiptsOf = (rs: ServerPricePoint[]) =>
    rs.reduce((s, r) => s + r.receipts, 0);

  return {
    exact: table(exactRows),
    averaged: table(avgRows),
    exactCount: receiptsOf(exactRows),
    averagedCount: receiptsOf(avgRows),
    receiptCount: receiptsOf(sold),
    isWeighted,
  };
};

/**
 * The receipt lines behind one server price point.
 *
 * Fetched only when somebody opens a price, then matched here by the rule the
 * server bucketed on: same price type, same single or multiple ring, and the
 * same price. A weighed line matches when its total is the price times its
 * weight within what the two roundings explain (the server's own window), so
 * a pack that rang at the shelf price lands under it. Anything else matches
 * to the cent, with a cent's slack for the penny-twin fold.
 */
export const linesAtPrice = (
  lines: TransactionListItem[],
  point: ActualPricePoint,
  opts: { weighed: boolean; averaged: boolean },
): TransactionListItem[] =>
  lines
    .filter((t) => {
      if ((t.price_type || "REG") !== point.priceType) return false;
      const w = t.weight ?? 0;
      if (opts.weighed && w !== 0) {
        const slack = point.price * 0.005 + 0.005 + 0.011 * Math.abs(w);
        return Math.abs(t.net_sales - point.price * w) <= slack;
      }
      const q = lineQty(t);
      if (q === 0) return false;
      if (!opts.weighed && Math.abs(q) > 1 !== opts.averaged) return false;
      return Math.abs(t.net_sales / q - point.price) <= 0.011;
    })
    .sort((a, b) => b.sale_date.localeCompare(a.sale_date));

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
/**
 * How much a price needs behind it before it can be called the best.
 *
 * "Moves fastest" ranks by units a day while a price was live, and a price
 * seen on one busy day wins that against a price that sold all week: COKE
 * 6PK's $3.34 was 26 sales on one day, Ground Beef's $11.94 was 11 packs on
 * one (dev board review, finding B). A price has to have been rung on at least
 * this many days, on at least this many receipts, to be a candidate.
 *
 * Starting values, picked rather than measured: three days is under half a
 * week, so a price on the shelf all week qualifies easily and a one-day spike
 * can't. Tune them against real stores.
 */
export const MIN_SUGGESTION_DAYS = 3;
export const MIN_SUGGESTION_RECEIPTS = 5;

const hasEvidence = (p: ActualPricePoint) =>
  p.daysSeen >= MIN_SUGGESTION_DAYS && p.trans >= MIN_SUGGESTION_RECEIPTS;

/**
 * Why there is no suggestion, when the item rang at several prices but none
 * had enough history. Null when there is a suggestion, or when there was only
 * ever one price, which needs no explaining.
 */
export const suggestionWithheld = (actual: ActualPricePoints) =>
  actual.exact.length >= 2 && actual.exact.filter(hasEvidence).length < 2
    ? `Not enough history to suggest a price: a price needs ${MIN_SUGGESTION_DAYS} days and ${MIN_SUGGESTION_RECEIPTS} receipts behind it, and fewer than two do.`
    : null;

export const suggestPrice = (
  actual: ActualPricePoints,
): PriceSuggestion | null => {
  const points = actual.exact;
  // One price is not a comparison, and inventing one would be noise.
  if (points.length < 2) return null;
  // The candidates must each have stood for a while; see MIN_SUGGESTION_DAYS.
  const eligible = points.filter(hasEvidence);
  if (eligible.length < 2) return null;

  const ranked = points.map(perf);
  const best = eligible
    .map(perf)
    .reduce((a, b) => (b.velocity > a.velocity ? b : a));

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
