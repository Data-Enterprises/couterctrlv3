import { sameWeekDayLastYear } from ".";

/**
 * The shared core of every ungraded mobile Performance screen.
 *
 * All of them reduce to the same question — for each of some dimension, what
 * is this year against last year — so all of them reduce to the same shape:
 * an array of {label, ty, ly}. Sales groups by store, sub-department and hour;
 * Sub Dept Margins and Vendors group by department, vendor, store and item.
 * The grouping differs, nothing else does.
 *
 * Kept page-agnostic on purpose. Anything that knows what a sub-department or
 * an hour is belongs in that page's own data module, not here.
 */

/** One comparison: a label, this year, last year. */
export interface PerfPair {
  key: string;
  label: string;
  ty: number;
  ly: number;
}

/** Rows across every sales endpoint carry a `sale_date`; this is the day key
 *  everything groups on. Split rather than parsed — a string compare is a date
 *  compare, with no timezone to lose a day to. */
export const dayOf = (r: { sale_date: string }) => r.sale_date.split("T")[0];

/**
 * Map each this-year date onto the matching weekday last year.
 *
 * Day-matching matters even without grading: comparing a Saturday against a
 * Friday makes the pair meaningless, and a fixed 365-day shift lands on the
 * wrong weekday five years in seven.
 */
export const lyDateFor = (tyIso: string) => sameWeekDayLastYear(tyIso).date;

/** Every sales row type carries both, so one key works across all of them.
 *
 *  Keyed on the pair because storeid alone is not unique — some ids carry two
 *  store numbers, and keying on the id would merge two real stores. */
export type StoreRow = { storeid: number; store_number: string };
export const storeKeyOf = (r: StoreRow) => `${r.storeid}__${r.store_number}`;

/** The two scopes compose. A row survives only if it matches both, so picking
 *  a store and a day narrows to that store on that day. */
export const inScope = <T extends StoreRow & { sale_date: string }>(
  r: T,
  day: string | null,
  store: string | null,
) => (!day || dayOf(r) === day) && (!store || storeKeyOf(r) === store);

/** Sum a metric over rows, narrowed to the current scopes. */
export const sumFor = <T extends StoreRow & { sale_date: string }>(
  rows: T[],
  day: string | null,
  store: string | null,
  pick: (r: T) => number,
) => rows.reduce((acc, r) => (inScope(r, day, store) ? acc + pick(r) : acc), 0);

/**
 * Group two periods of rows into pairs by some identity.
 *
 * The accumulator is filled from BOTH sides independently, which is the point:
 * a department that sold last year and nothing this year still produces a row,
 * with a zero against its last-year bar. Iterating this year and looking last
 * year up — which `buildItemRows` in utils/itemMargins does — makes those rows
 * vanish entirely and quietly breaks the comparison.
 */
export const pairBy = <T extends StoreRow & { sale_date: string }>(
  tyRows: T[],
  lyRows: T[],
  day: string | null,
  store: string | null,
  keyOf: (r: T) => string,
  labelOf: (r: T) => string,
  pick: (r: T) => number,
): PerfPair[] => {
  const lyDay = day ? lyDateFor(day) : null;
  const acc = new Map<string, PerfPair>();

  const add = (rows: T[], scope: string | null, side: "ty" | "ly") =>
    rows.forEach((r) => {
      if (!inScope(r, scope, store)) return;
      const key = keyOf(r);
      const found = acc.get(key) ?? { key, label: labelOf(r), ty: 0, ly: 0 };
      found[side] += pick(r);
      acc.set(key, found);
    });

  add(tyRows, day, "ty");
  add(lyRows, lyDay, "ly");

  // Largest this year first — the default. Size is a fact about the row;
  // ordering by how far it fell is available, but only when someone asks for
  // it (sortPairs "change").
  return [...acc.values()].sort((a, b) => b.ty - a.ty);
};

/** How a list of pairs can be ordered.
 *  - sales:  this year, largest first
 *  - change: vs last year, biggest drop first
 *  - name:   A-Z, numbers in number order ("9" before "10")
 *  - time:   by key as a number — hours of the day */
export type PairSort = "sales" | "change" | "name" | "time";

/** This year against last year as a percentage. Null when last year is zero:
 *  there is nothing to take a percentage of. */
export const pairChangePct = (p: PerfPair): number | null =>
  p.ly > 0 ? ((p.ty - p.ly) / p.ly) * 100 : null;

/**
 * Order a list of pairs. Returns a new array.
 *
 * Rows with no last year sort after every row that has one under "change" —
 * unknown isn't the same as down. Ties fall back to size, so equal rows keep a
 * stable, sensible order.
 *
 * `nameOf` picks what "name" compares; stores pass their store number.
 */
export const sortPairs = (
  pairs: PerfPair[],
  sort: PairSort,
  nameOf: (p: PerfPair) => string = (p) => p.label,
): PerfPair[] => {
  const bySize = (a: PerfPair, b: PerfPair) => b.ty - a.ty;
  const out = [...pairs];
  switch (sort) {
    case "sales":
      return out.sort(bySize);
    case "change":
      return out.sort((a, b) => {
        const pa = pairChangePct(a);
        const pb = pairChangePct(b);
        if (pa === null && pb === null) return bySize(a, b);
        if (pa === null) return 1;
        if (pb === null) return -1;
        return pa - pb || bySize(a, b);
      });
    case "name":
      return out.sort(
        (a, b) =>
          nameOf(a).localeCompare(nameOf(b), undefined, { numeric: true }) ||
          bySize(a, b),
      );
    case "time":
      return out.sort((a, b) => Number(a.key) - Number(b.key));
  }
};

export interface PerfDay {
  iso: string;
  label: string;
  ty: number;
  ly: number;
}

/**
 * The day columns, which double as the screen's filter.
 *
 * Narrowed by store but never by day — this chart IS the day control, and
 * filtering it to the selected day would leave one column to tap. Ordered by
 * date rather than size, because it is a calendar.
 */
export const buildDays = <T extends StoreRow & { sale_date: string }>(
  tyRows: T[],
  lyRows: T[],
  store: string | null,
  pick: (r: T) => number,
): PerfDay[] => {
  const ty = new Map<string, number>();
  tyRows
    .filter((r) => inScope(r, null, store))
    .forEach((r) => ty.set(dayOf(r), (ty.get(dayOf(r)) ?? 0) + pick(r)));

  const ly = new Map<string, number>();
  lyRows
    .filter((r) => inScope(r, null, store))
    .forEach((r) => ly.set(dayOf(r), (ly.get(dayOf(r)) ?? 0) + pick(r)));

  return [...ty.keys()].sort().map((iso) => ({
    iso,
    // Parsed at midday so the local-time read of a UTC-parsed date cannot slip
    // the label back a day.
    label: new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
      weekday: "short",
    }),
    ty: ty.get(iso) ?? 0,
    ly: ly.get(lyDateFor(iso)) ?? 0,
  }));
};

/**
 * The sales basis, unified across every level as of 2026-08-25.
 *
 * `sales/weekly`, `subs/sub_sales` and `subs/subs` all reconcile on
 * `total_sales - total_tax`. An earlier rule read "store uses net_sales,
 * sub-dept uses total_sales - total_tax, do not unify" — true while the
 * endpoints disagreed, and false once both were fixed.
 *
 * Do not flip this without asking: it moves numbers on every Sales surface,
 * and the right answer has already changed once.
 */
export const netOf = (r: { total_sales: number; total_tax: number }) =>
  r.total_sales - r.total_tax;
