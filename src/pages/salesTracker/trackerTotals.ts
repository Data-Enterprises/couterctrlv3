import type { SubSale } from "../../interfaces";
import type { WindowPlan } from "./trackerWeeks";

/**
 * Sub-department totals for the tracker, shaped the way the legacy tracker
 * shaped them: this year against last year, day-matched, with no grading of
 * any kind. A number is green above zero and red below, and that is the whole
 * verdict the page offers.
 *
 * Three levels, because that is how the question gets asked: which department
 * moved, which week it moved in, and which day inside that week.
 *
 * **Net is `total_sales - total_tax` on both sides.** The legacy page took LY
 * net of tax but TY raw (`salesLY = total_sales - total_tax` against
 * `salesTY = week.total_sales`), so every department's dollar and percentage
 * change carried this year's tax on the TY side and read better than it was.
 * Matching the two sides is a deliberate correction, and it means these figures
 * come in below the old page's.
 */

export type DayTotal = {
  date: string;
  lyDate: string;
  salesTy: number;
  /** null where last year has no matching day at all — distinct from a day
   *  that genuinely took nothing. */
  salesLy: number | null;
  trans: number;
  ats: number | null;
  dollarChange: number | null;
  pctChange: number | null;
  /** No rows came back for this date. Legacy stitched these in afterwards by
   *  walking for gaps; here every date in the window is enumerated up front by
   *  the plan, so a quiet day is a zero rather than a hole. */
  noSales: boolean;
};

export type WeekTotal = {
  index: number;
  start: string;
  end: string;
  /** In order. Usually seven — but a range that isn't a multiple of seven
   *  leaves the last bucket short, so nothing here may assume it. */
  days: DayTotal[];
  salesTy: number;
  salesLy: number | null;
  trans: number;
  ats: number | null;
  dollarChange: number | null;
  pctChange: number | null;
  /**
   * How the week's days split, so a closed card can say more than its total.
   *
   * A week down four percent reads the same whether every day was down four,
   * or six days were flat and Saturday fell off a cliff — and those are
   * different problems. Only days with a last-year partner are counted; a day
   * with nothing to compare is neither good nor bad.
   */
  upDays: number;
  downDays: number;
  comparedDays: number;
  /** The day that cost the most money. Ranked on dollars, like every other
   *  "worst" on this page, so the label can't disagree with the sort. */
  worstDay: DayTotal | null;
};

export type SubDeptTotal = {
  id: number;
  desc: string;
  weeks: WeekTotal[];
  salesTy: number;
  salesLy: number | null;
  trans: number;
  ats: number | null;
  dollarChange: number | null;
  pctChange: number | null;
};

const net = (r: SubSale) => r.total_sales - r.total_tax;

/**
 * Average transaction size, or `null` where there isn't one.
 *
 * Sales over `transaction_count`, summed at whatever level is being shown —
 * the same calculation the legacy tracker makes at every level (`TotalsGrid`
 * for a department, `TotalsGridLvlThree` for a day).
 *
 * A basket touching four departments counts in all four, so an
 * all-department ATS reads lower than the average basket at the till. That is
 * how the old page has always reported it and the two must agree.
 *
 * Null rather than zero when there are no transactions. A closed day has no
 * average transaction, and `$0.00` claims one — a figure the reader has no way
 * to tell apart from a real average that happened to be nothing.
 */
const atsOf = (sales: number, trans: number): number | null =>
  trans > 0 ? sales / trans : null;

const changes = (ty: number, ly: number | null) => ({
  dollarChange: ly === null ? null : ty - ly,
  pctChange: ly === null || ly === 0 ? null : ((ty - ly) / ly) * 100,
});

