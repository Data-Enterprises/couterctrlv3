import { describe, expect, it } from "vitest";
import {
  actualPricePoints,
  linesAtPrice,
  pricePointsFromServer,
  suggestPrice,
  suggestionWithheld,
  MIN_SUGGESTION_DAYS,
  mixedPriceFromServer,
  classifyPattern,
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

describe("a weighed line is read from its weight, not guessed", () => {
  /** A scale line: `transaction_list` returns pounds since 22 Oct. */
  const scale = (net: number, lb: number, receipt: string, qty = 1) =>
    ({ ...line(net, receipt, "2026-10-14", qty), weight: lb }) as TransactionListItem;

  it("treats an item with any weighed line as weighed", () => {
    const act = actualPricePoints(
      [scale(12.21, 3.5, "A"), scale(6.98, 2, "B")],
      3.13,
    );
    expect(act.isWeighted).toBe(true);
    // A weighed item has no averaged table: every line is already $/lb.
    expect(act.averaged).toHaveLength(0);
    expect(act.exactCount).toBe(2);
  });

  it("reads a pack weighing exactly one pound as weighed", () => {
    // The hole in the old guess. Quantity is a whole 1, so inferring from
    // integer-ness filed this as an each-priced unit; the weight says scale.
    const act = actualPricePoints([scale(3.49, 1, "A")], 3.13);
    expect(act.isWeighted).toBe(true);
    expect(act.averaged).toHaveLength(0);
  });

  it("counts a refund's negative weight as weighed", () => {
    const act = actualPricePoints(
      [scale(10.47, 3, "A"), scale(-3.49, -1, "B")],
      3.13,
    );
    expect(act.isWeighted).toBe(true);
  });

  it("reports unweighed when no line carries a weight", () => {
    // An each-priced item, and an API old enough to send no weight column.
    const act = actualPricePoints([line(3.49, "A"), line(3.49, "B")], 3.13);
    expect(act.isWeighted).toBe(false);
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

/**
 * COKE 6PK .5LT, store 695, week to 10/20/2026. A 2-for-$6.67 sale rang
 * $3.34 as a single and averaged $3.33 as a pair, so one promotion showed in
 * both tables a penny apart and read as two prices. The tile said 5 and the
 * note under it said "4 prices across 84 transactions" (finding AT).
 */
describe("one promotion across the two tables", () => {
  const sp = (over: Partial<ServerPricePoint>): ServerPricePoint => ({
    price_type: "SALE",
    multi: false,
    unit_price: 3.34,
    receipts: 34,
    units: 34,
    weight: 0,
    sales: 113.56,
    days_seen: 5,
    last_seen: "2026-10-18",
    weighed: false,
    ...over,
  });

  it("folds the averaged twin into the single-ring price", () => {
    const out = pricePointsFromServer(
      [
        sp({}),
        sp({ multi: true, unit_price: 3.33, receipts: 33, units: 66, sales: 219.78 }),
      ],
      2,
    );
    expect(out.exact).toHaveLength(1);
    expect(out.averaged).toHaveLength(0);
    // The price a customer actually paid is kept, not the division.
    expect(out.exact[0].price).toBe(3.34);
    expect(out.exact[0].trans).toBe(67);
    expect(out.exact[0].qty).toBe(100);
  });

  it("counts it once, and the tile and the note read that count", () => {
    const out = pricePointsFromServer(
      [
        sp({}),
        sp({ multi: true, unit_price: 3.33, receipts: 33 }),
        sp({ price_type: "REG", unit_price: 4.29, receipts: 17 }),
      ],
      2,
    );
    expect(out.priceCount).toBe(2);
    expect(out.exact.length + out.averaged.length).toBe(out.priceCount);
  });

  it("keeps two price types a penny apart as two prices", () => {
    // REG $3.34 and SALE $3.34 are two prices somebody set. Reading them as
    // one is how a promotion disappears.
    const out = pricePointsFromServer(
      [sp({ price_type: "REG" }), sp({ price_type: "SALE", multi: true })],
      2,
    );
    expect(out.priceCount).toBe(2);
  });

  it("leaves the multi-buy share alone", () => {
    // Those transactions were still multiples, and the multi share is what
    // decides whether a pattern is a package deal.
    const out = pricePointsFromServer(
      [sp({}), sp({ multi: true, unit_price: 3.33, receipts: 33 })],
      2,
    );
    expect(out.averagedCount).toBe(33);
    expect(out.exactCount).toBe(34);
  });

  it("does not fold prices that are genuinely apart", () => {
    const out = pricePointsFromServer(
      [sp({}), sp({ multi: true, unit_price: 2.99, receipts: 10 })],
      2,
    );
    expect(out.exact).toHaveLength(1);
    expect(out.averaged).toHaveLength(1);
    expect(out.priceCount).toBe(2);
  });
});


/**
 * The receipt counts behind Package deal, from the server (finding D).
 *
 * Figures are the backend's own, store 695, 14-20 Oct.
 */
describe("the multi-price receipt counts", () => {
  const point = (over: Partial<ServerPricePoint>): ServerPricePoint => ({
    price_type: "REG",
    multi: false,
    unit_price: 3.49,
    receipts: 40,
    units: 40,
    weight: 0,
    sales: 139.6,
    days_seen: 6,
    last_seen: "2026-10-20",
    weighed: false,
    ...over,
  });

  const patternFor = (
    resp: Parameters<typeof mixedPriceFromServer>[0],
    points = [point({}), point({ unit_price: 2.99, receipts: 40 })],
  ) =>
    classifyPattern(
      pricePointsFromServer(points, 1),
      mixedPriceFromServer(resp),
    );

  describe("reading them off the response", () => {
    it("is null when the API does not send them", () => {
      // An older deploy. The pattern is judged without them, as before.
      expect(mixedPriceFromServer({})).toBeNull();
    });

    it("is null on a weighed item, where the server sends null", () => {
      // Fam Pak Breast Tenders: receipts_total is real, the counts are not.
      expect(
        mixedPriceFromServer({
          receipts_total: 70,
          multi_price_receipts: null,
          max_price_spread: null,
        }),
      ).toBeNull();
    });

    it("carries the numbers through when they are there", () => {
      expect(
        mixedPriceFromServer({
          receipts_total: 69,
          multi_price_receipts: 12,
          max_price_spread: 2,
        }),
      ).toEqual({ mixedTxns: 12, uniqueTxns: 69, maxSpread: 2 });
    });

    it("treats a missing spread as zero rather than dropping the counts", () => {
      expect(
        mixedPriceFromServer({ receipts_total: 69, multi_price_receipts: 12 }),
      ).toEqual({ mixedTxns: 12, uniqueTxns: 69, maxSpread: 0 });
    });
  });

  describe("what the pattern does with them", () => {
    it("cannot fire without them", () => {
      // The bug: judged with no count at all, so it never fired.
      expect(patternFor({}).kind).not.toBe("package");
    });

    it("does not fire on COKE 6PK, whose two-price receipts were rounding", () => {
      // receipts_total 73, multi_price_receipts 0 -- all 11 two-price
      // receipts were $3.33 + $3.34, which is 3-for-$10 and not a deal.
      const p = patternFor({
        receipts_total: 73,
        multi_price_receipts: 0,
        max_price_spread: 0,
      });
      expect(p.kind).not.toBe("package");
    });

    it("does not fire below the threshold", () => {
      // Reduced packaged meat: 12 of 69 is 17%, under the 30% the pattern
      // asks for. Real mixed pricing, still not the store's normal way of
      // selling it.
      expect(
        patternFor({
          receipts_total: 69,
          multi_price_receipts: 12,
          max_price_spread: 2,
        }).kind,
      ).not.toBe("package");
    });

    it("fires once enough receipts carry two prices, and names the spread", () => {
      const p = patternFor({
        receipts_total: 80,
        multi_price_receipts: 40,
        max_price_spread: 1.5,
      });
      expect(p.kind).toBe("package");
      expect(p.detail).toContain("50%");
      expect(p.detail).toContain("1.50");
    });
  });
});
