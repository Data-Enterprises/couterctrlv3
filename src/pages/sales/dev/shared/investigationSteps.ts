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

/* ------------------------------------------------------------------ */
/* The department's own vitals                                         */
/* ------------------------------------------------------------------ */

export interface Vitals {
  /** The gap to the counterpart in each of the three periods. "Against
   *  itself" — whether this is a standing difference or something that broke
   *  in the last seven days. */
  weeks: { label: string; gap: number }[];
  /**
   * This store as a percentage of the counterpart, on three measures.
   *
   * One rule for all three, so measures that disagree are SEEN to disagree:
   * units at 102 beside sales at 76 is a department selling as much and
   * taking less, and reading that out of six absolute figures is work the
   * eye should not have to do.
   */
  index: { label: string; mine: number; theirs: number; pct: number | null }[];
}

export const vitalsOf = (items: ItemVerdict[]): Vitals => {
  const sum = (pick: (i: ItemVerdict) => number) =>
    items.reduce((t, i) => t + pick(i), 0);

  const mineSales = sum((i) => i.mineSales);
  const theirsSales = sum((i) => i.theirsSales);
  const mineUnits = sum((i) => i.mineUnits);
  const theirsUnits = sum((i) => i.theirsUnits);
  const mineMargin = sum((i) => i.margins.mine);
  const theirsMargin = sum((i) => i.margins.theirs);

  // Null rather than zero where there is nothing to be a percentage OF: a
  // counterpart that took nothing is not a store we are at 0% of.
  const share = (mine: number, theirs: number) =>
    theirs > 0 ? (mine / theirs) * 100 : null;

  return {
    weeks: [
      { label: "Last year", gap: sum((i) => i.mineLy) - sum((i) => i.theirsLy) },
      { label: "Last week", gap: sum((i) => i.mineLw) - sum((i) => i.theirsLw) },
      { label: "This week", gap: mineSales - theirsSales },
    ],
    index: [
      { label: "Sales", mine: mineSales, theirs: theirsSales, pct: share(mineSales, theirsSales) },
      { label: "Units", mine: mineUnits, theirs: theirsUnits, pct: share(mineUnits, theirsUnits) },
      { label: "Margin", mine: mineMargin, theirs: theirsMargin, pct: share(mineMargin, theirsMargin) },
    ],
  };
};

/* ------------------------------------------------------------------ */
/* Supply · what each store ordered, and what arrived                  */
/* ------------------------------------------------------------------ */

/**
 * The proof behind "never ordered".
 *
 * Everything else in this notebook takes our word for a cause: an item is
 * labelled never-ordered and the reader is asked to believe there is no
 * order. These are the orders and the invoices themselves, both stores side
 * by side, so the label can be checked rather than trusted.
 *
 * Read over the SUPPLY window — a fortnight — which does not line up with
 * the sales week. It can account for this week and says nothing about last
 * week or last year.
 */
export interface SupplyVendor {
  name: string;
  units: number;
  cost: number;
}

export interface StoreSupply {
  /** Distinct orders, not lines: five lines on one order is one order. */
  orders: number;
  orderLines: number;
  orderedUnits: number;
  deliveries: number;
  receivedUnits: number;
  receivedCost: number;
  vendors: SupplyVendor[];
}

/**
 * One order, or one invoice, as the document itself rather than a total.
 *
 * The counts above answer "how many"; these answer "which ones, and when".
 * A buyer checking a never-ordered label wants the dates, because four
 * orders at the other store and one here is the finding, and two counts
 * side by side hide the week it stopped.
 */
export interface SupplyRecord {
  id: number;
  date: string;
  vendor: string;
  /** Lines in THIS department, not on the whole document. */
  lines: number;
  units: number;
  cost: number;
  /** Orders carry one; invoices do not. */
  status: string | null;
  mine: boolean;
}

export interface Supply {
  mine: StoreSupply;
  theirs: StoreSupply;
  /** Both stores' documents, newest first. */
  orders: SupplyRecord[];
  deliveries: SupplyRecord[];
  /** Vendors that delivered to one store and not the other. A supplier they
   *  buy from and we do not is a buying decision, not an accident. */
  onlyTheirs: string[];
  onlyMine: string[];
}

interface OrderLine {
  order_id: number;
  order_date: string;
  status: string;
  product_code: string;
  qty: number;
  vendor_name: string;
}

interface ReceiptLine {
  product_code: string;
  units: number;
  ext_cost: number;
  item_return: number;
}

interface Receipt {
  invoiceid: number;
  invoice_date: string;
  vendor_name: string;
  lines: ReceiptLine[];
}

const sideOf = (
  orders: OrderLine[],
  receipts: Receipt[],
  codes: Set<string>,
): StoreSupply => {
  // Both payloads are department-wide; narrow to the items this comparison
  // is actually about, or a store's figures carry lines nobody is looking at.
  const lines = orders.filter((o) => codes.has(String(o.product_code)));
  const vendors = new Map<string, SupplyVendor>();
  let deliveries = 0;
  let receivedUnits = 0;
  let receivedCost = 0;

  for (const r of receipts) {
    const mine = r.lines.filter((l) => codes.has(String(l.product_code)));
    if (mine.length === 0) continue;
    deliveries += 1;
    const name = r.vendor_name || "Unknown vendor";
    const at = vendors.get(name) ?? { name, units: 0, cost: 0 };
    for (const l of mine) {
      // A return is not a delivery, and counting one as units arriving
      // would close a gap that is still open.
      const units = l.item_return ? -l.units : l.units;
      at.units += units;
      at.cost += l.ext_cost;
      receivedUnits += units;
      receivedCost += l.ext_cost;
    }
    vendors.set(name, at);
  }

  return {
    orders: new Set(lines.map((o) => o.order_id)).size,
    orderLines: lines.length,
    orderedUnits: lines.reduce((t, o) => t + o.qty, 0),
    deliveries,
    receivedUnits,
    receivedCost,
    vendors: [...vendors.values()].sort((a, b) => b.units - a.units),
  };
};

