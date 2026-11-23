// Utils
import { calculateCogs } from "../../../../utils/cogs";

// Interfaces
import type { SubDeptCost, SubDeptMargin } from "../../../../interfaces";

/**
 * Roll the margin rows up into one line per product, scoped to the selected
 * day.
 *
 * The day scoping has to happen *here*, before the rollup, and this is the
 * whole point of the function. The rows arrive one per product per day, so a
 * product sold all week contributes seven of them. Aggregating first and
 * filtering afterwards — which is what this did — produced a row carrying a
 * week of `qty` and `total_cost` but only the first day's `sale_date`, and
 * `SubDeptCostGrid` then matched that single date against the day strip. Two
 * failures at once: the days a product did not happen to sell first showed
 * nothing at all (Fri, Sun and Mon went completely empty on a week where all
 * three had sales), and the day that did match printed week totals — BNLS
 * CHICKEN THIGHS read 160 / $688.19 under Wednesday against a real 12 /
 * $54.50.
 *
 * `day` is "" for All Week, which keeps every row and rolls the full week up
 * exactly as before.
 */
export const buildCostRows = (
  margins: SubDeptMargin[],
  day: string,
  withCogs: boolean,
): SubDeptCost[] => {
  const fmtDate = (dte: string) => dte.split("T")[0];
  const scoped = day
    ? margins.filter((m) => fmtDate(m.sale_date) === day)
    : margins;

  // Keyed rather than `.find` on every row: this runs over a store week of
  // item rows, and the linear scan made it quadratic.
  const byProduct = new Map<string, SubDeptCost>();
  for (const curr of scoped) {
    const cogs = withCogs
      ? calculateCogs(
          curr.net_cost,
          curr.cost,
          curr.case_size,
          curr.qty,
          curr.weight,
        )
      : 0;
    const found = byProduct.get(curr.product_code);
    if (!found) {
      byProduct.set(curr.product_code, {
        date: fmtDate(curr.sale_date),
        product_code: curr.product_code,
        description: curr.product_description,
        calculated_cost: curr.calculated_cost,
        cost: curr.cost,
        qty: curr.qty,
        weight: curr.weight,
        total_cost: cogs,
      });
    } else {
      found.qty += curr.qty;
      found.weight = (found.weight ?? 0) + curr.weight;
      found.total_cost += cogs;
    }
  }
  return [...byProduct.values()];
};
