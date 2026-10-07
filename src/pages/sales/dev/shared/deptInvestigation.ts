import type {
  AllOrder,
  ReceiverItemSearchReceiver,
  SubDeptMargin,
  SubsPricePoint,
} from "../../../../interfaces";
import { calculateCogs } from "../../../../utils/cogs";
import type { GradingMetric } from "../../../../features/dev/devSalesLedgerSlice";

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

/**
 * What went wrong with one item.
 *
 * Ordered by who owns the fix, which is also the order the tests run in:
 * a store with nothing on the shelf cannot have a price problem, so supply
 * failures are settled before anything else is considered.
 */
export type Cause =
  | "never-ordered"
  | "not-received"
  | "cost"
  | "not-moving"
  | "price-mix"
  | "ahead"
  | "unclassified";

export interface Bands {
  /** How far a realised price has to move before it is the explanation.
   *  0.08 = 8% either way. */
  price: number;
  /**
   * How much dearer a unit has to be to buy before that is the explanation.
   *
   * Tighter than the price band, because a buying difference is a standing
   * one. A sell price moves with a promotion and comes back; paying 5% more
   * for the same case is every case, every week, until somebody renegotiates.
   */
  cost: number;
  /** Dollars below which an item is not worth a verdict. Rounding and a
   *  single unit of drift are not findings. */
  floor: number;
}

export const DEFAULT_BANDS: Bands = { price: 0.08, cost: 0.05, floor: 5 };

/** One item's week at both stores, with the open store's supply events.
 *
 *  `orderedQty` and `receivedUnits` are deliberately NOT comparable to each
 *  other: orders carry `qty` with a separate `casesize`, receipts carry
 *  `units` already multiplied out. Nothing here divides one by the other —
 *  only whether each is present is ever asked, and sell-through uses units
 *  sold against units received, which are both real unit counts. */
export interface ItemFacts {
  productCode: string;
  description: string;
  vendorName: string;
  mineTy: number;
  theirsTy: number;
  mineLw: number;
  theirsLw: number;
  mineLy: number;
  theirsLy: number;
  mineUnits: number;
  theirsUnits: number;
  /**
   * What the goods cost each store, through the shared `calculateCogs`.
   *
   * Not a cost column read straight off the row: that helper takes `net_cost`
   * over `cost`, because list price ignores a vendor allowance that roughly
   * half of any delivery carries, and `weight` over `qty`, because on a scale
   * item qty counts rings rather than pounds. Both mistakes are worth whole
   * percentage points of margin — see the note on the helper.
   */
  mineCogs: number;
  theirsCogs: number;
  /**
   * Sales in MONEY, whatever metric the page is set to.
   *
   * `mineTy` is the metric figure and becomes a unit count when the page is
   * switched to quantity. Margin is money less money — pairing a unit count
   * with a cost would produce a confident number that means nothing — so the
   * dollars are carried separately and margin is always built from these.
   */
  mineSales: number;
  theirsSales: number;
  orderedQty: number;
  receivedUnits: number;
}

export interface Margins {
  /** Sales less what the goods cost, per store. */
  mine: number;
  theirs: number;
  /** Ours minus theirs, from the open store's side. */
  diff: number;
  /** Cost per unit, each. Null without units to divide by. */
  minePerUnit: number | null;
  theirsPerUnit: number | null;
  /**
   * What the per-unit difference took on the units WE sold.
   *
   * Negative when we pay more. Deliberately not a ratio: "you paid $0.23 more
   * a unit on 488 units" is the sentence somebody acts on, and a percentage
   * hides how much of it there was.
   */
  costPenalty: number | null;
}

export interface Ratios {
  /** Ours over theirs. Null where theirs is zero — there is no ratio to a
   *  store that sold none, and 0/0 is not 1. */
  units: number | null;
  dollars: number | null;
  /** Realised price, ours over theirs. Above 1 means we are dearer. */
  price: number | null;
  /** Units sold over units received in the same window. Null without a
   *  receipt: an item sold from existing stock has no sell-through to report
   *  for this week, and calling that 0% would read as a failure. */
  sellThrough: number | null;
}

export interface ItemVerdict extends ItemFacts {
  /** Ours minus theirs, from the open store's side — negative is behind. */
  gap: number;
  cause: Cause;
  ratios: Ratios;
  margins: Margins;
}

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
 * after all of that is named `unclassified` rather than guessed at.
 */
