// Utils
import { rowPricedUnits as pricedUnits } from "../../../../utils/pricedUnits";

// Interfaces
import type { SubsPricePoint, SubDeptMargin } from "../../../../interfaces";
import type { ReceiptLine } from "./index";
import type { CostStep, CostHistory, PriceRead } from "../interfaces";

/**
 * The arithmetic behind Item Actions.
 *
 * The page carries no severity of its own. By the time a UPC reaches this list
 * it has already been called critical upstream; re-deciding that would answer a
 * question the user already answered and still not say why. Everything here
 * exists to turn each item into one call to action with the evidence for it.
 *
 * Two things shape the whole file:
 *
 *   Receipt date is the first branch. An item with no recent delivery and an
 *   item that was delivered and still isn't moving look identical in sales data
 *   — one is a stocking problem and one is a demand problem, they belong to
 *   different people, and nothing else can tell them apart.
 *
 *   Receipts describe the items on the list, and only those. An item that was
 *   delivered and never scanned produces no sales row anywhere, so it cannot
 *   reach this page at all — the sheet used to discover those from the receipt
 *   side, which is gone: the codes it took to find them had to travel as the
 *   `receivers/item_search` request body, five figures of them on a full store.
 */


/** A price has to hold this long before it counts as a period worth comparing.
 *  One day at an odd price is a markdown or a keying error. */
export const MIN_ERA_DAYS = 2;

/** Sales movement inside this band is noise on a low-volume item, not a trend. */
export const FLAT_PCT = 10;

/** Cost movement inside this band is rounding or a mixed pallet. */
export const COST_MOVE_FLOOR = 2;

/**
 * When cost movement is the vendor's problem rather than the shelf's.
 *
 * These replace a single rule — three receipts and a ten-cent spread — that was
 * wrong twice over. It counted *receipts*, not cost *changes*, so three
 * deliveries carrying one price rise looked like three; and ten cents is
 * absolute, which is 7% of a $1.43 soda and 0.5% of a $20 case. Between them
 * they swept up most of the list, which is why "call the vendor" stopped
 * meaning anything.
 *
 * Cost drifting upward is the economy. These are the shapes that are worth a
 * phone call, and each fires its own sentence so the row says which one it is.
 */

/** Changes, not cost points — four costs is three changes. Steps smaller than
 *  `COST_MOVE_FLOOR` are rounding and don't count toward it. */
export const COST_CHANGES_FLAG = 3;

/** One delivery moving this far up is worth asking about on its own, however
 *  steady the rest of the history looks. */
export const COST_STEP_UP_PCT = 5;

/** Where the whole lookback lands, first receipt to last. Small rises that all
 *  run the same way reach a number no single step reveals. */
export const COST_CUMULATIVE_PCT = 10;

/** Direction flips. Up-and-down is a different complaint from a trend: it makes
 *  invoice checking, promo planning and ordering unreliable even when the cost
 *  ends up where it started. */
export const COST_REVERSALS_FLAG = 2;

/**
 * The span stock movement is measured over.
 *
 * It has to be a window where **both** sides are complete. Deliveries reach back
 * 90 days and sales cover the report window, so subtracting one from the other
 * across their own spans would credit every item with three months of receipts
 * against one week of sales — a few hundred phantom units on everything in the
 * store.
 *
 * Fourteen days is the most we can honestly claim and it costs nothing: the LW
 * rows are already fetched for the baseline columns, they just aren't displayed.
 * A shorter picked window narrows this automatically, because the span is
 * clamped to the sales actually in hand.
 */
export const MOVEMENT_DAYS = 14;

export const round2 = (n: number) => Math.round(n * 100) / 100;
export const round1 = (n: number) => Math.round(n * 10) / 10;
const DAY_MS = 86400000;

/** Whole days since a date, or null when there's nothing to measure from.
 *  Parsed at noon so a timezone west of the server can't push a receipt back a
 *  day and turn "today" into "yesterday". */
export const daysSince = (date: string): number | null => {
  const t = new Date(`${date.split("T")[0]}T12:00:00`).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / DAY_MS));
};

export const pctMove = (from: number, to: number) =>
  from === 0 ? null : ((to - from) / from) * 100;

export const money = (n: number) => `$${n.toFixed(2)}`;

/**
 * Reads a cost history forwards.
 *
 * Receipts arrive newest-first because that is how every list on the page reads
 * them, but cost is a story told in the order it happened, so this reverses
 * once at the top rather than indexing backwards.
 *
 * Dates are carried alongside the costs so each finding can say *when*. A
 * 90-day window will always hold old events, and "cost jumped 35%" reads as
 * news until it is dated.
 *
 * Returns null below two priced receipts: one cost is not a history, and a
 * verdict drawn from it would be a guess wearing a number.
 */
