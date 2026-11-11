import { describe, expect, it, vi } from "vitest";
import { weekWindow } from "@/pages/couponSales/dev/utils";

// Pinned to a US zone with daylight saving: the week ending 11/8/2026 starts
// the day after the clocks went back.
vi.stubEnv("TZ", "America/Chicago");

describe("weekWindow", () => {
  it("gives the week ending on the date and the two weeks before it", () => {
    expect(weekWindow("11/08/2026")).toEqual({
      weekStart: "2026-11-02",
      weekEnd: "2026-11-08",
      baseStart: "2026-10-19",
      baseEnd: "2026-11-01",
    });
  });
});