export const causeOf = (f: ItemFacts, bands: Bands = DEFAULT_BANDS): Cause => {
  const gap = f.mineTy - f.theirsTy;
  const ordered = f.orderedQty > 0;
  const received = f.receivedUnits > 0;

  // The two supply failures come first wherever the sales landed: an item
  // that never reached the shelf cannot be explained by what it cost or what
  // it was priced at.
  if (!ordered && !received && f.mineTy === 0 && f.theirsTy > 0)
    return "never-ordered";
  if (ordered && !received && gap < 0) return "not-received";

  // Then buying terms — BEFORE "ahead", and that order is the point. An item
  // can sell more here and still make less, because it is bought for more.
  // Settling "ahead" on the sales gap alone called that a win.
  if (costsMore(f, bands)) return "cost";

  if (gap >= 0) return "ahead";
  if (Math.abs(gap) < bands.floor) return "unclassified";

  const mine = realised(f.mineTy, f.mineUnits);
  const theirs = realised(f.theirsTy, f.theirsUnits);
  if (mine !== null && theirs !== null && theirs > 0) {
    if (Math.abs(mine / theirs - 1) > bands.price) return "price-mix";
  }

  // It was here, it was priced like theirs, and it still did not sell.
  if (received || f.mineUnits > 0) return "not-moving";

  return "unclassified";
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

export const judge = (f: ItemFacts, bands: Bands = DEFAULT_BANDS): ItemVerdict => ({
  ...f,
  gap: f.mineTy - f.theirsTy,
  cause: causeOf(f, bands),
  ratios: ratiosOf(f),
  margins: marginsOf(f),
});

/* ------------------------------------------------------------------ */
/* Turning the three responses into facts                              */
/* ------------------------------------------------------------------ */

/** `total_sales - total_tax`, the basis the whole Sales page is on — see the
 *  note in PopupSubDeptList for why it is not `net_sales`. */
const money = (r: SubDeptMargin, metric: GradingMetric) =>
  metric === "qty" ? r.qty : r.total_sales - r.total_tax;

interface Tally {
  money: number;
  units: number;
  /** Summed per LINE, never derived from a total. Cost is per day and per
   *  item, and a week's cost is the sum of its days. */
  cogs: number;
  /** Always money, even when `money` above is a unit count. */
  dollars: number;
  description: string;
  vendorName: string;
}

/** Item rows arrive one per DAY, so a week is several rows an item. */
const tally = (rows: SubDeptMargin[], metric: GradingMetric) =>
  rows.reduce<Record<string, Tally>>((acc, r) => {
    const key = r.product_code;
    if (!acc[key]) {
      acc[key] = {
        money: 0,
        units: 0,
        cogs: 0,
        dollars: 0,
        description: r.product_description,
        vendorName: r.vendor_name,
      };
    }
    acc[key].money += money(r, metric);
    acc[key].units += r.qty;
    acc[key].dollars += r.total_sales - r.total_tax;
    acc[key].cogs += calculateCogs(
      r.net_cost,
      r.cost,
      r.case_size,
      r.qty,
      r.weight,
    );
    return acc;
  }, {});

export interface InvestigationInput {
  mineTw: SubDeptMargin[];
  mineLw: SubDeptMargin[];
  mineLy: SubDeptMargin[];
  theirsTw: SubDeptMargin[];
  theirsLw: SubDeptMargin[];
  theirsLy: SubDeptMargin[];
  /** The OPEN store's orders only, already narrowed to this department. The
   *  question is about our supply chain, not theirs. */
  orders: AllOrder[];
  receivers: ReceiverItemSearchReceiver[];
  metric: GradingMetric;
  bands?: Bands;
}

export const buildFacts = (input: InvestigationInput): ItemVerdict[] => {
  const mTw = tally(input.mineTw, input.metric);
  const mLw = tally(input.mineLw, input.metric);
  const mLy = tally(input.mineLy, input.metric);
  const tTw = tally(input.theirsTw, input.metric);
  const tLw = tally(input.theirsLw, input.metric);
  const tLy = tally(input.theirsLy, input.metric);

  const orderedBy = input.orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.product_code] = (acc[o.product_code] ?? 0) + o.qty;
    return acc;
  }, {});

  // Receipts are nested one level down: the endpoint pages by RECEIVER, and
  // each carries the lines that matched.
  const receivedBy = input.receivers.reduce<Record<string, number>>((acc, r) => {
    r.lines.forEach((l) => {
      acc[l.product_code] = (acc[l.product_code] ?? 0) + l.units;
    });
    return acc;
  }, {});

  // Every product either store touched in any period. An item one of them
  // does not carry at all is the finding, not a row to drop.
  const codes = [
    ...new Set([
      ...Object.keys(mTw), ...Object.keys(mLw), ...Object.keys(mLy),
      ...Object.keys(tTw), ...Object.keys(tLw), ...Object.keys(tLy),
    ]),
  ];

  const at = (
    m: Record<string, Tally>,
    c: string,
    field: "money" | "units" | "cogs" | "dollars",
  ) => m[c]?.[field] ?? 0;

  return codes
    .map((c) =>
      judge(
        {
          productCode: c,
          description:
            mTw[c]?.description ?? tTw[c]?.description ??
            mLy[c]?.description ?? tLy[c]?.description ?? c,
          vendorName:
            mTw[c]?.vendorName ?? tTw[c]?.vendorName ??
            mLy[c]?.vendorName ?? tLy[c]?.vendorName ?? "",
          mineTy: at(mTw, c, "money"),
          theirsTy: at(tTw, c, "money"),
          mineLw: at(mLw, c, "money"),
          theirsLw: at(tLw, c, "money"),
          mineLy: at(mLy, c, "money"),
          theirsLy: at(tLy, c, "money"),
          mineUnits: at(mTw, c, "units"),
          theirsUnits: at(tTw, c, "units"),
          mineCogs: at(mTw, c, "cogs"),
          theirsCogs: at(tTw, c, "cogs"),
          mineSales: at(mTw, c, "dollars"),
          theirsSales: at(tTw, c, "dollars"),
          orderedQty: orderedBy[c] ?? 0,
          receivedUnits: receivedBy[c] ?? 0,
        },
        input.bands,
      ),
    )
    .sort((a, b) => a.gap - b.gap);
};

