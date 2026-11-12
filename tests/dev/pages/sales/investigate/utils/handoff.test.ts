import { describe, it, expect } from "vitest";
import { judge } from "@/pages/sales/dev/investigate/utils/deptInvestigation";
import { desksOf } from "@/pages/sales/dev/investigate/utils/investigationSteps";
import { handoffLead, handoffOf, handoffSays } from "@/pages/sales/dev/investigate/utils/handoff";
import type { ItemFacts, ItemVerdict } from "@/pages/sales/dev/investigate/interfaces";

const item = (over: Partial<ItemFacts> = {}): ItemVerdict =>
  judge({
    productCode: "0001", description: "Thing", vendorName: "AWG",
    mineTy: 0, theirsTy: 0, mineLw: 0, theirsLw: 0, mineLy: 0, theirsLy: 0,
    mineUnits: 0, theirsUnits: 0, weighted: false, mineCogs: 0, theirsCogs: 0,
    mineSales: over.mineTy ?? 0, theirsSales: over.theirsTy ?? 0,
    orderedQty: 0, receivedUnits: 0, lastOrderDate: null, lastOrderQty: 0, receivedSinceOrder: 0,
    ...over,
  });
const money = (v: number) => "$" + v.toFixed(2);

const items = [
  // Never ordered: the buyer's.
  item({ productCode: "n1", theirsTy: 900, theirsUnits: 90 }),
  item({ productCode: "n2", theirsTy: 300, theirsUnits: 30 }),
  // Ordered at 018, nothing received, still behind: receiving's.
  item({ productCode: "r1", mineTy: 100, mineUnits: 100, theirsTy: 300, theirsUnits: 300, orderedQty: 6 }),
  // Both sold at the same price, 018 fewer: nobody's.
  item({ productCode: "s1", mineTy: 200, mineUnits: 200, theirsTy: 260, theirsUnits: 260, receivedUnits: 50 }),
];
const lists = handoffOf(desksOf(items, money));

describe("handoffOf", () => {
  it("makes one list per person, nobody's last", () => {
    expect(lists.map((l) => l.owner)).toEqual(["buyer", "receiving", null]);
    expect(lists[0].items.map((i) => i.productCode)).toEqual(["n1", "n2"]);
    expect(lists[0].total).toBe(-1200);
  });

  it("leaves out a person with nothing on their list", () => {
    expect(lists.some((l) => l.owner === "price")).toBe(false);
  });
});

describe("handoffSays", () => {
  it("names who the list is for and what is on it", () => {
    expect(handoffSays(lists[0], "018", "003", money)).toBe(
      "2 items for the buyer, worth −$1200.00: never ordered at 018.",
    );
    expect(handoffSays(lists[1], "018", "003", money)).toBe(
      "1 item for receiving, worth −$200.00: ordered at 018, with no receiver on file since the order.",
    );
  });

  it("says the last list is nobody's and that its sections say why", () => {
    expect(handoffSays(lists[2], "018", "003", money)).toBe(
      "1 item no list can fix, worth −$60.00. Each section says why.",
    );
  });
});

describe("handoffLead", () => {
  it("says how much of the shortfall has someone to hand it to", () => {
    const lead = handoffLead(lists);
    expect(lead.ownedTotal).toBe(-1400);
    expect(lead.rest).toBe(-60);
    expect(lead.says).toBe("Most of the shortfall has someone to hand it to: 2 lists, one for each desk.");
  });
});
