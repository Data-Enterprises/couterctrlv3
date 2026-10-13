import { describe, it, expect } from "vitest";
import {
  buildFacts,
  causeOf,
  judge,
  ladderFor,
  ladderSays,
  type PriceLadder,
  marginsOf,
  decompose,
  ratiosOf,
  summarise,
  supplyTimeline,
  tilesAt,
  DEFAULT_BANDS,
  type ItemFacts,
} from "./deptInvestigation";
import type {
  AllOrder,
  ReceiverItemSearchReceiver,
  SubDeptMargin,
  SubsPricePoint,
} from "../../../../interfaces";

const facts = (over: Partial<ItemFacts> = {}): ItemFacts => ({
  productCode: "0001",
  description: "Thing",
  vendorName: "Acme",
  mineTy: 0,
  theirsTy: 0,
  mineLw: 0,
  theirsLw: 0,
  mineLy: 0,
  theirsLy: 0,
  mineUnits: 0,
  theirsUnits: 0,
  weighted: false,
  mineCogs: 0,
  theirsCogs: 0,
  // In money mode the metric figure and the dollar figure are the same
  // number, so a test states its sales once and the factory mirrors them.
  // Where they diverge — quantity mode — is tested explicitly.
  mineSales: over.mineTy ?? 0,
  theirsSales: over.theirsTy ?? 0,
  orderedQty: 0,
  receivedUnits: 0,
  ...over,
});

const row = (over: Partial<SubDeptMargin> = {}): SubDeptMargin => ({
  storeid: 1,
  sale_date: "2026-10-01",
  store_number: "010",
  store_name: "Leitchfield",
  product_code: "0001",
  product_description: "Thing",
  price_type: "R",
  vendor_id: "V1",
  vendor_name: "Acme",
  sub_department: 7,
  sub_department_description: "Grocery",
  sale_type: "S",
  total_sales: 0,
  net_sales: 0,
  total_tax: 0,
  qty: 0,
  weight: 0,
  cost: 0,
  case_size: 1,
  calculated_cost: 0,
  margin: 0,
  cost_fees: 0,
  net_cost: 0,
  ...over,
});

const order = (code: string, qty: number, over: Partial<AllOrder> = {}) =>
  ({ product_code: code, qty, ...over }) as AllOrder;

const receiver = (
  lines: Array<[string, number]>,
  over: Partial<ReceiverItemSearchReceiver> = {},
) =>
  ({
    lines: lines.map(([product_code, units]) => ({ product_code, units })),
    ...over,
  }) as ReceiverItemSearchReceiver;

const point = (over: Partial<SubsPricePoint> = {}): SubsPricePoint => ({
  storeid: 1,
  store_number: "010",
  store_name: "Leitchfield",
  product_code: "0001",
  product_description: "Thing",
  price: 1,
  units: 0,
  transactions: 0,
  net_sales: 0,
  first_sold: "2026-09-28",
  last_sold: "2026-10-04",
  days: 1,
  days_sold: [],
  ...over,
});

