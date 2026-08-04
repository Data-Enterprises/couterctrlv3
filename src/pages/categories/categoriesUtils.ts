import type { CatSalesDaily } from "../../interfaces";

/** Category performance: turning three weeks of daily rows into graded rows.
 *
 *  Kept free of React so the same aggregation serves the desktop panel, a
 *  future mobile view, an export, and the item-level drill-down when that
 *  endpoint exists.
 *
 *  Why daily rows rather than `consolidated=1`: the consolidated shape has no
 *  `sale_date`, and without it a comparison can't be day-matched. A store
 *  closed last Tuesday would read as growth. Four pages per period is the
 *  price of a comparison that means something.
 */

export type CategoryMetric = "sales" | "qty";

/** One category's figures for a single day, across the three periods.
 *
 *  `null` is load-bearing throughout: it means "that day did not exist in that
 *  period" and must never be coerced to 0. Zero is a real trading day with no
 *  sales; null is a day the store was shut or a week that ran short. */
/** Everything the payload carries for one day, kept for the report column.
 *  Grading only needs net and qty, but the drill-down should show what the
 *  endpoint actually returned rather than a two-field summary of it. */
export interface DayDetail {
  gross: number;
  net: number;
  tax: number;
  qty: number;
  weight: number;
  elecInstore: number;
  elecStore: number;
  digital: number;
  storeCoupon: number;
}

export const emptyDetail = (): DayDetail => ({
  gross: 0, net: 0, tax: 0, qty: 0, weight: 0,
  elecInstore: 0, elecStore: 0, digital: 0, storeCoupon: 0,
});

export interface CategoryDay {
  /** YYYY-MM-DD, always the *this week* date — LW and LY are aligned onto it. */
  date: string;
  twNet: number;
  twQty: number;
  /** This week's full figures for the day. */
  detail: DayDetail;
  lwNet: number | null;
  lwQty: number | null;
  lyNet: number | null;
  lyQty: number | null;
}

export interface CategoryRow {
  category: number;
  /** Null from the API means uncategorized at the POS. Surfaced as such rather
   *  than hidden, because a large uncategorized bucket is worth acting on. */
  description: string | null;
  uncategorized: boolean;
  days: CategoryDay[];
  /** Day-matched: each comparison totals only the days present on both sides,
   *  and carries its own TW subtotal so the two are like for like. */
  twNet: number;
  twQty: number;
  lwNet: number;
  lwQty: number;
  twNetForLW: number;
  twQtyForLW: number;
  lyNet: number;
  lyQty: number;
  twNetForLY: number;
  twQtyForLY: number;
  hasLW: boolean;
  hasLY: boolean;
}

/* ── date helpers ─────────────────────────────────────────────────────────
   All parsed as UTC. Local parsing shifts YYYY-MM-DD back a day for anyone
   west of Greenwich, which would misalign every comparison by one. */

export const isoOf = (saleDate: string) => saleDate.split("T")[0];

export const shiftIso = (iso: string, days: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
};

/** Last year's matching week is 364 days back, not 365.
 *
 *  364 is exactly 52 weeks, so a Monday maps to a Monday. Using 365 would slide
 *  the comparison by one weekday and set every Saturday against a Friday —
 *  ruinous in retail, where day of week drives volume more than anything else. */
export const LY_OFFSET = -364;
export const LW_OFFSET = -7;

/* ── aggregation ──────────────────────────────────────────────────────────── */

type DayKey = string;
type CatKey = number;

const emptyDay = (date: string): CategoryDay => ({
  date,
  twNet: 0,
  twQty: 0,
  detail: emptyDetail(),
  lwNet: null,
  lwQty: null,
  lyNet: null,
  lyQty: null,
});

/** Sum rows to one figure per category per day. The endpoint can return several
 *  rows for the same pair, so this never assumes uniqueness. */
const foldByCategoryDay = (rows: CatSalesDaily[]) => {
  const map = new Map<CatKey, Map<DayKey, DayDetail>>();
  for (const r of rows) {
    const day = isoOf(r.sale_date);
    let byDay = map.get(r.category);
    if (!byDay) {
      byDay = new Map();
      map.set(r.category, byDay);
    }
    const cur = byDay.get(day) ?? emptyDetail();
    cur.gross += r.total_sales;
    cur.net += r.net_sales;
    cur.tax += r.total_tax;
    cur.qty += r.qty;
    cur.weight += r.weight;
    cur.elecInstore += r.elec_instore_coupons;
    cur.elecStore += r.elec_store_coupons;
    cur.digital += r.digital_coupons;
    cur.storeCoupon += r.store_coupon;
    byDay.set(day, cur);
  }
  return map;
};

/** Best available label for a category id, preferring any non-null description
 *  seen across the three periods — a category can be described this week and
 *  null last year, and the newer label is the useful one. */
const buildLabels = (...sets: CatSalesDaily[][]) => {
  const labels = new Map<CatKey, string | null>();
  for (const rows of sets) {
    for (const r of rows) {
      const existing = labels.get(r.category);
      if (existing == null && r.category_description != null) {
        labels.set(r.category, r.category_description);
      } else if (!labels.has(r.category)) {
        labels.set(r.category, r.category_description);
      }
    }
  }
  return labels;
};

/**
 * Build graded rows from the three periods.
 *
 * `twDates` is the ordered list of this week's days and drives everything:
 * each one is matched to its counterpart 7 and 364 days back. A category with
 * no row on a given prior date gets `null` for that day rather than 0, and the
 * matched totals then skip it on both sides.
 */
