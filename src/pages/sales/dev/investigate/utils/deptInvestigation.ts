// Utils
import { count, onDay } from ".";

// Interfaces
import type { Cause, Bands, GapSplit, ItemFacts, Margins, Ratios, ItemVerdict, PriceLadder } from "../interfaces";

/**
 * Why one store is behind another in one sub department.
 *
 * Pure arithmetic over rows the page has already fetched — no fetch, no
 * component, no slice. It takes one department's item rows for both stores
 * across the three periods, plus the open store's orders and receipts, and
 * says of each item which of a small number of things went wrong.
 *
 * The point is the CAUSE. A grid of differences tells you Grocery is $29K
 * behind; it does not tell you that $13K of it was never ordered, which is a
 * buyer's problem, and $6K was ordered with no receiver on file, which is
 * receiving's to check.
 * Those go to two different people, and the difference between them is three
 * facts this module already has.
 */

export const DEFAULT_BANDS: Bands = { price: 0.08, cost: 0.05, floor: 5 };

const ratio = (mine: number, theirs: number): number | null =>
  theirs > 0 ? mine / theirs : null;

const realised = (money: number, units: number): number | null =>
  units > 0 ? money / units : null;

export const marginsOf = (f: ItemFacts): Margins => {
  const minePerUnit = realised(f.mineCogs, f.mineUnits);
  const theirsPerUnit = realised(f.theirsCogs, f.theirsUnits);
  // Dollars, not `mineTy` — see the note on `mineSales`.
  const mine = f.mineSales - f.mineCogs;
  const theirs = f.theirsSales - f.theirsCogs;
  return {
    mine,
    theirs,
    diff: mine - theirs,
    minePerUnit,
    theirsPerUnit,
    costPenalty:
      minePerUnit !== null && theirsPerUnit !== null
        ? (theirsPerUnit - minePerUnit) * f.mineUnits
        : null,
  };
};

/** Whether a store rang an item at all. Units or money: an item can ring for
 *  nothing and still have sold. The Summary's rows count it the same way. */
export const rangAt = (units: number, sales: number) => units > 0 || sales > 0;

/**
 * An item's dollar gap, split exactly into what selling more or fewer units
 * did and what taking more or less a unit did.
 *
 * Each part is valued at the midpoint of the two stores (units at the average
 * price, price at the average units), so neither store is the base and the
 * two always add up to the gap. An item only one store sold is all units.
 */
export const splitGap = (f: ItemFacts): GapSplit => {
  const gap = f.mineSales - f.theirsSales;
  const mine = realised(f.mineSales, f.mineUnits);
  const theirs = realised(f.theirsSales, f.theirsUnits);
  if (mine === null || theirs === null) return { units: gap, price: 0 };
  return {
    units: ((f.mineUnits - f.theirsUnits) * (mine + theirs)) / 2,
    price: ((mine - theirs) * (f.mineUnits + f.theirsUnits)) / 2,
  };
};

/**
 * Is this item dearer to buy than it is at the other store, by enough and for
 * enough money to be worth saying?
 *
 * Both tests, because either alone lies: a 40% gap on nine units of something
 * is noise, and a penny a unit on ten thousand units is a rounding difference
 * in the data rather than a buying problem.
 */
const costsMore = (f: ItemFacts, bands: Bands): boolean => {
  const m = marginsOf(f);
  if (m.minePerUnit === null || m.theirsPerUnit === null) return false;
  if (m.theirsPerUnit <= 0) return false;
  if (m.minePerUnit / m.theirsPerUnit - 1 <= bands.cost) return false;
  return Math.abs(m.costPenalty ?? 0) >= bands.floor;
};

/**
 * Which of the causes fits this item.
 *
 * The order is the argument. Being ahead is settled first because it is not a
 * problem at all. Then the two supply failures, because an item that never
 * reached the shelf cannot be explained by its price — running the price test
 * first would label a missing delivery a merchandising problem. Only an item
 * that was genuinely on sale all week is asked about price, and what is left
 * after all of that is named `streamlined` rather than guessed at -- the two
 * stores are level on it, or nothing in this data separates them.
 */