describe("causeOf", () => {
  it("calls an item we are winning 'ahead' before anything else is asked", () => {
    // Ordered nothing, received nothing, but still ahead: no problem to name.
    expect(causeOf(facts({ mineTy: 500, theirsTy: 100 }))).toBe("ahead");
  });

  it("treats an exact tie as ahead rather than inventing a cause", () => {
    expect(causeOf(facts({ mineTy: 100, theirsTy: 100 }))).toBe("ahead");
  });

  it("ignores a gap under the floor", () => {
    expect(causeOf(facts({ mineTy: 98, theirsTy: 100 }))).toBe("unclassified");
  });

  it("names an item with no order and no sale 'never-ordered'", () => {
    expect(causeOf(facts({ mineTy: 0, theirsTy: 2840 }))).toBe("never-ordered");
  });

  it("names an item ordered but never received 'not-received'", () => {
    expect(
      causeOf(facts({ mineTy: 310, theirsTy: 2180, mineUnits: 200, theirsUnits: 1400, orderedQty: 10 })),
    ).toBe("not-received");
  });

  it("puts the supply failure ahead of the price test", () => {
    // Realised price is wildly out (2.00 against 1.00), which would read as
    // price-mix on its own. It was ordered and never arrived, so it is not.
    const f = facts({
      mineTy: 200, mineUnits: 100,
      theirsTy: 1000, theirsUnits: 1000,
      orderedQty: 12,
    });
    expect(ratiosOf(f).price).toBe(2);
    expect(causeOf(f)).toBe("not-received");
  });

  it("does not call an item never-ordered when it clearly sold", () => {
    // No order in the lookback, but it sold all week off existing stock.
    const f = facts({
      mineTy: 400, mineUnits: 400,
      theirsTy: 800, theirsUnits: 800,
    });
    expect(causeOf(f)).not.toBe("never-ordered");
    expect(causeOf(f)).toBe("not-moving");
  });

  it("names a dearer item 'price-mix'", () => {
    // 1.49 against 1.058 — 41% dearer, well past the 8% band.
    const f = facts({
      mineTy: 980.66, mineUnits: 658,
      theirsTy: 1640.12, theirsUnits: 1550,
      receivedUnits: 720,
    });
    expect(causeOf(f)).toBe("price-mix");
  });

  it("names a cheaper item 'price-mix' too — the band is two-sided", () => {
    const f = facts({
      mineTy: 500, mineUnits: 1000,
      theirsTy: 900, theirsUnits: 900,
      receivedUnits: 1000,
    });
    expect(causeOf(f)).toBe("price-mix");
  });

  it("names a same-priced item that did not sell 'not-moving'", () => {
    const f = facts({
      mineTy: 500, mineUnits: 500,
      theirsTy: 900, theirsUnits: 900,
      receivedUnits: 600,
    });
    expect(ratiosOf(f).price).toBe(1);
    expect(causeOf(f)).toBe("not-moving");
  });

  it("respects a widened price band", () => {
    const f = facts({
      mineTy: 550, mineUnits: 500,
      theirsTy: 900, theirsUnits: 900,
      receivedUnits: 600,
    });
    expect(causeOf(f)).toBe("price-mix");
    expect(causeOf(f, { ...DEFAULT_BANDS, price: 0.2 })).toBe("not-moving");
  });
});

describe("ratiosOf", () => {
  it("returns null rather than zero where the other store sold none", () => {
    const r = ratiosOf(facts({ mineTy: 100, mineUnits: 50 }));
    expect(r.units).toBeNull();
    expect(r.dollars).toBeNull();
    expect(r.price).toBeNull();
  });

  it("reports sell-through only where something was received", () => {
    expect(ratiosOf(facts({ mineUnits: 658 })).sellThrough).toBeNull();
    expect(
      ratiosOf(facts({ mineUnits: 360, receivedUnits: 720 })).sellThrough,
    ).toBe(0.5);
  });

  it("puts units and dollars apart when the price differs", () => {
    // The two disagreeing is what names a price problem: we lost more volume
    // than money, so we were dearer.
    const r = ratiosOf(
      facts({ mineTy: 980.66, mineUnits: 658, theirsTy: 1640.12, theirsUnits: 1550 }),
    );
    expect(r.units).toBeCloseTo(0.4245, 3);
    expect(r.dollars).toBeCloseTo(0.5979, 3);
    expect(r.price as number).toBeGreaterThan(1.4);
  });
});

describe("judge", () => {
  it("states the gap from the open store's side", () => {
    expect(judge(facts({ mineTy: 310, theirsTy: 2180 })).gap).toBe(-1870);
  });
});

