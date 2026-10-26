import type { AllOrder } from "../../../interfaces";
import type {
  OrderFlag,
  OrdersFilters,
} from "../../../features/dev/devOrdersSlice";
import type { SortState } from "../../../utils/useTriStateSort";

export type SortKey = "order" | "seq" | "qty" | "ext_retail" | "profit";

/** Null is the list's own order, which is what the tri-state cycle returns to. */
export type GridSort = SortState<SortKey>;

/**
 * What is wrong with a line's cost, if anything.
 *
 * `missingCost` is the cause and `highMargin` is usually its symptom — a line
 * with no cost rings 100% margin — so a line can carry both and the panel
 * counts them separately. Naming only the symptom would send somebody looking
 * for a pricing decision that was never made.
 *
 * `noCaseSize` is its own problem rather than a flavour of missing cost: the
 * case cost may be perfectly good, but unit cost cannot be worked out from it
 * and the line cannot take a bulk unit-cost edit.
 */
export const lineFlags = (o: AllOrder, marginOver: number | null): OrderFlag[] => {
  const flags: OrderFlag[] = [];
  if (!o.base_cost) flags.push("missingCost");
  if (!o.casesize || o.casesize <= 0) flags.push("noCaseSize");

  const eRet = o.e_ret ?? 0;
  if (marginOver !== null && eRet > 0) {
    const margin = ((eRet - (o.cogs ?? 0)) / eRet) * 100;
    if (margin > marginOver) flags.push("highMargin");
  }
  return flags;
};

/**
 * The configuration panel's filters, applied in one pass.
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
  const wanted = new Set(f.flags);

  return lines.filter((o) => {
    if (types.size && !types.has(o.order_type)) return false;
    if (stores.size && !stores.has(o.storenumber)) return false;
    if (dates.size && !dates.has(o.order_date)) return false;
    if (subs.size && !subs.has(o.sub_department)) return false;
    if (codes.size && !codes.has(String(o.product_code))) return false;
    if (ids.size && !ids.has(o.order_id)) return false;
    if (wanted.size) {
      // Any, not all — "missing cost or no case size" is the question
      // somebody asks, and a line holding both should answer it once.
      const has = lineFlags(o, f.marginOver);
      if (!has.some((fl) => wanted.has(fl))) return false;
    }
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
