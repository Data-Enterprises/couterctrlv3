import type { ItemSort, ItemSortCol, RecapItemRow } from "./recapTypes";

/** Where the item view opens: biggest net sales first, as Top 200 does. */
export const DEFAULT_ITEM_SORT: ItemSort = { column: "net", direction: "desc" };

/** Columns of words, which read A–Z first. */
const TEXT_COLS = new Set<ItemSortCol>(["code", "name", "dept", "vendor"]);

/**
 * Clicking a column head, by Top 200's rule: a new figure column starts
 * biggest first (most is the question being asked; smallest first reads as
 * broken), a column of words starts A–Z, and clicking the column already in
 * force flips it.
 */
export const nextItemSort = (current: ItemSort, column: ItemSortCol): ItemSort =>
  current.column === column
    ? { column, direction: current.direction === "desc" ? "asc" : "desc" }
    : { column, direction: TEXT_COLS.has(column) ? "asc" : "desc" };

const textOf = (r: RecapItemRow, c: ItemSortCol) =>
  c === "code" ? r.code : c === "name" ? r.name : c === "dept" ? r.subDeptName : (r.vendors[0] ?? "");

const numOf = (r: RecapItemRow, c: ItemSortCol) =>
  c === "units" ? r.units : c === "pounds" ? r.pounds : r.net;

/**
 * The rows in the order asked for. Ties fall back to net sales, biggest
 * first, then the name, so a page never reshuffles between renders.
 */
export const sortItemRows = (rows: RecapItemRow[], sort: ItemSort): RecapItemRow[] => {
  const dir = sort.direction === "asc" ? 1 : -1;
  const text = TEXT_COLS.has(sort.column);
  return [...rows].sort((a, b) => {
    const primary = text
      ? textOf(a, sort.column).localeCompare(textOf(b, sort.column), undefined, { numeric: true })
      : numOf(a, sort.column) - numOf(b, sort.column);
    return primary * dir || b.net - a.net || a.name.localeCompare(b.name);
  });
};
