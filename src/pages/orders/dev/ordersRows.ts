import type { AllOrder } from "../../../interfaces";
import type { OrdersFilters } from "../../../features/dev/devOrdersSlice";

export type SortKey = "order" | "seq" | "qty" | "ext_retail" | "profit";
export type SortDir = "asc" | "desc";

/** What the grid is narrowed by on top of the configuration panel. */
export type GridNarrowing = {
  upc: string;
  desc: string;
  sort: SortKey;
  dir: SortDir;
};

/**
 * The configuration panel's six filters, applied in one pass.
 *
 * Empty means all, per filter — the same convention the controls use, so an
 * untouched panel produces the whole set rather than nothing.
 */
export const applyFilters = (lines: AllOrder[], f: OrdersFilters): AllOrder[] => {
  const types = new Set(f.orderTypes);
  const stores = new Set(f.storeNumbers);
  const dates = new Set(f.dates);
  const subs = new Set(f.subIds);
  const codes = new Set(f.productCodes);
  const ids = new Set(f.orderIds);

  return lines.filter((o) => {
    if (types.size && !types.has(o.order_type)) return false;
    if (stores.size && !stores.has(o.storenumber)) return false;
    if (dates.size && !dates.has(o.order_date)) return false;
    if (subs.size && !subs.has(o.sub_department)) return false;
    if (codes.size && !codes.has(String(o.product_code))) return false;
    if (ids.size && !ids.has(o.order_id)) return false;
    return true;
  });
};

const sortValue = (o: AllOrder, key: SortKey): number => {
  switch (key) {
    case "seq":
      return o.line_number;
    case "qty":
      return o.qty;
    case "ext_retail":
      return o.e_ret ?? 0;
    case "profit":
      return (o.e_ret ?? 0) - (o.cogs ?? 0);
    default:
      return o.order_id;
  }
};

/**
 * The grid's own narrowing: its two column searches, then its sort.
 *
 * Separate from `applyFilters` because the two are set in different places —
 * the panel on the left, these in the grid's own header — but they have to be
 * composed in one known order, or the export and the screen disagree about
 * what "the rows" means.
 */
export const applyGrid = (rows: AllOrder[], n: GridNarrowing): AllOrder[] => {
  const upc = n.upc.trim().toLowerCase();
  const desc = n.desc.trim().toLowerCase();

  const matched = rows.filter((o) => {
    if (upc && !String(o.product_code).toLowerCase().includes(upc)) return false;
    if (desc && !o.description.toLowerCase().includes(desc)) return false;
    return true;
  });

  return [...matched].sort((a, b) => {
    const d = sortValue(a, n.sort) - sortValue(b, n.sort);
    // Inside one order the line number is the only order that means anything,
    // so it is always the tiebreak.
    const tie = d !== 0 ? d : a.order_id - b.order_id || a.line_number - b.line_number;
    return n.dir === "asc" ? tie : -tie;
  });
};

/** Everything, in the order the screen shows it. */
export const buildRows = (
  lines: AllOrder[],
  filters: OrdersFilters,
  narrowing: GridNarrowing,
): AllOrder[] => applyGrid(applyFilters(lines, filters), narrowing);
