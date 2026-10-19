import { describe, it, expect } from "vitest";
import { directionOf, shareTrendOf, trendPoints } from "./shareQuestions";
import type { ShareRow } from "./shareBalance";

const row = (over: Partial<ShareRow> = {}): ShareRow => ({
  storeid: 685,
  storeName: "Bruces Foodland 370",
  storeNumber: "370",
  storeNumbersForId: ["369", "370"],
  sharePct: 8.5,
  usualPct: 9.4,
  changePct: -0.9,
  shareLwPct: 9.4,
  shareLyPct: null,
  money: -11_900,
  standing: "falling",
  ownPct: -1,
  ...over,
});

describe("directionOf", () => {
  it("needs more than the band to be a direction", () => {
    expect(directionOf(-0.9)).toBe("down");
    expect(directionOf(0.9)).toBe("up");
    expect(directionOf(0.4)).toBe("level");
    expect(directionOf(-0.4)).toBe("level");
  });

  it("has no direction with nothing to compare", () => {
    expect(directionOf(null)).toBeNull();
  });
});

describe("shareTrendOf", () => {
  it("calls a slide new when last week was on its usual share", () => {
    const t = shareTrendOf(row());
    expect(t.vsLw).toBe("down");
    expect(t.lwOffUsual).toBe("level");
    expect(t.running).toBe(false);
  });

  it("calls it a run when last week was already short", () => {
    const t = shareTrendOf(row({ shareLwPct: 8.6 }));
    expect(t.lwOffUsual).toBe("down");
    expect(t.running).toBe(true);
  });

  it("does not call a swing a run", () => {
    // Heavy last week, light this week: it has been moving, not sliding.
    const t = shareTrendOf(row({ shareLwPct: 10.4 }));
    expect(t.lwOffUsual).toBe("up");
    expect(t.running).toBe(false);
  });

  it("calls a rising store on a run the same way", () => {
    const t = shareTrendOf(
      row({ sharePct: 15.3, usualPct: 14.4, changePct: 0.9, shareLwPct: 15.2 }),
    );
    expect(t.running).toBe(true);
  });

  it("has no answer at all without last week", () => {
    const t = shareTrendOf(row({ shareLwPct: null }));
    expect(t.vsLw).toBeNull();
    expect(t.lwOffUsual).toBeNull();
    expect(t.running).toBe(false);
  });

  it("carries each period's share through untouched", () => {
    const t = shareTrendOf(row({ shareLyPct: 9.1 }));
    expect(t.tyPct).toBe(8.5);
    expect(t.lwPct).toBe(9.4);
    expect(t.lyPct).toBe(9.1);
  });
});

describe("trendPoints", () => {
  it("runs oldest to newest", () => {
    const pts = trendPoints(shareTrendOf(row({ shareLyPct: 9.1 })));
    expect(pts.map((p) => p.label)).toEqual(["LY", "LW", "TY"]);
  });

  it("leaves out a period with nothing on file rather than plotting nought", () => {
    const pts = trendPoints(shareTrendOf(row()));
    expect(pts.map((p) => p.label)).toEqual(["LW", "TY"]);
  });

  it("is one point for a store with no history at all", () => {
    const pts = trendPoints(shareTrendOf(row({ shareLwPct: null })));
    expect(pts).toEqual([{ label: "TY", pct: 8.5 }]);
  });
});
