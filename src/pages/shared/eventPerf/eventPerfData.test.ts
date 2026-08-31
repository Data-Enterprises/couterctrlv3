import { describe, expect, it } from "vitest";
import type { EventRow } from "../../../features/eventPerfSlice";
import {
  buildEventDays,
  buildGroupRows,
  buildLensCards,
  buildReceipts,
  buildTotals,
  busiestDay,
  EMPTY_SCOPE,
  receiptLabel,
} from "./eventPerfData";

const MON = "2026-08-24";
const TUE = "2026-08-25";
const WEEK = [MON, TUE, "2026-08-26"];

const ev = (over: Partial<EventRow> = {}): EventRow => ({
  lens: "No Sale",
  storeid: 685,
  store_number: "369",
  store_name: "Arab",
  cashier_number: 412,
  cashier_name: "Kayla M",
  terminal: "3",
  sale_id: "4471029",
  day: MON,
  amount: 10,
  count: 1,
  ...over,
});

/** LP's baseline: one aggregate row per store per type, standing for many
 *  transactions, with no cashier and no day. */
const agg = (over: Partial<EventRow> = {}): EventRow =>
  ev({
    cashier_number: null,
    cashier_name: "",
    terminal: "",
    sale_id: "",
    day: "",
    ...over,
  });

describe("transaction counting", () => {
  it("counts a multi-line sale once", () => {
    // Four coupon lines on one basket is one transaction and four lines.
    const rows = [
      ev(),
      ev({ amount: 5 }),
      ev({ amount: 2 }),
      ev({ amount: 1 }),
    ];
    const t = buildTotals(rows, [], EMPTY_SCOPE);
    expect(t.transactions).toBe(1);
    expect(t.lines).toBe(4);
    expect(t.amount).toBe(18);
  });

  it("reads an aggregate row's own count rather than treating it as one", () => {
    // LP's trend row stands for a whole store-week. Counting it as 1 would
    // draw a baseline bar 200x too short.
    const t = buildTotals(
      [ev()],
      [agg({ count: 200, amount: 900 })],
      EMPTY_SCOPE,
    );
    expect(t.baselineTransactions).toBe(200);
    expect(t.baselineAmount).toBe(900);
  });

  it("keeps two store numbers under one storeid apart", () => {
    // 685 carries both 369 and 370; grouping on storeid alone merges them.
    const rows = [
      ev(),
      ev({ store_number: "370", store_name: "Arab 2", sale_id: "9" }),
    ];
    expect(buildTotals(rows, [], EMPTY_SCOPE).stores).toBe(2);
    expect(
      buildGroupRows(rows, [], EMPTY_SCOPE, "store", "transactions"),
    ).toHaveLength(2);
  });
});

describe("the baseline", () => {
  it("gives a store a baseline bar", () => {
    const rows = buildGroupRows(
      [ev()],
      [agg({ count: 17, amount: 300 })],
      EMPTY_SCOPE,
      "store",
      "transactions",
    );
    expect(rows[0].baseline).toBe(17);
  });

  it("gives a cashier none, rather than zero", () => {
    // LP's trend knows stores and never people. A zero would read as "none
    // last time"; null draws no bar at all, which is the honest answer.
    const rows = buildGroupRows(
      [ev()],
      [agg({ count: 17 })],
      EMPTY_SCOPE,
      "cashier",
      "transactions",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].baseline).toBeNull();
  });

  it("matches the selected day by WEEKDAY, not by date", () => {
    // MON is a Monday. The baseline window sits two weeks back, so its
    // Mondays are the comparison — not its whole fortnight, and not the same
    // calendar date.
    const t = buildTotals(
      [ev({ day: MON }), ev({ day: TUE, sale_id: "2" })],
      [
        ev({ day: "2026-08-10", sale_id: "b1", amount: 5 }), // Monday
        ev({ day: "2026-08-17", sale_id: "b2", amount: 5 }), // Monday
        ev({ day: "2026-08-11", sale_id: "b3", amount: 99 }), // Tuesday
      ],
      { ...EMPTY_SCOPE, day: MON },
    );
    expect(t.transactions).toBe(1);
    expect(t.baselineTransactions).toBe(2);
    expect(t.baselineAmount).toBe(10);
  });

  it("drops a dateless row when a day is selected", () => {
    // It cannot be matched to one, and pretending it can is how the bar came
    // to show a full period against a single day.
    const t = buildTotals([ev()], [agg({ count: 40 })], {
      ...EMPTY_SCOPE,
      day: MON,
    });
    expect(t.baselineTransactions).toBeNull();
  });

  it("gives each column its own weekday's baseline on the chart", () => {
    // A flat seventh drew the same grey bar under every day, which said
    // nothing: a Saturday baseline and a Tuesday baseline are different
    // numbers, and that difference is the reason the bar is there.
    const days = buildEventDays(
      [ev({ day: MON })],
      [
        ev({ day: "2026-08-10", sale_id: "b1" }), // Monday
        ev({ day: "2026-08-17", sale_id: "b2" }), // Monday
        ev({ day: "2026-08-11", sale_id: "b3" }), // Tuesday
      ],
      EMPTY_SCOPE,
      WEEK,
      "transactions",
    );
    expect(days[0].baseline).toBe(2); // Mon
    expect(days[1].baseline).toBe(1); // Tue
    expect(days[2].baseline).toBe(0); // Wed — nothing that weekday
  });
});