/* ------------------------------------------------------------------ */
/* Rolling it up                                                       */
/* ------------------------------------------------------------------ */

export interface CauseTotal {
  cause: Cause;
  dollars: number;
  items: number;
}

export interface VendorTotal {
  vendorName: string;
  dollars: number;
  items: number;
  /** The cause that accounts for most of this vendor's shortfall. One vendor
   *  owning one cause is the cluster worth finding. */
  leadCause: Cause | null;
}

export interface Summary {
  gap: number;
  byCause: CauseTotal[];
  byVendor: VendorTotal[];
}

const CAUSE_ORDER: Cause[] = [
  "never-ordered",
  "not-received",
  "cost",
  "not-moving",
  "price-mix",
  "unclassified",
  "ahead",
];

export const summarise = (items: ItemVerdict[]): Summary => {
  const causes = new Map<Cause, CauseTotal>();
  items.forEach((i) => {
    const t = causes.get(i.cause) ?? { cause: i.cause, dollars: 0, items: 0 };
    t.dollars += i.gap;
    t.items += 1;
    causes.set(i.cause, t);
  });

  const vendors = new Map<string, { dollars: number; items: number; by: Map<Cause, number> }>();
  items
    .filter((i) => i.gap < 0)
    .forEach((i) => {
      const name = i.vendorName || "Unknown vendor";
      const v = vendors.get(name) ?? { dollars: 0, items: 0, by: new Map() };
      v.dollars += i.gap;
      v.items += 1;
      v.by.set(i.cause, (v.by.get(i.cause) ?? 0) + i.gap);
      vendors.set(name, v);
    });

  return {
    gap: items.reduce((a, i) => a + i.gap, 0),
    byCause: CAUSE_ORDER.filter((c) => causes.has(c)).map(
      (c) => causes.get(c) as CauseTotal,
    ),
    byVendor: [...vendors.entries()]
      .map(([vendorName, v]) => ({
        vendorName,
        dollars: v.dollars,
        items: v.items,
        leadCause:
          [...v.by.entries()].sort((a, b) => a[1] - b[1])[0]?.[0] ?? null,
      }))
      .sort((a, b) => a.dollars - b.dollars),
  };
};



