import { sameWeekDayLastYear } from "../../utils";
import type { MarginTier, SubDeptGrade, GradingMetric } from "../../features/subMarginSlice";
import type { SubDeptMargin, SubSale } from "../../interfaces";
import {
  subDeptKeyOf,
  type SubDeptKeyMode,
} from "../../utils/subDeptIdentity";

// Sub department identity is shared with Sales, Orders and Coupons — the four
// pages have to bucket departments the same way. Re-exported so this page's
// many call sites keep importing from one place.
export {
  subDeptKeyMode,
  subDeptKeyOf,
  distinctSubDepts,
  scopeToSubDept,
  type SubDeptKeyMode,
} from "../../utils/subDeptIdentity";

export const setDates = (date: Date, days: number = 0) => {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  // returns yyyy-mm-dd so sub_sales endpoint can process the dates correctly
  return d.toISOString().split("T")[0];
};

// Last-year date for a given "YYYY-MM-DD", holiday- and leap-year-aware
// (see sameWeekDayLastYear) — use this instead of setDates(date, 364).
export const getLYDate = (date: string): string => sameWeekDayLastYear(date).date;

/** The figure a sub department is graded and ranked on: last year when we have
 * it, else last week. Shared by getTier and the list sort so ordering can
 * never drift from grading. */
export const getGradeDelta = (
  grade: SubDeptGrade,
  metric: GradingMetric,
): number => {
  const hasLY = grade.lySales > 0 || grade.lyMarginPct > 0;
  const vsLY = metric === "margin" ? grade.ptsDelta : grade.vsLYSalesPct;
  const vsLW = metric === "margin" ? grade.lwPtsDelta : grade.vsLWSalesPct;
  return hasLY ? vsLY : vsLW;
};

/**
 * Per-day TY vs its comparison period, for the mobile day strips.
 *
 * Uses the same fallback as getGradeDelta: last year when the sub dept has LY
 * data, otherwise last week. Without this the strip compared against LY only,
 * so any store missing LY rendered every day greyed out — even though the row
 * beside it was graded, correctly, against LW.
 *
 * Reference days are paired by position, matching how the strips already
 * aligned TY to LY (the periods are the same length).
 */
export const buildDayComparisons = (
  grade: SubDeptGrade,
): { date: string; isUp: boolean; hasRef: boolean }[] => {
  const datesOf = (rows: SubDeptMargin[]) =>
    [...new Set(rows.map((r) => r.sale_date))].sort();
  const net = (rows: SubDeptMargin[]) =>
    rows.reduce((s, m) => s + (m.total_sales - m.total_tax), 0);
  const cogs = (rows: SubDeptMargin[]) =>
    rows.reduce(
      (s, m) => s + calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight),
      0,
    );
  const pct = (n: number, c: number) => (n > 0 ? ((n - c) / n) * 100 : 0);

  const hasLY = grade.lySales > 0 || grade.lyMarginPct > 0;
  const refRows = hasLY ? grade.lyWeekOneMargins : grade.lwWeekOneMargins;
  const refDates = datesOf(refRows);

  return datesOf(grade.tyWeekOneMargins).map((date, i) => {
    const tyDay = grade.tyWeekOneMargins.filter((m) => m.sale_date === date);
    const refDay = refDates[i]
      ? refRows.filter((m) => m.sale_date === refDates[i])
      : [];
    const refNet = net(refDay);
    return {
      date,
      isUp: pct(net(tyDay), cogs(tyDay)) >= pct(refNet, cogs(refDay)),
      hasRef: refNet > 0,
    };
  });
};

export const getTier = (grade: SubDeptGrade, threshold: number, metric: GradingMetric): MarginTier => {
  const delta = getGradeDelta(grade, metric);
  if (delta >= 0) return "healthy";
  if (delta < -threshold) return "critical";
  return "watch";
};

type DayBucket = { net: number; cogs: number };

const dayKey = (saleDate: string) => saleDate.split("T")[0];

