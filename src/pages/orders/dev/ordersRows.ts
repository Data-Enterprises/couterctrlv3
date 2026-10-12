import type { AllOrder } from "../../../interfaces";
import type { OrdersFilters } from "../../../features/dev/devOrdersSlice";
import type { SortState } from "../../../utils/useTriStateSort";

export type SortKey = "order" | "seq" | "qty" | "ext_retail" | "profit";

/** Null is the list's own order, which is what the tri-state cycle returns to. */
export type GridSort = SortState<SortKey>;

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

export const sortValue = (o: AllOrder, key: SortKey): number => {
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
 * The list's own order: by order, then by line within it.
 *
 * This is what the tri-state sort returns to on its third click, so it has to
 * be an order worth coming back to rather than whatever the API happened to
 * send. Order number first because the grid spans many orders now, and a line
 * number means nothing without the order it belongs to.
 */
export const defaultOrder = (rows: AllOrder[]): AllOrder[] =>
  [...rows].sort(
    (a, b) => a.order_id - b.order_id || a.line_number - b.line_number,
  );

/**
 * Everything, in the order the screen shows it.
 *
 * `applySort` hands the rows back untouched when nothing is sorted, which is
 * why the default order goes on first rather than being a fourth branch.
 */
export const buildRows = (
  lines: AllOrder[],
  filters: OrdersFilters,
  applySort: (
    rows: AllOrder[],
    value: (row: AllOrder, col: SortKey) => number | null,
  ) => AllOrder[],
): AllOrder[] =>
  applySort(defaultOrder(applyFilters(lines, filters)), sortValue);