describe("buildFacts", () => {
  const base = {
    mineLw: [], mineLy: [], theirsLw: [], theirsLy: [],
    orders: [], receivers: [], metric: "sales" as const,
  };

  it("sums the daily rows an item arrives as", () => {
    const out = buildFacts({
      ...base,
      mineTw: [
        row({ total_sales: 110, total_tax: 10, qty: 5 }),
        row({ total_sales: 220, total_tax: 20, qty: 9 }),
      ],
      theirsTw: [],
    });
    expect(out).toHaveLength(1);
    expect(out[0].mineTy).toBe(300);
    expect(out[0].mineUnits).toBe(14);
  });

  describe("items sold by weight", () => {
    /* The failure this guards: 160 packages of chicken thighs weighing 506 lb
       counted as 160 units, so the realised price read $4.30 a package where
       the shelf said $1.36 a pound — and the cost beside it, which already
       followed weight, disagreed with it. */
    it("counts pounds, not rings", () => {
      const out = buildFacts({
        ...base,
        mineTw: [
          row({ total_sales: 688.19, total_tax: 0, qty: 160, weight: 506.03 }),
        ],
        theirsTw: [],
      });
      expect(out[0].mineUnits).toBeCloseTo(506.03, 2);
      expect(out[0].weighted).toBe(true);
    });

    it("still counts rings where nothing was weighed", () => {
      const out = buildFacts({
        ...base,
        mineTw: [row({ total_sales: 100, total_tax: 0, qty: 25, weight: 0 })],
        theirsTw: [],
      });
      expect(out[0].mineUnits).toBe(25);
      expect(out[0].weighted).toBe(false);
    });

    it("counts pounds on the quantity metric too", () => {
      const out = buildFacts({
        ...base,
        metric: "qty",
        mineTw: [row({ total_sales: 688.19, qty: 160, weight: 506.03 })],
        theirsTw: [],
      });
      expect(out[0].mineTy).toBeCloseTo(506.03, 2);
    });

    it("makes the realised figure a price per pound", () => {
      const out = buildFacts({
        ...base,
        mineTw: [
          row({ total_sales: 688.19, total_tax: 0, qty: 160, weight: 506.03 }),
        ],
        theirsTw: [
          row({
            store_number: "020",
            total_sales: 344.1,
            total_tax: 0,
            qty: 80,
            weight: 253.0,
          }),
        ],
      });
      // Both stores sell it at the same $1.36/lb, so the price ratio is 1 —
      // which counting rings would have reported as 1 as well, by accident.
      // What matters is that the figure behind it is a rate per pound.
      const mine = out[0].mineTy / out[0].mineUnits;
      expect(mine).toBeCloseTo(1.36, 2);
    });

    it("is weighted when either store weighs it", () => {
      const out = buildFacts({
        ...base,
        mineTw: [row({ total_sales: 10, qty: 2, weight: 0 })],
        theirsTw: [
          row({ store_number: "020", total_sales: 10, qty: 2, weight: 7.5 }),
        ],
      });
      // One product code cannot be in pounds at one store and rings at
      // another, so the pair is read in the unit either of them priced it in.
      expect(out[0].weighted).toBe(true);
    });
  });

  it("uses sales net of tax, not net_sales", () => {
    const out = buildFacts({
      ...base,
      mineTw: [row({ total_sales: 110, total_tax: 10, net_sales: 42 })],
      theirsTw: [],
    });
    expect(out[0].mineTy).toBe(100);
  });

  it("counts units when the metric is qty", () => {
    const out = buildFacts({
      ...base,
      metric: "qty",
      mineTw: [row({ total_sales: 110, total_tax: 10, qty: 7 })],
      theirsTw: [],
    });
    expect(out[0].mineTy).toBe(7);
  });

  it("keeps an item only one store carries", () => {
    const out = buildFacts({
      ...base,
      mineTw: [],
      theirsTw: [row({ product_code: "9999", total_sales: 500, product_description: "Theirs only" })],
    });
    expect(out).toHaveLength(1);
    expect(out[0].productCode).toBe("9999");
    expect(out[0].description).toBe("Theirs only");
    expect(out[0].mineTy).toBe(0);
  });

  it("names an item from whichever period carries it", () => {
    const out = buildFacts({
      ...base,
      mineTw: [],
      theirsTw: [],
      mineLy: [row({ product_code: "7", product_description: "Last year only" })],
    });
    expect(out[0].description).toBe("Last year only");
  });

  it("reads receipt lines out of the receivers that hold them", () => {
    const out = buildFacts({
      ...base,
      mineTw: [row({ product_code: "A", total_sales: 100, qty: 40 })],
      theirsTw: [row({ product_code: "A", total_sales: 400, qty: 160 })],
      orders: [order("A", 10)],
      receivers: [receiver([["A", 50]]), receiver([["A", 30], ["B", 99]])],
    });
    const a = out.find((i) => i.productCode === "A");
    expect(a?.receivedUnits).toBe(80);
    expect(a?.orderedQty).toBe(10);
  });

  it("ignores receipts for items outside the department's sales", () => {
    const out = buildFacts({
      ...base,
      mineTw: [row({ product_code: "A", total_sales: 100 })],
      theirsTw: [],
      receivers: [receiver([["ZZZ", 500]])],
    });
    expect(out.map((i) => i.productCode)).toEqual(["A"]);
  });

  it("sorts the worst gap first", () => {
    const out = buildFacts({
      ...base,
      mineTw: [],
      theirsTw: [
        row({ product_code: "small", total_sales: 100 }),
        row({ product_code: "big", total_sales: 900 }),
      ],
    });
    expect(out.map((i) => i.productCode)).toEqual(["big", "small"]);
  });

  it("classifies the missed-delivery case end to end", () => {
    const out = buildFacts({
      ...base,
      mineTw: [row({ product_code: "C", total_sales: 310, qty: 200 })],
      theirsTw: [row({ product_code: "C", total_sales: 2180, qty: 1400 })],
      orders: [order("C", 10)],
      receivers: [],
    });
    expect(out[0].cause).toBe("not-received");
  });
});