/* ------------------------------------------------------------------ */
/* The gap, decomposed                                                 */
/* ------------------------------------------------------------------ */

export interface Step {
  cause: Cause;
  dollars: number;
}

export interface Decomposition {
  /** What the comparison store did. The bar the walk starts from. */
  theirs: number;
  /** What this store did. Where it lands. */
  mine: number;
  steps: Step[];
}

/**
 * From their week to ours, one cause at a time.
 *
 * EXACT, not modelled. Every item's gap is `mineTy - theirsTy`, so summing
 * them is `mineTotal - theirsTotal` by construction: the walk starts on their
 * number, takes each cause in turn, and lands on ours with nothing left over.
 * There is no "expected at their rate" anywhere in it, which means no
 * assumption a reader has to accept before the chart means anything.
 *
 * Causes come back in CAUSE_ORDER — the order they are owned in, worst first
 * — rather than by size, so the same shape reads the same way twice.
 */
export const decompose = (items: ItemVerdict[]): Decomposition => {
  const byCause = new Map<Cause, number>();
  let mine = 0;
  let theirs = 0;

  items.forEach((i) => {
    mine += i.mineTy;
    theirs += i.theirsTy;
    byCause.set(i.cause, (byCause.get(i.cause) ?? 0) + i.gap);
  });

  return {
    theirs,
    mine,
    steps: CAUSE_ORDER.filter((c) => byCause.has(c)).map((c) => ({
      cause: c,
      dollars: byCause.get(c) as number,
    })),
  };
};

/* ------------------------------------------------------------------ */
/* The same gap, as a hierarchy                                        */
/* ------------------------------------------------------------------ */

export interface Tile {
  /** Identity at this level — a cause key, a vendor name, or a UPC. */
  key: string;
  label: string;
  /** Always positive: area cannot encode a sign, so this side of the screen
   *  is about losses and the tiles say how big. */
  value: number;
  items: number;
  /** Whether there is a level under this one worth opening. */
  deeper: boolean;
}

/**
 * What to draw at one level of the drill.
 *
 * Cause, then vendor, then item — the order a finding narrows in. Six items
 * all failing to arrive from one vendor on one order date is ONE missed
 * delivery, and no item-by-item read ever surfaces that; the vendor level is
 * the whole reason this view exists.
 *
 * Losses only. A store that is ahead on an item has nothing to explain, and
 * mixing winners in would have the areas cancelling each other.
 */
export const tilesAt = (items: ItemVerdict[], path: string[]): Tile[] => {
  const losses = items.filter((i) => i.gap < 0);

  const roll = (
    rows: ItemVerdict[],
    keyOf: (i: ItemVerdict) => string,
    labelOf: (i: ItemVerdict) => string,
    deeper: boolean,
  ): Tile[] => {
    const m = new Map<string, { label: string; value: number; items: number }>();
    rows.forEach((i) => {
      const k = keyOf(i);
      const t = m.get(k) ?? { label: labelOf(i), value: 0, items: 0 };
      t.value += Math.abs(i.gap);
      t.items += 1;
      m.set(k, t);
    });
    return [...m.entries()]
      .map(([key, t]) => ({ key, label: t.label, value: t.value, items: t.items, deeper }))
      .sort((a, b) => b.value - a.value);
  };

  if (path.length === 0) {
    return roll(
      losses.filter((i) => i.cause !== "ahead"),
      (i) => i.cause,
      (i) => i.cause,
      true,
    );
  }

  const inCause = losses.filter((i) => i.cause === path[0]);

  if (path.length === 1) {
    return roll(
      inCause,
      (i) => i.vendorName || "Unknown vendor",
      (i) => i.vendorName || "Unknown vendor",
      true,
    );
  }

  return inCause
    .filter((i) => (i.vendorName || "Unknown vendor") === path[1])
    .map((i) => ({
      key: i.productCode,
      label: i.description,
      value: Math.abs(i.gap),
      items: 1,
      deeper: false,
    }))
    .sort((a, b) => b.value - a.value);
};

/* ------------------------------------------------------------------ */
/* One item's supply, in date order                                    */
/* ------------------------------------------------------------------ */

