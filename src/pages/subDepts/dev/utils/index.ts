// API
import { getSubMargins } from "../../../../api/subMargins";
import { getRollup } from "../../../../api/rollup";

// Utils
import { calculateCogs, hasNoUsableCost } from "../../../../utils/cogs";
import { getLYDate, setDates } from "../../../../utils/dates";
import {
  coverageOf,
  gradeBasis,
  type Coverage,
  marginPct,
} from "../../../../utils/grading";

// Interfaces
import type { RollupRow } from "../../../../api/rollup";
import type { MarginDollars } from "../../../../utils/grading";
import type { MarginTier, SubDeptGrade, GradingMetric } from "../../../../features/dev/devSubMarginSlice";
import type {
  SubDept,
  SubDeptMargin,
  SubMarginsJsonResp,
} from "../../../../interfaces";
import type { RawSearch } from "../interfaces";

/** The figure a sub department is graded and ranked on: last year when it
 * covers every day of the week, else last week when that does, else nothing.
 * Shared by getTier and the list sort so ordering can never drift from
 * grading. Null means ungraded. */
export const gradeBasisOf = (grade: SubDeptGrade) =>
  gradeBasis(
    {
      hasLY: grade.lySales > 0 || (grade.lyMarginPct ?? 0) > 0,
      hasLW: grade.lwSales > 0 || (grade.lwMarginPct ?? 0) > 0,
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

  const hasLY = grade.lySales > 0 || (grade.lyMarginPct ?? 0) > 0;
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

/**
 * Rows a margin can be summed from: item rows from `subs/subs`, or the same
 * rows summed per department per day by `subs/rollup`, whose net is
 * `total_sales - total_tax` and whose cogs is `calculateCogs` per item row.
 * Either gives the same day buckets, so the list can grade from the rollup
 * while the item rows are still loading.
 */
export type MarginRow = SubDeptMargin | RollupRow;

const bucketByDay = (rows: MarginRow[]): Record<string, DayBucket> => {
  const out: Record<string, DayBucket> = {};
  for (const m of rows) {
    const key = dayKey(m.sale_date);
    const bucket = out[key] ?? { net: 0, cogs: 0 };
    if ("key" in m) {
      bucket.net += m.net_sales;
      bucket.cogs += m.cogs;
    } else {
      bucket.net += m.total_sales - m.total_tax;
      bucket.cogs += calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight);
    }
    out[key] = bucket;
  }
  return out;
};

/**
 * The STORE's margin from its departments' dollars.
 *
 * Weighted -- net summed, COGS summed, divided once. Averaging the
 * departments' percentages gives floral the same vote as grocery and read
 * about five points high on a real store-week; Vendors has always weighted,
 * so the two screens disagreed by that much while reading the same rows.
 *
 * Every department in the week gets a grade, so this sums to the store's
 * whole net and COGS -- the same totals Vendors reaches by grouping the same
 * rows by supplier. The two headline margins must now match to the cent.
 *
 * Takes dollars rather than grades so Vendors can call it too, and so the
 * rule can be tested without building a grade.
 */
export const storeMarginPctOf = (dollars: MarginDollars[]): number | null => {
  if (dollars.length === 0) return null;
  const net = dollars.reduce((acc, d) => acc + d.net, 0);
  if (net <= 0) return null;
  return marginPct(net, dollars.reduce((acc, d) => acc + d.cogs, 0));
};

/**
 * A store-level margin points delta, weighted the same way.
 *
 * Both sides are already scoped to the days that side matched, so this
 * compares two rates measured over the same days. A department with nothing
 * to compare contributes nothing to either side, which is right: it has no
 * delta, not a delta of zero.
 *
 * Null when either side has no sales -- there is no rate to compare, and a
 * dash says that where a 0.00 would claim the margin held.
 */
export const storeMarginDeltaOf = (
  dollars: MarginDollars[],
  side: "lw" | "ly",
): number | null => {
  const tyNet = dollars.reduce((acc, d) => acc + d[side].tyNet, 0);
  const refNet = dollars.reduce((acc, d) => acc + d[side].refNet, 0);
  if (tyNet <= 0 || refNet <= 0) return null;
  const tyCogs = dollars.reduce((acc, d) => acc + d[side].tyCogs, 0);
  const refCogs = dollars.reduce((acc, d) => acc + d[side].refCogs, 0);
  return marginPct(tyNet, tyCogs) - marginPct(refNet, refCogs);
};

export type SubDeptSalesTotals = { net: number; qty: number };

type NetRow =
  | { sale_date: string; total_sales: number; total_tax: number }
  | RollupRow;

export const netByDay = (rows: NetRow[]): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const k = r.sale_date.split("T")[0];
    out[k] =
      (out[k] ?? 0) + ("key" in r ? r.net_sales : r.total_sales - r.total_tax);
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
  /** Null where that period had no sales — a margin needs something to be a
   *  margin of, and zero is a rate somebody earned. */
  lwMarginPct: number | null;
  lySales: number;
  lyMarginPct: number | null;
  hasLW: boolean;
  hasLY: boolean;
  vsLWSalesPct: number;
  vsLYSalesPct: number;
  /** Null where either matched side had no sales, so there is nothing to
   *  compare rather than a collapse to report. */
  ptsDelta: number | null;
  lwPtsDelta: number | null;
  dollars: MarginDollars;
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
  tyRows: MarginRow[],
  lwRows: MarginRow[],
  lyRows: MarginRow[],
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
    dollars: {
      net: tySales,
      cogs: tyCogsAll,
      lw: {
        tyNet: lwMatch.tyNet,
        tyCogs: lwMatch.tyCogs,
        refNet: lwMatch.refNet,
        refCogs: lwMatch.refCogs,
      },
      ly: {
        tyNet: lyMatch.tyNet,
        tyCogs: lyMatch.tyCogs,
        refNet: lyMatch.refNet,
        refCogs: lyMatch.refCogs,
      },
    },
    lwSales: lwMatch.refNet,
    lwMarginPct: hasLW ? marginPct(lwMatch.refNet, lwMatch.refCogs) : null,
    lySales: lyMatch.refNet,
    lyMarginPct: hasLY ? marginPct(lyMatch.refNet, lyMatch.refCogs) : null,
    hasLW,
    hasLY,
    vsLWSalesPct: hasLW
      ? ((lwMatch.tyNet - lwMatch.refNet) / lwMatch.refNet) * 100
      : 0,
    vsLYSalesPct: hasLY
      ? ((lyMatch.tyNet - lyMatch.refNet) / lyMatch.refNet) * 100
      : 0,
    /**
      * Margin percentages are rates, so both sides are scoped to the matched
      * days — comparing a 3-day TY rate against a 7-day LW rate is the same
      * category of error as doing it with totals.
      *
      * And both sides need sales, because a rate needs something to be a rate
      * OF. The matched days can leave THIS week's side empty while the prior
      * one has something: a department selling on different days each week
      * matches on a day it did not sell, `marginPct` answers 0 for that, and
      * the delta reads as a collapse nobody can find. Null says there is no
      * comparison, and grades ungraded — see the Vendors fix, same shape.
      */
    ptsDelta:
      hasLY && lyMatch.tyNet > 0
        ? marginPct(lyMatch.tyNet, lyMatch.tyCogs) -
          marginPct(lyMatch.refNet, lyMatch.refCogs)
        : null,
    lwPtsDelta:
      hasLW && lwMatch.tyNet > 0
        ? marginPct(lwMatch.tyNet, lwMatch.tyCogs) -
          marginPct(lwMatch.refNet, lwMatch.refCogs)
        : null,
  };
};