describe("summarise", () => {
  const items = [
    judge(facts({ productCode: "a", vendorName: "P&G", mineTy: 0, theirsTy: 1000, orderedQty: 6 })),
    judge(facts({ productCode: "b", vendorName: "P&G", mineTy: 0, theirsTy: 600, orderedQty: 4 })),
    judge(facts({ productCode: "c", vendorName: "Coke", mineTy: 0, theirsTy: 400 })),
    judge(facts({ productCode: "d", vendorName: "Coke", mineTy: 900, theirsTy: 300 })),
  ];

  it("totals the gap over every item, winners included", () => {
    // -1000 -600 -400 +600
    expect(summarise(items).gap).toBe(-1400);
  });

  it("groups by cause in a fixed order, worst owner first", () => {
    const by = summarise(items).byCause;
    expect(by.map((c) => c.cause)).toEqual(["never-ordered", "not-received", "ahead"]);
    expect(by[0].dollars).toBe(-400);
    expect(by[0].items).toBe(1);
  });

  it("leaves a cause out entirely when nothing fell into it", () => {
    expect(summarise(items).byCause.map((c) => c.cause)).not.toContain("price-mix");
  });

  it("rolls vendors up over losses only, so a winner cannot mask a cluster", () => {
    const v = summarise(items).byVendor;
    expect(v[0].vendorName).toBe("P&G");
    expect(v[0].dollars).toBe(-1600);
    expect(v[0].items).toBe(2);
    // Coke's +600 winner is excluded; only its -400 loss counts.
    const coke = v.find((x) => x.vendorName === "Coke");
    expect(coke?.dollars).toBe(-400);
    expect(coke?.items).toBe(1);
  });

  it("names the cause carrying most of a vendor's shortfall", () => {
    expect(summarise(items).byVendor[0].leadCause).toBe("not-received");
  });

  it("buckets a missing vendor name rather than dropping the item", () => {
    const v = summarise([judge(facts({ vendorName: "", mineTy: 0, theirsTy: 50 }))]);
    expect(v.byVendor[0].vendorName).toBe("Unknown vendor");
  });
});

describe("ladderFor", () => {
  const points = [
    point({ product_code: "K", price: 1.0, units: 1240, transactions: 620, net_sales: 1240, days: 6 }),
    point({ product_code: "K", price: 1.29, units: 310, transactions: 295, net_sales: 399.9, days: 2 }),
    point({ product_code: "OTHER", price: 9.99, units: 10, transactions: 10, net_sales: 99.9, days: 1 }),
  ];

  it("keeps only the asked-for item", () => {
    expect(ladderFor(points, "K").points).toHaveLength(2);
  });

  it("orders the ladder by units, so the price most of it sold at leads", () => {
    expect(ladderFor(points, "K").points[0].price).toBe(1.0);
  });

  it("reports the modal price, not the average", () => {
    expect(ladderFor(points, "K").modal).toBe(1.0);
  });

  it("reports the blended average too, which is a price nobody paid", () => {
    const l = ladderFor(points, "K");
    expect(l.blended as number).toBeCloseTo(1.058, 3);
    expect(l.blended).not.toBe(l.modal);
  });

  it("exposes units per basket, which only the transaction count can give", () => {
    const l = ladderFor(points, "K");
    expect(l.points[0].unitsPerBasket).toBe(2);
    expect(l.points[1].unitsPerBasket as number).toBeCloseTo(1.051, 3);
    expect(l.unitsPerBasket as number).toBeCloseTo(1.694, 3);
  });

  it("calls a real spread a promotion", () => {
    expect(ladderFor(points, "K").promo).toBe(true);
  });

  it("does not call one price a promotion", () => {
    expect(ladderFor(points, "OTHER").promo).toBe(false);
  });

  it("does not call a trivial spread a promotion", () => {
    const close = [
      point({ product_code: "S", price: 2.0, units: 100, transactions: 100, net_sales: 200 }),
      point({ product_code: "S", price: 2.05, units: 50, transactions: 50, net_sales: 102.5 }),
    ];
    expect(ladderFor(close, "S").promo).toBe(false);
  });

  it("answers emptily for an item with no points at all", () => {
    const l = ladderFor(points, "nothing");
    expect(l.points).toEqual([]);
    expect(l.modal).toBeNull();
    expect(l.blended).toBeNull();
    expect(l.unitsPerBasket).toBeNull();
    expect(l.promo).toBe(false);
  });

  it("does not divide by a zero transaction count", () => {
    const odd = [point({ product_code: "Z", price: 3, units: 9, transactions: 0, net_sales: 27 })];
    expect(ladderFor(odd, "Z").points[0].unitsPerBasket).toBeNull();
    expect(ladderFor(odd, "Z").unitsPerBasket).toBeNull();
  });
});


