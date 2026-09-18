import { describe, expect, it } from "vitest";
import type { TransactionListItem } from "../../../../interfaces";
import { buildSignals, buildTotals, receiptLinesFor } from "./lensUtils";

/* Two stores sharing a storeid (685 carries both 369 and 370 in real data),
   plus an unrelated third store. Cashier 12 and lane 3 exist at all of them. */
const A = { storeid: 685, store_number: "369", store_name: "Arab" };
const B = { storeid: 685, store_number: "370", store_name: "Hartselle" };
const C = { storeid: 700, store_number: "401", store_name: "Cullman" };

let seq = 0;
const line = (
  store: typeof A,
  over: Partial<TransactionListItem> = {},
): TransactionListItem =>
  ({
    ...store,
    transaction_id: String(++seq),
    sale_id: `${store.store_number}-${seq}`,
    sale_type: "Voided",
    sale_date: "2026-09-01T00:00:00",
    sale_start_time: "093045",
    sale_end_time: "093145",
    line_number: 1,
    terminal: "3",
    cashier_number: 12,
    cashier_name: "Pat",
    product_code: "0001",
    product_description: "Milk",
    total_sales: 1,
    net_sales: 1,
    total_rounded_tax: 0,
    coupon_amount: 0,
    is_coupon: 0,
    qty: 1,
    ...over,
  }) as TransactionListItem;

const resolve = (_id: number, fallback: string) => fallback;

describe("buildSignals keying", () => {
  const rows = [line(A), line(B), line(C), line(C)];

  it("keeps the same cashier number at different stores apart", () => {
    const signals = buildSignals(rows, {}, "cashier", resolve);
    expect(signals).toHaveLength(3);
    expect(signals.map((s) => s.sublabel).sort()).toEqual([
      "#12 · store 369",
      "#12 · store 370",
      "#12 · store 401",
    ]);
  });

  it("keeps the same lane number at different stores apart", () => {
    const signals = buildSignals(rows, {}, "terminal", resolve);
    expect(signals).toHaveLength(3);
    expect(signals.every((s) => s.label === "Lane 3")).toBe(true);
  });

  it("counts cashiers per store on a lens that spans stores", () => {
    const [item] = buildSignals(rows, {}, "item", resolve);
    expect(item.cashiers).toBe(3);
    expect(item.spread).toBe("wide");
  });

  it("tolerates a numeric product_code", () => {
    const numeric = [line(A, { product_code: 42 as unknown as string })];
    const [item] = buildSignals(numeric, {}, "item", resolve);
    expect(item.key).toBe("42");
    expect(item.sublabel).toBe("42");
  });
});

describe("buildTotals", () => {
  it("counts co-located stores and their cashiers separately", () => {
    const totals = buildTotals([line(A), line(B), line(C), line(C)]);
    expect(totals.stores).toBe(3);
    expect(totals.cashiers).toBe(3);
  });
});

describe("receiptLinesFor", () => {
  it("returns every line of the sale in line order", () => {
    const all = [
      line(A, { sale_id: "s1", line_number: 3, sale_type: "Tender" }),
      line(A, { sale_id: "s2", line_number: 1 }),
      line(A, { sale_id: "s1", line_number: 1, sale_type: "Sale" }),
      line(A, { sale_id: "s1", line_number: 2 }),
    ];
    expect(receiptLinesFor(all, "s1").map((r) => r.line_number)).toEqual([
      1, 2, 3,
    ]);
  });
});
