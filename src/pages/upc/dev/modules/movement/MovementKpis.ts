import type { MovementRow } from "../../../../../features/dev/devUpcDevSlice";
import type { KpiCell } from "../../types";
import { fmtMovement, isWeighed, movementTotal, shortDate } from "./movementStats";

/**
 * The strip above Movement: the window, how many stores moved anything, and
 * the totals, with units and pounds kept apart. Adding a count of cans to a
 * weight of beef would be a number about nothing.
 */
export function getMovementKpis(
  rows: MovementRow[],
  codes: string[],
  weeks: number,
  weekEnding: string,
  storeCount: number,
): KpiCell[] {
  const inView = new Set(codes);
  const selling = new Set(
    rows.filter((r) => inView.has(r.product_code) && (r.qty !== 0 || r.weight !== 0)).map((r) => r.storeid),
  );
  let units = 0;
  let pounds = 0;
  for (const code of codes) {
    if (isWeighed(rows, code)) pounds += movementTotal(rows, code);
    else units += movementTotal(rows, code);
  }
  return [
    {
      label: "Weeks",
      value: String(weeks),
      sub: weekEnding ? `ending ${shortDate(weekEnding)}` : undefined,
    },
    { label: "Stores moving it", value: `${selling.size} of ${storeCount}` },
    { label: "Units", value: fmtMovement(units, false) },
    { label: "Pounds", value: fmtMovement(pounds, true) },
  ];
}