describe("supplyTimeline", () => {
  it("reads forwards, oldest first", () => {
    const out = supplyTimeline(
      "A",
      [order("A", 10, { order_date: "2026-09-29" })],
      [receiver([["A", 12]], { invoice_date: "2026-09-24", invoiceid: 1 })],
    );
    expect(out.map((e) => e.date)).toEqual(["2026-09-24", "2026-09-29"]);
  });

  it("keeps the day and drops the timestamp both endpoints send", () => {
    const out = supplyTimeline("A", [order("A", 1, { order_date: "2026-09-22T00:00:00" })], []);
    expect(out[0].date).toBe("2026-09-22");
  });

  it("names the unit rather than assuming the two agree", () => {
    const out = supplyTimeline(
      "A",
      [order("A", 10, { order_date: "2026-09-22" })],
      [receiver([["A", 24]], { invoice_date: "2026-09-24" })],
    );
    expect(out[0]).toMatchObject({ kind: "ordered", amount: 10, unit: "cases" });
    expect(out[1]).toMatchObject({ kind: "received", amount: 24, unit: "units" });
  });

  it("never invents a 'short' event", () => {
    // 10 cases ordered, 2 units in. Saying "8 short" would divide units by
    // cases; the two events are shown and the reader draws the conclusion.
    const out = supplyTimeline(
      "A",
      [order("A", 10, { order_date: "2026-09-22" })],
      [receiver([["A", 2]], { invoice_date: "2026-10-03" })],
    );
    expect(out.map((e) => e.kind)).toEqual(["ordered", "received"]);
  });

  it("shows an order with nothing against it as exactly that", () => {
    const out = supplyTimeline("A", [order("A", 10, { order_date: "2026-09-22" })], []);
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe("ordered");
  });

  it("ignores other items on the same order and the same invoice", () => {
    const out = supplyTimeline(
      "A",
      [order("A", 1, { order_date: "2026-09-22" }), order("B", 9, { order_date: "2026-09-22" })],
      [receiver([["B", 50], ["A", 4]], { invoice_date: "2026-09-24" })],
    );
    expect(out).toHaveLength(2);
    expect(out[1].amount).toBe(4);
  });

  it("reads every line of every receiver, not just the first", () => {
    const out = supplyTimeline("A", [], [
      receiver([["A", 2]], { invoice_date: "2026-09-24", invoiceid: 1 }),
      receiver([["A", 3]], { invoice_date: "2026-09-30", invoiceid: 2 }),
    ]);
    expect(out.map((e) => e.amount)).toEqual([2, 3]);
  });

  it("carries the vendor and invoice so an event can be chased", () => {
    const out = supplyTimeline("A", [], [
      receiver([["A", 2]], { invoice_date: "2026-09-24", invoiceid: 884120, vendor_name: "P&G" }),
    ]);
    expect(out[0].detail).toBe("P&G · inv 884120");
  });

  it("is empty for an item with no supply at all", () => {
    expect(supplyTimeline("ZZZ", [order("A", 1)], [receiver([["A", 1]])])).toEqual([]);
  });
});


