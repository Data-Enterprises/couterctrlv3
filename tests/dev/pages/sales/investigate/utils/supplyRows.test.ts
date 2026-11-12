import { describe, it, expect } from "vitest";
import { judge } from "@/pages/sales/dev/investigate/utils/deptInvestigation";
import { supplyOf } from "@/pages/sales/dev/investigate/utils/investigationSteps";
import {
  noReceiptsNote,
  supplyRowsOf,
  supplySlideSays,
  supplyTab,
} from "@/pages/sales/dev/investigate/utils/supplyRows";
import type { ItemFacts } from "@/pages/sales/dev/investigate/interfaces";

const order = (id: number, code: string, qty: number, order_date = "2026-10-20", status = "OPEN") => ({
  order_id: id, order_date, status, product_code: code, qty, vendor_name: "AWG",
});
const inv = (id: number, code: string, qty: number, cost: number, invoice_date = "2026-10-21") => ({
  invoiceid: id,
  invoice_date,
  vendor_name: "AWG",
  lines: [{ product_code: code, qty, ext_cost: cost, item_return: 0 }],
});
const of = (code: string) =>
  judge({
    productCode: code, description: code, vendorName: "AWG",
    mineTy: 0, theirsTy: 10, mineLw: 0, theirsLw: 0, mineLy: 0, theirsLy: 0,
    mineUnits: 0, theirsUnits: 1, weighted: false, mineCogs: 0, theirsCogs: 0,
    mineSales: 0, theirsSales: 10, orderedQty: 0, receivedUnits: 0,
    lastOrderDate: null, lastOrderQty: 0, receivedSinceOrder: 0,
  } as ItemFacts);
const money = (v: number) => "$" + v.toFixed(2);

const supply = supplyOf(
  {
    mine: [order(1, "a", 63, "2026-11-03"), order(2, "a", 626, "2026-11-01")],
    theirs: [order(9, "a", 9588, "2026-10-03"), order(8, "a", 11, "2026-11-02"), order(7, "a", 34, "2026-10-06")],
  },
  { mine: [], theirs: [inv(5, "a", 520, 1402.1)] },
  [of("a")],
);
const rows = supplyRowsOf(supply);

describe("supplyRowsOf", () => {
  it("gives each store its own orders and receipts, in the row order", () => {
    expect(rows.map((r) => [r.kind, r.docs.length])).toEqual([
      ["ordersMine", 2], ["ordersTheirs", 3], ["receiptsMine", 0], ["receiptsTheirs", 1],
    ]);
    expect(rows[0].docs.every((d) => d.mine)).toBe(true);
    expect(rows[3].units).toBe(520);
  });

  it("names its tab by store and kind", () => {
    expect(rows.map((r) => supplyTab(r, "018", "003"))).toEqual([
      "018 orders", "003 orders", "018 receipts", "003 receipts",
    ]);
  });
});

describe("supplySlideSays", () => {
  it("says an order with nothing received against it has no receiver on file", () => {
    expect(supplySlideSays(rows[0], "018", 0, true, true, money)).toBe(
      "2 orders at 018, all still open, and no receiver on file against them.",
    );
  });

  it("names the one order that carries most of the units", () => {
    expect(supplySlideSays(rows[1], "003", 1, true, true, money)).toBe(
      "3 orders at 003, all still open. One of them, #9, is 9,588 of the 9,633 units.",
    );
  });

  it("says nothing was received, or that the receipts could not be read", () => {
    expect(supplySlideSays(rows[2], "018", 0, true, true, money)).toBe(
      "No receiver on file at 018 in the window.",
    );
    expect(supplySlideSays(rows[2], "018", 0, true, false, money)).toBe(
      "We couldn't get the receipts information at this time.",
    );
    expect(supplySlideSays(rows[3], "003", 1, true, true, money)).toBe(
      "1 receipt at 003: 520 units, $1402.10.",
    );
  });

  it("never claims an order is late", () => {
    const all = rows.map((r) => supplySlideSays(r, "018", 0, true, true, money)).join(" ");
    expect(all).not.toMatch(/late|expected|on its way|arriv/i);
  });
});

describe("noReceiptsNote", () => {
  it("gives the window and says the receivers may not be entered yet", () => {
    expect(noReceiptsNote("018", { start: "2026-09-27", end: "2026-11-08" })).toBe(
      "Nothing was received at 018 for this department between Sep 27 and Nov 8. If deliveries came in, their receivers may not be entered yet.",
    );
  });
});
