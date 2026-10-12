import { describe, it, expect } from "vitest";
import { formatDate } from ".";

/**
 * The regression these cover: `new Date("2026-09-22")` is UTC midnight by spec,
 * and the getters are local, so every bare date printed as the day before in any
 * zone west of Greenwich. Receivers showed a whole panel one day early.
 *
 * The date-only path is string arithmetic now, so these assertions hold in every
 * timezone rather than passing wherever the suite happens to run.
 */
describe("formatDate", () => {
  it("keeps a bare yyyy-mm-dd on its own day", () => {
    expect(formatDate("2026-09-22")).toBe("9/22/2026");
    expect(formatDate("2026-01-01")).toBe("1/1/2026");
    expect(formatDate("2026-12-31")).toBe("12/31/2026");
  });

  it("drops the leading zeros the way the rest of the app writes dates", () => {
    expect(formatDate("2026-03-07")).toBe("3/7/2026");
  });

  it("holds across a DST boundary", () => {
    // US DST ends Nov 1 2026. A date-only string is not a moment in time, so
    // neither side of it should move.
    expect(formatDate("2026-10-31")).toBe("10/31/2026");
    expect(formatDate("2026-11-01")).toBe("11/1/2026");
  });

  it("still reads a zoneless datetime as local", () => {
    // What the Coupons and Cashiers payloads carry. This path never had the
    // bug, and the fix must not disturb it.
    expect(formatDate("2026-09-22T00:00:00")).toBe("9/22/2026");
    expect(formatDate("2026-09-22T23:59:59")).toBe("9/22/2026");
  });

  it("still accepts the JS date strings some callers build", () => {
    // `searchSlice` seeds its range with `addDays(new Date(), -1).toString()`,
    // which is not ISO at all.
    const d = new Date(2026, 8, 22);
    expect(formatDate(d.toString())).toBe("9/22/2026");
  });
});