describe("decompose", () => {
  const items = [
    judge(facts({ productCode: "a", mineTy: 0, theirsTy: 1000 })),
    judge(facts({ productCode: "b", mineTy: 300, theirsTy: 2000, mineUnits: 200, theirsUnits: 1400, orderedQty: 6 })),
    judge(facts({ productCode: "c", mineTy: 900, theirsTy: 300 })),
  ];

  it("walks from their week to ours with nothing left over", () => {
    const d = decompose(items);
    const landed = d.steps.reduce((a, s) => a + s.dollars, d.theirs);
    expect(d.theirs).toBe(3300);
    expect(d.mine).toBe(1200);
    // Exact by construction: the gaps ARE mine minus theirs, item by item.
    expect(landed).toBe(d.mine);
  });

  it("keeps a winner as a step up rather than hiding it", () => {
    const ahead = decompose(items).steps.find((s) => s.cause === "ahead");
    expect(ahead?.dollars).toBe(600);
  });

  it("orders the steps by who owns them, not by size", () => {
    expect(decompose(items).steps.map((s) => s.cause)).toEqual([
      "never-ordered",
      "not-received",
      "ahead",
    ]);
  });

  it("is a flat walk when there is nothing to explain", () => {
    const d = decompose([judge(facts({ mineTy: 500, theirsTy: 500 }))]);
    expect(d.theirs).toBe(d.mine);
  });
});

describe("tilesAt", () => {
  const items = [
    judge(facts({ productCode: "a", vendorName: "P&G", mineTy: 0, theirsTy: 1000, orderedQty: 4 })),
    judge(facts({ productCode: "b", vendorName: "P&G", mineTy: 0, theirsTy: 600, orderedQty: 2 })),
    judge(facts({ productCode: "c", vendorName: "Coke", mineTy: 0, theirsTy: 400 })),
    judge(facts({ productCode: "d", vendorName: "Coke", mineTy: 900, theirsTy: 300 })),
  ];

  it("opens on causes, biggest first", () => {
    const t = tilesAt(items, []);
    expect(t.map((x) => x.key)).toEqual(["not-received", "never-ordered"]);
    expect(t[0].value).toBe(1600);
    expect(t[0].items).toBe(2);
  });

  it("leaves winners out — area cannot carry a sign", () => {
    expect(tilesAt(items, []).map((x) => x.key)).not.toContain("ahead");
  });

  it("drills a cause into its vendors, which is where a cluster shows", () => {
    const t = tilesAt(items, ["not-received"]);
    expect(t).toHaveLength(1);
    expect(t[0].key).toBe("P&G");
    expect(t[0].value).toBe(1600);
  });

  it("drills a vendor into its items, and stops there", () => {
    const t = tilesAt(items, ["not-received", "P&G"]);
    expect(t.map((x) => x.key)).toEqual(["a", "b"]);
    expect(t.every((x) => x.deeper === false)).toBe(true);
  });

  it("does not leak an item from another cause into a vendor's tiles", () => {
    expect(tilesAt(items, ["never-ordered", "Coke"]).map((x) => x.key)).toEqual(["c"]);
  });

  it("buckets a missing vendor name rather than dropping the item", () => {
    const t = tilesAt([judge(facts({ vendorName: "", mineTy: 0, theirsTy: 90 }))], ["never-ordered"]);
    expect(t[0].key).toBe("Unknown vendor");
  });
});

describe("cost as a cause", () => {
  /** Ahead on sales, dearer to buy. 1.41 a unit against 1.18. */
  const dearer = facts({
    mineTy: 912.4, mineUnits: 488, mineCogs: 688.08,
    theirsTy: 741.15, theirsUnits: 402, theirsCogs: 474.36,
  });

  it("fires even when the item is AHEAD on sales", () => {
    // The whole point. Settling "ahead" on the sales gap called this a win:
    // it sold $171 more and made $42 less.
    expect(dearer.mineTy - dearer.theirsTy).toBeGreaterThan(0);
    expect(causeOf(dearer)).toBe("cost");
  });

  it("still puts a supply failure first — ordered and not delivered", () => {
    // Nothing reached the shelf, so what it would have cost is moot.
    const missing = facts({
      mineTy: 0, mineUnits: 0, mineCogs: 0,
      theirsTy: 741.15, theirsUnits: 402, theirsCogs: 474.36,
      orderedQty: 10,
    });
    expect(causeOf(missing)).toBe("not-received");
  });

  it("still puts a supply failure first — never ordered at all", () => {
    const missing = facts({
      mineTy: 0, mineUnits: 0, mineCogs: 0,
      theirsTy: 741.15, theirsUnits: 402, theirsCogs: 474.36,
    });
    expect(causeOf(missing)).toBe("never-ordered");
  });

  it("needs the gap to be wide enough", () => {
    // 2% dearer is inside the band and is not a finding.
    const close = facts({
      mineTy: 900, mineUnits: 500, mineCogs: 510,
      theirsTy: 900, theirsUnits: 500, theirsCogs: 500,
    });
    expect(causeOf(close)).not.toBe("cost");
  });

  it("needs the gap to be worth real money", () => {
    // 40% dearer, on four units: eighty pence. Noise, not a buying problem.
    const tiny = facts({
      mineTy: 12, mineUnits: 4, mineCogs: 2.8,
      theirsTy: 12, theirsUnits: 4, theirsCogs: 2,
    });
    expect(causeOf(tiny)).not.toBe("cost");
  });

  it("never fires on being CHEAPER to buy", () => {
    const cheaper = facts({
      mineTy: 900, mineUnits: 500, mineCogs: 400,
      theirsTy: 900, theirsUnits: 500, theirsCogs: 600,
    });
    expect(causeOf(cheaper)).not.toBe("cost");
  });

  it("says nothing without units on both sides to divide by", () => {
    const noUnits = facts({
      mineTy: 900, mineUnits: 0, mineCogs: 400,
      theirsTy: 900, theirsUnits: 500, theirsCogs: 300,
    });
    expect(causeOf(noUnits)).not.toBe("cost");
  });
});