export const buildSubDeptTotals = (
  ty: SubSale[],
  ly: SubSale[],
  plan: WindowPlan,
): SubDeptTotal[] => {
  type DayAcc = { ty: number; ly: number | null; trans: number; seen: boolean };

  // department -> tyDate -> accumulator. Keyed on the TY date so a row lands in
  // the day it happened, and the LY side is reached through the plan's pairing
  // rather than by position.
  const byDept = new Map<number, { desc: string; days: Map<string, DayAcc> }>();

  const blankDay = (): DayAcc => ({ ty: 0, ly: null, trans: 0, seen: false });

  const deptOf = (row: SubSale) => {
    let entry = byDept.get(row.sub_department);
    if (!entry) {
      entry = {
        desc: row.sub_department_description ?? `Sub dept ${row.sub_department}`,
        days: new Map(),
      };
      byDept.set(row.sub_department, entry);
    }
    return entry;
  };

  for (const row of ty) {
    const date = row.sale_date.split("T")[0];
    const pair = plan.byTyDate.get(date);
    if (!pair) continue;
    const entry = deptOf(row);
    const day = entry.days.get(date) ?? blankDay();
    day.ty += net(row);
    day.trans += row.transaction_count;
    day.seen = true;
    entry.days.set(date, day);
  }

  for (const row of ly) {
    const date = row.sale_date.split("T")[0];
    const pairs = plan.byLyDate.get(date);
    if (!pairs) continue;
    const entry = deptOf(row);
    // A holiday can pull two TY days onto one LY date; both then read the same
    // last-year figure, which the plan records in `collisions` for the UI.
    for (const pair of pairs) {
      const day = entry.days.get(pair.tyDate) ?? blankDay();
      day.ly = (day.ly ?? 0) + net(row);
      entry.days.set(pair.tyDate, day);
    }
  }

  return [...byDept.entries()]
    .map(([id, entry]) => {
      const weeks: WeekTotal[] = plan.weeks.map((bucket) => {
        const days: DayTotal[] = bucket.dates.map((date) => {
          const pair = plan.byTyDate.get(date);
          const acc = entry.days.get(date) ?? blankDay();
          const ats = atsOf(acc.ty, acc.trans);
          return {
            date,
            lyDate: pair?.lyDate ?? "",
            salesTy: acc.ty,
            salesLy: acc.ly,
            trans: acc.trans,
            ats,
            ...changes(acc.ty, acc.ly),
            noSales: !acc.seen,
          };
        });

        const salesTy = days.reduce((a, d) => a + d.salesTy, 0);
        const comparable = days.filter((d) => d.salesLy !== null);
        const salesLy = comparable.length
          ? comparable.reduce((a, d) => a + (d.salesLy ?? 0), 0)
          : null;
        // Day-matched: only the days with a last-year partner count on the TY
        // side too, so a week missing two LY days isn't shown as collapsing.
        const tyForCompare = comparable.reduce((a, d) => a + d.salesTy, 0);
        const trans = days.reduce((a, d) => a + d.trans, 0);

        const rated = days.filter((d) => d.dollarChange !== null);
        const worstDay = rated.reduce<DayTotal | null>(
          (worst, d) =>
            (d.dollarChange as number) < 0 &&
            (worst === null || (d.dollarChange as number) < (worst.dollarChange as number))
              ? d
              : worst,
          null,
        );

        return {
          index: bucket.index,
          start: bucket.start,
          end: bucket.end,
          days,
          salesTy,
          salesLy,
          trans,
          ats: atsOf(salesTy, trans),
          upDays: rated.filter((d) => (d.dollarChange as number) > 0).length,
          downDays: rated.filter((d) => (d.dollarChange as number) < 0).length,
          comparedDays: rated.length,
          worstDay,
          ...changes(tyForCompare, salesLy),
        };
      });

      const salesTy = weeks.reduce((a, w) => a + w.salesTy, 0);
      const cmp = weeks.filter((w) => w.salesLy !== null);
      const salesLy = cmp.length
        ? cmp.reduce((a, w) => a + (w.salesLy ?? 0), 0)
        : null;
      const tyForCompare = cmp.reduce((a, w) => a + w.salesTy, 0);
      const trans = weeks.reduce((a, w) => a + w.trans, 0);

      return {
        id,
        desc: entry.desc,
        weeks,
        salesTy,
        salesLy,
        trans,
        ats: atsOf(salesTy, trans),
        ...changes(tyForCompare, salesLy),
      };
    })
    // Sub-department number order, which is the order these are numbered in
    // the back office and the order every other report prints them in.
    // Alphabetical put Bakery above Grocery and made the list unrecognisable
    // to anyone who knows the departments by their numbers.
    .sort((a, b) => a.id - b.id);
};

