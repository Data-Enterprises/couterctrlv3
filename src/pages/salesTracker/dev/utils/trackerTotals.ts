// Interfaces
import type { DayTotal, SubDeptTotal, WeekTotal, WindowPlan } from "../interfaces";
import type { SubSale } from "../../../../interfaces";

/**
 * Sub-department totals for the tracker: this year against last year,
 * day-matched, ungraded, at three levels (department, week, day).
 *
 * **Net is `total_sales - total_tax` on both sides.** Legacy took LY net but TY
 * raw, so these come in below the old page's, deliberately.
 */

const net = (r: SubSale) => r.total_sales - r.total_tax;

/**
 * Average transaction size, or `null` with no transactions. Sales over
 * `transaction_count` at the level shown, as legacy does; a basket in four
 * departments counts in all four, so an all-department ATS reads low, matching
 * the old page.
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

  // department -> tyDate -> accumulator, keyed on the TY date; the LY side is
  // reached through the plan's pairing.
  const byDept = new Map<number, { desc: string; days: Map<string, DayAcc> }>();

  const blankDay = (): DayAcc => ({ ty: 0, ly: null, trans: 0, seen: false });

  const deptOf = (row: SubSale) => {
    let entry = byDept.get(row.sub_department);
    if (!entry) {
      entry = {
        desc:
          row.sub_department_description ?? `Sub dept ${row.sub_department}`,
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

  return (
    [...byDept.entries()]
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
              (worst === null ||
                (d.dollarChange as number) < (worst.dollarChange as number))
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
            downDays: rated.filter((d) => (d.dollarChange as number) < 0)
              .length,
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
      // Sub-department number order, as the back office and every other report
      // number them.
      .sort((a, b) => a.id - b.id)
  );
};

/**
 * Every department rolled into one series for the right panel, summed from the
 * day cells so it matches the list. ATS sums `transaction_count` and divides,
 * as legacy does.
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
        (worst === null ||
          (d.dollarChange as number) < (worst.dollarChange as number))
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

/** Window totals come from `allDeptsTotal`: one computation both panels read. */
