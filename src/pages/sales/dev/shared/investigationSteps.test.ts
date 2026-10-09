import { describe, expect, it } from "vitest";
import { desksOf, holdsUp, spreadOf, supplyOf, vitalsOf } from "./investigationSteps";
import { judge, type ItemFacts, type ItemVerdict } from "./deptInvestigation";

const facts = (over: Partial<ItemFacts> = {}): ItemFacts => ({
  productCode: "1",
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
  mineCogs: 0,
  theirsCogs: 0,
  mineSales: over.mineTy ?? 0,
  theirsSales: over.theirsTy ?? 0,
  orderedQty: 0,
  receivedUnits: 0,
  ...over,
});

const item = (over: Partial<ItemFacts> = {}): ItemVerdict => judge(facts(over));

/** Rang at the counterpart, never here. */
const absent = (n: number, each: number) =>
  Array.from({ length: n }, (_, i) =>
    item({ productCode: `a${i}`, theirsTy: each, theirsUnits: 10, orderedQty: 0 }),
  );

/** Rang at both, less here. */
const weaker = (n: number, mine: number, theirs: number) =>
  Array.from({ length: n }, (_, i) =>
    item({
      productCode: `w${i}`,
      mineTy: mine, mineUnits: 10,
      theirsTy: theirs, theirsUnits: 10,
      orderedQty: 5, receivedUnits: 5,
    }),
  );

/** Rang at both at much the same price, and still sold less: on the shelf,
 *  not moving. The one shape that names no record to act on. */
const sitting = (n: number) =>
  Array.from({ length: n }, (_, i) =>
    item({
      productCode: `s${i}`,
      mineTy: 400, mineUnits: 100,
      theirsTy: 450, theirsUnits: 112,
      orderedQty: 20, receivedUnits: 20,
    }),
  );

const money = (v: number) => "$" + v.toFixed(2);

describe("1 · does it hold", () => {
  it("holds when a supply call lands on items we never rang", () => {
    const h = holdsUp([...absent(5, 100), ...weaker(2, 40, 50)], "orders");
    expect(h.verdict).toBe("holds");
    expect(h.onlyTheirs.items).toBe(5);
    expect(h.onlyTheirs.dollars).toBeCloseTo(-500, 6);
    expect(h.says).toContain("did not");
  });

  /**
   * The valuable case. The department totals said volume, and the items are
   * all present and simply taking less — so the units never went missing and
   * the next four steps are about price, not supply.
   */
  it("overturns a volume call when the items were all here", () => {
    const h = holdsUp([...weaker(8, 40, 90), ...absent(1, 20)], "orders");
    expect(h.verdict).toBe("overturned");
    expect(h.says).toContain("they took less");
  });

  it("overturns a price call when the items were never rung", () => {
    const h = holdsUp([...absent(6, 100), ...weaker(1, 40, 50)], "price");
    expect(h.verdict).toBe("overturned");
    expect(h.says).toContain("never rang");
  });

  it("counts items we are ahead on separately", () => {
    const h = holdsUp(
      [...weaker(2, 40, 90), ...weaker(1, 120, 60)],
      "price",
    );
    expect(h.bothMore.items).toBe(1);
    expect(h.bothMore.dollars).toBeCloseTo(60, 6);
  });

  /** Units, not money: an item can ring for nothing and still have sold. */
  it("reads presence from units, not from sales", () => {
    const h = holdsUp(
      [item({ mineTy: 0, mineUnits: 4, theirsTy: 90, theirsUnits: 10 })],
      "price",
    );
    expect(h.onlyTheirs.items).toBe(0);
    expect(h.bothLess.items).toBe(1);
  });
});

describe("2 · where is it", () => {
  it("calls it concentrated when a handful carry half", () => {
    const s = spreadOf([
      item({ theirsTy: 900, theirsUnits: 90 }),
      item({ theirsTy: 100, theirsUnits: 10 }),
      item({ theirsTy: 50, theirsUnits: 5 }),
    ]);
    expect(s.toHalf).toBe(1);
    expect(s.concentrated).toBe(true);
    expect(s.says).toContain("A short list carries it");
  });

  /**
   * Fifty items each a fiftieth of the gap: a top ten is 20% of it, and
   * printing one would let somebody believe it mattered.
   */
  it("calls it spread when no short list reaches half", () => {
    const s = spreadOf(
      Array.from({ length: 50 }, (_, i) =>
        item({ productCode: `s${i}`, theirsTy: 100, theirsUnits: 10 }),
      ),
    );
    expect(s.toHalf).toBe(25);
    expect(s.concentrated).toBe(false);
    expect(s.topTenShare).toBeCloseTo(0.2, 6);
    expect(s.says).toContain("No short list carries it");
  });

  it("leaves the items we are ahead on out of the shortfall", () => {
    const s = spreadOf([
      item({ theirsTy: 100, theirsUnits: 10 }),
      item({ mineTy: 500, mineUnits: 50, theirsTy: 10, theirsUnits: 1 }),
    ]);
    expect(s.ranked).toHaveLength(1);
  });

  it("groups by vendor, worst first", () => {
    const s = spreadOf([
      item({ productCode: "a", vendorName: "AWG", theirsTy: 300, theirsUnits: 30 }),
      item({ productCode: "b", vendorName: "AWG", theirsTy: 200, theirsUnits: 20 }),
      item({ productCode: "c", vendorName: "Frito", theirsTy: 100, theirsUnits: 10 }),
      item({ productCode: "d", vendorName: "", theirsTy: 50, theirsUnits: 5 }),
    ]);
    expect(s.byVendor[0]).toMatchObject({ vendorName: "AWG", items: 2 });
    expect(s.byVendor[0].dollars).toBeCloseTo(-500, 6);
    expect(s.byVendor.map((v) => v.vendorName)).toContain("Unknown vendor");
  });

  it("says nothing is behind rather than dividing by zero", () => {
    const s = spreadOf([item({ mineTy: 90, mineUnits: 9, theirsTy: 10, theirsUnits: 1 })]);
    expect(s.toHalf).toBe(0);
    expect(s.topTenShare).toBe(0);
    expect(s.concentrated).toBe(false);
  });
});

