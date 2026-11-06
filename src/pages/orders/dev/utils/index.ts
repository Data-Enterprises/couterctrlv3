/**
 * What an order line costs and what it rings for.
 *
 * All that is left here. The ag-grid column definitions and the grid
 * theme went with the ag-grid grid itself — the dev report panel draws a
 * plain table, and the export takes its columns from
 * `ordersExportColumns.ts`.
 */
export const getCogs = (
  base_cost: number,
  qty: number,
  scalable: number,
  weight: number,
  casesize: number,
) => {
  // const { base_cost, qty, scalable, weight, casesize } = data;

  // Prevents NaN and infinites
  if (!base_cost) {
    return 0;
  }

  // A case of none is not a case. base_cost is a case cost in every branch
  // below, so an item carrying casesize 0 is treated as a case of one —
  // dividing by the zero the data actually holds returned Infinity, and one
  // row of it was enough to put a whole column's total through as N/A.
  const perCase = casesize > 0 ? casesize : 1;

  // For weighted items
  if (scalable > 0) {
    const unitCost = base_cost / perCase;
    if (!weight || weight === 0) {
      return unitCost * qty;
    }
    return unitCost * weight;
  }

  // For non-weighted items.
  //
  // The qty cancels: this branch has always returned base_cost, and it was
  // written as a division so it returned NaN when qty was 0. Left as it was
  // rather than "fixed" into base_cost * qty — that is a different cost for
  // every cased-by-one line in the app, and not a change to make while
  // chasing a crash.
  if (casesize === 1) {
    return base_cost;
  }

  // case size > 1, or the 0 the guard above rewrote to 1
  const unitCost = base_cost / perCase;
  return unitCost * qty;
};

export const getERet = (
  qty: number,
  weight: number,
  active_retail_price: number,
  scalable: number,
) => {
  // const { qty, weight, active_retail_price, scalable } = data;

  if (scalable > 0) {
    if (!weight || weight === 0) {
      return active_retail_price * qty;
    }
    return active_retail_price * weight;
  }

  return active_retail_price * qty;
};