const bucketByDay = (rows: SubDeptMargin[]): Record<string, DayBucket> => {
  const out: Record<string, DayBucket> = {};
  for (const m of rows) {
    const key = dayKey(m.sale_date);
    const bucket = out[key] ?? { net: 0, cogs: 0 };
    bucket.net += m.total_sales - m.total_tax;
    bucket.cogs += calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight);
    out[key] = bucket;
  }
  return out;
};

const marginPct = (net: number, cogs: number) =>
  net > 0 ? ((net - cogs) / net) * 100 : 0;

export type SubDeptSalesTotals = { net: number; qty: number };

type NetRow = { sale_date: string; total_sales: number; total_tax: number };

const netByDay = (rows: NetRow[]): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const k = r.sale_date.split("T")[0];
    out[k] = (out[k] ?? 0) + (r.total_sales - r.total_tax);
  }
  return out;
};

export interface StoreDayMatchedTotals {
  tySales: number;
  lwSales: number;
  lySales: number;
  vsLWSalesPct: number;
  vsLYSalesPct: number;
}

/** Store-level totals from the weekly endpoint, day-matched exactly as Sales
 * does it. The header figure is a STORE number, so it has to come from the
 * store-level source — summing sub-departments is a different quantity and
 * will not reconcile with what Sales shows. */
export const computeStoreDayMatched = (
  tw: NetRow[],
  lw: NetRow[],
  ly: NetRow[],
): StoreDayMatchedTotals => {
  const ty = netByDay(tw);
  const lwDays = netByDay(lw);
  const lyDays = netByDay(ly);
  const tyDates = Object.keys(ty);
  const tySales = tyDates.reduce((acc, d) => acc + ty[d], 0);

  const pair = (
    ref: Record<string, number>,
    mapDate: (d: string) => string,
  ) => {
    let tyNet = 0;
    let refNet = 0;
    for (const d of tyDates) {
      const match = ref[mapDate(d)];
      if (match === undefined) continue;
      tyNet += ty[d];
      refNet += match;
    }
    return { tyNet, refNet };
  };

  const lwM = pair(lwDays, (d) => setDates(new Date(`${d}T12:00:00`), 7));
  const lyM = pair(lyDays, (d) => getLYDate(d));

  return {
    tySales,
    lwSales: lwM.refNet,
    lySales: lyM.refNet,
    vsLWSalesPct:
      lwM.refNet > 0 ? ((lwM.tyNet - lwM.refNet) / lwM.refNet) * 100 : 0,
    vsLYSalesPct:
      lyM.refNet > 0 ? ((lyM.tyNet - lyM.refNet) / lyM.refNet) * 100 : 0,
  };
};

/** Sub-department sales totals from the sub_sales endpoint, using the same
 * formula as Sales' aggSubDepts (`total_sales - total_tax`).
 *
 * Sales figures come from sub_sales rather than subs/subs deliberately:
 * sub_sales has the correct item_ring_type filter ('ITEM','SUBD') while
 * subs/subs currently only matches 'ITEM', so totals built from subs run
 * short. Sales is the source of truth for sub-department sales, so this page
 * reads the same endpoint with the same maths to guarantee they agree.
 * subs/subs is still used for margin, since it's the only source with cost. */
export const aggSubDeptSales = (
  rows: SubSale[],
  mode: SubDeptKeyMode,
): Record<string, SubDeptSalesTotals> =>
  rows.reduce((acc: Record<string, SubDeptSalesTotals>, s) => {
    const key = subDeptKeyOf(s, mode);
    const cur = acc[key] ?? { net: 0, qty: 0 };
    cur.net += s.total_sales - s.total_tax;
    cur.qty += s.qty;
    acc[key] = cur;
    return acc;
  }, {});

/** The counterpart rows that actually pair with a TY day — used where a view
 * needs the matched row SET rather than totals (e.g. to display an LW figure
 * that reconciles with the percentage shown beside it). */
