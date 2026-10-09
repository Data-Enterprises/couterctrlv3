import type { Cause, ItemVerdict } from "./deptInvestigation";
import type { Focus } from "./deptReport";

/**
 * The three steps the items grid does not already answer.
 *
 * The comparison report hands over a SYMPTOM — nothing rung, fewer units,
 * took less per unit, a different mix — worked out from department totals.
 * These take that claim to the items:
 *
 *   1  Does it hold?     the items agree with the report, or they do not
 *   2  Where is it?      a few items, or thousands
 *   5  Who fixes it?     the causes sorted into lists with an owner
 *
 * Steps 3 and 4 — the grid and an item's evidence — are built already.
 *
 * Nothing here grades anything. The only judgements made are whether the
 * report's call survives contact with the items, and whether a finding names
 * a record somebody can act on.
 */

/* ------------------------------------------------------------------ */
/* 1 · Does it hold?                                                   */
/* ------------------------------------------------------------------ */

export interface Bucket {
  items: number;
  dollars: number;
}

export interface Holds {
  /** Rang at the counterpart and not here at all. */
  onlyTheirs: Bucket;
  /** Rang at both, less here. */
  bothLess: Bucket;
  /** Rang at both, more here. */
  bothMore: Bucket;
  /**
   * Whether the items tell the same story the department totals did.
   *
   * Not a grade — a check that the next four steps are worth taking. A
   * department reading as pure volume whose items are all present and simply
   * selling for less means the units never went missing; they were never
   * carried differently in the first place.
   */
  verdict: "holds" | "overturned";
  /** What the items say, in the verdict's own terms. */
  says: string;
}

/**
 * A supply-shaped symptom expects the shortfall to sit in items we did not
 * ring at all; a rate-shaped one expects it in items we did.
 *
 * Keyed on the report's `focus` because that is what travels with the
 * target — the gate it points at is the same reading as the finding it came
 * from, one step shorter.
 */
const EXPECTS_SUPPLY: Record<Focus, boolean> = {
  ringing: true,
  orders: true,
  price: false,
  mix: false,
  unknown: true,
};

/** How the report put it, for the line that opens the notebook. */
export const FOCUS_SAYS: Record<Focus, string> = {
  ringing: "nothing rang here all week",
  orders: "it sold fewer units than the other store",
  price: "it took less for every unit it did sell",
  mix: "it is selling a different mix",
  unknown: "it is a little under across the board",
};

const add = (b: Bucket, gap: number): Bucket => ({
  items: b.items + 1,
  dollars: b.dollars + gap,
});

export const holdsUp = (items: ItemVerdict[], focus: Focus): Holds => {
  let onlyTheirs: Bucket = { items: 0, dollars: 0 };
  let bothLess: Bucket = { items: 0, dollars: 0 };
  let bothMore: Bucket = { items: 0, dollars: 0 };

  for (const i of items) {
    // Units, not money: an item can ring for nothing and still have sold.
    const here = i.mineUnits > 0;
    const there = i.theirsUnits > 0;
    if (!here && there) onlyTheirs = add(onlyTheirs, i.gap);
    else if (here && there) {
      if (i.gap < 0) bothLess = add(bothLess, i.gap);
      else bothMore = add(bothMore, i.gap);
    }
  }

  const supplyLed =
    Math.abs(onlyTheirs.dollars) >= Math.abs(bothLess.dollars);
  const verdict = EXPECTS_SUPPLY[focus] === supplyLed ? "holds" : "overturned";

  const says =
    verdict === "holds"
      ? supplyLed
        ? "Most of the gap is items the other store rang and this one did not."
        : "Most of the gap is items both stores rang, where this one took less."
      : supplyLed
        ? "The report called it price, but most of the gap is items this store never rang at all."
        : "The report called it volume, but the items were here — they took less.";

  return { onlyTheirs, bothLess, bothMore, verdict, says };
};

/* ------------------------------------------------------------------ */
/* 2 · Where is it?                                                    */
/* ------------------------------------------------------------------ */

export interface VendorShare {
  vendorName: string;
  items: number;
  dollars: number;
}

export interface Spread {
  /** Behind-items, worst first. */
  ranked: ItemVerdict[];
  /** How many of them it takes to reach half the shortfall. */
  toHalf: number;
  /** What the ten biggest account for, 0–1. */
  topTenShare: number;
  /**
   * Whether a short list carries it.
   *
   * The same cumulative rule the comparison report cuts on, rather than a
   * second threshold: list items until they reach half, and if that takes
   * more than a dozen the shortfall is spread — which is a finding, and the
   * reason to group by vendor instead of printing a top ten nobody can act
   * on.
   */
  concentrated: boolean;
  byVendor: VendorShare[];
  says: string;
}

/** Past this many items to reach half, a list has stopped being a list. */
const A_LIST = 12;

