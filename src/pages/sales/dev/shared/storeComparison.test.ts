import { describe, expect, it } from "vitest";
import type { LedgerRowData } from "../components/LedgerRow";
import type { DayDot } from "../../../../interfaces";
import {
  DEFAULT_BANDS,
  basisOf,
  compareForView,
  groupDays,
  selectionFor,
  MIN_STORES_FOR_RANK,
  compareStores,
  exclusionOf,
  scopeToDay,
  verdictOf,
} from "./storeComparison";

/** Seven days, each splitting the week's totals evenly. Enough for coverage
 *  to be whole, which is what most of these cases need it to be. */
const week = (tw: number, ly: number | null): DayDot[] =>
  Array.from({ length: 7 }, (_, i) => ({
    sale_date: `2026-09-2${i + 1}T00:00:00`,
    twNet: tw / 7,
    twQty: tw / 70,
    lwNet: null,
    lwQty: null,
    lyNet: ly === null ? null : ly / 7,
    lyQty: ly === null ? null : ly / 70,
  }));

/**
 * A ledger row with the fields this module reads, and defaults everywhere
 * else. `vsLYPct` is derived rather than passed so a test cannot quietly set a
 * store's own movement to something its totals disagree with — which is
 * exactly the mistake the verdict is built to catch.
 */
const store = (
  storeid: number,
  tw: number,
  ly: number | null,
  over: Partial<LedgerRowData> = {},
): LedgerRowData => {
  const hasLY = ly !== null;
  const days = week(tw, ly);
  return {
    storeid,
    store_name: `Store ${storeid}`,
    store_number: String(storeid),
    storeNumbersForId: [String(storeid)],
    twTotal: tw,
    lwTotal: 0,
    lyTotal: hasLY ? ly : 0,
    twQty: tw / 10,
    lwQty: 0,
    lyQty: hasLY ? ly / 10 : 0,
    twTotalForLW: 0,
    twQtyForLW: 0,
    twTotalForLY: hasLY ? tw : 0,
    twQtyForLY: hasLY ? tw / 10 : 0,
    dayCount: 7,
    lwDayCount: 0,
    lyDayCount: hasLY ? 7 : 0,
    vsLWPct: 0,
    vsLYPct: hasLY && ly > 0 ? ((tw - ly) / ly) * 100 : 0,
    vsLYDollar: hasLY ? tw - ly : 0,
    hasLW: false,
    hasLY,
    gradedOn: hasLY ? "LY" : null,
    severity: null,
    days,
    ...over,
  };
};

const byId = (g: ReturnType<typeof compareStores>, id: number) =>
  g.rows.find((r) => r.storeid === id)!;

describe("basisOf", () => {
  it("measures against last year when it covers the whole week", () => {
    expect(basisOf(store(1, 100, 90), "sales")).toBe("LY");
  });

  it("falls back to last week when last year is short", () => {
    const shortLy = store(1, 100, 100, {
      lyDayCount: 3,
      hasLW: true,
      lwDayCount: 7,
      lwTotal: 80,
      lwQty: 8,
    });
    expect(basisOf(shortLy, "sales")).toBe("LW");
  });

  it("falls back to last week when there is no last year at all", () => {
    const noLy = store(1, 100, null, {
      hasLW: true,
      lwDayCount: 7,
      lwTotal: 80,
      lwQty: 8,
    });
    expect(basisOf(noLy, "sales")).toBe("LW");
  });

  it("has no basis when neither period covers the week", () => {
    expect(basisOf(store(1, 100, null), "sales")).toBeNull();
  });

  it("has no basis when the period it would use recorded nothing", () => {
    expect(basisOf(store(1, 100, 0), "sales")).toBeNull();
  });

  it("asks in the active metric", () => {
    const row = store(1, 100, 100, { lyQty: 0 });
    expect(basisOf(row, "sales")).toBe("LY");
    expect(basisOf(row, "qty")).toBeNull();
  });
});

describe("exclusionOf", () => {
  it("names a store with nothing to measure against", () => {
    expect(exclusionOf(store(1, 100, null), "sales")).toBe("no-baseline");
  });

  it("names a store whose period recorded nothing", () => {
    expect(exclusionOf(store(1, 100, 0), "sales")).toBe("nothing-to-compare");
  });

  it("says nothing about a store that has a basis", () => {
    expect(exclusionOf(store(1, 100, 90), "sales")).toBeNull();
  });
});

