import type { AllOrder } from "../../../interfaces";

/**
 * Which option in each filter is still reachable, given the others.
 *
 * The left panel's six filters each listed every value in the whole result,
 * so picking order type PER still offered dates no PER order was placed on
 * and vendors who never sent one. Every one of those picks returns nothing,
 * and the panel gave no sign which of the six was at fault.
 *
 * A filter's own selection is left OUT of its own test. Including it would
 * make each list collapse to what is already picked -- choose one date and
 * every other date goes unavailable, which stops you choosing a second.
 *
 * Six passes over the rows rather than one. Each list needs the rows that
 * survive a DIFFERENT five filters, so there is no single surviving set to
 * read them all off; the rows are walked once per filter instead, which is
 * six passes over a few thousand rows and costs nothing a reader notices.
 */

export interface OrdersFilterState {
  orderTypes: string[];
  storeNumbers: string[];
  dates: string[];
  subIds: number[];
  productCodes: string[];
  orderIds: number[];
}

export type FilterKey = keyof OrdersFilterState;

/** Every reachable value, per filter, as strings — which is what the
 *  controls hold, whatever the row's own type is. */
export type Available = Record<FilterKey, Set<string>>;

const passes = (
  o: AllOrder,
  f: OrdersFilterState,
  skip: FilterKey,
): boolean => {
  if (skip !== "orderTypes" && f.orderTypes.length && !f.orderTypes.includes(o.order_type))
    return false;
  if (
    skip !== "storeNumbers" &&
    f.storeNumbers.length &&
    !f.storeNumbers.includes(o.storenumber)
  )
    return false;
  if (skip !== "dates" && f.dates.length && !f.dates.includes(o.order_date))
    return false;
  if (skip !== "subIds" && f.subIds.length && !f.subIds.includes(o.sub_department))
    return false;
  if (
    skip !== "productCodes" &&
    f.productCodes.length &&
    !f.productCodes.includes(String(o.product_code))
  )
    return false;
  if (skip !== "orderIds" && f.orderIds.length && !f.orderIds.includes(o.order_id))
    return false;
  return true;
};

const KEYS: FilterKey[] = [
  "orderTypes",
  "storeNumbers",
  "dates",
  "subIds",
  "productCodes",
  "orderIds",
];

const valueOf = (o: AllOrder, key: FilterKey): string | null => {
  switch (key) {
    case "orderTypes":
      return o.order_type || null;
    case "storeNumbers":
      return o.storenumber || null;
    case "dates":
      return o.order_date || null;
    case "subIds":
      return o.sub_department == null ? null : String(o.sub_department);
    case "productCodes":
      return o.product_code ? String(o.product_code) : null;
    case "orderIds":
      return o.order_id == null ? null : String(o.order_id);
  }
};

export const availableOptions = (
  lines: AllOrder[],
  filters: OrdersFilterState,
): Available => {
  const out = {
    orderTypes: new Set<string>(),
    storeNumbers: new Set<string>(),
    dates: new Set<string>(),
    subIds: new Set<string>(),
    productCodes: new Set<string>(),
    orderIds: new Set<string>(),
  };

  for (const key of KEYS) {
    for (const o of lines) {
      if (!passes(o, filters, key)) continue;
      const v = valueOf(o, key);
      if (v !== null) out[key].add(v);
    }
  }

  return out;
};

/**
 * The option list as the control should draw it.
 *
 * Unavailable options are kept rather than dropped, so the list does not
 * reflow as somebody filters and a dead pick can be seen rather than
 * guessed at. A dead pick that is SELECTED goes to the top: in a list of two
 * thousand items it is the one thing worth finding, and it is the reason the
 * screen is empty.
 */
export const markAvailability = <T extends { value: string }>(
  options: T[],
  available: Set<string>,
  selected: string[],
): (T & { unavailable: boolean })[] => {
  const picked = new Set(selected);
  const marked = options.map((o) => ({
    ...o,
    unavailable: !available.has(o.value),
  }));
  const deadPicks = marked.filter((o) => o.unavailable && picked.has(o.value));
  if (deadPicks.length === 0) return marked;
  const rest = marked.filter((o) => !(o.unavailable && picked.has(o.value)));
  return [...deadPicks, ...rest];
};
