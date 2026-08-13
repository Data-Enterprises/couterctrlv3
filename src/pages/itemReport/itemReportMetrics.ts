import { calculateCogs } from "../subDepts";
import { shiftIso } from "../../utils/grading";
import { pricedUnits } from "../inventory/inventoryData";
import { estimatedPricePoints } from "../inventory/pricePoints";
import type { EstimatedPricePoint } from "../inventory/pricePoints";
import type { ReceiptLine } from "./itemReportData";
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

/** A shelf price this far under what the receipt intended is worth naming. */
const RETAIL_GAP_FLOOR = 0.05;

/** Distinct unit costs across the lookback before the cost itself is the
 *  problem rather than the price set against it. */
const ERRATIC_COST_SPREAD = 0.1;

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
    const code = String(r.product_code);
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
  insufficient: 4,
  none: 5,
  /** Last, so that once the walk finishes and rows resolve, nothing that has
   *  an answer is ever sorted below something that doesn't. */
  pending: 6,
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

  /* ── no recent delivery: a stocking problem ─────────────────────────── */

  if (!last) {
    if (sold > 0) {
      return {
        action: "vendor",
        evidence: `Sold ${round1(sold)} units but no receipt on file in ${lookbackDays} days. Check receiving, or whether this arrives direct-store and never gets entered.`,
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
      evidence: `No sales, no receipts in ${lookbackDays} days, no baseline. Can't tell if this item is still carried.`,
      unaccounted,
    };
  }

  if (!isRecent) {
    const sd = item.sinceDelivery;
    const gap = sd
      ? ` ${sd.received} units in, ${sd.sold} sold, ${sd.left} unaccounted for.`
      : "";
    return {
      action: "reorder",
      evidence: `Last received ${lastDays} days ago — likely off the shelf.${gap}`,
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
    const held = sd
      ? ` ${sd.received} units delivered, none scanned since.`
      : " Nothing scanned since.";
    return {
      action: "investigate",
      evidence: `${inStock}${held}`,
      unaccounted,
    };
  }

  if (item.unitCost === null) {
    return {
      action: "insufficient",
      evidence: `${inStock} No cost on file — margin can't be judged.`,
      unaccounted,
    };
  }

  // Cost that moves around on every delivery makes any margin unreliable, so
  // it outranks a pricing verdict computed from it.
  const costs = receipts.map((r) => r.unitCost).filter((c) => c > 0);
  const spread =
    costs.length >= 2 ? Math.max(...costs) - Math.min(...costs) : 0;
  if (costs.length >= 3 && spread >= ERRATIC_COST_SPREAD) {
    return {
      action: "vendor",
      evidence: `${inStock} ${costs.length} receipts at costs from ${money(Math.min(...costs))} to ${money(Math.max(...costs))}. Margin can't be trusted until the invoice price is confirmed.`,
      unaccounted,
    };
  }

  const current = eras[eras.length - 1] ?? null;
  const belowCost = eras.some((e) => e.marginPct !== null && e.marginPct < 0);
  const retailGap =
    current && last.retail > 0 ? round2(current.price - last.retail) : null;
  const costMove =
    costs.length >= 2 ? pctMove(costs[costs.length - 1], costs[0]) : null;

  if (belowCost) {
    return {
      action: "reprice",
      evidence: `${inStock} Selling below cost at ${money(current?.price ?? 0)} against ${money(item.unitCost)}.`,
      unaccounted,
    };
  }

  if (retailGap !== null && retailGap <= -RETAIL_GAP_FLOOR) {
    return {
      action: "reprice",
      evidence: `${inStock} Rings ${money(current!.price)}, last receipt intended ${money(last.retail)}. Margin ${item.marginPct?.toFixed(1)}%.`,
      unaccounted,
    };
  }

  if (
    costMove !== null &&
    costMove > COST_MOVE_FLOOR &&
    (retailGap === null || Math.abs(retailGap) < RETAIL_GAP_FLOOR)
  ) {
    return {
      action: "reprice",
      evidence: `${inStock} Cost up ${round1(costMove)}% across the last ${costs.length} deliveries and the shelf price didn't follow. Margin ${item.marginPct?.toFixed(1)}%.`,
      unaccounted,
    };
  }

  const pair = comparableEras(eras);
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
      ? `${inStock} Down on last year but holding against last week. Cost steady, margin ${item.marginPct?.toFixed(1)}%.`
      : `${inStock} Trend ${trend === null ? "flat" : `${round1(trend)}%`}, cost steady, margin ${item.marginPct?.toFixed(1)}%. Nothing to fix.`,
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
    none: 0,
    insufficient: 0,
    pending: 0,
  };
  for (const v of verdicts) out[v.action] += 1;
  return out;
};