/**
 * The department's order lines folded back into the orders they came on.
 *
 * Five lines on one order is one record, matching the `orders` count above:
 * a list that showed five would say the store ordered five times.
 */
const orderRecords = (
  lines: OrderLine[],
  codes: Set<string>,
  mine: boolean,
): SupplyRecord[] => {
  const by = new Map<number, SupplyRecord>();
  for (const o of lines) {
    if (!codes.has(String(o.product_code))) continue;
    const at =
      by.get(o.order_id) ??
      {
        id: o.order_id,
        date: o.order_date,
        vendor: o.vendor_name || "Unknown vendor",
        lines: 0,
        units: 0,
        cost: 0,
        status: o.status || null,
        mine,
      };
    at.lines += 1;
    at.units += o.qty;
    by.set(o.order_id, at);
  }
  return [...by.values()];
};

/** The invoices, counted the same way `deliveries` counts them. */
const deliveryRecords = (
  receipts: Receipt[],
  codes: Set<string>,
  mine: boolean,
): SupplyRecord[] =>
  receipts
    .map((r) => {
      const lines = r.lines.filter((l) => codes.has(String(l.product_code)));
      return {
        id: r.invoiceid,
        date: r.invoice_date,
        vendor: r.vendor_name || "Unknown vendor",
        lines: lines.length,
        units: lines.reduce(
          (t, l) => t + (l.item_return ? -l.units : l.units),
          0,
        ),
        cost: lines.reduce((t, l) => t + l.ext_cost, 0),
        status: null,
        mine,
      };
    })
    // An invoice carrying nothing in this department did not deliver it,
    // however many other lines it had.
    .filter((r) => r.lines > 0);

/** Newest first, with the id breaking a tie so the order is stable. */
const newestFirst = (a: SupplyRecord, b: SupplyRecord) =>
  b.date.localeCompare(a.date) || b.id - a.id;

/**
 * What the orders and deliveries amount to, in a sentence.
 *
 * Every other tab opens with its finding; this one opened with two cards of
 * counts and left the reader to subtract. The lead is what happened, the
 * tail is the arithmetic behind it.
 *
 * It never says why. "Nobody ordered it" is a fact about the orders; whose
 * fault that is belongs to the hand-off, which knows about owners.
 */
export const supplySays = (
  supply: Supply,
  us: string,
  them: string,
): { lead: string; tail: string } => {
  const m = supply.mine;
  const t = supply.theirs;
  const whole = (v: number) => Math.round(v).toLocaleString("en-US");
  const many = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;

  const ordered =
    m.orders > 0 && t.orders > 0
      ? "Both stores ordered."
      : m.orders > 0
        ? `Only ${us} ordered.`
        : t.orders > 0
          ? `Only ${them} ordered.`
          : "Neither store ordered this department.";

  const took =
    m.deliveries > 0 && t.deliveries > 0
      ? "Both took deliveries."
      : m.deliveries > 0
        ? `Only ${us} took a delivery.`
        : t.deliveries > 0
          ? `Only ${them} took a delivery.`
          : "Neither took a delivery in the window.";

  const counts = [
    t.orders > 0
      ? `${them} ordered ${whole(t.orderedUnits)} units on ${many(t.orders, "order")}.`
      : "",
    m.orders > 0
      ? `${us} ordered ${whole(m.orderedUnits)} on ${many(m.orders, "order")}.`
      : "",
  ].filter(Boolean);

  /* A status every order agrees on is worth a clause; a mix of them is a
     column in the list, not a sentence. */
  const states = [...new Set(supply.orders.map((o) => o.status).filter(Boolean))];
  if (states.length === 1 && supply.orders.length > 0) {
    counts.push(
      supply.orders.length === 1
        ? `It reads ${states[0]}.`
        : `All ${supply.orders.length} read ${states[0]}.`,
    );
  }

  return { lead: `${ordered} ${took}`, tail: counts.join(" ") };
};

export const supplyOf = (
  orders: { mine: OrderLine[]; theirs: OrderLine[] },
  receipts: { mine: Receipt[]; theirs: Receipt[] },
  items: ItemVerdict[],
): Supply => {
  const codes = new Set(items.map((i) => i.productCode));
  const mine = sideOf(orders.mine, receipts.mine, codes);
  const theirs = sideOf(orders.theirs, receipts.theirs, codes);
  const mineNames = new Set(mine.vendors.map((v) => v.name));
  const theirNames = new Set(theirs.vendors.map((v) => v.name));

  return {
    mine,
    theirs,
    orders: [
      ...orderRecords(orders.mine, codes, true),
      ...orderRecords(orders.theirs, codes, false),
    ].sort(newestFirst),
    deliveries: [
      ...deliveryRecords(receipts.mine, codes, true),
      ...deliveryRecords(receipts.theirs, codes, false),
    ].sort(newestFirst),
    onlyTheirs: theirs.vendors.filter((v) => !mineNames.has(v.name)).map((v) => v.name),
    onlyMine: mine.vendors.filter((v) => !theirNames.has(v.name)).map((v) => v.name),
  };
};
