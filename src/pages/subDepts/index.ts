import { calculateCogs } from "../../utils/cogs";
import { getLYDate, setDates } from "../../utils/dates";
import { coverageOf, gradeBasis, type Coverage } from "../../utils/grading";
import type { MarginTier, SubDeptGrade, GradingMetric } from "../../features/subMarginSlice";
import type { SubDeptMargin } from "../../interfaces";

// Universal — live in src/utils now. Re-exported so this page's own files keep
// working unchanged until its dev/prod split points them at src/utils directly.
export { calculateCogs, hasNoUsableCost } from "../../utils/cogs";
export { getLYDate, setDates } from "../../utils/dates";

/** The figure a sub department is graded and ranked on: last year when it
 * covers every day of the week, else last week when that does, else nothing.
 * Shared by getTier and the list sort so ordering can never drift from
 * grading. Null means ungraded. */
export const gradeBasisOf = (grade: SubDeptGrade) =>
  gradeBasis(
    {
      hasLY: grade.lySales > 0 || grade.lyMarginPct > 0,
      hasLW: grade.lwSales > 0 || grade.lwMarginPct > 0,
    },
    grade.coverage,
  );

export const getGradeDelta = (
  grade: SubDeptGrade,
  metric: GradingMetric,
): number | null => {
  const basis = gradeBasisOf(grade);
  const vsLY = metric === "margin" ? grade.ptsDelta : grade.vsLYSalesPct;
  const vsLW = metric === "margin" ? grade.lwPtsDelta : grade.vsLWSalesPct;
  return basis === "LY" ? vsLY : basis === "LW" ? vsLW : null;
};

/** The store's coverage for the week, from the dates each period has any row
 *  for — never one department's rows, where a slow day is a zero, not a gap. */
export const storeCoverage = (
  ty: { sale_date: string }[],
  lw: { sale_date: string }[],
  ly: { sale_date: string }[],
): Coverage => {
  const day = (r: { sale_date: string }) => r.sale_date.split("T")[0];
  const tw = new Set(ty.map(day));
  return coverageOf(
    tw,
    { tw, lw: new Set(lw.map(day)), ly: new Set(ly.map(day)) },
    (d) => setDates(new Date(`${d}T12:00:00`), 7),
    (d) => getLYDate(d),
  );
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
  if (delta === null) return "ungraded";
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

/**
 * Store-level totals, day-matched exactly as Sales does it.
 *
 * Takes any dated rows carrying `total_sales` and `total_tax`, so it works on
 * the weekly endpoint's rows or on item rows summed up. It used to say the
 * figure had to come from `sales/weekly` because summing sub departments gave
 * a different number — that was true before the endpoints were reconciled, and
 * is no longer: `sales/weekly`, `subs/sub_sales` and `subs/subs` now agree once
 * aggregated. See the endpoint-reconciliation note.
 */
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

/**
 * Sub-department sales totals, using the same formula as Sales' aggSubDepts
 * (`total_sales - total_tax`).
 *
 * Takes any rows carrying a department, sales, tax and quantity, so it works
 * on `subs/sub_sales` rows or on `subs/subs` item rows.
 *
 * This used to insist on `sub_sales`: `subs/subs` matched only
 * `item_ring_type = 'ITEM'` while `sub_sales` matched `'ITEM','SUBD'`, so
 * totals built from item rows ran short by every sale rung straight to a
 * department rather than to an item. **That has since been fixed on the
 * backend** — `subs/subs` now carries both ring types, and all three sales
 * endpoints agree once aggregated.
 */
export const aggSubDeptSales = (
  rows: {
    sub_department: number;
    total_sales: number;
    total_tax: number;
    qty: number;
  }[],
): Record<number, SubDeptSalesTotals> =>
  rows.reduce((acc: Record<number, SubDeptSalesTotals>, s) => {
    const cur = acc[s.sub_department] ?? { net: 0, qty: 0 };
    cur.net += s.total_sales - s.total_tax;
    cur.qty += s.qty;
    acc[s.sub_department] = cur;
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

/** The TY rows whose day has a counterpart in `refRows` — the TY side of a
 * day-matched comparison. Pair with matchedCounterpartRows: dividing a whole
 * TY week by two matched LY days is what put the right panel's vs LY at
 * −28.57 pts against the list's −32.37. */
export const matchedTyRows = (
  tyRows: SubDeptMargin[],
  refRows: SubDeptMargin[],
  period: "lw" | "ly",
): SubDeptMargin[] => {
  const present = new Set(refRows.map((r) => dayKey(r.sale_date)));
  const counterpart = (d: string) =>
    period === "lw" ? setDates(new Date(`${d}T12:00:00`), 7) : getLYDate(d);
  return tyRows.filter((r) => present.has(counterpart(dayKey(r.sale_date))));
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
