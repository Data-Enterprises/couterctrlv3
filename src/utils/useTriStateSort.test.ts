import { describe, expect, it } from "vitest";
import { nextSort, sortRows } from "./useTriStateSort";

/*
 * The column sort: a header click goes desc, asc, then back to the list's own
 * order, and a row with no figure sorts last either way.
 */

describe("nextSort", () => {
  it("goes desc, then asc, then off on the same column", () => {
    const desc = nextSort<"a" | "b">(null, "a");
    expect(desc).toEqual({ col: "a", dir: "desc" });
    const asc = nextSort(desc, "a");
    expect(asc).toEqual({ col: "a", dir: "asc" });
    expect(nextSort(asc, "a")).toBeNull();
  });

  it("starts a different column at desc", () => {
    expect(nextSort<"a" | "b">({ col: "a", dir: "asc" }, "b")).toEqual({
      col: "b",
      dir: "desc",
    });
  });
});

describe("sortRows", () => {
  const rows = [{ v: 2 }, { v: null }, { v: 5 }, { v: 1 }];
  const value = (r: { v: number | null }) => r.v;

  it("hands the rows back untouched when nothing is sorted", () => {
    expect(sortRows(rows, null, value)).toBe(rows);
  });

  it("sorts both ways with the row that has no figure last", () => {
    expect(sortRows(rows, { col: "v", dir: "desc" }, value).map((r) => r.v)).toEqual([5, 2, 1, null]);
    expect(sortRows(rows, { col: "v", dir: "asc" }, value).map((r) => r.v)).toEqual([1, 2, 5, null]);
  });
});
