import { describe, expect, it } from "vitest";
import {
  actualPricePoints,
  suggestPrice,
  suggestionWithheld,
  MIN_SUGGESTION_DAYS,
} from "./pricePoints";
import type { TransactionListItem } from "../interfaces";

/** One register line. `receipt` and `day` are what the rules below turn on. */
const line = (
  price: number,
  receipt: string,
  day = "2026-10-14",
  qty = 1,
  priceType = "REG",
): TransactionListItem =>
  ({
    sale_id: receipt,
    transaction_id: `${receipt}-line`,
    net_sales: price * qty,
    qty,
    price_type: priceType,
    sale_date: `${day}T10:00:00`,
    product_code: "4900002468",
  }) as TransactionListItem;

const days = (n: number) =>
  Array.from({ length: n }, (_, i) => `2026-10-${String(14 + i).padStart(2, "0")}`);

describe("actualPricePoints counts receipts, not lines", () => {
  it("counts one receipt once however many lines it rang", () => {
    // Receipt 333237 appeared three times under COKE's $3.34 (finding C).
    const act = actualPricePoints(
      [line(3.34, "333237"), line(3.34, "333237"), line(3.34, "333237"), line(3.34, "333300")],
      3.13,
    );
    expect(act.exact[0].trans).toBe(2);
    expect(act.exact[0].qty).toBe(4);
    expect(act.receiptCount).toBe(2);
  });

  it("counts a receipt once in the total even when it is in both tables", () => {
    const act = actualPricePoints(
      [line(3.49, "A"), line(3.33, "A", "2026-10-14", 3)],
      3.13,
    );
    expect(act.exactCount).toBe(1);
    expect(act.averagedCount).toBe(1);
    expect(act.receiptCount).toBe(1);
  });
});

describe("one-cent twins fold together", () => {
  it("reads three-for-$10 as one price", () => {
    // $3.33, $3.33, $3.34: a multi-buy split to the penny (finding B).
    const act = actualPricePoints(
      [line(3.33, "A"), line(3.33, "B"), line(3.34, "C")],
      3.13,
    );
    expect(act.exact).toHaveLength(1);
    expect(act.exact[0].price).toBe(3.33);
    expect(act.exact[0].trans).toBe(3);
  });

  it("keeps prices further apart than a cent", () => {
    const act = actualPricePoints([line(3.33, "A"), line(3.49, "B")], 3.13);
    expect(act.exact).toHaveLength(2);
  });

  it("keeps a sale price apart from a regular one at the same cents", () => {
    const act = actualPricePoints(
      [line(3.33, "A", "2026-10-14", 1, "REG"), line(3.34, "B", "2026-10-14", 1, "SALE")],
      3.13,
    );
    expect(act.exact).toHaveLength(2);
  });
});

describe("a suggestion needs history behind it", () => {
  it("won't crown a price seen on one busy day", () => {
    // 26 sales in one day used to beat a price that sold all week.
    const busyDay = Array.from({ length: 26 }, (_, i) => line(3.79, `x${i}`));
    const allWeek = days(7).flatMap((d, i) => [line(4.49, `w${i}a`, d), line(4.49, `w${i}b`, d)]);
    const act = actualPricePoints([...busyDay, ...allWeek], 3.13);
    const s = suggestPrice(act);
    // Only one price qualifies, so there is no comparison to make.
    expect(s).toBeNull();
    expect(suggestionWithheld(act)).toMatch(/Not enough history/);
  });

  it("suggests between prices that both stood", () => {
    const low = days(MIN_SUGGESTION_DAYS).flatMap((d, i) =>
      [0, 1, 2].map((k) => line(3.99, `l${i}${k}`, d)),
    );
    const high = days(4).flatMap((d, i) => [line(4.49, `h${i}`, d), line(4.49, `h${i}z`, d)]);
    const act = actualPricePoints([...low, ...high], 3.13);
    const s = suggestPrice(act);
    expect(s).not.toBeNull();
    expect(s?.best.point.price).toBe(3.99);
    expect(suggestionWithheld(act)).toBeNull();
  });

  it("says nothing when there was only ever one price", () => {
    const act = actualPricePoints(days(5).map((d, i) => line(4.49, `r${i}`, d)), 3.13);
    expect(suggestionWithheld(act)).toBeNull();
  });
});
