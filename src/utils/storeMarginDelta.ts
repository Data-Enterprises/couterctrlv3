import { calculateCogs } from "./cogs";
import { LW_OFFSET, LY_OFFSET, marginPct, shiftIso } from "./grading";

/**
 * The STORE's margin points delta, day-matched at store level.
 *
 * Sub Dept Margins and Vendors read the same `subs/subs` rows and must agree
 * on what the store did. Their headline margins do. Their LAST WEEK deltas did
 * not -- -5.36 against -5.39 on Bruces 361 -- and weighting was not the
 * reason.
 *
 * Each page was matching days at its own grouping. Vendors drops a day from
 * the comparison when THAT VENDOR did not trade in both weeks; Sub Dept
 * Margins drops it when THAT DEPARTMENT did not. A Tuesday one vendor missed
 * is still a Tuesday its department worked, so the two sums cover slightly
 * different rows and land a few hundredths apart. Both are defensible for a
 * single vendor or a single department, and neither is right for the store.
 *
 * So the store figure matches days ONCE, over every row the store rang. Then
 * the two pages agree by construction rather than by coincidence, and the
 * per-row deltas keep their own matched days, which is the correct comparison
 * for one vendor or one department.
 *
 * Null when either side has no sales on the matched days: there is no rate to
 * compare, and a dash says that where 0.00 would claim the margin held.
 */

export interface MarginRow {
  sale_date: string;
  total_sales: number;
  total_tax: number;
  net_cost: number;
  cost: number;
  case_size: number;
  qty: number;
  weight: number;
}

interface Day {
  net: number;
  cogs: number;
}

/** `total_sales - total_tax`, the basis every Performance page is on, and the
 *  canonical COGS helper -- net cost before cost, weight before qty. */
const byDay = (rows: MarginRow[]): Map<string, Day> => {
  const out = new Map<string, Day>();
  for (const r of rows) {
    const key = r.sale_date.slice(0, 10);
    const at = out.get(key) ?? { net: 0, cogs: 0 };
    at.net += r.total_sales - r.total_tax;
    at.cogs += calculateCogs(r.net_cost, r.cost, r.case_size, r.qty, r.weight);
    out.set(key, at);
  }
  return out;
};

export const storeMarginDelta = (
  tw: MarginRow[],
  reference: MarginRow[],
  side: "lw" | "ly",
): number | null => {
  const ty = byDay(tw);
  const ref = byDay(reference);
  const offset = side === "lw" ? LW_OFFSET : LY_OFFSET;

  let tyNet = 0;
  let tyCogs = 0;
  let refNet = 0;
  let refCogs = 0;

  for (const [date, day] of ty) {
    // A day joins the comparison only when both sides have it, and when it
    // does it joins BOTH sides. Comparing a seven-day rate against a
    // three-day one is two different questions.
    const counterpart = ref.get(shiftIso(date, offset));
    if (!counterpart) continue;
    tyNet += day.net;
    tyCogs += day.cogs;
    refNet += counterpart.net;
    refCogs += counterpart.cogs;
  }

  if (tyNet <= 0 || refNet <= 0) return null;
  return marginPct(tyNet, tyCogs) - marginPct(refNet, refCogs);
};