describe("marginsOf", () => {
  const dearer = facts({
    mineTy: 912.4, mineUnits: 488, mineCogs: 688.08,
    theirsTy: 741.15, theirsUnits: 402, theirsCogs: 474.36,
  });

  it("is sales less what the goods cost", () => {
    const m = marginsOf(dearer);
    expect(m.mine).toBeCloseTo(224.32, 2);
    expect(m.theirs).toBeCloseTo(266.79, 2);
  });

  it("can be negative while the sales gap is positive", () => {
    const m = marginsOf(dearer);
    expect(dearer.mineTy - dearer.theirsTy).toBeCloseTo(171.25, 2);
    expect(m.diff).toBeCloseTo(-42.47, 2);
  });

  it("gives cost per unit each side", () => {
    const m = marginsOf(dearer);
    expect(m.minePerUnit).toBeCloseTo(1.41, 2);
    expect(m.theirsPerUnit).toBeCloseTo(1.18, 2);
  });

  it("states the penalty in money on the units WE sold", () => {
    // (1.18 - 1.41) x 488. Negative because we pay more.
    expect(marginsOf(dearer).costPenalty).toBeCloseTo(-112.24, 1);
  });

  it("has no per-unit cost or penalty without units", () => {
    const m = marginsOf(facts({ mineTy: 10, theirsTy: 10 }));
    expect(m.minePerUnit).toBeNull();
    expect(m.theirsPerUnit).toBeNull();
    expect(m.costPenalty).toBeNull();
  });
});

describe("buildFacts and cost", () => {
  const base = {
    mineLw: [], mineLy: [], theirsLw: [], theirsLy: [],
    orders: [], receivers: [], metric: "sales" as const,
  };

  it("sums cogs per LINE rather than deriving it from a total", () => {
    // Two days, a case of 12 at 24.00 — 2.00 a unit — 5 then 7 units.
    const out = buildFacts({
      ...base,
      mineTw: [
        row({ total_sales: 30, qty: 5, net_cost: 24, cost: 26, case_size: 12 }),
        row({ total_sales: 42, qty: 7, net_cost: 24, cost: 26, case_size: 12 }),
      ],
      theirsTw: [],
    });
    expect(out[0].mineCogs).toBeCloseTo(24, 5);
  });

  it("takes net_cost over list cost, as the shared helper does", () => {
    // list 26, net 24 — the allowance is the whole point of the helper.
    const out = buildFacts({
      ...base,
      mineTw: [row({ total_sales: 30, qty: 12, net_cost: 24, cost: 26, case_size: 12 })],
      theirsTw: [],
    });
    expect(out[0].mineCogs).toBeCloseTo(24, 5);
  });

  it("takes weight over qty on a scale item", () => {
    // Rung 3 times for 6.3 lb at 1.00 a lb: 6.30, not 3.00.
    const out = buildFacts({
      ...base,
      mineTw: [row({ total_sales: 12, qty: 3, weight: 6.3, net_cost: 1, cost: 1, case_size: 0 })],
      theirsTw: [],
    });
    expect(out[0].mineCogs).toBeCloseTo(6.3, 5);
  });

  it("builds margin from money even when the page is counting units", () => {
    // The page's metric drives mineTy; it must not drive margin. Taking a
    // unit count away from a cost gives a number that looks like money and
    // is not — here it would have said 5 - 10 = -5 and coloured it red.
    const out = buildFacts({
      ...base,
      metric: "qty",
      mineTw: [row({ total_sales: 30, qty: 5, net_cost: 24, cost: 26, case_size: 12 })],
      theirsTw: [],
    });
    expect(out[0].mineTy).toBe(5);
    expect(out[0].mineSales).toBeCloseTo(30, 5);
    expect(out[0].mineCogs).toBeCloseTo(10, 5);
    expect(out[0].margins.mine).toBeCloseTo(20, 5);
  });
});

