import { useState } from "react";

export type SortDir = "desc" | "asc";
export type SortState<C extends string> = { col: C; dir: SortDir } | null;

/**
 * The tri-state cycle used across the dev tables (Sub Dept Margins, the
 * Cashiers explorer): unsorted → desc → asc → back to the list's own default
 * ordering.
 *
 * Returning to default matters more here than elsewhere: every list on this
 * page is sorted worst-first by grade, which is the whole point of a
 * Performance page. Sorting by a column is a temporary lens, not a new
 * permanent order, so there has to be a way back.
 */
export const useTriStateSort = <C extends string>() => {
  const [sort, setSort] = useState<SortState<C>>(null);

  const handleSort = (col: C) =>
    setSort((prev) => {
      if (prev?.col !== col) return { col, dir: "desc" };
      if (prev.dir === "desc") return { col, dir: "asc" };
      return null;
    });

  /** Applies the active sort, or hands the rows back untouched so the caller's
   *  default ordering survives. */
  const applySort = <T,>(rows: T[], compare: (a: T, b: T, col: C) => number) => {
    if (!sort) return rows;
    const next = [...rows];
    next.sort((a, b) => {
      const diff = compare(a, b, sort.col);
      return sort.dir === "asc" ? diff : -diff;
    });
    return next;
  };

  return { sort, handleSort, applySort };
};