export const costHistory = (receipts: ReceiptLine[]): CostHistory | null => {
  const series = receipts
    .filter((r) => r.unitCost > 0)
    .map((r) => ({ cost: r.unitCost, date: r.date.slice(0, 10) }))
    .reverse();
  if (series.length < 2) return null;

  const steps: CostStep[] = [];
  let reversals = 0;
  let lastDir = 0;
  for (let i = 1; i < series.length; i++) {
    const pct = pctMove(series[i - 1].cost, series[i].cost);
    // Mixed pallets and rounding are not cost changes, and counting them is
    // how a stable item ends up looking erratic.
    if (pct === null || Math.abs(pct) <= COST_MOVE_FLOOR) continue;
    steps.push({
      from: series[i - 1].cost,
      to: series[i].cost,
      pct,
      date: series[i].date,
      index: i,
    });
    const dir = pct > 0 ? 1 : -1;
    if (lastDir !== 0 && dir !== lastDir) reversals++;
    lastDir = dir;
  }

  // Standing means nothing after it brought the cost back to where it started.
  const standingStepUp =
    steps
      .filter((step) => step.pct > 0)
      .filter((step) =>
        series
          .slice(step.index)
          .every((p) => p.cost > step.from * (1 + COST_MOVE_FLOOR / 100)),
      )
      .sort((a, b) => b.pct - a.pct)[0] ?? null;

  const costs = series.map((p) => p.cost);
  return {
    first: series[0].cost,
    last: series[series.length - 1].cost,
    firstDate: series[0].date,
    low: Math.min(...costs),
    high: Math.max(...costs),
    changes: steps.length,
    firstChangeDate: steps[0]?.date ?? null,
    lastChangeDate: steps[steps.length - 1]?.date ?? null,
    standingStepUp,
    cumulative: pctMove(series[0].cost, series[series.length - 1].cost) ?? 0,
    reversals,
  };
};

/**
 * The row's price type, normalised.
 *
 * `String()` rather than a bare `??`: the field is typed as a string but does
 * not always arrive as one — some rows carry a numeric code, and calling
 * `.trim()` on that threw and took the whole report down.
 */
const priceTypeOf = (r: SubDeptMargin) =>
  String(r.price_type ?? "")
    .trim()
    .toUpperCase();

/** The base shelf price. */
const isRegular = (r: SubDeptMargin) => priceTypeOf(r) === "REG";

/**
 * A promotional ring, and only when the row says so in a form we recognise.
 *
 * Deliberately not "anything that isn't REG". A numeric or blank price type
 * tells us nothing, and reading it as a promotion would let the page announce
 * "on sale since 08/12" for an item that was never on sale. Unknown types count
 * as neither: they establish no regular price and support no promotion, which
 * leaves both claims unmade rather than guessed.
 *
 * Verified per-sale on real rows: Pepsi rang REG at $15.99 through 08/11 and
 * SALE at $9.99 from 08/12.
 */
const PROMO_TYPES = new Set(["TPR", "SALE", "AD", "ADS", "PROMO"]);

const isPromo = (r: SubDeptMargin) => PROMO_TYPES.has(priceTypeOf(r));

/**
 * What the item has been selling at, and under what kind of price.
 *
 * Prices come from `total_sales - total_tax`, never `net_sales`. Verified on a
 * real row: three units at $5.99 returned `total_sales 17.97`, `total_tax 0`,
 * `net_sales 16.97` — the missing dollar a coupon. Net is money received; this
 * is what the shelf asked, which is what a pricing decision acts on.
 *
 * A day is reported as an exact price when its money divides into a whole
 * number of cents, and as an average when it doesn't. Row counting was tried
 * first and is not enough: Coke Classic's 08/13 row is a single row of 182
 * units for $596.24 — $3.2760 each, which nobody can pay. A real price times a
 * unit count lands on a whole cent; a multi-buy or a mixed day does not.
 *
 * The promotional run walks back from the most recent day while the days stay
 * promotional, stopping at the first regular one. Pepsi stops at 08/11, giving
 * a two-day run of 53 units — which is what makes "on sale since 08/12" and the
 * money given away sayable.
 */
/** The price charged on a day, when exactly one point ran that day. Null when
 *  none did or when several did, which is the caller's cue to fall back. */
const priceOnDay = (points: SubsPricePoint[], day: string): number | null => {
  const on = points.filter((pp) => pp.days_sold?.includes(day));
  return on.length === 1 ? on[0].price : null;
};

