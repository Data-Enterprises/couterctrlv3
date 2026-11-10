// Interfaces
import type { Exception, ExceptionKind, RankEntry, Tier } from "../interfaces";
import type { ForecastOutlierRow } from "../../../../features/dev/devForecastSlice";
import type { PriceHistoryResult } from "../../../../interfaces";

/**
 * Ranking for the forecast grid: rows ranked by what they contribute and cut
 * into A/B/C tiers on cumulative share (the merchandisers' ABC split). Nothing
 * grades an item; `exceptionsFor` only flags the forecast's reliability or cost.
 */

/** Cumulative-share cut points. A is the ad, B supports it, C is the tail. */
const A_CUT = 0.8;
const B_CUT = 0.95;

/**
 * Rank rows by forecast total, descending, as a lookup, so callers keep their
 * own sort.
 */
export const rankRows = (
  rows: ForecastOutlierRow[],
): Map<string, RankEntry> => {
  const total = rows.reduce((sum, r) => sum + r.fcstTotal, 0);
  const markdownTotal = rows.reduce(
    (sum, r) => sum + Math.max(0, r.markdownDollars),
    0,
  );

  const byContribution = [...rows].sort((a, b) => b.fcstTotal - a.fcstTotal);

  const out = new Map<string, RankEntry>();
  let running = 0;
  let position = 0;

  for (const row of byContribution) {
    position += 1;
    // A zero total makes every share 0 and every row an A: nothing to
    // apportion.
    const share = total > 0 ? row.fcstTotal / total : 0;

    // The tier is decided by the cumulative BEFORE this row, so the item that
    // crosses 80% is itself an A.
    const before = running;
    running += share;

    out.set(row.upc, {
      rank: position,
      share,
      cumulative: running,
      tier: before < A_CUT ? "A" : before < B_CUT ? "B" : "C",
      markdownShare:
        markdownTotal > 0
          ? Math.max(0, row.markdownDollars) / markdownTotal
          : 0,
    });
  }

  return out;
};

/** Per-tier count and combined share, for the band headers. */
export const tierSummary = (ranks: Map<string, RankEntry>) => {
  const out: Record<Tier, { count: number; share: number }> = {
    A: { count: 0, share: 0 },
    B: { count: 0, share: 0 },
    C: { count: 0, share: 0 },
  };
  for (const entry of ranks.values()) {
    out[entry.tier].count += 1;
    out[entry.tier].share += entry.share;
  }
  return out;
};

/** What each band means, in the buyer's terms; the letter stays on the chip. */
export const TIER_LABEL: Record<Tier, string> = {
  A: "Driving",
  B: "Supporting",
  C: "Tail",
};

/** Left-edge stripe. A navy ramp — this is weight, not a verdict, so it stays
 *  out of the red/amber/green register the graded pages own. */
export const TIER_STRIPE: Record<Tier, string> = {
  A: "border-l-brand_navy",
  B: "border-l-[#8a93a8]",
  C: "border-l-[#dfe2e9]",
};

/**
 * Filter-chip treatment, shaped like the severity chips but on a navy ramp:
 * these are weights, not verdicts.
 */
export const TIER_CHIP_BASE: Record<Tier, string> = {
  A: "bg-brand_navy/10 text-brand_navy",
  B: "bg-row_selected_border/25 text-content",
  C: "bg-bkg text-content",
};

export const TIER_CHIP_ON: Record<Tier, string> = {
  A: "ring-2 ring-brand_navy/40 shadow-sm",
  B: "ring-2 ring-row_selected_border/60 shadow-sm",
  C: "ring-2 ring-row_selected_border/45 shadow-sm",
};

/** On the navy band bar, where a light chip would disappear. */
export const TIER_CHIP_ON_NAVY: Record<Tier, string> = {
  A: "bg-custom-white text-brand_navy",
  B: "bg-custom-white text-brand_navy",
  C: "bg-custom-white text-brand_navy",
};

export const tierCounts = (ranks: Map<string, RankEntry>) => {
  const counts: Record<Tier, number> = { A: 0, B: 0, C: 0 };
  for (const entry of ranks.values()) counts[entry.tier] += 1;
  return counts;
};

/**
 * How far the markdown share must exceed the revenue share to flag a row:
 * 1.5×, loose on purpose, so the flag stays rare.
 */
const COSTLY_RATIO = 1.5;

/** Two price points is the least a demand curve can be fitted through. */
const THIN_POINTS = 2;

/**
 * Reasons a row's forecast deserves a second look. The reliability flags are
 * scoped to A and B tiers.
 */
export const exceptionsFor = (
  row: ForecastOutlierRow,
  rank: RankEntry | undefined,
  result: PriceHistoryResult | undefined,
  isCustomPriced: boolean,
): Exception[] => {
  if (!rank) return [];
  const found: Exception[] = [];
  const matters = rank.tier !== "C";
  const points = result?.price_history.length ?? 0;

  if (matters && (row.singlePrice || points <= THIN_POINTS)) {
    found.push({
      kind: "thin",
      detail: `Forecast is fitted through ${points} price point${
        points === 1 ? "" : "s"
      } — thin history for an item this size.`,
    });
  }

  if (matters && isCustomPriced) {
    found.push({
      kind: "untested",
      detail:
        "This price has never been run on this item, so the forecast is extrapolated rather than observed.",
    });
  }

  if (
    rank.markdownShare > 0 &&
    rank.share > 0 &&
    rank.markdownShare > rank.share * COSTLY_RATIO
  ) {
    found.push({
      kind: "costly",
      detail: `${(rank.markdownShare * 100).toFixed(0)}% of the ad's markdown against ${(
        rank.share * 100
      ).toFixed(0)}% of its revenue.`,
    });
  }

  // Not a cap — the buyer's own record is the reference. Beating it is often
  // the point of the ad; it just shouldn't arrive unannounced.
  const perDay = row.adDays > 0 ? row.adFcst / row.adDays : 0;
  if (result?.max_day_qty && perDay > result.max_day_qty) {
    found.push({
      kind: "record",
      detail: `Forecast runs at ${Math.round(perDay)} a day against a best-ever day of ${result.max_day_qty}.`,
    });
  }

  return found;
};

export const EXCEPTION_LABEL: Record<ExceptionKind, string> = {
  thin: "thin history",
  untested: "untested price",
  costly: "markdown heavy",
  record: "beats record",
};
