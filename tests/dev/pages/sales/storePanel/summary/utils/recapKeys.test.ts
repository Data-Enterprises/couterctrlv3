import { describe, expect, it } from "vitest";
import { dayKey, isCacheableDay, localIsoToday } from "@/pages/sales/dev/storePanel/summary/utils/recapKeys";

describe("what Summary keeps", () => {
  it("keys a day by store, location and date", () => {
    expect(dayKey(685, "369", "2026-10-30")).toBe("685__369__2026-10-30");
    expect(dayKey(685, "370", "2026-10-30")).not.toBe(dayKey(685, "369", "2026-10-30"));
  });

  it("reads today in the reader's own time zone", () => {
    expect(localIsoToday(new Date(2026, 10, 4, 23, 30))).toBe("2026-11-04");
    expect(localIsoToday(new Date(2026, 0, 2, 0, 5))).toBe("2026-01-02");
  });

  it("never keeps today's rows, and keeps every finished day", () => {
    expect(isCacheableDay("2026-11-04", "2026-11-04")).toBe(false);
    expect(isCacheableDay("2026-11-03", "2026-11-04")).toBe(true);
    expect(isCacheableDay("2026-11-05", "2026-11-04")).toBe(false);
  });
});