export const readPrices = (
  rows: SubDeptMargin[],
  points: SubsPricePoint[] = [],
): PriceRead | null => {
  /** One entry per day: money, units, and whether any of it was promotional. */
  const days = new Map<
    string,
    { revenue: number; units: number; promo: boolean }
  >();
  let highestPrice = 0;
  let shelfPrice: number | null = null;
  let shelfDay = "";
  let regularPrice: number | null = null;
  let regularDay = "";
  let firstRegularPrice: number | null = null;
  let firstRegularDay = "";

  /** Money off, by day. Held apart from `days` so a discount row can never
   *  create a day with revenue and no units to divide it by. */
  const discounts = new Map<string, number>();

  for (const r of rows) {
    const u = pricedUnits(r);
    const day = r.sale_date.slice(0, 10);
    const revenue = r.total_sales - r.total_tax;

    // A discount line: qty 0, money negative, same product_code as the item.
    if (u <= 0) {
      if (revenue < 0) discounts.set(day, (discounts.get(day) ?? 0) + revenue);
      continue;
    }

    const entry = days.get(day) ?? { revenue: 0, units: 0, promo: false };
    entry.revenue += revenue;
    entry.units += u;
    if (isPromo(r)) entry.promo = true;
    days.set(day, entry);

    const rowPrice = revenue / u;
    if (rowPrice > highestPrice) highestPrice = rowPrice;

    // Latest wins, same rule as the regular ring below — a price file that
    // changed mid-window should report where it ended up.
    const posted = r.ring_price ?? 0;
    if (posted > 0 && day >= shelfDay) {
      shelfDay = day;
      shelfPrice = round2(posted);
    }
    // Latest regular ring wins, so a price change is picked up rather than the
    // first one seen.
    //
    // The price comes from the point that ran on that day when exactly one did
    // — a real charged price rather than the day's average. A day carrying two
    // points is genuinely ambiguous without a price type on the point, so it
    // keeps the row arithmetic rather than guessing which of the two was the
    // shelf price.
    if (isRegular(r)) {
      const exact = priceOnDay(points, day);
      if (day >= regularDay) {
        regularDay = day;
        regularPrice = round2(exact ?? rowPrice);
      }
      if (firstRegularDay === "" || day < firstRegularDay) {
        firstRegularDay = day;
        firstRegularPrice = round2(exact ?? rowPrice);
      }
    }
  }
  if (days.size === 0) return null;

  const ordered = [...days.keys()].sort();
  const latest = ordered[ordered.length - 1];
  const today = days.get(latest)!;

  // Walk back while the days stay promotional.
  let saleStart = latest;
  let saleUnits = 0;
  let saleRevenue = 0;
  let saleDays = 0;
  let saleDiscount = 0;
  if (today.promo) {
    for (let i = ordered.length - 1; i >= 0; i--) {
      const d = days.get(ordered[i])!;
      if (!d.promo) break;
      saleStart = ordered[i];
      saleUnits += d.units;
      saleRevenue += d.revenue;
      saleDiscount += discounts.get(ordered[i]) ?? 0;
      saleDays += 1;
    }
  }

  // Tolerance rather than equality: 37.98 / 6 lands a fraction of a cent off
  // 6.33 in floating point before rounding.
  const cents = (today.revenue / today.units) * 100;

  /**
   * What it last rang at, and whether that day carried more than one price.
   *
   * The points answer both exactly. Dividing the day's revenue by its units
   * only ever produced the average of the prices on it, and `blended` had to
   * be inferred from whether that average landed on a whole cent — which a
   * genuine $3.335 average defeats and a $2.99/$3.99 pair can accidentally
   * satisfy. Counting the points that actually sold on the latest day is the
   * question itself rather than a proxy for it.
   */
  const onLatest = points.filter((pp) => pp.days_sold?.includes(latest));
  return {
    shelfPrice,
    price:
      onLatest.length === 1
        ? round2(onLatest[0].price)
        : round2(today.revenue / today.units),
    date: latest,
    units: round1(today.units),
    blended:
      onLatest.length > 0
        ? onLatest.length > 1
        : Math.abs(cents - Math.round(cents)) >= 1e-4,
    onSale: today.promo,
    saleStart,
    saleDays,
    saleUnits: round1(saleUnits),
    saleRevenue: round2(saleRevenue),
    saleDiscount: round2(saleDiscount),
    regularPrice,
    firstRegularPrice,
    promoDays: new Set(
      [...days.entries()].filter(([, d]) => d.promo).map(([day]) => day),
    ),
    // The dearest price actually charged, not the dearest daily average. A day
    // that blended $6.99 and $3.99 used to report $5.49 as the highest price
    // seen, and "Highest price seen" is quoted verbatim in reprice evidence.
    highestPrice: round2(
      points.length > 0
        ? points.reduce((m, pp) => Math.max(m, pp.price), 0)
        : highestPrice,
    ),
  };
};

/** Midnight UTC of a yyyy-mm-dd, for whole-day differences with no timezone
 *  to slip a day on. */
export const utcDay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

/** mm/dd from a yyyy-mm-dd. Enough to place an event without spending the width
 *  a full date costs inside a sentence. */
export const shortDate = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${m}/${d}`;
};

/** Inclusive day count between two yyyy-mm-dd dates. */
export const daySpan = (start: string, end: string) =>
  Math.max(
    1,
    Math.round(
      (new Date(`${end}T12:00:00`).getTime() -
        new Date(`${start}T12:00:00`).getTime()) /
        DAY_MS,
    ) + 1,
  );

/* ------------------------------------------------------------------- items */