describe("verdictOf", () => {
  const b = DEFAULT_BANDS;

  it("calls it Rising only when the store itself grew", () => {
    expect(verdictOf(20, 15, b)).toBe("rising");
  });

  it("will not call it Rising on a gap the store did not earn", () => {
    expect(verdictOf(20, 0, b)).toBe("consistent");
    expect(verdictOf(20, -12, b)).toBe("consistent");
  });

  it("calls a shortfall Falling whichever way the store itself moved", () => {
    expect(verdictOf(-20, -15, b)).toBe("falling");
    expect(verdictOf(-20, 15, b)).toBe("falling");
  });

  it("leaves the neutral band neutral", () => {
    expect(verdictOf(0, 0, b)).toBe("consistent");
    expect(verdictOf(b.pct, 50, b)).toBe("consistent");
    expect(verdictOf(-b.pct, -50, b)).toBe("consistent");
  });

  it("has no verdict without a gap", () => {
    expect(verdictOf(null, 40, b)).toBeNull();
  });
});

describe("compareStores — the sibling collapse", () => {
  // Three stores, each $100k last year. This week A and C are unchanged and B
  // rings nothing. A did not move, and every relative signal says it grew.
  const group = () =>
    compareStores(
      [store(1, 100_000, 100_000), store(2, 0, 100_000), store(3, 100_000, 100_000)],
      "sales",
    );

  it("lifts the untouched store's gap, because the group total fell", () => {
    const a = byId(group(), 1);
    expect(a.expected).toBeCloseTo(66_666.67, 1);
    expect(a.gapPct).toBeCloseTo(50, 1);
  });

  it("lifts its share too, so share and gap agree on a lie", () => {
    const a = byId(group(), 1);
    expect(a.shareTy as number).toBeGreaterThan(a.usualShare as number);
  });

  it("still does not call it Rising, because the store itself is flat", () => {
    const a = byId(group(), 1);
    expect(a.ownPct).toBe(0);
    expect(a.verdict).toBe("consistent");
  });

  it("calls the store that actually collapsed Falling", () => {
    const b = byId(group(), 2);
    expect(b.ownPct).toBe(-100);
    expect(b.verdict).toBe("falling");
  });
});

describe("compareStores — standing still in a group that moved", () => {
  it("calls a flat store Falling when the group grew around it", () => {
    // Not a false reading: the store held level while its group put on 25%, so
    // it did fall short of what its own weight predicted. This is the row the
    // plan words as "grew, but the group grew faster" — here it did not even
    // grow.
    const g = compareStores(
      [store(1, 100_000, 100_000), store(2, 150_000, 100_000)],
      "sales",
    );
    const steady = byId(g, 1);
    expect(steady.ownPct).toBe(0);
    expect(steady.expected).toBe(125_000);
    // Ground given up: it holds less of the group than it used to.
    expect(steady.shareTy as number).toBeLessThan(steady.usualShare as number);
    expect(steady.verdict).toBe("falling");
  });

  it("calls a flat store Consistent when the group was flat too", () => {
    const g = compareStores(
      [store(1, 100_000, 100_000), store(2, 100_000, 100_000)],
      "sales",
    );
    expect(byId(g, 1).verdict).toBe("consistent");
  });
});

describe("compareStores — the counted set", () => {
  it("keeps an excluded store's row but leaves it out of the totals", () => {
    const g = compareStores(
      [store(1, 100, 100), store(2, 100, null), store(3, 100, 100)],
      "sales",
    );
    expect(g.counted).toBe(2);
    expect(g.groupTy).toBe(200);
    expect(g.groupLy).toBe(200);
    expect(g.rows).toHaveLength(3);

    const out = byId(g, 2);
    expect(out.excluded).toBe("no-baseline");
    expect(out.verdict).toBeNull();
    expect(out.shareTy).toBeNull();
    expect(out.expected).toBeNull();
  });

  it("names why each store was set aside", () => {
    const g = compareStores(
      [
        store(1, 100, 100),
        store(2, 100, null),
        store(3, 100, 100, { lyDayCount: 2 }),
        store(4, 100, 0),
      ],
      "sales",
    );
    expect(g.excludedBy).toEqual({
      "no-baseline": 1,
      "partial-week": 1,
      "nothing-to-compare": 1,
    });
  });

  it("leaves the counted shares summing to 100%", () => {
    const g = compareStores(
      [store(1, 120, 100), store(2, 80, 100), store(3, 100, null)],
      "sales",
    );
    const sum = g.rows
      .filter((r) => r.shareTy !== null)
      .reduce((acc, r) => acc + (r.shareTy as number), 0);
    expect(sum).toBeCloseTo(1, 10);
  });
});