/**
 * Every department rolled into one series, so the right panel has something to
 * show before a department is picked.
 *
 * Built by summing the day cells rather than by re-reading the rows, so it
 * cannot drift from the list beside it.
 *
 * ATS sums `transaction_count` and divides, the same way the legacy tracker
 * does at every level it aggregates. A basket touching four departments is
 * counted in all four, so a whole-group ATS reads lower than the average basket
 * at the till - but this is the figure the old page has always shown, and
 * agreeing with it matters more than the objection.
 */
export const allDeptsTotal = (
  rows: SubDeptTotal[],
  plan: WindowPlan,
  label = "All sub departments",
): SubDeptTotal | null => {
  if (rows.length === 0) return null;

  const weeks: WeekTotal[] = plan.weeks.map((bucket) => {
    const days: DayTotal[] = bucket.dates.map((date, i) => {
      const cells = rows
        .map((r) => r.weeks[bucket.index]?.days[i])
        .filter((d): d is DayTotal => Boolean(d));
      const salesTy = cells.reduce((a, d) => a + d.salesTy, 0);
      const comparable = cells.filter((d) => d.salesLy !== null);
      const salesLy = comparable.length
        ? comparable.reduce((a, d) => a + (d.salesLy ?? 0), 0)
        : null;
      const tyForCompare = comparable.reduce((a, d) => a + d.salesTy, 0);
      const trans = cells.reduce((a, d) => a + d.trans, 0);
      return {
        date,
        lyDate: cells[0]?.lyDate ?? "",
        salesTy,
        salesLy,
        trans,
        ats: atsOf(salesTy, trans),
        ...changes(tyForCompare, salesLy),
        noSales: cells.every((d) => d.noSales),
      };
    });

    const salesTy = days.reduce((a, d) => a + d.salesTy, 0);
    const comparable = days.filter((d) => d.salesLy !== null);
    const salesLy = comparable.length
      ? comparable.reduce((a, d) => a + (d.salesLy ?? 0), 0)
      : null;
    const tyForCompare = comparable.reduce((a, d) => a + d.salesTy, 0);
    const rated = days.filter((d) => d.dollarChange !== null);
    const worstDay = rated.reduce<DayTotal | null>(
      (worst, d) =>
        (d.dollarChange as number) < 0 &&
        (worst === null || (d.dollarChange as number) < (worst.dollarChange as number))
          ? d
          : worst,
      null,
    );

    const trans = days.reduce((a, d) => a + d.trans, 0);

    return {
      index: bucket.index,
      start: bucket.start,
      end: bucket.end,
      days,
      salesTy,
      salesLy,
      trans,
      ats: atsOf(salesTy, trans),
      upDays: rated.filter((d) => (d.dollarChange as number) > 0).length,
      downDays: rated.filter((d) => (d.dollarChange as number) < 0).length,
      comparedDays: rated.length,
      worstDay,
      ...changes(tyForCompare, salesLy),
    };
  });

  const salesTy = weeks.reduce((a, w) => a + w.salesTy, 0);
  const cmp = weeks.filter((w) => w.salesLy !== null);
  const salesLy = cmp.length
    ? cmp.reduce((a, w) => a + (w.salesLy ?? 0), 0)
    : null;
  const tyForCompare = cmp.reduce((a, w) => a + w.salesTy, 0);
  const trans = weeks.reduce((a, w) => a + w.trans, 0);

  return {
    id: -1,
    desc: label,
    weeks,
    salesTy,
    salesLy,
    trans,
    ats: atsOf(salesTy, trans),
    ...changes(tyForCompare, salesLy),
  };
};

/**
 * Deleted on purpose — use `allDeptsTotal` for window totals.
 *
 * There used to be a `windowTotals` here that summed the department rows and
 * excluded a whole department from the comparison whenever it had no last-year
 * history at all. `allDeptsTotal` excludes at the **day** level and aggregates
 * upward, so the two disagreed: on one real store the panel header read
 * "GAP -$2,504.22" beside a TY and an LY figure that differed by +$8,046.99.
 *
 * A page that reports two different answers to "how far ahead are we" is worse
 * than one that reports the harder-to-defend answer, so there is now one
 * computation and both panels read from it.
 */