/** A signed percent to two places, and a signed point change. */
export const fmtPct = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
export const fmtPts = (pts: number) => `${pts >= 0 ? "+" : ""}${pts.toFixed(2)} pts`;

/** Net sales and margin % over margin rows. */
export const agg = (rows: SubDeptMargin[]) => {
  const sales = rows.reduce((acc, m) => acc + (m.total_sales - m.total_tax), 0);
  const cogs = rows.reduce(
    (acc, m) =>
      acc + calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight),
    0,
  );
  return { sales, marginPct: sales > 0 ? ((sales - cogs) / sales) * 100 : 0 };
};

/** The margin rows of one yyyy-mm-dd day. */
export const byDate = (src: SubDeptMargin[], dateStr: string) =>
  src.filter((m) => m.sale_date.split("T")[0] === dateStr);

/** Worst-first order of the margin tiers. */
export const SEV_RANK: Record<MarginTier, number> = { critical: 0, watch: 1, healthy: 2, ungraded: 3 };

/** The list's Margin / Sales toggle. */
export const TOGGLE_OPTS: { key: GradingMetric; label: string }[] = [
  { key: "margin", label: "Margin" },
  { key: "sales", label: "Sales" },
];

/** Each tier's sparkline stroke colour. */
export const TIER_STROKE: Record<MarginTier, string> = {
  critical: "#ef4444",
  watch: "#fbbf24",
  healthy: "#10b981",
  ungraded: "#9ca3af",
};