describe("buildLensCards", () => {
  it("gives every lens its own card, plus one for everything", () => {
    const rows = [
      ev({ lens: "No Sale" }),
      ev({ lens: "Void", sale_id: "2", amount: 30 }),
      ev({ lens: "Void", sale_id: "3", amount: 20 }),
    ];
    const [all, noSale, voided] = buildLensCards(rows, [], EMPTY_SCOPE, [
      null,
      "No Sale",
      "Void",
    ]);
    expect(all.transactions).toBe(3);
    expect(noSale.transactions).toBe(1);
    expect(voided.transactions).toBe(2);
    expect(voided.amount).toBe(50);
  });

  it("narrows every card by the drill, not just the open one", () => {
    const rows = [
      ev({ lens: "Void", sale_id: "1" }),
      ev({ lens: "Void", sale_id: "2", store_number: "370" }),
    ];
    const [all, voided] = buildLensCards(
      rows,
      [],
      { ...EMPTY_SCOPE, storeKey: "685__369" },
      [null, "Void"],
    );
    expect(all.transactions).toBe(1);
    expect(voided.transactions).toBe(1);
  });

  it("matches buildTotals for the same scope", () => {
    // The one-pass version replaced N calls to buildTotals; drifting from it
    // would put different figures on the card than on everything below it.
    const rows = [ev(), ev({ sale_id: "2", lens: "Void", amount: 7 })];
    const base = [agg({ count: 12, amount: 99 })];
    const [card] = buildLensCards(rows, base, EMPTY_SCOPE, [null]);
    const direct = buildTotals(rows, base, EMPTY_SCOPE);
    expect(card).toEqual(direct);
  });
});

describe("buildReceipts", () => {
  it("collapses a sale's lines into one row carrying the total", () => {
    const out = buildReceipts(
      [
        ev({ amount: 6.99 }),
        ev({ amount: 4.5 }),
        ev({ sale_id: "4470884", amount: 7.29 }),
      ],
      EMPTY_SCOPE,
      "",
    );
    expect(out).toHaveLength(2);
    const big = out.find((r) => r.saleId === "4471029")!;
    expect(big.lines).toBe(2);
    expect(big.amount).toBeCloseTo(11.49);
  });

  it("searches sale id, cashier and lane", () => {
    const rows = [
      ev(),
      ev({ sale_id: "999", cashier_name: "Devon P", terminal: "1" }),
    ];
    expect(buildReceipts(rows, EMPTY_SCOPE, "devon")).toHaveLength(1);
    expect(buildReceipts(rows, EMPTY_SCOPE, "4471")).toHaveLength(1);
    expect(buildReceipts(rows, EMPTY_SCOPE, "nope")).toHaveLength(0);
  });

  it("ignores aggregate rows, which are not receipts", () => {
    expect(buildReceipts([agg({ count: 40 })], EMPTY_SCOPE, "")).toHaveLength(
      0,
    );
  });
});

describe("group rows", () => {
  it("lists a cashier's lanes", () => {
    const rows = buildGroupRows(
      [ev({ terminal: "3" }), ev({ terminal: "5", sale_id: "2" })],
      [],
      EMPTY_SCOPE,
      "cashier",
      "transactions",
    );
    expect(rows[0].label).toBe("Kayla M · 412");
    expect(rows[0].sub).toBe("lanes 3, 5");
  });

  it("orders by size, not by distance from baseline", () => {
    // Ordering by how unusual someone looks is the grading this page is
    // deliberately without.
    const rows = buildGroupRows(
      [
        ev({ cashier_number: 1, cashier_name: "A", sale_id: "1" }),
        ev({ cashier_number: 2, cashier_name: "B", sale_id: "2" }),
        ev({ cashier_number: 2, cashier_name: "B", sale_id: "3" }),
      ],
      [],
      EMPTY_SCOPE,
      "cashier",
      "transactions",
    );
    expect(rows.map((r) => r.label)).toEqual(["B · 2", "A · 1"]);
  });
});

describe("receiptLabel", () => {
  it("takes the second segment, not the last", () => {
    // 54-454872-3-8-30-2026 — the tail is the DATE, so .pop() would label
    // every receipt in a week with the same four digits.
    expect(receiptLabel("54-454872-3-8-30-2026")).toBe("454872");
  });

  it("leaves a plain id alone", () => {
    // Coupon Sales sale ids are numbers with no structure to strip.
    expect(receiptLabel("7352085")).toBe("7352085");
  });
});

describe("busiestDay", () => {
  it("names the biggest day, and nothing when the week is empty", () => {
    const days = buildEventDays(
      [ev({ day: TUE }), ev({ day: TUE, sale_id: "2" }), ev({ day: MON })],
      [],
      EMPTY_SCOPE,
      WEEK,
      "transactions",
    );
    expect(busiestDay(days)).toContain("Tue");
    expect(
      busiestDay(buildEventDays([], [], EMPTY_SCOPE, WEEK, "transactions")),
    ).toBeNull();
  });
});