export interface SupplyEvent {
  /** ISO day. Both endpoints hand back a timestamp; only the day matters. */
  date: string;
  kind: "ordered" | "received";
  /** Orders report `qty` with a separate case size; receipts report units
   *  already multiplied out. The unit is named rather than assumed, because
   *  these two are NOT the same thing and nothing here divides one by the
   *  other. */
  amount: number;
  unit: "cases" | "units";
  detail: string;
}

const day = (v: string) => (v ?? "").split("T")[0];

/**
 * What happened to one item, at one store, in date order.
 *
 * This is the evidence behind the cause. "Didn't arrive" is a label a reader
 * has to take on trust until they can see an order on the 22nd with nothing
 * against it — so the timeline is not a decoration, it is the proof.
 *
 * It states only what each source actually says. There is no "short"
 * event: deciding a delivery came up short would mean dividing receipt units
 * by order cases, and an order's case size is its own column for a reason.
 * Two orders and one receipt are shown as exactly that, and the reader can
 * see the gap without being told a number that might be wrong.
 */
export const supplyTimeline = (
  productCode: string,
  orders: AllOrder[],
  receivers: ReceiverItemSearchReceiver[],
): SupplyEvent[] => {
  const out: SupplyEvent[] = [];

  orders
    .filter((o) => o.product_code === productCode)
    .forEach((o) =>
      out.push({
        date: day(o.order_date),
        kind: "ordered",
        amount: o.qty,
        unit: "cases",
        detail: [o.status, o.vendor_name].filter(Boolean).join(" · "),
      }),
    );

  receivers.forEach((r) =>
    r.lines
      .filter((l) => l.product_code === productCode)
      .forEach((l) =>
        out.push({
          date: day(r.invoice_date),
          kind: "received",
          amount: l.units,
          unit: "units",
          detail: [r.vendor_name, `inv ${r.invoiceid}`].filter(Boolean).join(" · "),
        }),
      ),
  );

  // Oldest first: the story reads forwards, and an order with nothing after
  // it is only obviously an order with nothing after it in that order.
  return out.sort((a, b) => a.date.localeCompare(b.date));
};

/* ------------------------------------------------------------------ */
/* True price points                                                   */
/* ------------------------------------------------------------------ */

export interface PricePoint {
  price: number;
  units: number;
  transactions: number;
  netSales: number;
  days: number;
  /** Units over transactions. Above 1 by any margin is a multi-buy showing
   *  up, and it is the one thing only the transaction count can tell you. */
  unitsPerBasket: number | null;
}

export interface PriceLadder {
  points: PricePoint[];
  /** The price the most UNITS rang at — what an item actually sold for. */
  modal: number | null;
  /**
   * Money over units across every point.
   *
   * Carried so a caller can show what an average WOULD have said, beside the
   * prices that really rang. On an item that spent six days at $1.00 and two
   * at $1.29 the average is a price nobody ever paid, and the gap between it
   * and `modal` is the whole reason this payload exists.
   */
  blended: number | null;
  unitsPerBasket: number | null;
  /** More than one price, and far enough apart to be a decision rather than
   *  a scale item's rounding. */
  promo: boolean;
}

export const ladderFor = (
  points: SubsPricePoint[],
  productCode: string,
  bands: Bands = DEFAULT_BANDS,
): PriceLadder => {
  const mine = points
    .filter((p) => p.product_code === productCode)
    .map((p) => ({
      price: p.price,
      units: p.units,
      transactions: p.transactions,
      netSales: p.net_sales,
      days: p.days,
      unitsPerBasket: p.transactions > 0 ? p.units / p.transactions : null,
    }))
    .sort((a, b) => b.units - a.units);

  const units = mine.reduce((a, p) => a + p.units, 0);
  const sales = mine.reduce((a, p) => a + p.netSales, 0);
  const txns = mine.reduce((a, p) => a + p.transactions, 0);

  const prices = mine.map((p) => p.price);
  const spread =
    prices.length > 1 ? Math.max(...prices) / Math.min(...prices) - 1 : 0;

  return {
    points: mine,
    modal: mine.length ? mine[0].price : null,
    blended: units > 0 ? sales / units : null,
    unitsPerBasket: txns > 0 ? units / txns : null,
    promo: mine.length > 1 && spread > bands.price,
  };
};
