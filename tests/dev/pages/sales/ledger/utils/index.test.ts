import { describe, expect, it } from "vitest";
import {
  filterLedgerRows,
  ledgerHeadline,
  severityBuckets,
  weekRangeLabel,
  weekRanges,
} from "@/pages/sales/dev/ledger/utils";
import type { LedgerRowData } from "@/pages/sales/dev/interfaces";

/*
 * The ledger's week, its grade chips and store filter, and the header's
 * figures.
 */

const row = (over: Partial<LedgerRowData>) =>
  ({
    store_name: "IGA GLASGOW KY",
    store_number: "001",
    twTotal: 0, lwTotal: 0, lyTotal: 0, twQty: 0, lwQty: 0, lyQty: 0,
    twTotalForLW: 0, twQtyForLW: 0, twTotalForLY: 0, twQtyForLY: 0,
    dayCount: 7, lwDayCount: 7, lyDayCount: 7,
    severity: "healthy",
    ...over,
  }) as LedgerRowData;

describe("weekRanges", () => {
  it("is the seven days ending on the date, the week before, and last year", () => {
    const r = weekRanges("11/08/2026");
    expect(r).toMatchObject({
      twStart: "2026-11-02",
      twEnd: "2026-11-08",
      lwStart: "2026-10-26",
      lwEnd: "2026-11-01",
    });
    expect(r.lyStart < r.lyEnd).toBe(true);
  });
});

describe("weekRangeLabel", () => {
  it("reads as the header shows it", () => {
    expect(weekRangeLabel("2026-11-02", "2026-11-08")).toBe("11/2 – 11/8/2026");
  });
});

describe("filterLedgerRows", () => {
  const rows = [
    row({ store_name: "IGA GLASGOW KY", severity: "critical" }),
    row({ store_name: "BROOKS TUPELO", store_number: "015", severity: "healthy" }),
    row({ store_name: "SHORT WEEK", store_number: "022", severity: null }),
  ];
  const buckets = severityBuckets(rows);

  it("keeps an ungraded store under All", () => {
    expect(filterLedgerRows(rows, buckets, "all", "")).toHaveLength(3);
    expect(filterLedgerRows(rows, buckets, "critical", "")).toHaveLength(1);
  });

  it("narrows by store name or number", () => {
    expect(filterLedgerRows(rows, buckets, "all", " tupelo ")).toHaveLength(1);
    expect(filterLedgerRows(rows, buckets, "all", "022")[0].store_name).toBe("SHORT WEEK");
  });
});

describe("ledgerHeadline", () => {
  it("divides each comparison by its own matched days, weighted by store size", () => {
    const h = ledgerHeadline(
      [
        row({ twTotal: 1000, twTotalForLY: 400, lyTotal: 500, dayCount: 7, lyDayCount: 3 }),
        row({ twTotal: 200, twTotalForLY: 200, lyTotal: 100, dayCount: 7, lyDayCount: 7 }),
      ],
      "sales",
    );
    expect(h.twTotal).toBe(1200);
    expect(h.vsLYPct).toBe(0);
    expect(h.hasLY).toBe(true);
    expect(h.hasLW).toBe(false);
    expect(h.lyDayCount).toBe(10);
  });
});
