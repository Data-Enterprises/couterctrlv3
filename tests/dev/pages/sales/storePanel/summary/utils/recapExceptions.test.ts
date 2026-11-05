import { describe, expect, it } from "vitest";
import type { ExceptionLine } from "@/api/exceptionLines";
import { exceptionsByDay } from "@/pages/sales/dev/storePanel/summary/utils/recapExceptions";

const line = (
  sale_type: string,
  sale_id: string,
  net_sales: number,
  qty = 1,
  date = "2026-10-30",
) => ({ sale_type, sale_id, net_sales, qty, sale_date: `${date}T00:00:00` }) as ExceptionLine;

describe("a week's exceptions, by day and type", () => {
  const byDay = exceptionsByDay([
    line("Voided", "r1", 4),
    line("Voided", "r1", 6, 2),
    line("Voided", "r2", -3),
    line("Refunded", "r3", -2),
    line("No Sale", "r4", 0),
    line("No Sale", "r5", 0),
    line("Cancelled", "r9", 50, 3, "2026-10-29"),
  ]);
  const fri = byDay.get("2026-10-30")!;

  it("counts transactions as distinct receipts, so a many-line void is one", () => {
    expect(fri.types.find((t) => t.type === "Voided")).toMatchObject({ transactions: 2, qty: 4 });
    expect(fri.transactions).toBe(5);
  });

  it("adds amounts as positive net sales, whichever way a line is signed", () => {
    expect(fri.types.find((t) => t.type === "Voided")?.amount).toBe(13);
    expect(fri.amount).toBe(15);
  });

  it("gives a No Sale a count but no qty or amount", () => {
    expect(fri.types.find((t) => t.type === "No Sale")).toMatchObject({
      label: "No sale",
      transactions: 2,
      qty: null,
      amount: null,
    });
  });

  it("leaves Tender lines out entirely, receipts and amount included", () => {
    const only = exceptionsByDay([line("Tender", "t1", 99), line("Voided", "v1", 1)]).get("2026-10-30")!;
    expect(only.types.map((t) => t.type)).toEqual(["Voided"]);
    expect(only).toMatchObject({ transactions: 1, amount: 1 });
  });

  it("lists the types in a fixed order, only those with lines that day", () => {
    expect(fri.types.map((t) => t.type)).toEqual(["Voided", "Refunded", "No Sale"]);
    expect(byDay.get("2026-10-29")!.types.map((t) => t.type)).toEqual(["Cancelled"]);
  });
});