export const buildCategoryRows = (
  tw: CatSalesDaily[],
  lw: CatSalesDaily[],
  ly: CatSalesDaily[],
  twDates: string[],
): CategoryRow[] => {
  const twMap = foldByCategoryDay(tw);
  const lwMap = foldByCategoryDay(lw);
  const lyMap = foldByCategoryDay(ly);
  const labels = buildLabels(tw, lw, ly);

  // Any category appearing in any period gets a row — one that traded last
  // year and not this week is exactly the disappearance worth seeing.
  const categories = new Set<CatKey>([
    ...twMap.keys(),
    ...lwMap.keys(),
    ...lyMap.keys(),
  ]);

  const rows: CategoryRow[] = [];

  for (const category of categories) {
    const twDays = twMap.get(category);
    const lwDays = lwMap.get(category);
    const lyDays = lyMap.get(category);

    const days: CategoryDay[] = twDates.map((date) => {
      const d = emptyDay(date);
      const t = twDays?.get(date);
      if (t) {
        d.twNet = t.net;
        d.twQty = t.qty;
        d.detail = t;
      }
      const l = lwDays?.get(shiftIso(date, LW_OFFSET));
      if (l) {
        d.lwNet = l.net;
        d.lwQty = l.qty;
      }
      const y = lyDays?.get(shiftIso(date, LY_OFFSET));
      if (y) {
        d.lyNet = y.net;
        d.lyQty = y.qty;
      }
      return d;
    });

    const matched = days.filter((d) => d.lwNet !== null);
    const matchedLY = days.filter((d) => d.lyNet !== null);
    const sum = (list: CategoryDay[], pick: (d: CategoryDay) => number) =>
      list.reduce((acc, d) => acc + pick(d), 0);

    const description = labels.get(category) ?? null;

    rows.push({
      category,
      description,
      uncategorized: description == null,
      days,
      twNet: sum(days, (d) => d.twNet),
      twQty: sum(days, (d) => d.twQty),
      lwNet: sum(matched, (d) => d.lwNet as number),
      lwQty: sum(matched, (d) => d.lwQty ?? 0),
      twNetForLW: sum(matched, (d) => d.twNet),
      twQtyForLW: sum(matched, (d) => d.twQty),
      lyNet: sum(matchedLY, (d) => d.lyNet as number),
      lyQty: sum(matchedLY, (d) => d.lyQty ?? 0),
      twNetForLY: sum(matchedLY, (d) => d.twNet),
      twQtyForLY: sum(matchedLY, (d) => d.twQty),
      hasLW: matched.length > 0,
      hasLY: matchedLY.length > 0,
    });
  }

  return rows;
};

/* ── grading ──────────────────────────────────────────────────────────────── */

/** Matches Sub Dept Margins' MarginTier naming — same list-of-rows-under-a-
 *  store shape, so the vocabulary should be the same too. */
export type CategoryTier = "critical" | "watch" | "healthy" | "ungraded";

export const TIER_RANK: Record<CategoryTier, number> = {
  critical: 0,
  watch: 1,
  healthy: 2,
  ungraded: 3,
};

/** Percent change against a matched prior period, or null when there is
 *  nothing to compare with. Null is not 0% — an unknown is not a flat week. */
export const pctChange = (current: number, prior: number): number | null => {
  if (prior === 0) return null;
  return ((current - prior) / prior) * 100;
};

/**
 * The single number a category is graded on.
 *
 * Last year when it exists, last week otherwise — the same fallback as
 * `getGradeDelta` in Sub Dept Margins. A category with no LY would otherwise
 * render ungraded even though the row beside it grades fine against LW.
 *
 * Both sides come from the day-matched subtotals, so a short prior week
 * narrows the current side to match rather than flattering it.
 */
export const categoryDelta = (
  row: CategoryRow,
  metric: CategoryMetric,
): number | null => {
  if (row.hasLY) {
    const tw = metric === "qty" ? row.twQtyForLY : row.twNetForLY;
    const prior = metric === "qty" ? row.lyQty : row.lyNet;
    return pctChange(tw, prior);
  }
  if (row.hasLW) {
    const tw = metric === "qty" ? row.twQtyForLW : row.twNetForLW;
    const prior = metric === "qty" ? row.lwQty : row.lwNet;
    return pctChange(tw, prior);
  }
  return null;
};

/**
 * Grade against the threshold the user dialled in — same shape as
 * `getTier` in Sub Dept Margins: anything not down is healthy, a decline
 * past the threshold is critical, and the band between the two is watch.
 *
 * One deliberate divergence: a category with no comparison period at all comes
 * back **ungraded** rather than healthy. Sub Dept Margins returns healthy in
 * that case, which the LP info popover already flags as misleading — an
 * absence of comparison data is not a clean bill of health.
 */
export const getTier = (
  row: CategoryRow,
  threshold: number,
  metric: CategoryMetric,
): CategoryTier => {
  const delta = categoryDelta(row, metric);
  if (delta === null) return "ungraded";
  if (delta >= 0) return "healthy";
  if (delta < -threshold) return "critical";
  return "watch";
};

/** Critical first, then by size within a tier — a 30% fall on a large category
 *  matters more than the same percentage on a rounding error. */
export const sortGraded = <T extends CategoryRow & { tier: CategoryTier }>(
  rows: T[],
  metric: CategoryMetric,
): T[] =>
  [...rows].sort((a, b) => {
    const rank = TIER_RANK[a.tier] - TIER_RANK[b.tier];
    if (rank !== 0) return rank;
    const av = metric === "qty" ? a.twQty : a.twNet;
    const bv = metric === "qty" ? b.twQty : b.twNet;
    return bv - av;
  });