describe("5 · who fixes it", () => {
  const mixed = () => [
    ...absent(3, 100),                                   // never ordered
    ...weaker(2, 40, 90),                                // not moving / price
    item({ productCode: "x", theirsTy: 60, theirsUnits: 6, orderedQty: 10 }),
    item({ productCode: "ahead", mineTy: 500, mineUnits: 50, theirsTy: 10, theirsUnits: 1 }),
  ];

  it("leaves what we are ahead on off the hand-off", () => {
    expect(desksOf(mixed(), money).map((d) => d.cause)).not.toContain("ahead");
  });

  it("gives every actionable cause an owner", () => {
    const desks = desksOf(mixed(), money);
    const never = desks.find((d) => d.cause === "never-ordered");
    expect(never?.owner).toBe("buyer");
    expect(never?.actionable).toBe(true);
    const late = desks.find((d) => d.cause === "not-received");
    expect(late?.owner).toBe("vendor");
  });

  /**
   * The line that decides this: a list is actionable when the evidence names
   * a RECORD — an order that does not exist, an invoice that never came, a
   * price that differs. "It was here and did not sell" names nothing, so it
   * is stated and handed to nobody.
   */
  it("hands nobody the causes that name no record", () => {
    const desks = desksOf([...sitting(2), ...weaker(2, 40, 90)], money);
    expect(desks.map((d) => d.cause)).toContain("not-moving");
    for (const d of desks) {
      if (d.cause === "not-moving" || d.cause === "unclassified") {
        expect(d.owner).toBeNull();
        expect(d.actionable).toBe(false);
      }
    }
  });

  it("states what cannot be handed over rather than dropping it", () => {
    const desks = desksOf(sitting(2), money);
    const quiet = desks.filter((d) => !d.actionable);
    expect(quiet.length).toBeGreaterThan(0);
    expect(quiet[0].says).toContain("items");
  });

  it("ranks the desks by money, worst first", () => {
    const desks = desksOf(mixed(), money);
    for (let i = 1; i < desks.length; i += 1) {
      expect(desks[i - 1].dollars).toBeLessThanOrEqual(desks[i].dollars);
    }
  });
});


describe("the department's vitals", () => {
  const dept = () => [
    item({
      productCode: "a",
      mineTy: 400, mineUnits: 100, mineCogs: 300,
      theirsTy: 500, theirsUnits: 100, theirsCogs: 320,
      mineLw: 380, theirsLw: 500, mineLy: 520, theirsLy: 500,
    }),
  ];

  it("carries the gap in all three periods", () => {
    const v = vitalsOf(dept());
    expect(v.weeks.map((w) => w.gap)).toEqual([20, -120, -100]);
  });

  /** Sales down and units level is a department selling as much and taking
   *  less — the divergence a reader should not have to compute. */
  it("indexes each measure against the counterpart", () => {
    const v = vitalsOf(dept());
    expect(v.index.find((i) => i.label === "Sales")?.pct).toBeCloseTo(80, 6);
    expect(v.index.find((i) => i.label === "Units")?.pct).toBeCloseTo(100, 6);
    expect(v.index.find((i) => i.label === "Margin")?.pct).toBeCloseTo(100 * 100 / 180, 6);
  });

  it("gives no percentage where there is nothing to be one of", () => {
    const v = vitalsOf([item({ mineTy: 90, mineUnits: 9 })]);
    expect(v.index.find((i) => i.label === "Sales")?.pct).toBeNull();
  });
});

