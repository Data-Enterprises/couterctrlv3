// Utils
import {
  FLAT_PCT,
  COST_MOVE_FLOOR,
  COST_CHANGES_FLAG,
  COST_STEP_UP_PCT,
  COST_CUMULATIVE_PCT,
  COST_REVERSALS_FLAG,
  round2,
  round1,
  daysSince,
  pctMove,
  money,
  costHistory,
  readPrices,
  utcDay,
  shortDate,
} from "./metrics";
import { comparableEras } from "./priceEras";

// Interfaces
import type { ActionKind } from "../../../../interfaces";
import type { ReceiptLine } from "./index";
import type { ReportItem, PriceEra, Verdict } from "../interfaces";

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
  insufficient: 5,
  none: 6,
  /** Last, so that once the walk finishes and rows resolve, nothing that has
   *  an answer is ever sorted below something that doesn't. */
  pending: 7,
};

/**
 * How often this item usually arrives, in days.
 *
 * The rail has always shown it — "usually every 4" beside the last delivery —
 * and the verdict ignored it, holding every item to a flat week before zero
 * sales counted as evidence. An item delivered every four days has had its
 * chance on day five; one delivered monthly has not had it on day eight. Null
 * when there are fewer than two deliveries to measure between, which is the
 * honest answer rather than a default dressed up as a measurement.
 *
 * Exported so the rail reads the same number it displays. The two were
 * computed separately and would have drifted the first time either changed.
 */
export const deliveryGap = (receipts: { date: string }[]): number | null => {
  if (receipts.length < 2) return null;
  const day = (d: string) =>
    new Date(`${d.split("T")[0]}T12:00:00`).getTime() / 86400000;
  // Newest first, so each gap is this delivery less the one before it.
  let total = 0;
  for (let i = 0; i < receipts.length - 1; i++)
    total += day(receipts[i].date) - day(receipts[i + 1].date);
  return Math.max(1, Math.round(total / (receipts.length - 1)));
};

/**
 * Days at the end of a run with no sales, counting back from a date.
 *
 * What makes an item worth investigating even though it was just delivered:
 * the silence BEFORE the delivery. Body Armor had seven flat days and then a
 * delivery, and saying "nothing scanned since the delivery" named the wrong
 * week — the delivery is the one thing that might fix it.
 */
