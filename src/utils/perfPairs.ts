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
  /** This year, every day in scope — what the row is sized and sorted by. */
  ty: number;
  /** Last year, on the matched dates only. */
  ly: number;
  /** This year over only the days last year can be matched on — the side a
   *  vs-LY figure divides and a TY/LY bar should draw. Same as `ty` inside a
   *  single day or when last year covers the whole week. */
  tyForLy: number;
  /** Days this year has in scope, and how many matched last year. Absent
   *  inside a single day, where the question doesn't arise. */
  days?: number;
  lyDays?: number;
  /** Nothing on file last year for this row's scope — see noLyHistory. Absent
   *  when no matching was given. */
  noLy?: boolean;
}

/**
 * Which days of a week can be compared with last year.
 *
 * Last year's dates come from `lyDateFor` one TY date at a time, so around a
 * moving holiday they aren't contiguous — TY Fri 9/4–Thu 9/10/2026 matches
 * Labor Day Mon 9/1/2025 plus Fri 9/5–Thu 9/11. The fetch covers min..max,
 * 9/1–9/11, so rows for 9/2–9/4 and 9/8 arrive too and must never be summed.
 * A TY date matches only when its own partner has rows.
 *
 * Coverage is on dates across the rows given, not per group: a department
 * with nothing on a day the store traded is a zero, not a gap.
 */
export interface DayMatch {
  /** TY dates whose partner last year has rows. */
  tyDates: Set<string>;
  /** Those partners — the only LY dates any sum may include. */
  lyDates: Set<string>;
  /** TY dates with rows. */
  days: number;
  /** How many of them matched. */
  lyDays: number;
  /** Every LY date that has rows, matched or not — what a single selected
   *  day checks its partner against. */
  lyAll: Set<string>;
}

export const matchWeek = (
  tyRows: { sale_date: string }[],
  lyRows: { sale_date: string }[],
): DayMatch => {
  const lyHave = new Set(lyRows.map(dayOf));
  const tyAll = new Set(tyRows.map(dayOf));
  const tyDates = new Set<string>();
  const lyDates = new Set<string>();
  for (const d of tyAll) {
    const partner = lyDateFor(d);
    if (lyHave.has(partner)) {
      tyDates.add(d);
      lyDates.add(partner);
    }
  }
  return { tyDates, lyDates, days: tyAll.size, lyDays: tyDates.size, lyAll: lyHave };
};

/**
 * Last year has nothing on file to compare against — for the week, not one
 * matched day; for a selected day, no row on its partner date.
 *
 * Not the same as last year selling nothing: that is a row with a zero in it.
 * Drawing a missing year as a $0.00 bar states a fact nobody measured, so the
 * UI says "no history" instead.
 */
export const noLyHistory = (m: DayMatch, day: string | null) =>
  day ? !m.lyAll.has(lyDateFor(day)) : m.days > 0 && m.lyDays === 0;

/** Last year has some of the week but not all of it — a comparison worth
 *  showing, over fewer days, and flagged as such. */
