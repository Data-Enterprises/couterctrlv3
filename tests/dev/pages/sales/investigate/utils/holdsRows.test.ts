import { describe, it, expect } from "vitest";
import { judge, splitGap } from "@/pages/sales/dev/investigate/utils/deptInvestigation";
import {
  leadRow,
  reasonOf,
  rowOf,
  rowSays,
  rowsOf,
} from "@/pages/sales/dev/investigate/utils/holdsRows";
import type { ItemFacts, ItemVerdict } from "@/pages/sales/dev/investigate/interfaces";

const item = (over: Partial<ItemFacts> = {}): ItemVerdict =>
  judge({
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
    mineSales: over.mineTy ?? 0,
    theirsSales: over.theirsTy ?? 0,
    orderedQty: 0,
    receivedUnits: 0,
    lastOrderDate: null,
    lastOrderQty: 0,
    receivedSinceOrder: 0,
    ...over,
  });

const money = (v: number) => "$" + v.toFixed(2);

const items = [
  // Rang at 003 only: two never ordered, one received and unsold.
  item({ productCode: "t1", theirsTy: 300, theirsUnits: 30 }),
  item({ productCode: "t2", theirsTy: 100, theirsUnits: 10 }),
  item({ productCode: "t3", theirsTy: 50, theirsUnits: 5, receivedUnits: 4 }),
  // Rang at both, 018 sold less: fewer units, same price.
  item({ productCode: "l1", mineTy: 100, mineUnits: 100, theirsTy: 300, theirsUnits: 300 }),
  // Rang at both, 018 sold more.
  item({ productCode: "m1", mineTy: 200, mineUnits: 100, theirsTy: 100, theirsUnits: 50 }),
  // Rang at 018 only.
  item({ productCode: "o1", mineTy: 40, mineUnits: 4 }),
];

describe("rowOf", () => {
  it("files every item under the row its two stores put it in", () => {
    expect(items.map(rowOf)).toEqual([
      "onlyTheirs", "onlyTheirs", "onlyTheirs", "bothLess", "bothMore", "onlyMine",
    ]);
  });

  it("leaves out an item neither store rang", () => {
    expect(rowOf(item())).toBeNull();
  });
});

describe("rowsOf", () => {
  const rows = rowsOf(items);

  it("lists all four rows in order, biggest item first", () => {
    expect(rows.map((r) => r.kind)).toEqual(["onlyTheirs", "bothLess", "bothMore", "onlyMine"]);
    expect(rows[0].items.map((i) => i.productCode)).toEqual(["t1", "t2", "t3"]);
    expect(rows[0].total).toBe(-450);
  });

  it("breaks the items one store never rang down by cause", () => {
    expect(rows[0].breakdown.map((l) => [l.label, l.amount, l.side])).toEqual([
      ["Never ordered", -400, "2 items"],
      ["Received, none sold", -50, "1 item"],
    ]);
  });

  it("splits the rows both rang into units and price that add up to the gap", () => {
    const [units, price] = rows[1].breakdown;
    expect(units.label).toBe("Fewer sold");
    expect(units.amount + price.amount).toBeCloseTo(-200, 6);
    expect(units.money && price.money).toBe(true);
  });

  it("adds each item's own split rather than splitting the totals", () => {
    const pair = [
      item({ productCode: "a", mineTy: 100, mineUnits: 100, theirsTy: 200, theirsUnits: 100 }),
      item({ productCode: "b", mineTy: 1000, mineUnits: 100, theirsTy: 1200, theirsUnits: 200 }),
    ];
    const [units, price] = rowsOf(pair)[1].breakdown;
    expect(units.amount).toBeCloseTo(splitGap(pair[0]).units + splitGap(pair[1]).units, 6);
    expect(price.amount).toBeCloseTo(splitGap(pair[0]).price + splitGap(pair[1]).price, 6);
  });

  it("gives the items only this store rang no breakdown", () => {
    expect(rows[3].breakdown).toEqual([]);
  });

  it("counts the items it takes to reach half the row", () => {
    expect(rows[0].toHalf).toBe(1);
  });

  it("keeps an empty row, so a zero is shown rather than lost", () => {
    const only = rowsOf([items[0]]);
    expect(only).toHaveLength(4);
    expect(only[1].items).toEqual([]);
  });
});

describe("reasonOf", () => {
  it("calls it units when the price is inside the band", () => {
    expect(reasonOf(items[3])).toBe("units");
  });

  it("calls it price when price is past the band and the bigger part", () => {
    const i = item({ mineTy: 850, mineUnits: 1000, theirsTy: 1000, theirsUnits: 1000 });
    expect(reasonOf(i)).toBe("price");
  });

  it("names both when price is past the band but units are bigger", () => {
    const i = item({ mineTy: 289.52, mineUnits: 88, theirsTy: 482.79, theirsUnits: 121 });
    expect(reasonOf(i)).toBe("both");
  });
});

describe("rowSays", () => {
  const rows = rowsOf(items);

  it("leads the items one store never rang with their biggest cause", () => {
    expect(rowSays(rows[0], "018", "003", money, money)).toBe(
      "Most of it was never ordered: 2 of the 3 items.",
    );
  });

  it("says when units carry a row both stores rang", () => {
    expect(rowSays(rows[1], "018", "003", money, money)).toBe(
      "Mostly fewer sold, not price: units account for $200.00 of the $200.00.",
    );
  });

  it("names the store in the row only one store rang", () => {
    expect(rowSays(rows[3], "018", "003", money, money)).toBe(
      "1 item rang at 018 and not at 003, worth $40.00.",
    );
  });
});

describe("leadRow", () => {
  it("opens on the row with the most money in it", () => {
    expect(leadRow(rowsOf(items))).toBe("onlyTheirs");
  });
});