describe("compareStores — group aggregates", () => {
  it("takes vs LY as a sum of sums, not a mean of rates", () => {
    // One tiny store up 300% must not drag the group's figure around.
    const g = compareStores(
      [store(1, 1_000_000, 1_000_000), store(2, 400, 100)],
      "sales",
    );
    expect(g.groupVsLyPct).toBeCloseTo(0.03, 2);
    // The mean of the two store percentages would be 150.
  });

  it("reports the range and median of counted stores", () => {
    const g = compareStores(
      [store(1, 100, 100), store(2, 300, 100), store(3, 200, 100)],
      "sales",
    );
    expect(g.low).toBe(100);
    expect(g.high).toBe(300);
    expect(g.median).toBe(200);
  });

  it("names the store furthest below its expected", () => {
    const g = compareStores(
      [store(1, 100_000, 100_000), store(2, 20_000, 100_000), store(3, 90_000, 100_000)],
      "sales",
    );
    expect(g.biggestShortfall?.storeid).toBe(2);
  });

  it("has no shortfall to name when nobody is short", () => {
    const g = compareStores([store(1, 100, 100), store(2, 100, 100)], "sales");
    expect(g.biggestShortfall).toBeNull();
  });
});

describe("compareStores — small groups", () => {
  it("withholds rank below the floor rather than printing 2nd of 2", () => {
    const g = compareStores([store(1, 200, 100), store(2, 100, 100)], "sales");
    expect(g.rows.every((r) => r.rank === null)).toBe(true);
  });

  it("ranks once there are enough stores to rank among", () => {
    const rows = Array.from({ length: MIN_STORES_FOR_RANK }, (_, i) =>
      store(i + 1, (i + 1) * 100, 100),
    );
    const g = compareStores(rows, "sales");
    expect(byId(g, MIN_STORES_FOR_RANK).rank).toBe(1);
    expect(byId(g, 1).rank).toBe(MIN_STORES_FOR_RANK);
  });

  it("does not rank a store it did not count", () => {
    const rows = [
      ...Array.from({ length: MIN_STORES_FOR_RANK }, (_, i) =>
        store(i + 1, 100, 100),
      ),
      store(99, 999, null),
    ];
    expect(byId(compareStores(rows, "sales"), 99).rank).toBeNull();
  });
});

describe("compareStores — co-located stores", () => {
  it("counts one storeid once, however many numbers it carries", () => {
    const shared = store(1, 100, 100, {
      store_number: "369",
      storeNumbersForId: ["369", "370"],
    });
    const g = compareStores([shared, store(2, 100, 100)], "sales");
    expect(g.counted).toBe(2);
    expect(byId(g, 1).storeNumbersForId).toEqual(["369", "370"]);
  });
});

describe("compareStores — metric", () => {
  it("answers in units when the page is on Qty", () => {
    const g = compareStores([store(1, 1000, 500), store(2, 1000, 500)], "qty");
    // store() puts qty at a tenth of dollars.
    expect(g.groupTy).toBe(200);
    expect(g.groupLy).toBe(100);
  });
});

