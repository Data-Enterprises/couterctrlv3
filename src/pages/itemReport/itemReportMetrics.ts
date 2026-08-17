import { calculateCogs } from "../subDepts";
import { shiftIso } from "../../utils/grading";
import { pricedUnits } from "../inventory/inventoryData";
import { estimatedPricePoints } from "../inventory/pricePoints";
import type { EstimatedPricePoint } from "../inventory/pricePoints";
import type { ReceiptLine } from "./itemReportData";
import { normalizeProductCode } from "../../utils/productCode";
import type { SubDeptMargin } from "../../interfaces";

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
 *   Receipts are an entry point, not a lookup. An item that was delivered and
 *   never scanned produces no sales row anywhere, so it can't reach this page
 *   through the upload — Sub Dept Margins and Vendors both build their lists
 *   from this-year sales. Those items are found on the receipt side and marked
 *   `discovered`, and they are usually the most actionable rows in the report.
 */

/** A price has to hold this long before it counts as a period worth comparing.
 *  One day at an odd price is a markdown or a keying error. */
const MIN_ERA_DAYS = 2;

/** Sales movement inside this band is noise on a low-volume item, not a trend. */
const FLAT_PCT = 10;

/** Cost movement inside this band is rounding or a mixed pallet. */
const COST_MOVE_FLOOR = 2;

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
const COST_CHANGES_FLAG = 3;

/** One delivery moving this far up is worth asking about on its own, however
 *  steady the rest of the history looks. */
const COST_STEP_UP_PCT = 5;

/** Where the whole lookback lands, first receipt to last. Small rises that all
 *  run the same way reach a number no single step reveals. */
const COST_CUMULATIVE_PCT = 10;

/** Direction flips. Up-and-down is a different complaint from a trend: it makes
 *  invoice checking, promo planning and ordering unreliable even when the cost
 *  ends up where it started. */
const COST_REVERSALS_FLAG = 2;

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
const MOVEMENT_DAYS = 14;

const round2 = (n: number) => Math.round(n * 100) / 100;
const round1 = (n: number) => Math.round(n * 10) / 10;
const DAY_MS = 86400000;

/** Whole days since a date, or null when there's nothing to measure from.
 *  Parsed at noon so a timezone west of the server can't push a receipt back a
 *  day and turn "today" into "yesterday". */
export const daysSince = (date: string): number | null => {
  const t = new Date(`${date.split("T")[0]}T12:00:00`).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / DAY_MS));
};

const pctMove = (from: number, to: number) =>
  from === 0 ? null : ((to - from) / from) * 100;

const money = (n: number) => `$${n.toFixed(2)}`;

/** What the cost did across the lookback, in the four shapes worth a call. */
/** One significant move between consecutive receipts. */
interface CostStep {
  from: number;
  to: number;
  pct: number;
  /** The receipt that carried the new cost. */
  date: string;
  /** Position in the series, so a later reversal can be looked for. */
  index: number;
}

