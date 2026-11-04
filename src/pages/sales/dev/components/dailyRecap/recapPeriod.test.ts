import { describe, expect, it } from "vitest";
import { combineExceptions, combineMix } from "./recapPeriod";
import type { DayMixState, RecapExceptions, RecapMix } from "./recapTypes";

const mix = (codes: string[], over: Partial<RecapMix> = {}): DayMixState => ({
  status: "ready",
  mix: {
    items: codes.length,
    codes,
    refunds: { units: 1, net: 2 },
    regular: 10,
    promo: 5,
    unknown: 1,
    ...over,
  },
});

describe("a week's mix", () => {
  it("counts an item once however many days it sold on, and sums the money", () => {
    const week = combineMix([mix(["a", "b"]), mix(["b", "c"]), mix(["a"])]);
    expect(week.status).toBe("ready");
    if (week.status !== "ready") return;
    expect(week.mix.items).toBe(3);
    expect(week.mix).toMatchObject({ regular: 30, promo: 15, unknown: 3 });
    expect(week.mix.refunds).toEqual({ units: 3, net: 6 });
  });

  it("waits for every day rather than showing part of the week as the whole", () => {
    expect(combineMix([mix(["a"]), { status: "loading" }]).status).toBe("loading");
    expect(combineMix([mix(["a"]), { status: "idle" }]).status).toBe("loading");
  });

  it("is an error when any day could not be read", () => {
    expect(combineMix([mix(["a"]), { status: "error" }, { status: "loading" }]).status).toBe(
      "error",
    );
  });
});

const day = (types: RecapExceptions["types"]): RecapExceptions => ({
  transactions: types.reduce((n, t) => n + t.transactions, 0),
  amount: types.reduce((n, t) => n + (t.amount ?? 0), 0),
  types,
});

describe("a week's exceptions", () => {
  const byDay = {
    "2026-10-29": day([
      { type: "Refunded", label: "Refunded", transactions: 1, qty: 2, amount: 8 },
      { type: "No Sale", label: "No sale", transactions: 3, qty: null, amount: null },
    ]),
    "2026-10-30": day([
      { type: "Voided", label: "Voided", transactions: 2, qty: 4, amount: 12 },
      { type: "No Sale", label: "No sale", transactions: 1, qty: null, amount: null },
    ]),
  };

  it("adds the days' receipts and amounts, each type summed, in the card's order", () => {
    const week = combineExceptions(byDay, ["2026-10-28", "2026-10-29", "2026-10-30"]);
    expect(week.transactions).toBe(7);
    expect(week.amount).toBe(20);
    expect(week.types.map((t) => [t.type, t.transactions, t.qty, t.amount])).toEqual([
      ["Voided", 2, 4, 12],
      ["Refunded", 1, 2, 8],
      ["No Sale", 4, null, null],
    ]);
  });

  it("gives one day as it is, and a day with none as empty", () => {
    expect(combineExceptions(byDay, ["2026-10-30"])).toBe(byDay["2026-10-30"]);
    expect(combineExceptions(byDay, ["2026-10-28"])).toEqual({
      transactions: 0,
      amount: 0,
      types: [],
    });
  });

  it("leaves a day's own figures alone", () => {
    combineExceptions(byDay, ["2026-10-29", "2026-10-30"]);
    expect(byDay["2026-10-29"].types[1].transactions).toBe(3);
  });
});