export const flatDaysBefore = (
  series: { date: string; units: number }[],
  before: string,
): number => {
  const prior = series.filter((d) => d.date < before);
  let flat = 0;
  for (let i = prior.length - 1; i >= 0; i--) {
    if (prior[i].units > 0) break;
    flat += 1;
  }
  return flat;
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
  /** yyyy-mm-dd, the last day of the sales window. Needed to tell "stopped
   *  selling four days ago" from "sold right up to the end". */
  windowEnd: string,
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

  /**
   * A missing delivery record is a fact about the DATA, not a verdict about the
   * item, and it is no longer either of those things here.
   *
   * It used to be both: a store with no receivers at all returned `insufficient`
   * for every row, and an item with no receiver of its own returned "check
   * receiving" before any pricing or demand test could run. Orders received
   * electronically never reach the scan this is built from, so entire stores
   * come through with no invoice trail — and 522 items would land in one bucket
   * reading `Reprice 0`, not because nothing was wrong but because nothing was
   * looked at.
   *
   * Sales are proof of presence. An item that sold 81 units is on the shelf
   * whatever receiving says, so its price and its trend can both be judged. The
   * count of items with no invoice is reported once, above the list.
   *
   * What still needs the invoice trail is unchanged and simply does not fire
   * without it: reorder, run-out, cost history, and cost-moved-but-shelf-didn't.
   */

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
  const rulingCost =
    last && last.unitCost > 0
      ? last.unitCost
      : item.unitCost && item.unitCost > 0
        ? item.unitCost
        : null;

  /**
   * Which cost the sentence is about to quote.
   *
   * The invoice wins whenever there is one — a delivery landing mid-window
   * makes any blend stale, and the question is whether the price is wrong now.
   * The sales-side figure is `cogs / units` off the `subs` rows and covers 520
   * of 523 products in a real department, so refusing it means refusing to
   * judge margin at all on a store whose orders arrive electronically. It is
   * named in the evidence rather than passed off as an invoice cost.
   */
  const costIsInvoiced = Boolean(last && last.unitCost > 0);
  const costBasis = costIsInvoiced
    ? ""
    : " (average cost this week — no invoice on file to confirm)";
  /** How to name the cost mid-sentence. "You last paid" is a claim about an
   *  invoice, and saying it over a figure derived from `subs` cost ÷ case pack
   *  would be untrue on every electronically-received store. */
  const costPhrase = costIsInvoiced
    ? "you last paid"
    : "average cost this week, with no invoice on file to confirm it";

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
  const lastPrice = readPrices(item.rows, item.points);

  /**
   * The shelf price, best source first.
   *
   * A regular ring is the real thing. Failing that the last receiver's intended
   * retail, which is what the invoice expects the shelf to be — the only source
   * for an item that spent the whole window on promotion. Failing both, the
   * dearest price seen, which is a stand-in and not evidence.
   */
  /**
   * The shelf price, best source first.
   *
   * A regular ring is the real thing. Then the last receiver's intended retail.
   * Then the POS `ring_price` — an actual posted price rather than an inference,
   * which matters because 401 of 520 products in a real department never rang
   * REG in the window at all, and "highest price seen" was reading a promotion
   * as though it were the tag. Highest-seen survives only as a last resort.
   *
   * Every one of these is named in the evidence. Where the posted price and the
   * ring disagree the page does not try to decide which is right — it prints
   * both and lets someone walk out and read the tag, which is the only thing
   * that settles it.
   */
  const regularPrice =
    lastPrice?.regularPrice ??
    (last && last.retail > 0 ? last.retail : null) ??
    (lastPrice?.shelfPrice != null && lastPrice.shelfPrice > 0
      ? lastPrice.shelfPrice
      : null) ??
    (lastPrice && lastPrice.highestPrice > 0 ? lastPrice.highestPrice : null);

  const regularSource =
    lastPrice?.regularPrice != null
      ? "Regular price"
      : last && last.retail > 0
        ? "Regular price per the last invoice"
        : lastPrice?.shelfPrice != null && lastPrice.shelfPrice > 0
          ? "Shelf price on file"
          : "Highest price seen";

  const rulingMargin =
    lastPrice && rulingCost !== null && lastPrice.price > 0
      ? round1(((lastPrice.price - rulingCost) / lastPrice.price) * 100)
      : null;

  /** Dropped rather than printed as "n/a". An item that sold only on promotion
   *  has no regular price to compute a margin from, and a placeholder in the
   *  middle of a sentence reads as a broken figure rather than an absent one. */
  const marginClause =
    rulingMargin === null
      ? ""
      : `, margin ${rulingMargin.toFixed(1)}%${costBasis}`;

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

  /**
   * No delivery record at all.
   *
   * Only the two no-sales cases resolve here. An item that HAS sold is on the
   * shelf by the evidence of its own sales, so it carries on to the pricing and
   * demand tests below rather than stopping at "check receiving" — which was a
   * statement about our data wearing the costume of a verdict about the item.
   */
  if (!last) {
    if (sold === 0 && (item.lw || item.ly)) {
      /**
       * The one Reorder that does not need an invoice, and the only evidence
       * for it is the sales stopping.
       *
       * This said "No delivery in 90 days", which is a claim about the store.
       * What is actually known is that no invoice is on file — and on a
       * store receiving electronically that is true of everything, so the
       * sentence would have read as a delivery failure on every row.
       *
       * The conclusion is offered, not asserted: an item that sold every week
       * and now sells nothing is usually off the shelf, but demand collapse and
       * a delist look identical from here. Checking the spot settles it, and
       * that is the action either way.
       */
      const sellingHistory = [
        item.lw ? `${round1(item.lw.units)} last week` : "",
        item.ly ? `${round1(item.ly.units)} last year` : "",
      ]
        .filter(Boolean)
        .join(", ");
      return {
        action: "reorder",
        evidence: `Sold ${sellingHistory}, none this window, and no receiver invoice on file to confirm a delivery. Most likely off the shelf — worth checking the spot.`,
        unaccounted,
      };
    }
    if (sold === 0) {
      return {
        action: "insufficient",
        evidence: `No sales, no receivers in ${lookbackDays} days, no baseline. Can't tell if this item is still carried.`,
        unaccounted,
      };
    }
    // Sold, but no delivery trail. Everything that needs one is skipped below
    // by its own guards; everything that does not still runs.
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
  /**
   * Earlier deliveries still on the shelf.
   *
   * "Left of the last delivery" can't see stock from before it, so an item that
   * sold through a two-unit delivery read empty the next day while its own row
   * showed NET +7 for the span (White Wheat Round Top, dev board review,
   * finding N). When two or more deliveries landed in the span, the span's net
   * movement does see that stock, and a positive net means the shelf filled
   * over the span rather than emptied. With only one delivery the span figure
   * charges pre-delivery sales against it (see StockMovement), so it can't
   * overrule the anchored one there.
   */
  const earlierStockLeft =
    item.movement !== null &&
    item.movement.deliveries >= 2 &&
    item.movement.net > 0;
  const runOut =
    item.sinceDelivery !== null &&
    item.sinceDelivery.left <= 0 &&
    !earlierStockLeft;

  // `last &&` matters: without a receipt `isRecent` is false, and an unguarded
  // `!isRecent` would call every no-invoice item off the shelf — the same
  // mistake as before, wearing "reorder" instead of "check receiving".
  if (last && (!isRecent || runOut)) {
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
  // With an invoice, the delivery date says it is in stock. Without one, the
  // only evidence is that it sold — enough to judge price and trend on, not
  // enough to state stock.
  const inStock = last ? "In stock." : "Selling.";

  if (sold === 0) {
    const sd = item.sinceDelivery;

    /**
     * A delivery that landed at the very end of the window.
     *
     * Measured against the window's end, not against today: a delivery on the
     * window's last day had no time to sell INSIDE it, however long ago that
     * day now is. Five items delivered on 10/20, for a week ending 10/20, were
     * called Investigate for "3 units delivered, none scanned since" (dev
     * board review, finding L). The delivery hadn't had a day to sell.
     *
     * Nothing sold earlier in the window either, so the likely story is that
     * the shelf was empty until this delivery refilled it. That's not
     * Investigate, and it's too soon for anything else, so it says so and
     * names when to look again.
     */
    const FRESH_DELIVERY_DAYS = 2;
    const lastDate = last ? last.date.slice(0, 10) : null;
    const daysToWindowEnd =
      lastDate && windowEnd
        ? Math.round((utcDay(windowEnd) - utcDay(lastDate)) / 86400000)
        : null;
    if (
      daysToWindowEnd !== null &&
      daysToWindowEnd >= 0 &&
      daysToWindowEnd < FRESH_DELIVERY_DAYS
    ) {
      const before = item.lw
        ? `, against ${round1(item.lw.units)} last week`
        : item.ly
          ? `, against ${round1(item.ly.units)} the same week last year`
          : "";
      return {
        action: "insufficient",
        evidence: `${inStock} Delivered ${shortDate(lastDate as string)}, at the end of the window, so the new stock hasn't had time to sell. Nothing sold earlier in the window${before}, which looks like an empty shelf until this delivery. Check again next week.`,
        unaccounted,
      };
    }

    /**
     * Zero sales is only evidence once the item has had a chance.
     *
     * A delivery two days ago with nothing scanned yet was being ranked worst
     * in the list, ahead of items genuinely off the shelf. Either it has sat
     * long enough, or it sold in one of the comparison periods so we know it
     * normally moves — without one of those there is nothing to explain yet.
     *
     * "Long enough" is the item's own delivery interval rather than a flat
     * week (finding L): an item that arrives every four days has had its
     * chance by day five, and holding it to seven called a working shelf
     * Investigate. Floored at two days, because a delivery yesterday has told
     * us nothing whatever its cadence, and backed by a week when there are too
     * few deliveries to measure a cadence from.
     */
    const gap = deliveryGap(receipts);
    const chanceDays = Math.max(FRESH_DELIVERY_DAYS, gap ?? 7);
    const hadTime = (lastDays ?? 0) >= chanceDays;
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
    /**
     * What is standing there, in money.
     *
     * No price to quote — nothing sold, so there is no ring to read — and the
     * unit counts are already in the strip above. The one figure neither of
     * those carries is what the stock is worth, which is the size of the
     * problem and the reason to walk out and look at it.
     */
    const atCost =
      sd && sd.received > 0 && rulingCost !== null
        ? ` About ${money(round2(sd.received * rulingCost))} of stock at cost${costBasis}.`
        : "";

    /**
     * Name the right silence.
     *
     * When the delivery is newer than the item's own cadence, "nothing scanned
     * since" points at a delivery that has barely had a day — and the real
     * evidence is the run of flat days that came BEFORE it. Body Armor earned
     * Investigate on seven of those, and was told it had earned it on a
     * delivery from yesterday (finding L).
     */
    const flatBefore = lastDate ? flatDaysBefore(item.series, lastDate) : 0;
    const reason =
      lastDays !== null && gap !== null && lastDays < gap && flatBefore >= 2
        ? ` Nothing sold for ${flatBefore} days before it arrived, and nothing since.`
        : held;

    return {
      action: "investigate",
      evidence: `${inStock}${reason}${atCost}`,
      unaccounted,
    };
  }

  /**
   * Ran out partway through the window.
   *
   * The other Reorder tests both start from a delivery — how long ago it was,
   * or how much of it has sold — so neither can fire on a store with no invoice
   * trail, and Reorder reads zero there however empty the shelves get.
   *
   * This one reads the shelf instead of the paperwork: an item selling every
   * day that stops dead, with days still left in the window, went empty. That
   * is a stronger signal than a delivery date in any case — a date says what
   * should be there, sales say what was.
   *
   * Guarded three ways, because a slow mover looks the same as a stockout if
   * you squint: at least two days of sales to establish a rate, at least two
   * days of silence to rule out a quiet day, and a rate of at least a unit a
   * day so that "sold one on Monday and one on Tuesday" does not qualify.
   */
  const isoDaysBetween = (from: string, to: string) => {
    const [ay, am, ad] = from.split("-").map(Number);
    const [by, bm, bd] = to.split("-").map(Number);
    return Math.round(
      (Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000,
    );
  };

  const stockout = (() => {
    if (!windowEnd || sold <= 0) return null;
    const selling = item.series.filter((d) => d.units > 0);
    if (selling.length < 2) return null;
    const lastSale = selling[selling.length - 1].date;
    const dead = isoDaysBetween(lastSale, windowEnd);
    if (dead < 2) return null;
    const rate = sold / selling.length;
    if (rate < 1) return null;
    return { lastSale, dead, rate: round1(rate), missed: round1(rate * dead) };
  })();

  if (stockout) {
    return {
      action: "reorder",
      evidence: `Sold about ${stockout.rate} a day through ${shortDate(stockout.lastSale)}, then nothing for the last ${stockout.dead} days — roughly ${stockout.missed} units of missed sales. Looks like it ran out mid-week.${extraNote}`,
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
      evidence: `${inStock} ${regularSource} is ${money(regularPrice)}, below the ${money(rulingCost ?? 0)} ${costPhrase}. Margin ${pct.toFixed(1)}%.${regularSource === "Highest price seen" ? " Worth checking the shelf tag — if it reads higher than this, the gap is coming from a sale or a coupon." : ""}`,
      unaccounted,
    };
  }

  if (underCost && lastPrice && lastPrice.onSale) {
    /**
     * What the promotion actually cost, discounts included.
     *
     * `saleRevenue` is what the shelf asked. Register discounts are taken off
     * it, because they are money given away on the same units — the bacon's
     * $3.99 run looked like $44.60 and was $84.60 once its $40.00 of "DC" rows
     * were counted. Reporting the smaller figure understated the promotion by
     * nearly half.
     */
    const discount = Math.abs(lastPrice.saleDiscount);
    const givenAway = round2(
      (rulingCost ?? 0) * lastPrice.saleUnits -
        (lastPrice.saleRevenue + lastPrice.saleDiscount),
    );
    const run = `${lastPrice.saleDays} day${lastPrice.saleDays === 1 ? "" : "s"}, ${lastPrice.saleUnits} units`;
    /** Named separately rather than folded in, because the two are fixed in
     *  different places: the shelf promotion, and whatever is firing at the
     *  register on top of it. */
    const discountClause =
      discount > 0
        ? ` That includes ${money(discount)} taken at the register on top of the ${money(lastPrice.price)} — some of these units left at ${money(round2(lastPrice.price - discount / lastPrice.saleUnits))} or less.`
        : "";
    return {
      action: "reprice",
      /**
       * "On sale" is a claim the data supports, not an inference.
       *
       * `price_type` is a real POS field with REG for the regular price and
       * TPR/SALE for the two kinds of reduced one, and `isPromo` only fires on
       * types it recognises — an unknown or blank type establishes neither a
       * regular price nor a promotion. So this says the promotion out loud.
       */
      evidence: `${inStock} On sale at ${money(lastPrice.price)} since ${shortDate(lastPrice.saleStart)} — ${run} — against a ${money(rulingCost ?? 0)} cost.${rulingMargin === null ? "" : ` Margin ${rulingMargin.toFixed(1)}%,`} about ${money(givenAway)} given away.${discountClause}${regularPrice === null ? "" : ` ${regularSource} is ${money(regularPrice)}, so it is the promotion that is underwater.`}`,
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
      /**
       * "Cost and price steady" was asserted and never shown.
       *
       * It is the whole basis of the verdict — the reason this is Investigate
       * and not Reprice — so it prints the two figures it rests on. Without
       * them the reader has to take the one claim that matters on trust.
       */
      evidence: `${inStock} Down ${Math.abs(round1(item.lyPct!))}% on last year and ${Math.abs(round1(item.lwPct!))}% on last week.${
        lastPrice && rulingCost !== null
          ? ` It rang ${money(lastPrice.price)} against a ${money(rulingCost)} cost${rulingMargin === null ? "" : `, margin ${rulingMargin.toFixed(1)}%`}${costBasis} — neither moved.`
          : " Cost and price steady."
      } Nothing in the data explains it.`,
      unaccounted,
    };
  }

  /**
   * Nothing fired — but "no action" has to mean "checked and clean", not
   * "could not check". An item with no cost from either source never reached
   * the margin tests at all, and 3 of 523 products in a real department are
   * like that (Managers Special and other open-department keys).
   */
  if (rulingCost === null) {
    return {
      action: "insufficient",
      evidence: `${inStock} No cost on file from an invoice or from sales, so margin can't be judged. Trend ${trend === null ? "flat" : `${round1(trend)}%`}.`,
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