export const spreadOf = (items: ItemVerdict[]): Spread => {
  const ranked = items.filter((i) => i.gap < 0).sort((a, b) => a.gap - b.gap);
  const shortfall = ranked.reduce((t, i) => t - i.gap, 0);

  let running = 0;
  let toHalf = 0;
  for (const i of ranked) {
    if (running >= shortfall / 2) break;
    running -= i.gap;
    toHalf += 1;
  }

  const topTen = ranked.slice(0, 10).reduce((t, i) => t - i.gap, 0);
  const topTenShare = shortfall > 0 ? topTen / shortfall : 0;
  const concentrated = toHalf > 0 && toHalf <= A_LIST;

  const vendors = new Map<string, VendorShare>();
  for (const i of ranked) {
    const name = i.vendorName || "Unknown vendor";
    const at = vendors.get(name) ?? { vendorName: name, items: 0, dollars: 0 };
    at.items += 1;
    at.dollars += i.gap;
    vendors.set(name, at);
  }
  const byVendor = [...vendors.values()].sort((a, b) => a.dollars - b.dollars);

  const pct = Math.round(topTenShare * 100);
  const says = concentrated
    ? `A short list carries it — ${toHalf} ${toHalf === 1 ? "item is" : "items are"} half the shortfall.`
    : `No short list carries it. The ten biggest items are ${pct}% of the shortfall, and the rest is spread across ${ranked.length.toLocaleString("en-US")}.`;

  return { ranked, toHalf, topTenShare, concentrated, byVendor, says };
};

/* ------------------------------------------------------------------ */
/* 5 · Who fixes it?                                                   */
/* ------------------------------------------------------------------ */

export type Owner = "buyer" | "vendor" | "price" | null;

export const OWNER_LABEL: Record<Exclude<Owner, null>, string> = {
  buyer: "Buyer",
  vendor: "Vendor",
  price: "Whoever sets price",
};

/**
 * A list is actionable when the evidence names a RECORD: an order that does
 * not exist, an invoice that never arrived, a price that differs from theirs,
 * a cost that is higher. It is not actionable when the evidence is only an
 * absence of sales.
 *
 * That line is why "not moving" gets no owner. It means the goods were here,
 * priced comparably, and did not sell — which could be the shelf, or could be
 * that the other store has different customers walking in. Handing it to the
 * store team names a culprit the data does not identify.
 */
const DESK: Record<Cause, Owner> = {
  "never-ordered": "buyer",
  "not-received": "vendor",
  cost: "buyer",
  "price-mix": "price",
  "not-moving": null,
  unclassified: null,
  ahead: null,
};

export interface Desk {
  cause: Cause;
  owner: Owner;
  /** False where the finding is real but names nothing to act on. */
  actionable: boolean;
  items: ItemVerdict[];
  dollars: number;
  says: string;
}

const SAYS: Record<Cause, (n: number, money: string) => string> = {
  "never-ordered": (n, m) =>
    `${n.toLocaleString("en-US")} items with no order here in the window, worth ${m} at the other store.`,
  "not-received": (n, m) =>
    `${n.toLocaleString("en-US")} items ordered here that never arrived, worth ${m}.`,
  cost: (n, m) =>
    `${n.toLocaleString("en-US")} items bought for more here than there, costing ${m} of margin.`,
  "price-mix": (n, m) =>
    `${n.toLocaleString("en-US")} items that sold here but took less per unit, worth ${m}.`,
  "not-moving": (n, m) =>
    `${n.toLocaleString("en-US")} items on the shelf here that sold less than there, worth ${m}. Nothing in this data says why.`,
  unclassified: (n, m) =>
    `${m} across ${n.toLocaleString("en-US")} items with no cause this data can support.`,
  ahead: (n, m) => `${n.toLocaleString("en-US")} items ahead, worth ${m}.`,
};

/**
 * The causes as lists, biggest first.
 *
 * `ahead` is left out: it is not work for anybody. Everything else appears,
 * including the two that cannot be handed over, because a shortfall that
 * quietly vanishes from the hand-off is a shortfall somebody will find again
 * later and not trust.
 */
export const desksOf = (
  items: ItemVerdict[],
  money: (v: number) => string,
): Desk[] => {
  const by = new Map<Cause, ItemVerdict[]>();
  for (const i of items) {
    if (i.cause === "ahead") continue;
    const at = by.get(i.cause);
    if (at) at.push(i);
    else by.set(i.cause, [i]);
  }

  return [...by.entries()]
    .map(([cause, rows]) => {
      const dollars = rows.reduce((t, r) => t + r.gap, 0);
      const owner = DESK[cause];
      return {
        cause,
        owner,
        actionable: owner !== null,
        items: rows.sort((a, b) => a.gap - b.gap),
        dollars,
        says: SAYS[cause](rows.length, money(Math.abs(dollars))),
      };
    })
    .sort((a, b) => a.dollars - b.dollars);
};
