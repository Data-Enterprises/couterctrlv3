import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildWindowPlan } from "@/pages/salesTracker/dev/utils";
import { fetchTrackerWindow } from "@/pages/salesTracker/dev/utils/trackerData";
import type { SubSale } from "@/interfaces";
import type { WindowPlan } from "@/pages/salesTracker/dev/interfaces";

const api = vi.hoisted(() => ({ daily: vi.fn() }));
vi.mock("@/api/sales", () => ({ getSubsDaily: api.daily }));

const scope = { url: "u/", token: "t", useGroups: 0, searchValue: 590 };

/** Every date from start to end, inclusive. */
const datesBetween = (start: string, end: string) => {
  const out: string[] = [];
  const d = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  while (d <= last) {
    out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
};

const row = (date: string): SubSale =>
  ({
    sale_date: `${date}T00:00:00`,
    storeid: 590,
    store_number: "590",
    store_name: "Store 590",
    sub_department: 1,
    sub_department_description: "Grocery",
    is_hash: false,
    total_sales: 10,
    net_sales: 10,
    total_tax: 0,
    qty: 1,
    transaction_count: 1,
  }) as SubSale;

/** `subs/daily` answering one row per day of whatever range it is asked for. */
beforeEach(() => {
  api.daily.mockReset();
  api.daily.mockImplementation((_u: string, _t: string, start: string, end: string) =>
    Promise.resolve({
      data: { error: 0, total_pages: 1, subs: datesBetween(start, end).map(row) },
    }),
  );
});

describe("fetchTrackerWindow", () => {
  it("asks for four weeks at a time, this year and last year apart", async () => {
    const plan = buildWindowPlan("2026-09-06", "2026-10-31");
    const res = await fetchTrackerWindow(scope, plan);
    // Eight weeks: two batches, each a TY and an LY range.
    expect(api.daily).toHaveBeenCalledTimes(4);
    const ranges = api.daily.mock.calls.map((c) => [c[2], c[3]]);
    expect(ranges).toContainEqual(["2026-09-06", "2026-10-03"]);
    expect(ranges).toContainEqual(["2026-10-04", "2026-10-31"]);
    expect(res?.ty).toHaveLength(56);
  });

  it("counts a last-year date once when two batches pair with it", async () => {
    // Five weeks, so two batches; the last day of week 4 and the first of week
    // 5 share one LY partner, the way a holiday snaps neighbours together.
    const base = buildWindowPlan("2026-09-06", "2026-10-10");
    const seamLy = base.pairs.find((p) => p.weekIndex === base.weeks[3].index && p.slot === 6)!.lyDate;
    const pairs = base.pairs.map((p) =>
      p.weekIndex === base.weeks[4].index && p.slot === 0 ? { ...p, lyDate: seamLy } : p,
    );
    const plan = { ...base, pairs } as WindowPlan;

    const res = await fetchTrackerWindow(scope, plan);
    const lyDays = (res?.ly ?? []).map((r) => r.sale_date.slice(0, 10));
    expect(lyDays.filter((d) => d === seamLy)).toHaveLength(1);
    expect(new Set(lyDays).size).toBe(lyDays.length);
  });

  it("keeps only each batch's own dates from a range read", async () => {
    const plan = buildWindowPlan("2026-09-06", "2026-10-03");
    const res = await fetchTrackerWindow(scope, plan);
    const owned = new Set(plan.pairs.map((p) => p.lyDate));
    expect((res?.ly ?? []).every((r) => owned.has(r.sale_date.slice(0, 10)))).toBe(true);
  });

  it("treats a store with no last year as empty, not as a failure", async () => {
    api.daily.mockImplementation((_u: string, _t: string, start: string, end: string) =>
      start < "2026-01-01"
        ? Promise.resolve({ data: { error: 1, msg: "No records returned" } })
        : Promise.resolve({ data: { error: 0, total_pages: 1, subs: datesBetween(start, end).map(row) } }),
    );
    const res = await fetchTrackerWindow(scope, buildWindowPlan("2026-09-06", "2026-10-03"));
    expect(res?.ty).toHaveLength(28);
    expect(res?.ly).toEqual([]);
  });
});
