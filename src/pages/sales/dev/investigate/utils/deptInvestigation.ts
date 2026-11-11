// Interfaces
import type { Cause, Bands, ItemFacts, Margins, Ratios, ItemVerdict, PriceLadder } from "../interfaces";

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
 * buyer's problem, and $6K was ordered and never arrived, which is a vendor's.
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
): Cause => {
  const gap = f.mineTy - f.theirsTy;
  const ordered = f.orderedQty > 0;
  const received = f.receivedUnits > 0;

  // The two supply failures come first wherever the sales landed: an item
  // that never reached the shelf cannot be explained by what it cost or what
  // it was priced at.
  if (!ordered && !received && f.mineTy === 0 && f.theirsTy > 0)
    return ordersKnown ? "never-ordered" : "not-carried";
  // Ordered-but-not-arrived needs an order to have been placed, so it cannot
  // fire at all without order history.
  if (ordered && !received && gap < 0) return "not-received";

  // Then buying terms — BEFORE "ahead", and that order is the point. An item
  // can sell more here and still make less, because it is bought for more.
  // Settling "ahead" on the sales gap alone called that a win.
  if (costsMore(f, bands)) return "cost";

  // Level first, and that order is the point. An item that rang the same
  // money at both stores has not won anything -- "ahead" was swallowing every
  // item the two stores agreed on, which is most of a department.
  if (Math.abs(gap) < bands.floor) return "streamlined";
  if (gap > 0) return "ahead";

  const mine = realised(f.mineTy, f.mineUnits);
  const theirs = realised(f.theirsTy, f.theirsUnits);
  if (mine !== null && theirs !== null && theirs > 0) {
    if (Math.abs(mine / theirs - 1) > bands.price) return "price-mix";
  }

  // It was here, it was priced like theirs, and it still did not sell.
  if (received || f.mineUnits > 0) return "not-moving";

  return "streamlined";
};

export const ratiosOf = (f: ItemFacts): Ratios => {
  const mine = realised(f.mineTy, f.mineUnits);
  const theirs = realised(f.theirsTy, f.theirsUnits);
  return {
    units: ratio(f.mineUnits, f.theirsUnits),
    dollars: ratio(f.mineTy, f.theirsTy),
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
  "not-received": "Didn't arrive",
  cost: "Costing more",
  "not-moving": "Not moving",
  "price-mix": "Price / mix",
  ahead: "We're ahead",
  streamlined: "Streamlined",
};

/** Who owns the fix. The whole reason the causes are named separately is that
 *  they go to three different people. */
export const CAUSE_OWNER: Record<Cause, string> = {
  "never-ordered": "buyer",
  "not-carried": "nothing on file either way",
  "not-received": "vendor",
  cost: "buying terms",
  "not-moving": "merchandising",
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
    case "not-received":
      return `${us} ordered it and it never arrived. ${theirs}`;
    case "cost": {
      const per = item.margins.minePerUnit !== null && item.margins.theirsPerUnit !== null
        ? item.margins.minePerUnit - item.margins.theirsPerUnit
        : null;
      return per === null
        ? `Both stores sold it, and ${us} buys it for more.`
        : `Both stores sold it. ${us} buys it for ${cash(per)} more a unit, which cost ${cash(item.margins.costPenalty ?? 0)} on the units it sold.`;
    }
    case "not-carried":
      return `Nothing here says ${us} ever had it, and no orders came back for the window to say whether it was ever asked for. ${theirs}`;
    case "price-mix":
      return `${us} sold it and took ${cash(item.mineSales)} against ${cash(item.theirsSales)} — less per unit, not fewer of them.`;
    case "not-moving":
      return `${us} has it and sold ${cash(item.mineSales)} against ${cash(item.theirsSales)}. Nothing in this data says why.`;
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
): ItemVerdict => ({
  ...f,
  gap: f.mineTy - f.theirsTy,
  cause: causeOf(f, bands, ordersKnown),
  ratios: ratiosOf(f),
  margins: marginsOf(f),
});

/* ------------------------------------------------------------------ */
/* Turning the three responses into facts                              */
/* ------------------------------------------------------------------ */
