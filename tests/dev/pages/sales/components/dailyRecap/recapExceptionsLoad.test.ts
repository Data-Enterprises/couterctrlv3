import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadWeekExceptions } from "@/pages/sales/dev/components/dailyRecap/recapExceptionsLoad";

const getExceptions = vi.fn();
vi.mock("@/api/exceptionLines", () => ({
  getExceptionLines: (...args: unknown[]) => getExceptions(...args),
}));

const page = (rows: { store_number: string }[], total_pages = 1) => ({
  data: { error: 0, total_pages, transactions: rows },
});

describe("the week's exception lines", () => {
  beforeEach(() => getExceptions.mockReset());

  it("reads every page for one store and the week, and keeps this location", async () => {
    getExceptions
      .mockResolvedValueOnce(page([{ store_number: "369" }, { store_number: "370" }], 2))
      .mockResolvedValueOnce(page([{ store_number: "369" }], 2));
    const lines = await loadWeekExceptions("u/", "t", 685, "369", "2026-10-27", "2026-11-02");
    expect(lines).toHaveLength(2);
    expect(getExceptions.mock.calls.map((c) => c.slice(2))).toEqual([
      [685, "2026-10-27", "2026-11-02", 1],
      [685, "2026-10-27", "2026-11-02", 2],
    ]);
  });

  it("reads 'No records returned' as a week with no exceptions", async () => {
    getExceptions.mockResolvedValue({ data: { error: 1, msg: "No records returned" } });
    await expect(loadWeekExceptions("u/", "t", 1, "1", "a", "b")).resolves.toEqual([]);
  });

  it("does not pass any other error off as a clean week", async () => {
    getExceptions.mockResolvedValue({ data: { error: 1, msg: "relation does not exist" } });
    await expect(loadWeekExceptions("u/", "t", 1, "1", "a", "b")).rejects.toThrow();
  });
});