describe("scopeToDay", () => {
  const day = "2026-09-24";

  it("re-asks the whole question of one day", () => {
    const rows = scopeToDay([store(1, 700, 350), store(2, 700, 700)], day);
    const g = compareStores(rows, "sales");
    // Each store's week splits evenly over seven days.
    expect(g.groupTy).toBe(200);
    expect(g.groupLy).toBe(150);
    expect(byId(g, 1).ownPct).toBeCloseTo(100, 6);
    expect(byId(g, 2).ownPct).toBeCloseTo(0, 6);
  });

  it("tells a day with no counterpart from a day that rang nothing", () => {
    const noLastYear = scopeToDay([store(1, 700, null)], day)[0];
    expect(noLastYear.hasLY).toBe(false);
    expect(exclusionOf(noLastYear, "sales")).toBe("no-baseline");

    const rangNothing = scopeToDay([store(1, 0, 700)], day)[0];
    expect(rangNothing.hasLY).toBe(true);
    expect(exclusionOf(rangNothing, "sales")).toBeNull();
    expect(rangNothing.vsLYPct).toBe(-100);
  });

  it("leaves a store with no row for that day uncomparable", () => {
    const absent = scopeToDay([store(1, 700, 700)], "2026-12-25")[0];
    expect(absent.days).toEqual([]);
    expect(absent.dayCount).toBe(0);
    expect(exclusionOf(absent, "sales")).toBe("no-baseline");
  });

  it("keeps the sibling-collapse guard when scoped to a day", () => {
    const rows = scopeToDay(
      [store(1, 700_000, 700_000), store(2, 0, 700_000), store(3, 700_000, 700_000)],
      day,
    );
    const a = byId(compareStores(rows, "sales"), 1);
    expect(a.gapPct).toBeCloseTo(50, 1);
    expect(a.verdict).toBe("consistent");
  });
});

describe("compareForView", () => {
  const rows = [store(1, 108, 100), store(2, 100, 100)];

  it("judges against the page's own threshold", () => {
    // Store 1: +8% on itself, and +3.85% against what its usual share
    // predicts. Both figures sit either side of these two cuts.
    const wide = compareForView(rows, "sales", 9, null).rows[0];
    expect(wide.gapPct).toBeCloseTo(3.85, 1);
    expect(wide.verdict).toBe("consistent"); // 3.85 is inside a 9 band

    const tight = compareForView(rows, "sales", 3, null).rows[0];
    expect(tight.verdict).toBe("rising"); // and outside a 3 one, with the
    // store itself up 8%, which is what earns Rising rather than the gap alone
  });

  it("widens the band once a day is selected", () => {
    const day = "2026-09-24";
    const tight = compareForView(rows, "sales", 2, day).rows[0];
    const wide = compareForView(rows, "sales", 2, null).rows[0];
    // Same figures either way; only the cut they are judged against moves.
    expect(tight.gapPct).toBeCloseTo(wide.gapPct as number, 6);
    expect(tight.verdict).toBe("consistent");
    expect(wide.verdict).toBe("rising");
  });
});

describe("groupDays", () => {
  it("sums the group's week by date", () => {
    const days = groupDays([store(1, 700, 350), store(2, 700, 700)]);
    expect(days).toHaveLength(7);
    expect(days[0].twNet).toBeCloseTo(200, 6);
    expect(days[0].lyNet).toBeCloseTo(150, 6);
  });

  it("keeps a date null only when no store can compare on it", () => {
    const some = groupDays([store(1, 700, null), store(2, 700, 700)]);
    expect(some[0].lyNet).toBeCloseTo(100, 6);

    const none = groupDays([store(1, 700, null), store(2, 700, null)]);
    expect(none[0].lyNet).toBeNull();
  });

  it("hands the dates back in order", () => {
    const days = groupDays([store(1, 700, 700)]);
    const sorted = [...days].sort((a, b) => a.sale_date.localeCompare(b.sale_date));
    expect(days.map((d) => d.sale_date)).toEqual(sorted.map((d) => d.sale_date));
  });
});

describe("selectionFor", () => {
  it("spans the store's own days, sorted", () => {
    const sel = selectionFor(store(1, 700, 700));
    expect(sel.mode).toBe("weekly");
    expect(sel.start).toBe("2026-09-21");
    expect(sel.end).toBe("2026-09-27");
    expect(sel.days).toHaveLength(7);
  });

  it("carries the co-located numbers the detail panel labels with", () => {
    const sel = selectionFor(
      store(1, 700, 700, { store_number: "369", storeNumbersForId: ["369", "370"] }),
    );
    expect(sel.storeNumbersForId).toEqual(["369", "370"]);
    expect(sel.storeNumber).toBe("369");
  });
});