interface CostHistory {
  first: number;
  last: number;
  firstDate: string;
  low: number;
  high: number;
  /** Steps that moved more than the rounding floor. Four cost points is three
   *  changes — the distinction the old rule missed by counting receipts. */
  changes: number;
  firstChangeDate: string | null;
  lastChangeDate: string | null;
  /**
   * The largest rise that is *still in force*.
   *
   * A rise the cost later came back down from is a bounce, not an increase, and
   * `reversals` is the trigger built for that shape. Without this, an item that
   * went $3.63 → $4.90 → $3.63 in June and has been billed $3.63 across ten
   * deliveries since was told to call the vendor about a 35% jump it is no
   * longer paying.
   */
  standingStepUp: CostStep | null;
  /** First receipt to last, as a percentage. */
  cumulative: number;
  /** How often the direction flipped between significant steps. */
  reversals: number;
}

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
const costHistory = (receipts: ReceiptLine[]): CostHistory | null => {
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

/** How the item has been selling: what it last rang at, and whether that was a
 *  promotion or the shelf price. */
interface PriceRead {
  /** The most recent day it sold, and what came in per unit that day. */
  price: number;
  date: string;
  units: number;
  /** True when `price` is an average rather than a figure the register rang. */
  blended: boolean;
  /** True when the most recent day rang on a promotional price type. */
  onSale: boolean;
  /** The current promotional run — first day, length, volume and money. Only
   *  meaningful when `onSale`. */
  saleStart: string;
  saleDays: number;
  saleUnits: number;
  saleRevenue: number;
  /** The last regular ring in the window, if there was one. */
  regularPrice: number | null;
  /** The first regular ring, so shelf-price movement can be measured without
   *  promotional days dragging it. */
  firstRegularPrice: number | null;
  /** Every day that carried a promotional ring. Lets a comparison skip the
   *  stretch where a promotion was running. */
  promoDays: Set<string>;
  /** The dearest price seen. A last-resort stand-in for the regular price when
   *  nothing rang REG and the invoice carries no intended retail. */
  highestPrice: number;
}

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
const readPrices = (rows: SubDeptMargin[]): PriceRead | null => {
  /** One entry per day: money, units, and whether any of it was promotional. */
  const days = new Map<
    string,
    { revenue: number; units: number; promo: boolean }
  >();
  let highestPrice = 0;
  let regularPrice: number | null = null;
  let regularDay = "";
  let firstRegularPrice: number | null = null;
  let firstRegularDay = "";

  for (const r of rows) {
    const u = pricedUnits(r);
    if (u <= 0) continue;
    const day = r.sale_date.slice(0, 10);
    const revenue = r.total_sales - r.total_tax;

    const entry = days.get(day) ?? { revenue: 0, units: 0, promo: false };
    entry.revenue += revenue;
    entry.units += u;
    if (isPromo(r)) entry.promo = true;
    days.set(day, entry);

    const rowPrice = revenue / u;
    if (rowPrice > highestPrice) highestPrice = rowPrice;
    // Latest regular ring wins, so a price change is picked up rather than the
    // first one seen.
    if (isRegular(r)) {
      if (day >= regularDay) {
        regularDay = day;
        regularPrice = round2(rowPrice);
      }
      if (firstRegularDay === "" || day < firstRegularDay) {
        firstRegularDay = day;
        firstRegularPrice = round2(rowPrice);
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
  if (today.promo) {
    for (let i = ordered.length - 1; i >= 0; i--) {
      const d = days.get(ordered[i])!;
      if (!d.promo) break;
      saleStart = ordered[i];
      saleUnits += d.units;
      saleRevenue += d.revenue;
      saleDays += 1;
    }
  }

  // Tolerance rather than equality: 37.98 / 6 lands a fraction of a cent off
  // 6.33 in floating point before rounding.
  const cents = (today.revenue / today.units) * 100;

  return {
    price: round2(today.revenue / today.units),
    date: latest,
    units: round1(today.units),
    blended: Math.abs(cents - Math.round(cents)) >= 1e-4,
    onSale: today.promo,
    saleStart,
    saleDays,
    saleUnits: round1(saleUnits),
    saleRevenue: round2(saleRevenue),
    regularPrice,
    firstRegularPrice,
    promoDays: new Set(
      [...days.entries()].filter(([, d]) => d.promo).map(([day]) => day),
    ),
    highestPrice: round2(highestPrice),
  };
};

/** mm/dd from a yyyy-mm-dd. Enough to place an event without spending the width
 *  a full date costs inside a sentence. */
const shortDate = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${m}/${d}`;
};

/** Inclusive day count between two yyyy-mm-dd dates. */
const daySpan = (start: string, end: string) =>
  Math.max(
    1,
    Math.round(
      (new Date(`${end}T12:00:00`).getTime() -
        new Date(`${start}T12:00:00`).getTime()) /
        DAY_MS,
    ) + 1,
  );

/* ------------------------------------------------------------------- items */

/** One day of one item: what it sold, and what it was selling at. */
export interface DayPoint {
  date: string;
  units: number;
  netSales: number;
  price: number;
  cogs: number;
}

/** One period's totals. Null anywhere means the item did not sell in that
 *  period, which is not the same as selling zero. */
export interface PeriodTotals {
  sales: number;
  units: number;
}

export type ActionKind =
  | "investigate"
  | "reorder"
  | "reprice"
  | "vendor"
  /**
   * Sells, but nothing on file says it ever arrived.
   *
   * Split out of "vendor". That action was covering two unrelated situations —
   * an unstable cost, which is a conversation with the vendor, and a missing
   * receiving trail, which usually is not their fault at all. Orders received
   * electronically never reach the scan our data is built from, so the item can
   * be arriving perfectly well and still look absent here. Telling a manager to
   * phone a vendor about that is a wrong steer, and wrong steers are what a
   * suggestion tool cannot afford.
   *
   * What is actually worth doing is finding out how the item arrives. The list
   * already hints at it — these are the rows whose Last column reads "none".
   */
  | "receiving"
  | "none"
  | "insufficient"
  /**
   * Not a verdict — the absence of one, while the delivery read is still
   * running.
   *
   * Every action here depends on receipts, so none can be reached until the
   * walk finishes. This used to report as "Insufficient", which is a real
   * finding meaning "the data will never answer this" — so a whole store would
   * briefly sit in a category that reads like a conclusion, and looks like a
   * broken page to anyone who doesn't know a fetch is in flight. Separating the
   * two lets the sheet say "still reading" and mean it.
   */
  | "pending";

/**
 * Stock movement over a window where receipts and sales are both known.
 *
 * Not an inventory level — nothing in the API reports one, and there is no
 * opening balance to start from. This is the *change*: what came in against
 * what went out. An item can show +40 and still have an empty shelf if the
 * opening position was −40, which is why nothing here is labelled "on hand".
 *
 * It is also blind to shrink, damage, theft, transfers and markdowns to zero,
 * all of which leave through the back door without a sales row. Net movement
 * therefore reads high rather than low when something is going missing.
 */
export interface StockMovement {
  /** Days actually covered — the movement window clamped to the sales in hand. */
  days: number;
  start: string;
  received: number;
  sold: number;
  /** Received less sold. Positive means the shelf filled over the window. */
  net: number;
  /** How many deliveries landed inside the span. Drives which of the two stock
   *  blocks the rail shows: at exactly one, this block is a contaminated copy
   *  of "since last delivery" — its `sold` counts days *before* that delivery
   *  arrived, charging pre-delivery sales against it — so the anchored block
   *  replaces it. At two or more the two answer different questions and both
   *  are shown. */
  deliveries: number;
}

/** What is left of the most recent delivery. Sharper than net movement because
 *  it is anchored to one event rather than a span, so there is no opening
 *  balance to be ignorant of — but only answerable when that delivery landed
 *  inside the days we hold sales for. */
export interface SinceDelivery {
  date: string;
  received: number;
  sold: number;
  left: number;
}

export interface ReportItem {
  productCode: string;
  description: string;
  department: string;
  vendorName: string;
  /** Found on the receipt side rather than in the upload — delivered but never
   *  scanned, so no sales row for it exists anywhere. */
  discovered: boolean;

  ty: PeriodTotals;
  lw: PeriodTotals | null;
  ly: PeriodTotals | null;
  /**
   * Percent change in **units**, not dollars. Null when the baseline period
   * sold none.
   *
   * Dollars conflate the two causes this page exists to separate: sales down
   * 30% is either fewer units or a lower price, while units down 30% can only
   * mean the item physically moved less. Everything else on the row — received,
   * net, unaccounted — is already in units, so this keeps one basis across the
   * whole comparison. Sales are still carried on `ty`/`lw`/`ly` for weighting
   * and for the export.
   */
  lwPct: number | null;
  lyPct: number | null;

  /** Blended cost per priced unit. Falls back to the latest receipt when the
   *  item has no sales rows to derive one from. */
  unitCost: number | null;
  marginPct: number | null;
  /** Days in the window it sold at all. */
  daysSold: number;
  series: DayPoint[];
  estimated: EstimatedPricePoint[];
  movement: StockMovement | null;
  sinceDelivery: SinceDelivery | null;
  rows: SubDeptMargin[];
}

const totalsOf = (rows: SubDeptMargin[]): PeriodTotals => ({
  sales: rows.reduce((s, r) => s + r.net_sales, 0),
  units: rows.reduce((s, r) => s + pricedUnits(r), 0),
});

const byCode = (rows: SubDeptMargin[]) => {
  const map = new Map<string, SubDeptMargin[]>();
  for (const r of rows) {
    const code = normalizeProductCode(r.product_code);
    const found = map.get(code);
    if (found) found.push(r);
    else map.set(code, [r]);
  }
  return map;
};

/**
 * Every row the report will show.
 *
 * The item set is the union of three sources, and the third is the point of the
 * whole rebuild:
 *
 *   the uploaded UPCs that sold this window,
 *   the uploaded UPCs that didn't (they still get a row — zero is a finding),
 *   and items that were received but never scanned, which the upload could not
 *   have contained.
 *
 * Discovery is bounded: an item only joins on the receipt side if it sold in
 * last week or last year, which both gives it a baseline to be judged against
 * and supplies the department that receipts don't carry. An item that has never
 * sold in any of the three windows has no signal to report and is left out
 * rather than padding the sheet with unknowns.
 */
export const buildReport = (
  upcs: string[],
  tyRows: SubDeptMargin[],
  lwRows: SubDeptMargin[],
  lyRows: SubDeptMargin[],
  /** Plain object rather than a Map: this comes straight out of Redux, and
   *  state has to stay serializable. Every consumer indexes by product code,
   *  which an object does just as well. */
  receiptsByUpc: Record<string, ReceiptLine[]>,
  windowStart: string,
  windowEnd: string,
): ReportItem[] => {
  // The movement span, clamped to the sales we hold. LW covers the days before
  // the picked window, so the pair reaches back a fortnight — but only the part
  // of it that both sides can account for is used.
  const movementStart = (() => {
    const wanted = shiftIso(windowEnd, -(MOVEMENT_DAYS - 1));
    const lwFloor = shiftIso(windowStart, -7);
    return wanted > lwFloor ? wanted : lwFloor;
  })();
  const tyBy = byCode(tyRows);
  const lwBy = byCode(lwRows);
  const lyBy = byCode(lyRows);

  // Both populations are built; the sheet's scope toggle picks between them, so
  // switching costs a filter rather than a rebuild.
  //
  // Discovery is bounded twice over: the code has to appear on a receipt, and it
  // has to have sold in one of the prior periods — which is also what names the
  // department a receipt line can't. An item already selling this week is left
  // out because it wasn't flagged and isn't the question.
  const uploaded = new Set(upcs);
  const wanted = new Set(uploaded);
  for (const code of Object.keys(receiptsByUpc)) {
    if (wanted.has(code)) continue;
    if (tyBy.has(code)) continue;
    if (lwBy.has(code) || lyBy.has(code)) wanted.add(code);
  }

  const items: ReportItem[] = [];
  for (const code of wanted) {
    const ty = tyBy.get(code) ?? [];
    const lw = lwBy.get(code) ?? [];
    const ly = lyBy.get(code) ?? [];
    const receipts = receiptsByUpc[code] ?? [];
    if (ty.length === 0 && lw.length === 0 && ly.length === 0) continue;

    const identity = ty[0] ?? lw[0] ?? ly[0];

    const dayMap = new Map<string, DayPoint>();
    for (const r of ty) {
      const date = r.sale_date.slice(0, 10);
      const units = pricedUnits(r);
      const cogs = calculateCogs(
        r.net_cost,
        r.cost,
        r.case_size,
        r.qty,
        r.weight,
      );
      const found = dayMap.get(date);
      if (found) {
        found.units += units;
        found.netSales += r.net_sales;
        found.cogs += cogs;
      } else {
        dayMap.set(date, {
          date,
          units,
          netSales: r.net_sales,
          price: 0,
          cogs,
        });
      }
    }
    const series = [...dayMap.values()]
      .map((d) => ({
        ...d,
        price: d.units > 0 ? round2(d.netSales / d.units) : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const tyTotals = totalsOf(ty);
    const lwTotals = lw.length > 0 ? totalsOf(lw) : null;
    const lyTotals = ly.length > 0 ? totalsOf(ly) : null;
    const cogs = series.reduce((s, d) => s + d.cogs, 0);

    // Sales across the movement span. LW rows are taken only from before the
    // picked window — a window that isn't exactly seven days makes the two
    // fetches overlap, and adding both sets would count the shared day twice.
    const movementSales = [
      ...ty,
      ...lw.filter((r) => r.sale_date.slice(0, 10) < windowStart),
    ].filter((r) => r.sale_date.slice(0, 10) >= movementStart);

    const soldInSpan = movementSales.reduce((s, r) => s + pricedUnits(r), 0);
    const inSpan = receipts.filter((r) => r.date.slice(0, 10) >= movementStart);
    const receivedInSpan = inSpan.reduce((s, r) => s + r.sellingUnits, 0);
    const movement: StockMovement | null =
      movementSales.length > 0 || receivedInSpan > 0
        ? {
            days: daySpan(movementStart, windowEnd),
            start: movementStart,
            received: round1(receivedInSpan),
            sold: round1(soldInSpan),
            net: round1(receivedInSpan - soldInSpan),
            deliveries: inSpan.length,
          }
        : null;

    // Anchored to the last delivery rather than a span, so it needs no opening
    // balance — but only when that delivery is inside the days we hold sales
    // for, otherwise the sales between it and the span are missing and the
    // subtraction would invent a shortfall.
    const last = receipts[0] ?? null;
    const lastDate = last ? last.date.slice(0, 10) : null;
    const sinceDelivery: SinceDelivery | null =
      last && lastDate && lastDate >= movementStart
        ? (() => {
            const soldSince = movementSales
              .filter((r) => r.sale_date.slice(0, 10) >= lastDate)
              .reduce((s, r) => s + pricedUnits(r), 0);
            return {
              date: last.date,
              received: round1(last.sellingUnits),
              sold: round1(soldSince),
              left: round1(last.sellingUnits - soldSince),
            };
          })()
        : null;

    items.push({
      productCode: code,
      description: identity.product_description,
      department: identity.sub_department_description,
      vendorName:
        identity.vendor_name || receipts[0]?.vendorName || "No vendor",
      discovered: !uploaded.has(code),
      ty: tyTotals,
      lw: lwTotals,
      ly: lyTotals,
      lwPct: lwTotals ? pctMove(lwTotals.units, tyTotals.units) : null,
      lyPct: lyTotals ? pctMove(lyTotals.units, tyTotals.units) : null,
      unitCost:
        tyTotals.units > 0
          ? cogs / tyTotals.units
          : (receipts[0]?.unitCost ?? null),
      marginPct:
        tyTotals.sales > 0
          ? ((tyTotals.sales - cogs) / tyTotals.sales) * 100
          : null,
      daysSold: series.length,
      series,
      estimated: estimatedPricePoints(ty),
      movement,
      sinceDelivery,
      rows: ty,
    });
  }

  return items;
};

/* -------------------------------------------------------------- price eras */

/** A stretch of consecutive selling days at one price. "Did the price change
 *  and did demand follow" can't be read off a total — one price may have run
 *  three weeks and the other three days. */
export interface PriceEra {
  price: number;
  start: string;
  end: string;
  days: number;
  units: number;
  unitsPerDay: number;
  unitCost: number | null;
  marginPct: number | null;
}

const costOn = (date: string, receipts: ReceiptLine[]): number | null => {
  for (const r of receipts) {
    if (r.date.slice(0, 10) <= date && r.unitCost > 0) return r.unitCost;
  }
  return null;
};

export const buildPriceEras = (
  item: ReportItem,
  receipts: ReceiptLine[],
): PriceEra[] => {
  const eras: PriceEra[] = [];
  for (const day of item.series) {
    const last = eras[eras.length - 1];
    if (last && last.price === day.price) {
      last.end = day.date;
      last.days += 1;
      last.units += day.units;
    } else {
      eras.push({
        price: day.price,
        start: day.date,
        end: day.date,
        days: 1,
        units: day.units,
        unitsPerDay: 0,
        unitCost: null,
        marginPct: null,
      });
    }
  }
  return eras.map((e) => {
    const unitCost = costOn(e.start, receipts) ?? item.unitCost;
    return {
      ...e,
      unitsPerDay: e.days > 0 ? round1(e.units / e.days) : 0,
      unitCost,
      marginPct:
        unitCost === null || e.price <= 0
          ? null
          : round1(((e.price - unitCost) / e.price) * 100),
    };
  });
};

export const comparableEras = (
  eras: PriceEra[],
): { prior: PriceEra; current: PriceEra } | null => {
  const held = eras.filter((e) => e.days >= MIN_ERA_DAYS);
  if (held.length < 2) return null;
  return { prior: held[held.length - 2], current: held[held.length - 1] };
};

/* ---------------------------------------------------------------- actions */

export interface Verdict {
  action: ActionKind;
  /** The sentence shown on the row. Leads with the stock-or-demand split,
   *  because that decides who owns the problem. */
  evidence: string;
  /** Units delivered on the last receipt that the window can't account for.
   *  Only computed when that receipt falls inside the sales window, since
   *  otherwise the sales before it aren't in hand. */
  unaccounted: number | null;
}

export const ACTION_LABEL: Record<ActionKind, string> = {
  pending: "Reading…",
  investigate: "Investigate",
  reorder: "Reorder",
  reprice: "Reprice",
  vendor: "Call vendor",
  receiving: "Check receiving",
  none: "No action",
  insufficient: "Insufficient",
};

/** Worst first. Not a severity scale — an ordering of how much each action
 *  costs the store to leave alone. */
export const ACTION_RANK: Record<ActionKind, number> = {
  investigate: 0,
  reorder: 1,
  reprice: 2,
  vendor: 3,
  receiving: 4,
  insufficient: 5,
  none: 6,
  /** Last, so that once the walk finishes and rows resolve, nothing that has
   *  an answer is ever sorted below something that doesn't. */
  pending: 7,
};

/**
 * One item's call to action, and the sentence backing it.
 *
 * Receipt date branches first. Everything under "no recent delivery" is an
 * operational problem — the item probably isn't on the shelf, and no amount of
 * pricing analysis applies to something a customer can't pick up. Everything
 * under "delivered and in stock" is a demand problem, and only there does price
 * against cost mean anything.
 *
 * The absence of data is a verdict of its own rather than a blank. An item with
 * no cost on file can't have its margin judged, and saying so is more use than
 * a confident number derived from nothing.
 */
export const verdictFor = (
  item: ReportItem,
  receipts: ReceiptLine[],
  eras: PriceEra[],
  windowDays: number,
  lookbackDays: number,
  receivingKnown: boolean,
  /** False when the store has no receiving on file at all — see the guard
   *  below for why that is a different question from this item having none. */
  receivingAvailable: boolean,
): Verdict => {
  const last = receipts[0] ?? null;
  const lastDays = last ? daysSince(last.date) : null;
  const unaccounted = item.sinceDelivery?.left ?? null;

  const sold = item.ty.units;
  const trend = item.lyPct ?? item.lwPct;
  /** A delivery is "recent" if it could plausibly still be on the shelf for the
   *  window being examined. */
  const recentDays = Math.max(windowDays, 14);
  const isRecent = lastDays !== null && lastDays <= recentDays;

  if (!receivingKnown) {
    return {
      action: "pending",
      evidence: "Waiting on the delivery read before drawing a conclusion.",
      unaccounted,
    };
  }

  /**
   * The store has no received orders on file — not this item, the store.
   * `receivers/` answered with `record_count: 0`.
   *
   * Everything below reads the delivery side, so without it every row in the
   * list reaches the same branch and the page hands back a hundred identical
   * "call the vendor, nothing received in 90 days" verdicts. Each one is
   * strictly true and none of them is about the item it sits on — the absence
   * is a fact about the store, and repeating it per row disguises that.
   *
   * So it is said once, plainly, and the rows stop pretending to a conclusion
   * they cannot reach. The banner above the list says the same thing.
   */
  if (!receivingAvailable) {
    return {
      action: "insufficient",
      evidence: `No received orders on file for this store in ${lookbackDays} days — nothing here can be checked against deliveries.`,
      unaccounted,
    };
  }

  /**
   * The price the item is currently ringing at.
   *
   * No minimum era length. A two-day floor lived here briefly, on the theory
   * that a single day was too thin to judge — but `price = net ÷ units` is
   * exact on one unit, not an average, so a short era is precise rather than
   * unreliable. It only suppressed true findings: an item selling one unit at
   * $6.49 against a $6.85 cost lost money on it, and the register confirms the
   * line.
   *
   * Averaging *can* distort a busy day — four units split across two prices
   * report a blend that never rang — but that is a property of the day, not of
   * how many days ran, and requiring two of them fixes none of it.
   */

  /**
   * The cost that rules today: the newest receiver.
   *
   * Not `currentEra.unitCost`, which is `costOn(era.start)` — whatever was
   * current when this price *opened*. A delivery landing mid-era leaves that
   * figure stale, and an item ringing $6.49 against a fresh $5.55 was reported
   * as "below cost at $6.49 against $6.85" from a receiver three weeks old. The
   * question this page asks is whether the price is wrong *now*, so the cost
   * has to be the one now.
   */
  const rulingCost = last && last.unitCost > 0 ? last.unitCost : null;

  /**
   * Margin as the shelf sees it: what it rings at now, against what the last
   * receiver cost.
   *
   * `item.marginPct` comes off the sales rows and is a blend across the window
   * — it reported -7.4% on an item ringing $6.38 against a $5.55 receiver,
   * which is +13%. Harmless when nothing else quoted a cost; wrong the moment
   * the sentence beside it names one.
   */
  /** What it last rang at, and whether that was a promotion. */
  const lastPrice = readPrices(item.rows);

  /**
   * The shelf price, best source first.
   *
   * A regular ring is the real thing. Failing that the last receiver's intended
   * retail, which is what the invoice expects the shelf to be — the only source
   * for an item that spent the whole window on promotion. Failing both, the
   * dearest price seen, which is a stand-in and not evidence.
   */
  const regularPrice =
    lastPrice?.regularPrice ??
    (last && last.retail > 0 ? last.retail : null) ??
    (lastPrice && lastPrice.highestPrice > 0 ? lastPrice.highestPrice : null);

  const regularSource =
    lastPrice?.regularPrice != null
      ? "Regular price"
      : last && last.retail > 0
        ? "Regular price per the last invoice"
        : "Highest price seen";

  const rulingMargin =
    lastPrice && rulingCost !== null && lastPrice.price > 0
      ? round1(((lastPrice.price - rulingCost) / lastPrice.price) * 100)
      : null;

  /** Dropped rather than printed as "n/a". An item that sold only on promotion
   *  has no regular price to compute a margin from, and a placeholder in the
   *  middle of a sentence reads as a broken figure rather than an absent one. */
  const marginClause =
    rulingMargin === null ? "" : `, margin ${rulingMargin.toFixed(1)}%`;

  const underCost =
    lastPrice !== null &&
    rulingCost !== null &&
    lastPrice.price > 0 &&
    lastPrice.price < rulingCost;

  /** The shelf tag itself is under cost — a permanent problem that taking the
   *  item off promotion would not fix, so it outranks an underwater promo. */
  const regularUnderCost =
    regularPrice !== null && rulingCost !== null && regularPrice < rulingCost;

  /**
   * Losing money per unit, said alongside a stocking verdict rather than
   * instead of it.
   *
   * The branches below return before the pricing checks ever run, so an item
   * that had not been delivered recently could never be flagged on price no
   * matter what it was ringing at — one sat in Reorder selling at $6.49 against
   * a $6.85 cost. The two findings are not alternatives: reordering something
   * that loses money on every unit just buys more of the loss, so the price
   * travels with the reorder and names the order to do them in.
   */
  const underCostFact =
    underCost && lastPrice
      ? ` Also below cost — ${lastPrice.blended ? `${lastPrice.units} units on ${shortDate(lastPrice.date)} averaged ${money(lastPrice.price)}` : `last sold at ${money(lastPrice.price)} on ${shortDate(lastPrice.date)}`} against ${money(rulingCost ?? 0)}${marginClause}.`
      : "";

  /**
   * The cost history, hoisted so a stocking verdict can carry it too.
   *
   * Same reasoning as the below-cost note: an item that needs reordering *and*
   * has a cost that will not hold still is one errand, not two. Telling someone
   * to restock without mentioning that the price may not be what they last paid
   * sends them into the order blind.
   */
  const hist = costHistory(receipts);
  const step = hist?.standingStepUp ?? null;
  const costReason = !hist
    ? null
    : hist.changes >= COST_CHANGES_FLAG
      ? `${hist.changes} cost changes between ${shortDate(hist.firstChangeDate!)} and ${shortDate(hist.lastChangeDate!)}, ${money(hist.low)} to ${money(hist.high)}`
      : step && step.pct >= COST_STEP_UP_PCT
        ? `Cost up ${round1(step.pct)}% on ${shortDate(step.date)}, ${money(step.from)} to ${money(step.to)}, and still there`
        : hist.cumulative >= COST_CUMULATIVE_PCT
          ? `Cost up ${round1(hist.cumulative)}% since ${shortDate(hist.firstDate)}, ${money(hist.first)} to ${money(hist.last)}`
          : hist.reversals >= COST_REVERSALS_FLAG
            ? `Cost moved up and down ${hist.reversals} times between ${money(hist.low)} and ${money(hist.high)}`
            : null;

  /**
   * At most one supplementary note, and money bleeding now outranks a
   * conversation about the next invoice.
   *
   * Stacking both onto a reorder produced a four-clause paragraph in a strip
   * meant to be read at a glance. One fact, chosen by urgency.
   */
  const extraNote = underCostFact
    ? `${underCostFact} Worth fixing the price before reordering.`
    : costReason
      ? ` ${costReason} — worth confirming with the vendor before you order.`
      : "";

  /* ── no recent delivery: a stocking problem ─────────────────────────── */

  if (!last) {
    if (sold > 0) {
      return {
        action: "receiving",
        evidence: `Sold ${round1(sold)} units but no receiver on file in ${lookbackDays} days. Confirm how this arrives — scanned, direct-store, or electronically.${underCostFact}`,
        unaccounted,
      };
    }
    if (item.lw || item.ly) {
      return {
        action: "reorder",
        evidence: `No delivery in ${lookbackDays} days and nothing sold this window — off the shelf.`,
        unaccounted,
      };
    }
    return {
      action: "insufficient",
      evidence: `No sales, no receivers in ${lookbackDays} days, no baseline. Can't tell if this item is still carried.`,
      unaccounted,
    };
  }

  /**
   * Nothing left of the last delivery.
   *
   * Days alone were the whole reorder test, which misses the case that matters
   * most: an item selling faster than it arrives is empty long before its
   * cadence elapses. Reorder is a relationship between sold and received, so
   * the relationship drives it — if as much has sold as came in, the delivery
   * is consumed whatever the date says.
   *
   * Carries the same blind spot as everything built on `sinceDelivery`: there
   * is no opening balance in the data, so prior stock is invisible and this can
   * read empty when a few units remain. The sentence prints both figures rather
   * than only the conclusion, so the reader can see what it is claiming.
   */
  const runOut = item.sinceDelivery !== null && item.sinceDelivery.left <= 0;

  if (!isRecent || runOut) {
    const sd = item.sinceDelivery;
    const lead =
      runOut && sd
        ? `${sd.received} delivered, ${sd.sold} sold since — nothing left of the last delivery.`
        : `Last received ${lastDays} days ago — likely off the shelf.${
            sd
              ? ` ${sd.received} units in, ${sd.sold} sold, ${sd.left} unaccounted for.`
              : ""
          }`;
    return {
      action: "reorder",
      evidence: `${lead}${extraNote}`,
      unaccounted,
    };
  }

  /* ── delivered and in stock: a demand problem ───────────────────────── */

  // The sheet carries days-since in its own column and the rail states it
  // beside the Received heading, so the sentence says the conclusion the date
  // supports rather than repeating the date a third time.
  const inStock = "In stock.";

  if (sold === 0) {
    const sd = item.sinceDelivery;
    /**
     * Zero sales is only evidence once the item has had a chance.
     *
     * A delivery two days ago with nothing scanned yet was being ranked worst
     * in the list, ahead of items genuinely off the shelf. Either it has sat a
     * full week, or it sold in one of the comparison periods so we know it
     * normally moves — without one of those there is nothing to explain yet.
     */
    const hadTime = (lastDays ?? 0) >= 7;
    const hasBaseline = Boolean(item.lw || item.ly);
    if (!hadTime && !hasBaseline) {
      return {
        action: "insufficient",
        evidence: `${inStock} Delivered ${lastDays} day${lastDays === 1 ? "" : "s"} ago, nothing scanned yet and no history to compare against — too soon to call.`,
        unaccounted,
      };
    }
    const held = sd
      ? ` ${sd.received} units delivered, none scanned since.`
      : " Nothing scanned since.";
    return {
      action: "investigate",
      evidence: `${inStock}${held}`,
      unaccounted,
    };
  }

  const costs = receipts.map((r) => r.unitCost).filter((c) => c > 0);

  /**
   * Whether the shelf price moved at all across the window.
   *
   * The check below claims "the shelf price didn't follow", but its guard used
   * to be `|retailGap| < $0.05` — the ring price agreeing with the *receiver's
   * intended retail*. That is a different statement: if the vendor raised
   * intended retail alongside cost, the price had followed and it still fired.
   * Comparing the first era to the current one tests what the sentence says.
   */
  /**
   * Whether the *shelf* price moved — measured on regular rings only.
   *
   * This compared the first estimated era to the current one, and both are
   * daily blends. On a promoted item those swing for reasons that have nothing
   * to do with the tag: a promotion starting reads as a price cut, ending reads
   * as a rise. Comparing the first regular ring to the last measures the shelf
   * and ignores the promotions running across it.
   *
   * Null when the item never rang regular in the window, and the check that
   * uses it then does not fire — with no regular price at either end there is
   * no way to say whether the shelf followed anything.
   */
  const shelfMove =
    lastPrice?.firstRegularPrice != null && lastPrice.regularPrice != null
      ? pctMove(lastPrice.firstRegularPrice, lastPrice.regularPrice)
      : null;
  const costMove =
    costs.length >= 2 ? pctMove(costs[costs.length - 1], costs[0]) : null;

  /**
   * Below cost *now*, on the price it is currently ringing at.
   *
   * This used to fire on `eras.some(...)` — any era in the window — while the
   * sentence printed the current price against the current cost. Two true
   * numbers from different periods, and they contradicted each other on screen:
   * "selling below cost at $9.49 against $5.95". The era that actually fired
   * was an older $6.49 stretch that ran while cost was $6.85.
   *
   * Both figures now come off the same era object, so the sentence cannot
   * disagree with itself no matter what the cost did in between. Scoping it to
   * the current era also matches what this page is for: an item that was
   * underwater last week and has since been repriced is a fact about the past,
   * not an action for this afternoon. It stays visible in the estimated
   * price-points grid, where a historical figure belongs.
   *
   * Ahead of the cost-history checks below. Selling under cost is unambiguous
   * and fixable today; an unreliable cost is a conversation.
   */
  /**
   * Two ways a price is wrong, and they need different fixes.
   *
   * The shelf tag being under cost is checked first: it is permanent, and
   * taking the item off promotion would not repair it. An underwater promotion
   * is the commoner case and the easier fix — end the promotion — so its
   * sentence says how long it has run and what it has cost, which is what makes
   * "take it off sale" an argument rather than an instruction.
   */
  if (regularUnderCost && regularPrice !== null) {
    const pct = round1(
      ((regularPrice - (rulingCost ?? 0)) / regularPrice) * 100,
    );
    return {
      action: "reprice",
      evidence: `${inStock} ${regularSource} is ${money(regularPrice)}, below the ${money(rulingCost ?? 0)} you last paid. Margin ${pct.toFixed(1)}%.${regularSource === "Highest price seen" ? " Worth checking the shelf tag — if it reads higher than this, the gap is coming from a sale or a coupon." : ""}`,
      unaccounted,
    };
  }

  if (underCost && lastPrice && lastPrice.onSale) {
    const givenAway = round2(
      (rulingCost ?? 0) * lastPrice.saleUnits - lastPrice.saleRevenue,
    );
    const run = `${lastPrice.saleDays} day${lastPrice.saleDays === 1 ? "" : "s"}, ${lastPrice.saleUnits} units`;
    return {
      action: "reprice",
      evidence: `${inStock} On sale at ${money(lastPrice.price)} since ${shortDate(lastPrice.saleStart)} — ${run} — against a ${money(rulingCost ?? 0)} cost.${rulingMargin === null ? "" : ` Margin ${rulingMargin.toFixed(1)}%,`} about ${money(givenAway)} given away.${regularPrice === null ? "" : ` ${regularSource} is ${money(regularPrice)}, so it is the promotion that is underwater.`}`,
      unaccounted,
    };
  }

  if (underCost && lastPrice) {
    return {
      action: "reprice",
      evidence: `${inStock} ${
        lastPrice.blended
          ? `On ${shortDate(lastPrice.date)} it rang at more than one price, averaging ${money(lastPrice.price)} across ${lastPrice.units} units`
          : `Last sold at ${money(lastPrice.price)} on ${shortDate(lastPrice.date)}`
      }, below the ${money(rulingCost ?? 0)} cost.${rulingMargin === null ? "" : ` Margin ${rulingMargin.toFixed(1)}%.`}`,
      unaccounted,
    };
  }

  // Cost that can't be relied on makes every margin computed from it suspect,
  // so this outranks the pricing verdicts that follow. The reason itself is
  // built above, because the reorder branch needs it too.
  if (costReason) {
    return {
      action: "vendor",
      evidence: `${inStock} ${costReason}. Worth confirming the price with the vendor before the next order.`,
      unaccounted,
    };
  }

  /**
   * Ringing under the receiver's intended retail is no longer a verdict on its
   * own.
   *
   * It fired on any gap over five cents, which made every deliberate markdown a
   * pricing error: an item ringing $6.38 against an intended $9.49 was raised
   * as Reprice while earning 13% over its $5.55 cost. It also quoted
   * `item.marginPct` — the sales file's blended figure — which said -7.4% about
   * a price that was plainly profitable.
   *
   * Judging a markdown needs a target margin, and there isn't one anywhere in
   * this data (see the Call vendor notes on category minimums). Below cost is
   * the floor we can actually assert, and it has its own check above. The
   * intended retail stays on screen in the detail panel, where someone can see
   * the gap and decide for themselves.
   *
   * `retailGap` survives as a guard on the cost-move check below — that one
   * only means anything when the shelf price has *not* moved.
   */

  if (
    costMove !== null &&
    costMove > COST_MOVE_FLOOR &&
    shelfMove !== null &&
    shelfMove <= COST_MOVE_FLOOR
  ) {
    return {
      action: "reprice",
      evidence: `${inStock} Cost up ${round1(costMove)}% across ${costs.length} deliveries and the shelf price didn't follow${marginClause}.`,
      unaccounted,
    };
  }

  /**
   * Price up, demand down — but only between two regular stretches.
   *
   * Without that condition this fires on every promotion that ends: the price
   * "rises" from the promotional one back to the shelf one, and demand falls
   * away from the volume the promotion was run to create. Both are true and
   * neither is a pricing fault — moving stock is what the promotion was for.
   *
   * An era is skipped if any of its days carried a promotional ring, so the
   * comparison only ever sees the shelf price against itself.
   */
  const pair = comparableEras(
    eras.filter((e) => !lastPrice?.promoDays.has(e.start)),
  );
  if (pair) {
    const priceMove = pctMove(pair.prior.price, pair.current.price);
    const demandMove = pctMove(
      pair.prior.unitsPerDay,
      pair.current.unitsPerDay,
    );
    if (
      priceMove !== null &&
      demandMove !== null &&
      priceMove > COST_MOVE_FLOOR &&
      demandMove < -FLAT_PCT
    ) {
      return {
        action: "reprice",
        evidence: `${inStock} Price went ${money(pair.prior.price)} to ${money(pair.current.price)} and demand fell ${Math.abs(round1(demandMove))}%, ${pair.prior.unitsPerDay} to ${pair.current.unitsPerDay} a day.`,
        unaccounted,
      };
    }
  }

  // Both baselines have to agree before an in-stock, correctly-priced item is
  // called a problem. Down on last year but up on last week is a recovery, and
  // flagging it is the false warning this page exists to avoid.
  const downOnBoth =
    (item.lyPct ?? 0) < -FLAT_PCT && (item.lwPct ?? 0) < -FLAT_PCT;
  if (downOnBoth) {
    return {
      action: "investigate",
      evidence: `${inStock} Down ${Math.abs(round1(item.lyPct!))}% on last year and ${Math.abs(round1(item.lwPct!))}% on last week, with cost and price steady. Nothing in the data explains it.`,
      unaccounted,
    };
  }

  const recovering =
    (item.lyPct ?? 0) < -FLAT_PCT && (item.lwPct ?? 0) >= -FLAT_PCT;
  return {
    action: "none",
    evidence: recovering
      ? `${inStock} Down on last year but holding against last week. Cost steady${marginClause}.`
      : `${inStock} Trend ${trend === null ? "flat" : `${round1(trend)}%`}, cost steady${marginClause}. Nothing to fix.`,
    unaccounted,
  };
};

/* ----------------------------------------------------------------- rollup */

export const buildRollup = (
  verdicts: Verdict[],
): Record<ActionKind, number> => {
  const out: Record<ActionKind, number> = {
    investigate: 0,
    reorder: 0,
    reprice: 0,
    vendor: 0,
    receiving: 0,
    none: 0,
    insufficient: 0,
    pending: 0,
  };
  for (const v of verdicts) out[v.action] += 1;
  return out;
};
