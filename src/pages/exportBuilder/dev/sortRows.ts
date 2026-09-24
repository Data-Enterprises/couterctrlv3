import type { ExportColumn, ExportRow, ExportSort } from "../../../api/salesExport";
import { isNumericType } from "./aggregates";

/**
 * The preview, in the order the file will be written.
 *
 * Sorted here rather than on the way in, because the sort is a question about
 * the finished rows: a summary is sorted by its measures as often as by its
 * keys, and those do not exist until the rollup has run.
 *
 * A measure has no column type behind it, so anything that is not a known
 * text column is compared as a number when both sides look like one. That is
 * the same rule the rest of the page uses, and the same one Postgres lands on
 * for a numeric column.
 */
export const sortRows = (
  rows: ExportRow[],
  orderBy: ExportSort[],
  columns: ExportColumn[],
) => {
  if (orderBy.length === 0) return rows;

  const textual = new Set(
    columns
      .filter((c) => !isNumericType(c.data_type))
      .map((c) => c.name),
  );

  return [...rows].sort((a, b) => {
    for (const { key, desc } of orderBy) {
      const x = a[key];
      const y = b[key];
      if (x === y) continue;
      // Nulls last whichever way it is sorted: an empty cell is not the
      // smallest value, it is the absence of one.
      if (x === null || x === undefined) return 1;
      if (y === null || y === undefined) return -1;

      let order: number;
      if (textual.has(key)) {
        order = String(x) < String(y) ? -1 : 1;
      } else {
        const nx = Number(x);
        const ny = Number(y);
        order = Number.isNaN(nx) || Number.isNaN(ny)
          ? String(x) < String(y)
            ? -1
            : 1
          : nx - ny;
      }
      if (order !== 0) return desc ? -order : order;
    }
    return 0;
  });
};
