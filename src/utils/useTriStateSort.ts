import { useState } from "react";

export type SortDir = "desc" | "asc";
export type SortState<C extends string> = { col: C; dir: SortDir } | null;

/**
 * The tri-state column sort shared by the Performance pages: unsorted → desc →
 * asc → back to the list's own default ordering.
 *
 * Returning to default matters more here than in an ordinary table. Every
 * Performance list is ordered worst-grade-first, which is the whole point of
 * the page — sorting by a column is a temporary lens, not a new permanent
 * order, so there has to be a way back to the grade order without reloading.
 */
export const useTriStateSort = <C extends string>() => {
  const [sort, setSort] = useState<SortState<C>>(null);

  const handleSort = (col: C) =>
    setSort((prev) => {
      if (prev?.col !== col) return { col, dir: "desc" };
      if (prev.dir === "desc") return { col, dir: "asc" };
      return null;
    });

  /**
   * Sorts by the active column, or hands the rows back untouched so the
   * caller's own ordering survives.
   *
   * `value` returning null means the row has no figure for that column — an
   * absent comparison period, not a low number. Those sort last in BOTH
   * directions: treating null as -Infinity would park every un-comparable row
   * at the top the moment you sorted ascending, which reads as "these are the
   * worst" when it actually means "these have nothing to compare".
   */
  const applySort = <T,>(rows: T[], value: (row: T, col: C) => number | null) => {
    if (!sort) return rows;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = value(a, sort.col);
      const vb = value(b, sort.col);
      if (va === null) return vb === null ? 0 : 1;
      if (vb === null) return -1;
      return (va - vb) * dir;
    });
  };

  return { sort, handleSort, applySort };
};