export const matchedCounterpartRows = (
  tyRows: SubDeptMargin[],
  refRows: SubDeptMargin[],
  period: "lw" | "ly",
): SubDeptMargin[] => {
  const wanted = new Set(
    [...new Set(tyRows.map((r) => dayKey(r.sale_date)))].map((d) =>
      period === "lw" ? setDates(new Date(`${d}T12:00:00`), 7) : getLYDate(d),
    ),
  );
  return refRows.filter((r) => wanted.has(dayKey(r.sale_date)));
};

export interface MarginDayMatchedTotals {
  tySales: number;
  tyMarginPct: number;
  lwSales: number;
  lwMarginPct: number;
  lySales: number;
  lyMarginPct: number;
  hasLW: boolean;
  hasLY: boolean;
  vsLWSalesPct: number;
  vsLYSalesPct: number;
  ptsDelta: number;
  lwPtsDelta: number;
}

/** Margin-side equivalent of computeDayMatchedTotals in
 * sales/shared/ledgerUtils.ts — same rules, applied to net + COGS instead of
 * net + qty. See that function for the reasoning; the two must stay in step.
 *
 * The rules that matter:
 *  - A day with no matching row is absent, NOT zero — a real zero-sales day
 *    would otherwise be indistinguishable from missing data.
 *  - Each comparison gets its OWN TY subtotal, scoped to the days that have a
 *    counterpart on that specific side. LW and LY match different day sets, so
 *    a single shared "matched total" would be wrong for one of them.
 *  - The headline tySales stays unmatched (the true period total) — only the
 *    comparison figures are scoped. */
export const computeMarginDayMatched = (
  tyRows: SubDeptMargin[],
  lwRows: SubDeptMargin[],
  lyRows: SubDeptMargin[],
): MarginDayMatchedTotals => {
  const ty = bucketByDay(tyRows);
  const lw = bucketByDay(lwRows);
  const ly = bucketByDay(lyRows);

  const tyDates = Object.keys(ty).sort();
  const tySales = tyDates.reduce((acc, d) => acc + ty[d].net, 0);
  const tyCogsAll = tyDates.reduce((acc, d) => acc + ty[d].cogs, 0);

  const accumulate = (
    counterpart: Record<string, DayBucket>,
    mapDate: (d: string) => string,
  ) => {
    let tyNet = 0, tyCogs = 0, refNet = 0, refCogs = 0;
    for (const d of tyDates) {
      const match = counterpart[mapDate(d)];
      if (!match) continue;
      tyNet += ty[d].net;
      tyCogs += ty[d].cogs;
      refNet += match.net;
      refCogs += match.cogs;
    }
    return { tyNet, tyCogs, refNet, refCogs };
  };

  const lwMatch = accumulate(lw, (d) => setDates(new Date(`${d}T12:00:00`), 7));
  const lyMatch = accumulate(ly, (d) => getLYDate(d));

  const hasLW = lwMatch.refNet > 0;
  const hasLY = lyMatch.refNet > 0;

  return {
    tySales,
    tyMarginPct: marginPct(tySales, tyCogsAll),
    lwSales: lwMatch.refNet,
    lwMarginPct: marginPct(lwMatch.refNet, lwMatch.refCogs),
    lySales: lyMatch.refNet,
    lyMarginPct: marginPct(lyMatch.refNet, lyMatch.refCogs),
    hasLW,
    hasLY,
    vsLWSalesPct: hasLW
      ? ((lwMatch.tyNet - lwMatch.refNet) / lwMatch.refNet) * 100
      : 0,
    vsLYSalesPct: hasLY
      ? ((lyMatch.tyNet - lyMatch.refNet) / lyMatch.refNet) * 100
      : 0,
    // Margin percentages are rates, so both sides are scoped to the matched
    // days — comparing a 3-day TY rate against a 7-day LW rate is the same
    // category of error as doing it with totals.
    ptsDelta: hasLY
      ? marginPct(lyMatch.tyNet, lyMatch.tyCogs) -
        marginPct(lyMatch.refNet, lyMatch.refCogs)
      : 0,
    lwPtsDelta: hasLW
      ? marginPct(lwMatch.tyNet, lwMatch.tyCogs) -
        marginPct(lwMatch.refNet, lwMatch.refCogs)
      : 0,
  };
};

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