export const causeOf = (
  f: ItemFacts,
  bands: Bands = DEFAULT_BANDS,
  /**
   * Whether there is any order history to reason from.
   *
   * False when the window returned no orders at all for either store, which
   * is what a department delivered straight off the vendor's truck looks
   * like: invoices arrive, no purchase order is ever raised. "Never ordered"
   * rests on `orderedQty === 0` being a fact ABOUT THE ITEM, and when every
   * item in the window is at nought that is an absence of evidence rather
   * than evidence of absence -- the page was handing a buyer fifty items it
   * had no order data for and calling it a missed order.
   */
  ordersKnown: boolean = true,
  /** Whether the receipts came back. Every supply cause rests on them. */
  receiptsKnown: boolean = true,
): Cause => {
  // Dollars whatever the page shows: an item's cause must not change with the
  // Sales/Quantity switch, and on quantity `mineTy` is a unit count.
  const gap = f.mineSales - f.theirsSales;
  const ordered = f.orderedQty > 0;
  const received = f.receivedUnits > 0;
  const rangHere = rangAt(f.mineUnits, f.mineSales);
  const rangThere = rangAt(f.theirsUnits, f.theirsSales);

  // Without receipts nothing can say whether it was delivered, so an item
  // that did not ring here gets no supply cause at all.
  if (!receiptsKnown && !rangHere && rangThere) return "no-receipts";

  // The two supply failures come first wherever the sales landed: an item
  // that never reached the shelf cannot be explained by what it cost or what
  // it was priced at.
  if (!ordered && !received && !rangHere && rangThere)
    return ordersKnown ? "never-ordered" : "not-carried";
  // An order with no receiver on file. Orders carry no expected date, so this
  // says only what is on record, never that it is late. An item that did not
  // ring here asks about its newest order; one that rang was stocked from
  // somewhere, so only no receiver at all in the window points at supply.
  const noReceiver = rangHere ? !received : f.receivedSinceOrder === 0;
  if (receiptsKnown && ordered && noReceiver && gap < 0) return "not-received";
  // Delivered, and none of it rang here while the other store sold it.
  if (received && !rangHere && rangThere) return "unsold";

  // Then buying terms — BEFORE "ahead", and that order is the point. An item
  // can sell more here and still make less, because it is bought for more.
  // Settling "ahead" on the sales gap alone called that a win.
  if (costsMore(f, bands)) return "cost";

  // Level first, and that order is the point. An item that rang the same
  // money at both stores has not won anything -- "ahead" was swallowing every
  // item the two stores agreed on, which is most of a department.
  if (Math.abs(gap) < bands.floor) return "streamlined";
  if (gap > 0) return "ahead";

  const mine = realised(f.mineSales, f.mineUnits);
  const theirs = realised(f.theirsSales, f.theirsUnits);
  // Price is the cause only where it is the bigger part of the gap. Past the
  // band alone it called an item that sold a tenth of the units "price".
  // Bigger but inside the band, the units are level and the price gap is
  // under what the page calls a difference, so nothing names it.
  if (mine !== null && theirs !== null && theirs > 0) {
    const { units, price } = splitGap(f);
    if (Math.abs(price) > Math.abs(units))
      return Math.abs(mine / theirs - 1) > bands.price ? "price-mix" : "streamlined";
  }

  // Both sold it, at about the same price, and this store sold fewer.
  if (rangHere) return "not-moving";

  return "streamlined";
};

/** Dollars, not the page's metric: on quantity the metric figure is units, and
 *  units over units would make every price ratio 1. */
export const ratiosOf = (f: ItemFacts): Ratios => {
  const mine = realised(f.mineSales, f.mineUnits);
  const theirs = realised(f.theirsSales, f.theirsUnits);
  return {
    units: ratio(f.mineUnits, f.theirsUnits),
    dollars: ratio(f.mineSales, f.theirsSales),
    price: mine !== null && theirs !== null && theirs > 0 ? mine / theirs : null,
    sellThrough: f.receivedUnits > 0 ? f.mineUnits / f.receivedUnits : null,
  };
};

/* ------------------------------------------------------------------ */
/* What a cause is called, and what it wears                           */
/* ------------------------------------------------------------------ */

/* Beside the Cause they describe rather than inside one of the two
   components that need them: the grid and the evidence rail must agree on
   every word and every tint, and a copy in each is two places to drift. */

export const CAUSE_LABEL: Record<Cause, string> = {
  "never-ordered": "Never ordered",
  "not-carried": "Not carried here",
  "not-received": "No receiver on file",
  cost: "Costing more",
  "not-moving": "Selling fewer",
  unsold: "Received, none sold",
  "no-receipts": "Receivers unavailable",
  "price-mix": "Price / mix",
  ahead: "We're ahead",
  streamlined: "Streamlined",
};

/** What each cause means, in one line: the tooltip wherever a cause is a
 *  label. Kept here so the Summary and the Hand-off say the same thing. */
