import { describe, it, expect } from "vitest";
import {
  buildFacts,
  causeOf,
  judge,
  ladderFor,
  ratiosOf,
  summarise,
  supplyTimeline,
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