/** The cost grid's filter input style. */
export const inputStyle: React.CSSProperties = {
  fontSize: 11,
  border: "1px solid rgb(var(--color-brand-navy) / 0.15)",
  borderRadius: 4,
  padding: "4px 7px",
  outline: "none",
  color: "var(--color-text-primary)",
  background: "rgb(var(--color-brand-navy) / 0.03)",
};

/** The cost grid's column widths. */
export const COLS = "minmax(0,2fr) 0.6fr 0.55fr 0.55fr 0.42fr 0.55fr";

/** fetchAllPages, with a failed read as no rows. */
export const fetchSafe = (
  url: string,
  token: string,
  subDeptId: number,
  start: string,
  end: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
): Promise<SubDeptMargin[]> =>
  fetchAllPages(
    url,
    token,
    subDeptId,
    start,
    end,
    useGroups,
    searchValue,
    singleStore,
  ).catch(() => []);

/** Every page of a sub department's margins: page 1, then the rest together. */
export const fetchAllPages = async (
  url: string,
  token: string,
  subDeptId: number,
  start: string,
  end: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
): Promise<SubDeptMargin[]> => {
  const resp = await getSubMargins(
    url,
    token,
    subDeptId,
    start,
    end,
    useGroups,
    searchValue,
    singleStore,
  );
  const j: SubMarginsJsonResp = resp.data;
  if (j.error !== 0) throw new Error(j.msg ?? "Failed to load margins");

  // Pages 2..N go out together. Sequential paging was tried and measured
  // slower in practice, so the parallel form stands regardless of how many
  // workers the API runs.
  let data: SubDeptMargin[] = j.subs;
  if (j.total_pages > 1) {
    const extras = await Promise.all(
      Array.from({ length: j.total_pages - 1 }, (_, i) =>
        getSubMargins(
          url,
          token,
          subDeptId,
          start,
          end,
          useGroups,
          searchValue,
          singleStore,
          i + 2,
        ),
      ),
    );
    for (const r of extras) {
      const pj: SubMarginsJsonResp = r.data;
      if (pj.error === 0) data = [...data, ...pj.subs];
    }
  }
  return data;
};

/**
 * The `subDeptId` value that asks `subs/subs` for every department at once.
 *
 * Named rather than a bare 0 at the call site, because 0 is also a real
 * department number in the response — `deriveSubDepts` deliberately keeps rows
 * whose `sub_department` is 0. As a *request* argument it means "all"; as a
 * *row value* it means that department. Conflating the two is easy and this
 * name is here to stop it.
 *
 * It also removes a fault in the shape this replaced: that version asked for
 * each department in turn, so on a store that has a department 0 the request
 * for it came back with every item in the store, and department 0 was then
 * graded against all of them.
 */
export const ALL_SUB_DEPTS = 0;

/**
 * Rows falling inside a date window, bounds inclusive.
 *
 * Dates are `yyyy-mm-dd`, so a string compare is a date compare — no parsing,
 * and no timezone to get wrong.
 */
export const inRange = (rows: SubDeptMargin[], start: string, end: string) =>
  rows.filter((r) => {
    const d = r.sale_date.split("T")[0];
    return d >= start && d <= end;
  });

/** Item rows keyed by the department each row says it belongs to. */
export const groupBySubDept = (rows: SubDeptMargin[]) => {
  const by = new Map<number, SubDeptMargin[]>();
  for (const row of rows) {
    const found = by.get(row.sub_department);
    if (found) found.push(row);
    else by.set(row.sub_department, [row]);
  }
  return by;
};

/** A search with nothing read yet. */
export const emptyRaw = (): RawSearch => ({
  totals: { ty: [], lw: [], ly: [] },
  items: { ty: [], lw: [], ly: [] },
  itemsReady: false,
});

/** One rollup read by department, unpaged. */
export const fetchTotals = async (
  url: string,
  token: string,
  startDate: string,
  endDate: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
) => {
  const resp = await getRollup(url, token, {
    by: "sub_department",
    startDate,
    endDate,
    useGroups,
    searchValue,
    singleStore,
  });
  if (resp.data.error !== 0) {
    throw new Error(resp.data.msg ?? "Could not read the department totals");
  }
  return resp.data.rows ?? [];
};

/**
 * A department's grade from its totals alone.
 *
 * The same day-matched arithmetic as `computeSubDeptGrade`, on the rollup's
 * rows, so every rate and delta is the one the item rows will give. What it
 * cannot have is the items: the arrays are empty and the no-cost count is 0
 * until the item rows land and the full grade replaces this one.
 */