export const CAUSE_TIP: Record<Cause, (us: string, them: string) => string> = {
  "never-ordered": (us, them) =>
    `No order at ${us} in the window, nothing received, nothing sold. ${them} sold it.`,
  "not-carried": () =>
    "Like Never ordered, but neither store ordered in this department, so it can't say one was missed.",
  "not-received": (us) => `Ordered at ${us}, and no receiver for it is on file since the order.`,
  unsold: (us) => `Delivered to ${us}, and none of it rang this week.`,
  "no-receipts": () => "The receivers couldn't be read, so nothing says whether it was delivered.",
  cost: (us) => `Both sold it, and ${us} buys it for more.`,
  "price-mix": (us, them) => `${us} took less a unit than ${them}, and price is most of the gap.`,
  "not-moving": (us) => `Both sold it at about the same price, and ${us} sold fewer.`,
  streamlined: (_us, them) => `Within $5 of ${them}.`,
  ahead: (us) => `${us} sold more of it, by more than $5.`,
};

/** Who owns the fix. The whole reason the causes are named separately is that
 *  they go to three different people. */
export const CAUSE_OWNER: Record<Cause, string> = {
  "never-ordered": "buyer",
  "not-carried": "nothing on file either way",
  "not-received": "receiving: check the receiver was entered",
  cost: "buying terms",
  "not-moving": "merchandising",
  unsold: "merchandising",
  "no-receipts": "the receivers could not be read",
  "price-mix": "same units, less money",
  ahead: "ours to keep",
  streamlined: "nothing to chase",
};

/**
 * One tone per cause, worn everywhere that cause appears.
 *
 * The same shape Item Actions uses for its piles: the chip carries its colour
 * all the time, and selecting it adds a ring in its own tone rather than
 * swapping the fill for a generic highlight. A chip that only colours itself
 * once you click it cannot be scanned, which is the whole job of the row.
 *
 * Six distinct hues rather than three greys, because these go to six
 * different people. `GapBreakdown` paints the same causes in the same
 * order — a cause that is violet here and grey in the treemap is two
 * findings as far as a reader is concerned.
 */
export const CAUSE_TONE: Record<Cause, { chip: string; ring: string }> = {
  "never-ordered": {
    chip: "bg-severity_critical_bg text-severity_critical_text",
    ring: "ring-severity_critical_text/40",
  },
  // Indigo, not the critical red "never ordered" wears. The finding is the
  // same shape -- they sell it, we do not -- but the claim is weaker, and a
  // department with no purchase orders at all would otherwise light up red
  // every week for doing nothing wrong.
  "not-carried": {
    chip: "bg-indigo-50 text-indigo-900",
    ring: "ring-indigo-900/40",
  },
  "not-received": {
    chip: "bg-severity_watch_bg text-severity_watch_text",
    ring: "ring-severity_watch_text/40",
  },
  // Violet, the tone Item Actions gives anything that is settled with a
  // vendor rather than on the shelf. Buying terms are exactly that.
  cost: { chip: "bg-violet-50 text-violet-900", ring: "ring-violet-900/40" },
  "not-moving": { chip: "bg-blue-50 text-blue-900", ring: "ring-blue-900/40" },
  unsold: { chip: "bg-sky-50 text-sky-900", ring: "ring-sky-900/40" },
  "no-receipts": { chip: "bg-fill_muted text-content/95", ring: "ring-content/30" },
  "price-mix": { chip: "bg-cyan-50 text-cyan-900", ring: "ring-cyan-900/40" },
  ahead: {
    chip: "bg-delta_positive_bg text-delta_positive_text",
    ring: "ring-delta_positive_text/40",
  },
  // Grey is the honest colour for a department's quiet majority. Giving it a
  // hue would put it on the same footing as the five findings that mean
  // something, and there is nothing here to act on.
  streamlined: { chip: "bg-fill_muted text-content/95", ring: "ring-content/30" },
};

/**
 * What a week of prices amounts to, in a sentence.
 *
 * The ladder underneath is every price in order, which answers "what did it
 * ring at" exactly and "what did it mostly ring at" not at all — a reader
 * has to add up thirteen rows to see that four fifths of the units went at
 * one price. This says it, and the ladder proves it.
 *
 * Null where there is nothing to summarise: no prices, or one, where the
 * ladder's single row already is the sentence.
 */