describe("supply · the proof behind the labels", () => {
  const order = (
    id: number,
    code: string,
    qty: number,
    order_date = "2026-09-30",
    status = "SENT",
  ) => ({
    order_id: id, order_date, status, product_code: code, qty, vendor_name: "AWG",
  });
  const inv = (
    id: number,
    vendor: string,
    lines: [string, number, number, number][],
    invoice_date = "2026-10-01",
  ) => ({
    invoiceid: id,
    invoice_date,
    vendor_name: vendor,
    lines: lines.map(([product_code, units, ext_cost, item_return]) => ({
      product_code, units, ext_cost, item_return,
    })),
  });
  const of = (code: string) => item({ productCode: code, theirsTy: 10, theirsUnits: 1 });

  it("counts orders, not order lines", () => {
    const s = supplyOf(
      { mine: [order(1, "a", 5), order(1, "b", 3), order(2, "a", 2)], theirs: [] },
      { mine: [], theirs: [] },
      [of("a"), of("b")],
    );
    expect(s.mine.orders).toBe(2);
    expect(s.mine.orderLines).toBe(3);
    expect(s.mine.orderedUnits).toBe(10);
  });

  /** Both payloads are department-wide; a line for an item this comparison
   *  is not about would put units on a store's figures nobody is reading. */
  it("ignores lines for items outside the comparison", () => {
    const s = supplyOf(
      { mine: [order(1, "a", 5), order(2, "zzz", 99)], theirs: [] },
      { mine: [inv(7, "AWG", [["a", 4, 20, 0], ["zzz", 50, 400, 0]])], theirs: [] },
      [of("a")],
    );
    expect(s.mine.orderedUnits).toBe(5);
    expect(s.mine.receivedUnits).toBe(4);
    expect(s.mine.receivedCost).toBeCloseTo(20, 6);
  });

  /** A return is not a delivery. Counting one as units arriving would close
   *  a gap that is still open. */
  it("takes a return back off what arrived", () => {
    const s = supplyOf(
      { mine: [], theirs: [] },
      { mine: [inv(7, "AWG", [["a", 10, 50, 0]]), inv(8, "AWG", [["a", 4, 20, 1]])], theirs: [] },
      [of("a")],
    );
    expect(s.mine.receivedUnits).toBe(6);
  });

  it("names the vendors that deliver to one store and not the other", () => {
    const s = supplyOf(
      { mine: [], theirs: [] },
      {
        mine: [inv(1, "AWG", [["a", 5, 25, 0]])],
        theirs: [inv(2, "AWG", [["a", 5, 25, 0]]), inv(3, "LIPARI", [["a", 9, 40, 0]])],
      },
      [of("a")],
    );
    expect(s.onlyTheirs).toEqual(["LIPARI"]);
    expect(s.onlyMine).toEqual([]);
  });

  it("does not count an invoice that carried nothing in this department", () => {
    const s = supplyOf(
      { mine: [], theirs: [] },
      { mine: [inv(1, "AWG", [["zzz", 5, 25, 0]])], theirs: [] },
      [of("a")],
    );
    expect(s.mine.deliveries).toBe(0);
    expect(s.mine.vendors).toEqual([]);
  });

  /* ---------------- the documents themselves ---------------- */

  /** The list has to count orders the way the summary counts them, or one
   *  says a store ordered twice while the other lists three. */
  it("lists one record per order, carrying its date and status", () => {
    const s = supplyOf(
      {
        mine: [order(1, "a", 5, "2026-09-24"), order(1, "b", 3, "2026-09-24")],
        theirs: [order(2, "a", 7, "2026-10-02", "RECEIVED")],
      },
      { mine: [], theirs: [] },
      [of("a"), of("b")],
    );
    expect(s.orders).toHaveLength(2);
    // Newest first, so the two stores interleave by date rather than sitting
    // in two blocks that have to be read against each other.
    expect(s.orders[0]).toMatchObject({
      id: 2, date: "2026-10-02", status: "RECEIVED", lines: 1, units: 7, mine: false,
    });
    expect(s.orders[1]).toMatchObject({
      id: 1, date: "2026-09-24", lines: 2, units: 8, mine: true,
    });
  });

  it("leaves out-of-department lines off the records too", () => {
    const s = supplyOf(
      { mine: [order(1, "a", 5), order(2, "zzz", 99)], theirs: [] },
      { mine: [inv(7, "AWG", [["a", 4, 20, 0], ["zzz", 50, 400, 0]])], theirs: [] },
      [of("a")],
    );
    expect(s.orders).toHaveLength(1);
    expect(s.orders[0]).toMatchObject({ id: 1, units: 5, lines: 1 });
    expect(s.deliveries[0]).toMatchObject({ id: 7, units: 4, lines: 1 });
    expect(s.deliveries[0].cost).toBeCloseTo(20, 6);
  });

  it("shows a return as the negative units it is", () => {
    const s = supplyOf(
      { mine: [], theirs: [] },
      { mine: [inv(8, "AWG", [["a", 4, 20, 1]], "2026-10-03")], theirs: [] },
      [of("a")],
    );
    expect(s.deliveries[0]).toMatchObject({ id: 8, date: "2026-10-03", units: -4 });
  });

  it("keeps an invoice carrying nothing in this department off the list", () => {
    const s = supplyOf(
      { mine: [], theirs: [] },
      { mine: [inv(1, "AWG", [["zzz", 5, 25, 0]])], theirs: [] },
      [of("a")],
    );
    expect(s.deliveries).toEqual([]);
  });
});