export const computeTotalsGrade = (
  ty: RollupRow[],
  ly: RollupRow[],
  lw: RollupRow[],
  coverage: Coverage,
): SubDeptGrade => {
  const m = computeMarginDayMatched(ty, lw, ly);
  const sales = computeStoreDayMatched(ty, lw, ly);
  return {
    tyMarginPct: m.tyMarginPct,
    lyMarginPct: m.lyMarginPct,
    ptsDelta: m.ptsDelta,
    lwMarginPct: m.lwMarginPct,
    lwPtsDelta: m.lwPtsDelta,
    noCostCount: 0,
    dollars: m.dollars,
    tySales: sales.tySales,
    lySales: sales.lySales,
    lwSales: sales.lwSales,
    vsLYSalesPct: sales.vsLYSalesPct,
    vsLWSalesPct: sales.vsLWSalesPct,
    tyWeekOneMargins: [],
    lyWeekOneMargins: [],
    lwWeekOneMargins: [],
    tyDaily: netByDay(ty),
    coverage,
  };
};

/** Rollup rows keyed by department. The key is the department number as
 *  text, "0" for none, which is the number the item rows carry. */
export const groupTotalsBySubDept = (rows: RollupRow[]) => {
  const by = new Map<number, RollupRow[]>();
  for (const row of rows) {
    const id = Number(row.key);
    const found = by.get(id);
    if (found) found.push(row);
    else by.set(id, [row]);
  }
  return by;
};

// No sub_department !== 0 filter — Sales doesn't exclude it (aggSubDepts takes
// every row), so dropping it here made this page show one fewer sub department
// and a lower total than Sales.
export const deriveSubDepts = (
  rows: { sub_department: number; sub_department_description: string }[],
): SubDept[] =>
  rows
    .reduce((acc: SubDept[], curr) => {
      if (!acc.some((s) => s.id === curr.sub_department)) {
        acc.push({
          id: curr.sub_department,
          desc: curr.sub_department_description,
        });
      }
      return acc;
    }, [])
    .sort((a, b) => a.id - b.id);

/** A sub department's grade from TY, LY and LW margins and the coverage. */
export const computeSubDeptGrade = (
  tyMargins: SubDeptMargin[],
  lyMargins: SubDeptMargin[],
  lwMargins: SubDeptMargin[],
  coverage: Coverage,
): SubDeptGrade => {
  // Each metric reads the endpoint that's authoritative for it — getTier and
  // the panels already branch on gradingMetric, so this lands in the right
  // place without any UI change:
  //
  //  Sales metric  -> sub_sales. It has the correct item_ring_type filter
  //                   ('ITEM','SUBD'); subs/subs only matches 'ITEM' and so
  //                   runs short. Same endpoint and formula as the Sales page,
  //                   including its whole-range comparison, so the two agree
  //                   exactly.
  //  Margin metric -> subs/subs, the only source carrying cost. Stays
  //                   day-matched (computeMarginDayMatched) since there's no
  //                   Sales figure it has to line up with.
  const m = computeMarginDayMatched(tyMargins, lwMargins, lyMargins);
  // Sales figures day-matched too, exactly as the store header above them is.
  // They used to be whole-range sums — full week against whatever last year
  // returned — which is the comparison that flipped Wic Grocery from -42% to
  // +49% on the Sales page.
  const sales = computeStoreDayMatched(tyMargins, lwMargins, lyMargins);

  const seen = new Set<string>();
  let noCostCount = 0;
  for (const row of tyMargins) {
    if (!seen.has(row.product_code)) {
      seen.add(row.product_code);
      if (hasNoUsableCost(row)) noCostCount++;
    }
  }

  return {
    tyMarginPct: m.tyMarginPct,
    lyMarginPct: m.lyMarginPct,
    ptsDelta: m.ptsDelta,
    lwMarginPct: m.lwMarginPct,
    lwPtsDelta: m.lwPtsDelta,
    noCostCount,
    dollars: m.dollars,
    tySales: sales.tySales,
    lySales: sales.lySales,
    lwSales: sales.lwSales,
    vsLYSalesPct: sales.vsLYSalesPct,
    vsLWSalesPct: sales.vsLWSalesPct,
    tyWeekOneMargins: tyMargins,
    lyWeekOneMargins: lyMargins,
    lwWeekOneMargins: lwMargins,
    coverage,
  };
};
