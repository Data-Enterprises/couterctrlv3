/*
 * Cost of goods — the one place every page that shows a margin gets it from.
 * Moved here from pages/subDepts/index.ts, which still re-exports it for its
 * own files.
 */

// An item only lacks usable cost when there is genuinely no cost figure to
// use. case_size deliberately isn't part of this — calculateCogs now falls
// back to a per-unit cost when case_size is 0, so a missing case size no
// longer makes an item uncostable. Shared because six call sites had this
// expression inlined and would otherwise drift apart from calculateCogs.
export const hasNoUsableCost = (m: {
  net_cost: number;
  cost: number;
}): boolean => m.net_cost === 0 && m.cost === 0;

/**
 * Cost of goods for one item row. The canonical helper — Sub Dept Margins,
 * Categories and Item Lookup all route through this, which is the only reason
 * the three pages agree on a margin.
 *
 * Two things it gets right that are easy to get wrong independently:
 *
 *  - **netCost before cost.** `cost` is the list/invoice price; `net_cost` is
 *    what was actually paid after a vendor allowance. Roughly half the items in
 *    a given delivery carry an allowance and half don't, regardless of
 *    `price_type` — so this isn't predictable from whether the item was on
 *    promo. Costing a promoted item at list made 7800003538 read −12.95% on a
 *    day it actually made +9.79%.
 *
 *  - **weight before qty.** On a scale item `qty` counts how many times the
 *    item was *rung*, not how much was sold; bananas ring ~2.1 lb at a time.
 *    Costing 4011 by qty read 67.78% against a real 30.93%.
 *
 * Callers pass per-CASE costs with the real `caseSize`. `/itemlookup` returns
 * only per-unit costs, so it derives its own unit cost first and passes
 * `caseSize = 0` — see `rowUnitCost` in pages/lookup/dev/lookupMetrics.ts.
 */
export const calculateCogs = (
  netCost: number,
  cost: number,
  caseSize: number,
  qty: number,
  weight: number,
) => {

  const baseCost = netCost > 0 ? netCost : cost;
  const baseLine = weight > 0 ? weight : qty;

  // case_size is 0 for vendors that report a per-unit cost rather than a case
  // cost (ACE/vendor 80 does this on every row). This used to return 0, which
  // discarded a perfectly good cost and made margin read 100% — so those
  // stores could never grade anything but healthy. Treat the cost as
  // per-unit instead of dividing by a case size that doesn't exist.
  //
  // Rows with case_size > 0 fall through to the identical path as before, so
  // stores that already compute correctly cannot change.
  if (caseSize === 0) return baseCost * baseLine;

  const unitCost = (baseCost / caseSize).toString();
  return parseFloat(unitCost) * baseLine;

  // When using calculated cost, cost fees, qty
  // if (qty === 0) return 0;

  // if (costFees) {
  //   const feePct = costFees / 100;
  //   const feeAmount = parseFloat((calculatedCost * feePct).toString());
  //   return (calculatedCost + feeAmount) * qty;
  // }

  // // no cost fees
  // return calculatedCost * qty;
};
