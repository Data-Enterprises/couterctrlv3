import { describe, it, expect } from "vitest";
import { shareDaysOf, shareDayNoteOf, storeKeyOf, type ShareDay } from "./shareByDay";
import type { LedgerRowData } from "../components/LedgerRow";

const day = (date: string, twNet: number) => ({
  sale_date: date,
  twNet,
  twQty: twNet / 10,
  lwNet: null,
  lyNet: null,
  lwQty: null,
  lyQty: null,
});

const store = (
  storeid: number,
  store_number: string,
  nets: number[],
): LedgerRowData =>
  ({
    storeid,
    store_name: `Store ${store_number}`,
    store_number,
    storeNumbersForId: [store_number],
    days: nets.map((n, i) => day(`2026-10-${String(12 + i).padStart(2, "0")}`, n)),
  }) as unknown as LedgerRowData;

describe("shareDaysOf", () => {
  const rows = [
    store(1, "370", [100, 100, 100]),
    store(2, "365", [300, 300, 900]),
  ];
  const counted = new Set(rows.map(storeKeyOf));

  it("divides the store by the group, day by day", () => {
    const out = shareDaysOf(rows, counted, "1__370", 25, "sales");
    expect(out.map((d) => d.sharePct)).toEqual([25, 25, 10]);
  });

  it("prices the day against the usual share", () => {
    const out = shareDaysOf(rows, counted, "1__370", 25, "sales");
    // Level on the first two days; a tenth of a $1,000 day where a quarter
    // was usual is $150 given up.
    expect(out[0].money).toBe(0);
    expect(out[2].money).toBeCloseTo(-150, 6);
  });

  it("leaves a store out of the denominator when the week left it out", () => {
    const only = new Set(["1__370"]);
    const out = shareDaysOf(rows, only, "1__370", 25, "sales");
    expect(out.map((d) => d.sharePct)).toEqual([100, 100, 100]);
  });

  it("has no share on a day the group rang nothing", () => {
    const quiet = [store(1, "370", [0]), store(2, "365", [0])];
    const out = shareDaysOf(quiet, new Set(quiet.map(storeKeyOf)), "1__370", 25, "sales");
    expect(out[0].sharePct).toBeNull();
    expect(out[0].money).toBeNull();
  });

  it("answers the active metric", () => {
    const out = shareDaysOf(rows, counted, "1__370", 25, "qty");
    expect(out.map((d) => d.sharePct)).toEqual([25, 25, 10]);
  });

  it("comes back in date order", () => {
    const out = shareDaysOf(rows, counted, "1__370", 25, "sales");
    expect(out.map((d) => d.date)).toEqual([
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
    ]);
  });
});

describe("shareDayNoteOf", () => {
  const mk = (
    date: string,
    label: string,
    money: number | null,
    groupValue = 1000,
  ): ShareDay => ({
    date,
    label,
    sharePct: money === null ? null : 10,
    changePct: money === null ? null : money / 100,
    money,
    storeValue: 100,
    groupValue,
  });

  it("names the day that gave up the most", () => {
    const note = shareDayNoteOf([
      mk("2026-10-12", "Mon", 20),
      mk("2026-10-13", "Tue", -50),
      mk("2026-10-14", "Wed", -200),
    ]);
    expect(note.worst?.label).toBe("Wed");
    expect(note.below).toBe(2);
    expect(note.weekMoney).toBe(-230);
  });

  it("finds the run only when the week ends on one", () => {
    const ending = shareDayNoteOf([
      mk("2026-10-12", "Mon", 20),
      mk("2026-10-13", "Tue", -50),
      mk("2026-10-14", "Wed", -200),
    ]);
    expect(ending.runFrom?.label).toBe("Tue");

    const scattered = shareDayNoteOf([
      mk("2026-10-12", "Mon", -50),
      mk("2026-10-13", "Tue", -20),
      mk("2026-10-14", "Wed", 200),
    ]);
    expect(scattered.runFrom).toBeNull();
  });

  it("says when the worst day is also the biggest", () => {
    const note = shareDayNoteOf([
      mk("2026-10-12", "Mon", -20, 500),
      mk("2026-10-13", "Tue", -200, 4000),
    ]);
    expect(note.worstIsBiggestDay).toBe(true);
  });

  it("has nothing to say about a week with no shortfall", () => {
    const note = shareDayNoteOf([
      mk("2026-10-12", "Mon", 20),
      mk("2026-10-13", "Tue", 50),
    ]);
    expect(note.worst).toBeNull();
    expect(note.runFrom).toBeNull();
    expect(note.below).toBe(0);
  });

  it("skips days with no share rather than counting them as shortfalls", () => {
    const note = shareDayNoteOf([
      mk("2026-10-12", "Mon", null),
      mk("2026-10-13", "Tue", -50),
    ]);
    expect(note.below).toBe(1);
    expect(note.weekMoney).toBe(-50);
  });
});