export const isPartialMatch = (p: { days?: number; lyDays?: number }) =>
  p.days !== undefined &&
  p.lyDays !== undefined &&
  p.lyDays > 0 &&
  p.lyDays < p.days;

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
  /**
   * The whole week's day matching — one for every row, or per row key when
   * each group has its own dates (stores). Ignored inside a single day, where
   * `lyDateFor(day)` already names the one date. Without it the whole week
   * sums every LY row fetched, padding dates included.
   */
  match?: DayMatch | ((key: string) => DayMatch | undefined),
): PerfPair[] => {
  const lyDay = day ? lyDateFor(day) : null;
  const acc = new Map<string, PerfPair>();
  const scopeMatch = (key: string) =>
    typeof match === "function" ? match(key) : match;
  // Filtering by matched dates is a whole-week concern; a single day already
  // names its one LY date.
  const matchFor = (key: string) => (day ? undefined : scopeMatch(key));

  tyRows.forEach((r) => {
    if (!inScope(r, day, store)) return;
    const key = keyOf(r);
    const found = acc.get(key) ?? { key, label: labelOf(r), ty: 0, ly: 0, tyForLy: 0 };
    const v = pick(r);
    found.ty += v;
    const m = matchFor(key);
    if (!m || m.tyDates.has(dayOf(r))) found.tyForLy += v;
    acc.set(key, found);
  });

  lyRows.forEach((r) => {
    if (!inScope(r, lyDay, store)) return;
    const key = keyOf(r);
    const m = matchFor(key);
    // Checked before the row is created, so a group that only traded on a
    // padding date doesn't appear as an empty pair.
    if (m && !m.lyDates.has(dayOf(r))) return;
    const found = acc.get(key) ?? { key, label: labelOf(r), ty: 0, ly: 0, tyForLy: 0 };
    found.ly += pick(r);
    acc.set(key, found);
  });

  for (const p of acc.values()) {
    const m = scopeMatch(p.key);
    if (!m) continue;
    p.noLy = noLyHistory(m, day);
    if (!day) {
      p.days = m.days;
      p.lyDays = m.lyDays;
    }
  }

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

/** This year against last year as a percentage, over the matched days. Null
 *  when last year is zero: there is nothing to take a percentage of. */
export const pairChangePct = (p: PerfPair): number | null =>
  p.ly > 0 ? ((p.tyForLy - p.ly) / p.ly) * 100 : null;

/**
 * A list's order: which column, and whether it is reversed from that column's
 * natural direction. Null is the list's own ordering, untouched.
 */
export interface SortState<K extends string> {
  key: K;
  reversed: boolean;
}

/**
 * The three-state cycle every mobile Performance sort chip follows: natural
 * order, reversed, then back to the list as it arrived.
 *
 * The third state is why null is representable. Every one of these lists is
 * ordered meaningfully before anyone touches a chip — a search's own order,
 * size, time — so sorting is a temporary lens and there has to be a way to put
 * it down. The same contract `useTriStateSort` gives the desktop panels.
 *
 * Generic over the key because the pages sort on different columns: Sales has
 * sales/change/name/time, the margin pages add profit and GPM.
 */
export const cycleSort = <K extends string>(
  prev: SortState<K> | null,
  key: K,
): SortState<K> | null => {
  if (prev?.key !== key) return { key, reversed: false };
  if (!prev.reversed) return { key, reversed: true };
  return null;
};

/**
 * The order each key reads in on its first tap.
 *
 * Not uniformly descending, because "biggest first" and "worst first" are both
 * the useful end of their own column: sales opens on the largest, change opens
 * on the steepest fall, and a name or an hour opens where a reader expects to
 * start. The second tap reverses whichever of those it is.
 */
export const SORT_DIR: Record<PairSort, "asc" | "desc"> = {
  sales: "desc",
  change: "asc",
  name: "asc",
  time: "asc",
};

/** Which way a list is actually pointing, for the arrow on its chip. */
export const dirOf = (sort: PairSort, reversed: boolean): "asc" | "desc" =>
  reversed ? (SORT_DIR[sort] === "asc" ? "desc" : "asc") : SORT_DIR[sort];

/**
 * Order a list of pairs. Returns a new array.
 *
 * Rows with no last year sort after every row that has one under "change" —
 * unknown isn't the same as down. Ties fall back to size, so equal rows keep a
 * stable, sensible order.
 *
 * `nameOf` picks what "name" compares; stores pass their store number.
 *
 * `reversed` flips the comparison, and does it INSIDE each case rather than by
 * reversing the result. Two things would break if it reversed the array: rows
 * with no last year would float to the top under "change" — reading as "these
 * are the worst" when they mean "these have nothing to compare" — and the
 * size tiebreak would invert with them, so equal rows would reshuffle on a tap
 * that should only have changed direction.
 */
export const sortPairs = (
  pairs: PerfPair[],
  sort: PairSort,
  nameOf: (p: PerfPair) => string = (p) => p.label,
  reversed: boolean = false,
): PerfPair[] => {
  const flip = reversed ? -1 : 1;
  // Never flipped: it only ever breaks ties, and a stable tiebreak is the
  // point of having one.
  const bySize = (a: PerfPair, b: PerfPair) => b.ty - a.ty;
  const out = [...pairs];
  switch (sort) {
    case "sales":
      return out.sort((a, b) => bySize(a, b) * flip);
    case "change":
      return out.sort((a, b) => {
        const pa = pairChangePct(a);
        const pb = pairChangePct(b);
        // Checked before the flip, so an absent comparison stays last in both
        // directions.
        if (pa === null && pb === null) return bySize(a, b);
        if (pa === null) return 1;
        if (pb === null) return -1;
        return (pa - pb) * flip || bySize(a, b);
      });
    case "name":
      return out.sort(
        (a, b) =>
          nameOf(a).localeCompare(nameOf(b), undefined, { numeric: true }) *
            flip || bySize(a, b),
      );
    case "time":
      return out.sort((a, b) => (Number(a.key) - Number(b.key)) * flip);
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