export const ladderSays = (ladder: PriceLadder): string | null => {
  const pts = ladder.points;
  if (pts.length < 2) return null;

  const cash = (v: number) =>
    "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const whole = (v: number) => Math.round(v).toLocaleString("en-US");

  const prices = pts.map((p) => p.price);
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);

  /* A weighted item has no price ladder to summarise. Saying it "rang at 4
     prices from $7.62 to $8.46" states as a pricing fact what is really four
     packages of different sizes, and the reader acts on it. */
  if (ladder.weighted)
    return (
      `Sold by weight. ${whole(pts.length)} package sizes between ${cash(lo)} and ${cash(hi)}, ` +
      "which is the spread of package sizes rather than of prices — the rate is the price per pound above."
    );
  const total = pts.reduce((t, p) => t + p.units, 0);

  /* The band the units actually went at: the modal price and anything
     within a dime of it, which is where a scale item's rounding lands and
     a genuine second price does not. */
  const near = ladder.modal === null
    ? []
    : pts.filter((p) => Math.abs(p.price - ladder.modal!) <= 0.1);
  const nearUnits = near.reduce((t, p) => t + p.units, 0);
  const nearLo = near.length ? Math.min(...near.map((p) => p.price)) : null;
  const nearHi = near.length ? Math.max(...near.map((p) => p.price)) : null;

  const where =
    nearLo === null
      ? ""
      : nearLo === nearHi
        ? ` Most units went at ${cash(nearLo)} (${whole(nearUnits)} of ${whole(total)}).`
        : ` Most units went at ${cash(nearLo)}–${cash(nearHi!)} (${whole(nearUnits)} of ${whole(total)}).`;

  /* A basket taking several at once is the one thing only the transaction
     count can tell you, and it is usually a multi-buy nobody mentioned. */
  const multi = [...pts]
    .filter((p) => (p.unitsPerBasket ?? 0) >= 1.5)
    .sort((a, b) => b.units - a.units)[0];
  const deal = multi
    ? ` At ${cash(multi.price)} a basket took ${multi.unitsPerBasket!.toFixed(1)} at a time.`
    : "";

  return `Rang at ${pts.length} prices from ${cash(lo)} to ${cash(hi)}.${where}${deal}`;
};

/**
 * The item in a sentence, which is what the rail opens with.
 *
 * The grid's Cause column is a label; a label on its own is a claim. This
 * says what each store did, in the order a reader needs it: what happened
 * here, then what it was worth there.
 *
 * It names no owner and no remedy. Whose job it is belongs to the hand-off,
 * which knows about desks; this knows about one item.
 */
export const evidenceSays = (
  item: ItemVerdict,
  us: string,
  them: string,
  /** The newest receiver on file for the department, so a missing one can be
   *  read against how far the receiving data goes. */
  newestReceiver: string | null = null,
): string => {
  const cash = (v: number) =>
    "$" + Math.abs(v).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const theirs = `${them} sold ${cash(item.theirsSales)} of it and made ${cash(item.margins.theirs)}.`;

  switch (item.cause) {
    case "never-ordered":
      return `${us} never ordered or rang it. ${theirs}`;
    case "not-received": {
      const when = item.lastOrderDate ? ` on ${onDay(item.lastOrderDate)}` : "";
      const newest = newestReceiver
        ? ` The newest receiver on file for this department is ${onDay(newestReceiver)}.`
        : "";
      return `${us} ordered ${count(item.lastOrderQty)}${when}. No receiver for it is on file since then.${newest} ${theirs}`;
    }
    case "cost": {
      const per = item.margins.minePerUnit !== null && item.margins.theirsPerUnit !== null
        ? item.margins.minePerUnit - item.margins.theirsPerUnit
        : null;
      return per === null
        ? `Both stores sold it, and ${us} buys it for more.`
        : `Both stores sold it. ${us} buys it for ${cash(per)} more a unit, which cost ${cash(item.margins.costPenalty ?? 0)} on the units it sold.`;
    }
    case "not-carried":
      return `Nothing here says ${us} ever had it, and no order in this department came back for either store over the window to say whether it was ever asked for. ${theirs}`;
    case "price-mix":
      return `${us} sold it and took ${cash(item.mineSales)} against ${cash(item.theirsSales)}. Taking less a unit is most of that difference, more than the units sold.`;
    case "not-moving": {
      const lb = item.weighted ? " lb" : "";
      return `Both stores sold it, at about the same price. ${us} sold ${count(item.mineUnits)}${lb} against ${count(item.theirsUnits)}${lb}. Nothing in this data says why.`;
    }
    case "no-receipts":
      return `${us} did not ring it. We couldn't get the receiver information at this time, so nothing here says whether it was delivered. ${theirs}`;
    case "unsold":
      return `${us} received it and none of it rang this week. ${theirs}`;
    case "ahead":
      return `${us} sold ${cash(item.mineSales)} of it against ${cash(item.theirsSales)}, and is ${cash(item.mineSales - item.theirsSales)} ahead on it.`;
    default:
      return `${us} sold ${cash(item.mineSales)} of it against ${cash(item.theirsSales)}.`;
  }
};

export const judge = (
  f: ItemFacts,
  bands: Bands = DEFAULT_BANDS,
  ordersKnown: boolean = true,
  receiptsKnown: boolean = true,
): ItemVerdict => ({
  ...f,
  gap: f.mineTy - f.theirsTy,
  cause: causeOf(f, bands, ordersKnown, receiptsKnown),
  ratios: ratiosOf(f),
  margins: marginsOf(f),
});

/* ------------------------------------------------------------------ */
/* Turning the three responses into facts                              */
/* ------------------------------------------------------------------ */
