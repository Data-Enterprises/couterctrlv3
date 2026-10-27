import { describe, it, expect } from "vitest";
import {
  commonUnit,
  itemStoreRows,
  itemsInScope,
  workingOrder,
  type ProblemItem,
} from "./problemItems";
import { buildDocs, stageUnitCost, startDraft, applyUnitCost } from "./orderEdit";
import type { AllOrder } from "../../../interfaces";

const PIZZA = "004470036114";
const BOLO = "3560009007";

/** A line as `all_orders` sends it, figures already derived. */
const line = (over: Partial<AllOrder> = {}): AllOrder =>
  ({
    storeid: 10,
    order_id: 1,
    order_date: "2026-10-20T00:00:00",
    storenumber: "010",
    storename: "IGA 10",
    status: "open",
    record_count: 1,
    order_type: "SMS",
    product_code: PIZZA,
    qty: 2,
    line_number: 1,
    tpr: 0,
    active_price: 0,
    active_qty: 0,
    extended_plessy: null,
    net_cost: 0,
    weight: 0,
    active_retail_price: 5,
    active_retail_qty: 0,
    description: "TOMBSTONE PIZZA",
    base_cost: 24,
    category: 1,
    category_description: "Frozen",
    vendor_id: "AWG",
    retail_price: null,
    sub_department: 1,
    sub_department_description: "Frozen",
    vendor_name: "AWG",
    casesize: 12,
    edited: null,
    scalable: 0,
    e_ret: 10,
    cogs: 4,
    rev: 6,
    ...over,
  }) as AllOrder;

/** Three stores carry the pizza; one has no cost. Another item is fine. */
const LINES = [
  line({ storeid: 10, storenumber: "010", order_id: 1, base_cost: 0, cogs: 0 }),
  line({ storeid: 114, storenumber: "114", order_id: 2, casesize: 24, base_cost: 52.56, cogs: 4.38 }),
  line({ storeid: 206, storenumber: "206", order_id: 3, base_cost: 26.28, cogs: 4.38 }),
  line({ storeid: 10, storenumber: "010", order_id: 1, line_number: 2, product_code: BOLO, description: null as unknown as string, base_cost: 9, cogs: 5 }),
];

const find = (items: ProblemItem[], code: string) =>
  items.find((i) => i.code === code)!;

describe("itemsInScope", () => {
  it("names what is wrong, cause first", () => {
    // No cost rings 100% margin, so the pizza is both — cause first.
    const pizza = find(itemsInScope(LINES, {}, 60), PIZZA);
    expect(pizza.flags).toEqual(["missingCost", "highMargin"]);
    expect(pizza.stores).toBe(3);
    expect(pizza.orders).toBe(3);
  });

  it("leaves an item with nothing wrong unflagged", () => {
    expect(find(itemsInScope(LINES, {}, 60), BOLO).flags).toEqual([]);
  });

  it("survives a line with no description", () => {
    expect(find(itemsInScope(LINES, {}, 60), BOLO).desc).toBe("");
  });

  it("counts the orders a fix has staged into", () => {
    const pizzaLines = LINES.filter((l) => l.product_code === PIZZA);
    const drafts = stageUnitCost({}, pizzaLines.slice(0, 1), LINES, 2.19);
    expect(find(itemsInScope(LINES, drafts, 60), PIZZA).staged).toBe(1);
  });

  it("does not count an order whose cost did not move", () => {
    const [doc] = buildDocs(LINES).filter((d) => d.storenumber === "206");
    // Same unit cost it already has: 26.28 over a case of 12.
    const same = applyUnitCost(startDraft(doc, LINES), 1, 2.19);
    expect(find(itemsInScope(LINES, { [doc.key]: same }, 60), PIZZA).staged).toBe(0);
  });

  it("uses the cutoff it is given", () => {
    // 60% margin on the 114 and 206 lines; a cutoff of 70 leaves only the
    // missing-cost line ringing high.
    const rows = itemsInScope(LINES.slice(1, 3), {}, 50);
    expect(find(rows, PIZZA).flags).toEqual(["highMargin"]);
    expect(find(itemsInScope(LINES.slice(1, 3), {}, 70), PIZZA).flags).toEqual([]);
  });
});

