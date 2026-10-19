import { describe, it, expect } from "vitest";
import {
  counterweightOf,
  shareBalanceOf,
  shareRowsOf,
  shareStandingCounts,
  shareStandingOf,
  SHARE_BAND_PCT,
  type ShareRow,
} from "./shareBalance";
import type { ComparisonRow } from "./storeComparison";

const cmp = (over: Partial<ComparisonRow> = {}): ComparisonRow =>
  ({
    storeid: 1,
    storeName: "Bruces Foodland 370",
    storeNumber: "370",
    storeNumbersForId: ["370"],
    ty: 116_600,
    lw: 117_700,
    ly: 0,
    shareTy: 0.085,
    shareLw: 0.094,
    shareLy: null,
    usualShare: 0.094,
    basis: "LW",
    expected: 128_500,
    gapValue: -11_900,
    gapPct: -9.3,
    ownPct: -0.96,
    ownLwPct: -0.96,
    ownLyPct: 0,
    hasLW: true,
    hasLY: false,
    dayCount: 7,
    lwDayCount: 7,
    lyDayCount: 0,
    rank: 6,
    verdict: "falling",
    excluded: null,
    ...over,
  }) as ComparisonRow;

describe("shareStandingOf", () => {
  it("is falling past half a point down", () => {
    expect(shareStandingOf(-0.9)).toBe("falling");
  });

  it("is rising past half a point up", () => {
    expect(shareStandingOf(0.9)).toBe("rising");
  });

  it("treats the same move the same way either side", () => {
    // The whole reason this is absolute points and not a percentage of the
    // store: a fall has to have a matching rise, or the balance is a lie.
    expect(shareStandingOf(-0.9)).toBe("falling");
    expect(shareStandingOf(0.9)).toBe("rising");
  });

  it("leaves the rounding of a normal week alone", () => {
    expect(shareStandingOf(0.1)).toBe("consistent");
    expect(shareStandingOf(-0.4)).toBe("consistent");
  });

  it("does not grade a store sitting exactly on the band", () => {
    expect(shareStandingOf(SHARE_BAND_PCT)).toBe("consistent");
    expect(shareStandingOf(-SHARE_BAND_PCT)).toBe("consistent");
  });
});

describe("shareRowsOf", () => {
  it("prices the share change at the group's week", () => {
    const [row] = shareRowsOf([cmp()]);
    expect(row.changePct).toBeCloseTo(-0.9, 5);
    expect(row.money).toBe(-11_900);
    expect(row.standing).toBe("falling");
  });

  it("drops a store with no usual share rather than placing it at nought", () => {
    // Nought share would make a store with no history the week's biggest
    // loser, which is the opposite of the truth: nobody can say.
    expect(
      shareRowsOf([cmp({ usualShare: null, gapValue: null, excluded: null })]),
    ).toEqual([]);
  });

  it("drops an excluded store", () => {
    expect(shareRowsOf([cmp({ excluded: "partial-week" })])).toEqual([]);
  });

  it("orders by share, biggest first", () => {
    const rows = shareRowsOf([
      cmp({ storeid: 1, shareTy: 0.08 }),
      cmp({ storeid: 2, shareTy: 0.22 }),
      cmp({ storeid: 3, shareTy: 0.15 }),
    ]);
    expect(rows.map((r) => r.storeid)).toEqual([2, 3, 1]);
  });
});

describe("shareBalanceOf", () => {
  const row = (
    storeid: number,
    money: number,
    changePct: number,
  ): ShareRow => ({
    storeid,
    storeName: `Store ${storeid}`,
    storeNumber: String(storeid),
    storeNumbersForId: [String(storeid)],
    sharePct: 10,
    usualPct: 10 - changePct,
    changePct,
    money,
    standing: shareStandingOf(changePct),
    ownPct: 0,
  });

  it("splits the week into what was lost and what was taken", () => {
    const b = shareBalanceOf([
      row(370, -11_900, -0.9),
      row(369, -6_300, -0.4),
      row(365, 11_800, 0.9),
      row(361, 2_200, 0.1),
      row(366, 2_000, 0.2),
      row(368, 1_000, 0.1),
      row(367, 1_000, 0.1),
      row(360, 300, 0.0),
    ]);
    expect(b.lost.map((r) => r.storeid)).toEqual([370, 369]);
    expect(b.gained[0].storeid).toBe(365);
    expect(b.lostTotal).toBe(-18_200);
    expect(b.gainedTotal).toBe(18_300);
  });

  it("reports how far the two sides are from cancelling", () => {
    // Exactly zero when every store is graded on the same period. Mixed
    // bases do not cancel, and the panel has to be able to say so rather
    // than quietly rounding a balance that does not balance.
    const b = shareBalanceOf([row(1, -100, -1), row(2, 100, 1)]);
    expect(b.imbalance).toBe(0);
    const c = shareBalanceOf([row(1, -100, -1), row(2, 140, 1)]);
    expect(c.imbalance).toBe(40);
  });

  it("puts the worst loss and the biggest gain first", () => {
    const b = shareBalanceOf([
      row(1, -100, -1),
      row(2, -900, -2),
      row(3, 100, 1),
      row(4, 900, 2),
    ]);
    expect(b.lost[0].storeid).toBe(2);
    expect(b.gained[0].storeid).toBe(4);
  });
});

describe("shareStandingCounts", () => {
  it("counts the bands for the headings", () => {
    const mk = (standing: ShareRow["standing"]): ShareRow => ({
      storeid: 1,
      storeName: "x",
      storeNumber: "1",
      storeNumbersForId: ["1"],
      sharePct: 1,
      usualPct: 1,
      changePct: 0,
      money: 0,
      standing,
      ownPct: null,
    });
    expect(
      shareStandingCounts([
        mk("falling"),
        mk("consistent"),
        mk("consistent"),
        mk("rising"),
      ]),
    ).toEqual({ falling: 1, consistent: 2, rising: 1 });
  });
});

describe("counterweightOf", () => {
  const row = (storeid: number, money: number): ShareRow => ({
    storeid,
    storeName: `Store ${storeid}`,
    storeNumber: String(storeid),
    storeNumbersForId: [String(storeid)],
    sharePct: 10,
    usualPct: 10,
    changePct: money / 1000,
    money,
    standing: shareStandingOf(money / 1000),
    ownPct: 0,
  });

  it("pairs a faller with the riser closest to its size", () => {
    const fell = row(370, -11_900);
    const rows = [fell, row(365, 11_800), row(368, 1_000)];
    expect(counterweightOf(fell, rows)?.storeid).toBe(365);
  });

  it("pairs a riser with a faller, the other way round", () => {
    const rose = row(365, 11_800);
    const rows = [row(370, -11_900), rose, row(368, -200)];
    expect(counterweightOf(rose, rows)?.storeid).toBe(370);
  });

  it("never pairs a store with itself", () => {
    const fell = row(370, -500);
    expect(counterweightOf(fell, [fell])).toBeNull();
  });

  it("tells co-located stores apart by their number", () => {
    const a: ShareRow = { ...row(370, -500), storeNumber: "370" };
    const b: ShareRow = { ...row(370, 500), storeNumber: "371" };
    expect(counterweightOf(a, [a, b])?.storeNumber).toBe("371");
  });

  it("has nobody to pair a store that did not move", () => {
    const flat = row(368, 0);
    expect(counterweightOf(flat, [flat, row(365, 900)])).toBeNull();
  });

  it("has nobody to pair when the whole group went one way", () => {
    const fell = row(370, -500);
    expect(counterweightOf(fell, [fell, row(365, -900)])).toBeNull();
  });
});
