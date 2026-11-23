import { describe, expect, it } from "vitest";
import {
  documentLines,
  matchesCodes,
  ordersNote,
  plural,
  wantedCodes,
} from "@/pages/sales/prod/investigate/supply/utils/documents";
import type { OrdersWave, ReceiptsWave } from "@/pages/sales/prod/investigate/utils/investigationData";
import type { Supply, SupplyRecord } from "@/pages/sales/prod/investigate/utils/investigationSteps";
import type { SupplyRow } from "@/pages/sales/prod/investigate/interfaces";

/*
 * The Supply documents card: which codes a paste asks about, which documents
 * carry them, and what an empty orders list says.
 */

const orders = {
  ok: true,
  inWindow: 3,
  mine: [{ order_id: 7, product_code: "0001", description: "BEEF", qty: 4 }],
  theirs: [],
  allMine: [],
  allTheirs: [],
} as unknown as OrdersWave;
const receipts = { ok: true, mine: [], theirs: [] } as unknown as ReceiptsWave;
const supply = { orders: [], deliveries: [] } as unknown as Supply;
const row = (docs: SupplyRecord[] = []) => ({ docs, isOrder: true, mine: true }) as unknown as SupplyRow;

describe("wantedCodes", () => {
  it("reads codes split by commas, spaces or new lines", () => {
    expect([...wantedCodes("0001, 0002\n0003  ")]).toEqual(["0001", "0002", "0003"]);
    expect(wantedCodes("  ").size).toBe(0);
  });
});

describe("plural", () => {
  it("says one or many", () => {
    expect(plural(1, "order")).toBe("1 order");
    expect(plural(1200, "receiver")).toBe("1,200 receivers");
  });
});

describe("matchesCodes", () => {
  const lines = documentLines(orders, receipts);
  const rec = { id: 7, mine: true } as SupplyRecord;

  it("keeps every document when no code is asked for", () => {
    expect(matchesCodes(new Set(), lines)(rec, true)).toBe(true);
  });

  it("keeps an order only when one of its lines carries a wanted code", () => {
    expect(matchesCodes(new Set(["0001"]), lines)(rec, true)).toBe(true);
    expect(matchesCodes(new Set(["9999"]), lines)(rec, true)).toBe(false);
  });
});

describe("ordersNote", () => {
  it("says the orders did not come back when they failed", () => {
    expect(ordersNote(row(), "018", { ...orders, ok: false }, supply)).toMatch(/did not come back/);
  });

  it("says no order carries the codes when the list was narrowed to nothing", () => {
    expect(ordersNote(row([{} as SupplyRecord]), "018", orders, supply)).toBe(
      "No order at 018 carries any of those codes.",
    );
  });

  it("calls a window with no orders at all the finding", () => {
    expect(ordersNote(row(), "018", { ...orders, inWindow: 0 }, supply)).toMatch(/That is the finding/);
  });
});