describe("ladderSays", () => {
  const pt = (
    price: number,
    units: number,
    transactions = units,
    days = 1,
  ) => ({
    price,
    units,
    transactions,
    netSales: price * units,
    days,
    unitsPerBasket: transactions > 0 ? units / transactions : null,
  });

  const of = (
    points: ReturnType<typeof pt>[],
    weighted = false,
  ): PriceLadder => ({
    points,
    weighted,
    modal: points.length
      ? points.reduce((m, p) => (p.units > m.units ? p : m)).price
      : null,
    blended: null,
    unitsPerBasket: null,
    promo: false,
  });

  /** One price is its own summary; the ladder's single row says it. */
  it("says nothing about a single price", () => {
    expect(ladderSays(of([pt(5, 100)]))).toBeNull();
    expect(ladderSays(of([]))).toBeNull();
  });

  it("gives the span and where the units went", () => {
    const say = ladderSays(of([pt(5.0, 135), pt(4.99, 40), pt(6.19, 3)]))!;
    expect(say).toContain("Rang at 3 prices from $4.99 to $6.19.");
    // $4.99 and $5.00 are one price as far as a shopper is concerned.
    expect(say).toContain("Most units went at $4.99–$5.00 (175 of 178).");
  });

  /** Units over baskets is the only thing the transaction count can tell
   *  you, so a basket taking four at a time is worth the clause. */
  it("names a multi-buy when a basket took several at once", () => {
    const say = ladderSays(of([pt(5.0, 140, 35), pt(6.5, 10, 10)]))!;
    expect(say).toContain("At $5.00 a basket took 4.0 at a time.");
  });

  it("leaves the clause off when every basket took one", () => {
    const say = ladderSays(of([pt(5.0, 140, 140), pt(6.5, 10, 10)]))!;
    expect(say).not.toContain("at a time");
  });
});

describe("a ladder for an item sold by weight", () => {
  const pt = (price: number, units: number, transactions = units, days = 1) => ({
    storeid: 1,
    store_number: "010",
    store_name: "Leitchfield",
    product_code: "0001",
    product_description: "Ground beef",
    price,
    units,
    transactions,
    net_sales: price * units,
    first_sold: "2026-10-01",
    last_sold: "2026-10-01",
    days,
    days_sold: ["2026-10-01"],
  });

  /* The screenshot this came from: four packages of 75% lean ground beef
     ringing $7.62, $7.97, $8.11 and $8.46, every one of them a single scan.
     The endpoint divides money by scan count, so each "price" is a package
     total and the spread between them is the spread of package sizes. */
  const rings = [pt(8.46, 1), pt(8.11, 1), pt(7.97, 1), pt(7.62, 1)];

  it("does not call a spread of package sizes a promotion", () => {
    expect(ladderFor(rings, "0001").promo).toBe(true);
    expect(ladderFor(rings, "0001", undefined, true).promo).toBe(false);
  });

  it("says what the figures actually are", () => {
    const say = ladderSays(ladderFor(rings, "0001", undefined, true));
    expect(say).toContain("Sold by weight");
    expect(say).toContain("package sizes");
    // And never the claim it used to make.
    expect(say).not.toContain("Rang at");
    expect(say).not.toContain("Most units went at");
  });

  it("leaves an unweighted ladder reading as prices", () => {
    const say = ladderSays(ladderFor(rings, "0001"));
    expect(say).toContain("Rang at");
  });

  it("carries the flag so the panel can label pounds", () => {
    expect(ladderFor(rings, "0001", undefined, true).weighted).toBe(true);
    expect(ladderFor(rings, "0001").weighted).toBe(false);
  });
});
