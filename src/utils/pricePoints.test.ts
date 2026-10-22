import { describe, expect, it } from "vitest";
import {
  actualPricePoints,
  linesAtPrice,
  pricePointsFromServer,
  suggestPrice,
  suggestionWithheld,
  MIN_SUGGESTION_DAYS,
} from "./pricePoints";
import type { TransactionListItem } from "../interfaces";
import type { ServerPricePoint } from "../api/pricePoints";

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

/** One row of `cashiers/price_points`. */
const sp = (over: Partial<ServerPricePoint>): ServerPricePoint => ({
  price_type: "REG",
  multi: false,
  unit_price: 3.49,
  receipts: 10,
  units: 10,
  weight: 0,
  sales: 34.9,
  days_seen: 4,
  last_seen: "2026-10-20",
  weighed: false,
  ...over,
});

describe("pricePointsFromServer", () => {
  it("files single rings as exact and multiples as averaged", () => {
    const act = pricePointsFromServer(
      [
        sp({ unit_price: 6.49, receipts: 40 }),
        sp({ unit_price: 3.34, multi: true, receipts: 28, units: 166, sales: 553.37 }),
      ],
      3.13,
    );
    expect(act.exact.map((p) => p.price)).toEqual([6.49]);
    expect(act.averaged.map((p) => p.price)).toEqual([3.34]);
    expect(act.exactCount).toBe(40);
    expect(act.averagedCount).toBe(28);
    expect(act.receiptCount).toBe(68);
    expect(act.exact[0].lines).toEqual([]);
  });

  it("folds the server's half-cent twins as the browser's were folded", () => {
    // COKE 6PK, 2 for $6.67: 28 receipts at $3.34 and 5 at $3.33 on the
    // server, which are one price.
    const act = pricePointsFromServer(
      [
        sp({ unit_price: 3.34, multi: true, receipts: 28, units: 166, sales: 553.37, days_seen: 5 }),
        sp({ unit_price: 3.33, multi: true, receipts: 5, units: 14, sales: 46.69, days_seen: 2, last_seen: "2026-10-21" }),
      ],
      3.13,
    );
    expect(act.averaged).toHaveLength(1);
    const p = act.averaged[0];
    expect(p.price).toBe(3.34);
    expect(p.trans).toBe(33);
    expect(p.qty).toBe(180);
    expect(p.sales).toBeCloseTo(600.06, 2);
    // Days may overlap, so the larger stands rather than the sum.
    expect(p.daysSeen).toBe(5);
    expect(p.lastSeen).toBe("2026-10-21");
  });

  it("prices a weighed item per pound, on pounds", () => {
    // Ground beef at 695: the $3.49 sale, the $6.49 shelf price, one markdown.
    const act = pricePointsFromServer(
      [
        sp({ price_type: "SALE", unit_price: 3.49, receipts: 159, units: 323, weight: 1120.139, sales: 3909.28, days_seen: 1, weighed: true }),
        sp({ unit_price: 6.49, receipts: 60, units: 70, weight: 200, sales: 1298, weighed: true }),
        sp({ unit_price: 6.16, receipts: 1, units: 1, weight: 2.5, sales: 15.4, days_seen: 1, weighed: true }),
      ],
      2.1,
    );
    expect(act.isWeighted).toBe(true);
    expect(act.averaged).toEqual([]);
    expect(act.exact.map((p) => p.price)).toEqual([3.49, 6.49, 6.16]);
    expect(act.exact[0].qty).toBeCloseTo(1120.139, 3);
    expect(act.exact[0].marginPerUnit).toBeCloseTo(1.39, 2);
  });

  it("keeps a weighed multi row in the exact table", () => {
    const act = pricePointsFromServer(
      [sp({ multi: true, weighed: true, weight: 5, units: 2 })],
      1,
    );
    expect(act.exact).toHaveLength(1);
    expect(act.averaged).toHaveLength(0);
  });

  it("drops refund-only buckets, as the receipts did", () => {
    const act = pricePointsFromServer(
      [sp({ sales: -6.49 }), sp({ unit_price: 3.49, sales: 0 })],
      1,
    );
    expect(act.exact).toEqual([]);
    expect(act.receiptCount).toBe(0);
  });

  it("gives the suggestion something to rank", () => {
    const act = pricePointsFromServer(
      [sp({ unit_price: 3.49, receipts: 50, units: 60, sales: 209.4, days_seen: 7 }), sp({ unit_price: 3.99, receipts: 20, units: 20, sales: 79.8, days_seen: 7 })],
      2,
    );
    expect(suggestPrice(act)?.best.point.price).toBe(3.49);
  });
});

describe("linesAtPrice", () => {
  const weighed = (net: number, weight: number, receipt: string, priceType = "REG") =>
    ({ ...line(net, receipt, "2026-10-14", 1, priceType), weight }) as TransactionListItem;

  it("matches an each-priced line to the cent", () => {
    const [point] = pricePointsFromServer([sp({ unit_price: 3.49 })], 1).exact;
    const lines = [line(3.49, "A"), line(3.5, "B"), line(3.48, "C"), line(3.6, "D")];
    expect(
      linesAtPrice(lines, point, { weighed: false, averaged: false }).map((t) => t.sale_id),
    ).toEqual(["A", "B", "C"]);
  });

  it("keeps single and multiple rings apart", () => {
    const [point] = pricePointsFromServer([sp({ unit_price: 3.34, multi: true })], 1).averaged;
    const lines = [line(3.34, "single"), line(3.34, "pair", "2026-10-14", 2)];
    expect(
      linesAtPrice(lines, point, { weighed: false, averaged: true }).map((t) => t.sale_id),
    ).toEqual(["pair"]);
  });

  it("matches a weighed line by its total against price times weight", () => {
    // $11.79/lb ribeye: 2.36 lb rings $27.82, which is 11.788/lb -- inside the
    // rounding the server allows, so it is a shelf-price ring.
    const [point] = pricePointsFromServer(
      [sp({ unit_price: 11.79, weighed: true, weight: 507.23, sales: 5981.29 })],
      8,
    ).exact;
    const lines = [
      weighed(27.82, 2.36, "shelf"),
      weighed(-33.01, -2.8, "refund"),
      weighed(20, 2.36, "markdown"),
    ];
    expect(
      linesAtPrice(lines, point, { weighed: true, averaged: false }).map((t) => t.sale_id),
    ).toEqual(["shelf", "refund"]);
  });

  it("does not cross price types", () => {
    const [point] = pricePointsFromServer([sp({ price_type: "SALE", unit_price: 3.49 })], 1).exact;
    expect(
      linesAtPrice([line(3.49, "A", "2026-10-14", 1, "REG")], point, { weighed: false, averaged: false }),
    ).toEqual([]);
  });
});