describe("workingOrder", () => {
  const item = (over: Partial<ProblemItem>): ProblemItem => ({
    code: "X",
    desc: "X",
    flags: [],
    stores: 1,
    orders: 1,
    topMargin: null,
    staged: 0,
    ...over,
  });

  it("puts missing cost first, then high margin worst first", () => {
    const got = workingOrder(
      [
        item({ code: "M70", desc: "B", flags: ["highMargin"], topMargin: 70 }),
        item({ code: "MISS", desc: "Z", flags: ["missingCost"] }),
        item({ code: "M95", desc: "A", flags: ["highMargin"], topMargin: 95 }),
      ],
      new Set(),
    );
    expect(got.map((i) => i.code)).toEqual(["MISS", "M95", "M70"]);
  });

  it("sends skipped and then staged items to the bottom", () => {
    const got = workingOrder(
      [
        item({ code: "DONE", flags: ["missingCost"], staged: 2 }),
        item({ code: "SKIP", flags: ["missingCost"] }),
        item({ code: "TODO", flags: ["highMargin"], topMargin: 61 }),
      ],
      new Set(["SKIP"]),
    );
    expect(got.map((i) => i.code)).toEqual(["TODO", "SKIP", "DONE"]);
  });
});

describe("itemStoreRows", () => {
  const scope = LINES.filter((l) => l.product_code === PIZZA);

  it("lists one row per order carrying the item", () => {
    expect(itemStoreRows(PIZZA, LINES, LINES, {}, null)).toHaveLength(3);
  });

  it("works each store's case cost from its own case size", () => {
    const rows = itemStoreRows(PIZZA, scope, LINES, {}, 2.19);
    const by = Object.fromEntries(rows.map((r) => [r.doc.storenumber, r.after!.caseCost]));
    expect(by["010"]).toBeCloseTo(26.28);
    expect(by["114"]).toBeCloseTo(52.56);
    expect(by["206"]).toBeCloseTo(26.28);
  });

  it("recomputes Ext cost from the new case cost", () => {
    const store10 = itemStoreRows(PIZZA, scope, LINES, {}, 2.19).find(
      (r) => r.doc.storenumber === "010",
    )!;
    expect(store10.now.extCost).toBe(0);
    expect(store10.after!.extCost).toBeGreaterThan(0);
  });

  it("only marks the orders whose cost would actually move", () => {
    const rows = itemStoreRows(PIZZA, scope, LINES, {}, 2.19);
    expect(rows.filter((r) => r.changes).map((r) => r.doc.storenumber)).toEqual(["010"]);
  });

  it("treats no case size as ordered by the unit", () => {
    const byUnit = [line({ casesize: 0, base_cost: 0, cogs: 0 })];
    const [row] = itemStoreRows(PIZZA, byUnit, byUnit, {}, 3.5);
    expect(row.casesize).toBe(0);
    expect(row.after!.caseCost).toBe(3.5);
  });

  it("reads an order's draft rather than the line as loaded", () => {
    const drafts = stageUnitCost({}, scope.slice(0, 1), LINES, 2.19);
    const store10 = itemStoreRows(PIZZA, scope, LINES, drafts, null).find(
      (r) => r.doc.storenumber === "010",
    )!;
    expect(store10.now.caseCost).toBeCloseTo(26.28);
  });
});

describe("commonUnit", () => {
  const rows = (units: number[]) =>
    units.map((u) => ({ unitNow: u }) as Parameters<typeof commonUnit>[0][number]);

  it("offers the price most stores pay", () => {
    expect(commonUnit(rows([2.19, 2.19, 0]))).toBe(2.19);
  });

  it("offers nothing when no two stores agree", () => {
    expect(commonUnit(rows([2.19, 1.95, 0]))).toBeNull();
  });

  it("offers nothing on a tie", () => {
    expect(commonUnit(rows([2.19, 2.19, 1.95, 1.95]))).toBeNull();
  });

  it("never counts a zero", () => {
    expect(commonUnit(rows([0, 0, 0]))).toBeNull();
  });
});
