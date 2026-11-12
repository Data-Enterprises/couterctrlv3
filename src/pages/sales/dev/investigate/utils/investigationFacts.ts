// Utils
import { calculateCogs } from "../../../../../utils/cogs";
import { isWeighted, pricedUnits } from "../../../../../utils/pricedUnits";
import { judge } from "./deptInvestigation";
import { codeOf } from ".";

// Interfaces
import type { GradingMetric } from "../../../../../features/dev/devSalesLedgerSlice";
import type { SubDeptMargin } from "../../../../../interfaces";
import type { Cause, ItemVerdict, InvestigationInput, CauseTotal, Summary, Decomposition, Tile } from "../interfaces";

/** `total_sales - total_tax`, the basis the whole Sales page is on — see the
 *  note in PopupSubDeptList for why it is not `net_sales`. */
const money = (r: SubDeptMargin, metric: GradingMetric) =>
  // On quantity, the figure is the unit the item is PRICED in — pounds on a
  // scale item, where `qty` counts rings. Same rule as the cost beside it.
  metric === "qty" ? pricedUnits(r.qty, r.weight) : r.total_sales - r.total_tax;

interface Tally {
  money: number;
  /**
   * Units in the unit the item is PRICED in.
   *
   * `pricedUnits`, not `qty`: on a scale item qty counts rings and weight
   * carries the pounds, which is the rule `calculateCogs` below already
   * follows and the rule the realised price depends on. Counting rings here
   * made a 1.7 lb ring of ground beef read as one unit at $8.46 — a package
   * total presented as a shelf price.
   */
  units: number;
  /** Summed per LINE, never derived from a total. Cost is per day and per
   *  item, and a week's cost is the sum of its days. */
  cogs: number;
  /** Always money, even when `money` above is a unit count. */
  dollars: number;
  /** Any row for this item carried a weight, so its units are pounds and its
   *  realised figure is a price per pound. */
  weighted: boolean;
  description: string;
  vendorName: string;
}

/** Item rows arrive one per DAY, so a week is several rows an item. */
const tally = (rows: SubDeptMargin[], metric: GradingMetric) =>
  rows.reduce<Record<string, Tally>>((acc, r) => {
    const key = codeOf(r.product_code);
    if (!acc[key]) {
      acc[key] = {
        money: 0,
        units: 0,
        cogs: 0,
        dollars: 0,
        weighted: false,
        description: r.product_description,
        vendorName: r.vendor_name,
      };
    }
    acc[key].money += money(r, metric);
    acc[key].units += pricedUnits(r.qty, r.weight);
    if (isWeighted(r.weight)) acc[key].weighted = true;
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

export const buildFacts = (input: InvestigationInput): ItemVerdict[] => {
  const mTw = tally(input.mineTw, input.metric);
  const mLw = tally(input.mineLw, input.metric);
  const mLy = tally(input.mineLy, input.metric);
  const tTw = tally(input.theirsTw, input.metric);
  const tLw = tally(input.theirsLw, input.metric);
  const tLy = tally(input.theirsLy, input.metric);

  const orderedBy = input.orders.reduce<Record<string, number>>((acc, o) => {
    const c = codeOf(o.product_code);
    acc[c] = (acc[c] ?? 0) + o.qty;
    return acc;
  }, {});

  // Receipts are nested one level down: the endpoint pages by RECEIVER, and
  // each carries the lines that matched.
  const receivedBy = input.receivers.reduce<Record<string, number>>((acc, r) => {
    r.lines.forEach((l) => {
      // `qty`, not `units`. On this endpoint's lines `qty` is the selling-unit
      // count and `cases` is how many cases they came in -- which is why Item
      // Actions derives its case size as qty / cases. `units` carries a
      // different thing depending on how the vendor billed, and on a
      // case-billed invoice it comes back 0, which read here as a delivery
      // that never arrived.
      const c = codeOf(l.product_code);
      acc[c] = (acc[c] ?? 0) + l.qty;
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
          // Either store selling it by weight makes it a weighted item; the
          // two cannot be on different units for the same product code.
          weighted: !!(mTw[c]?.weighted || tTw[c]?.weighted),
          mineCogs: at(mTw, c, "cogs"),
          theirsCogs: at(tTw, c, "cogs"),
          mineSales: at(mTw, c, "dollars"),
          theirsSales: at(tTw, c, "dollars"),
          orderedQty: orderedBy[c] ?? 0,
          receivedUnits: receivedBy[c] ?? 0,
        },
        input.bands,
        input.ordersKnown ?? true,
      ),
    )
    .sort((a, b) => a.gap - b.gap);
};

/* ------------------------------------------------------------------ */
/* Rolling it up                                                       */
/* ------------------------------------------------------------------ */

const CAUSE_ORDER: Cause[] = [
  "never-ordered",
  "not-carried",
  "not-received",
  "cost",
  "not-moving",
  "price-mix",
  "streamlined",
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
