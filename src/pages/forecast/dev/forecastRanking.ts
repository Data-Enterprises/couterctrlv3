import type { ForecastOutlierRow } from "../../../features/forecastSlice";
import type { PriceHistoryResult } from "../../../interfaces";

/**
 * Ranking for the forecast grid.
 *
 * A forecast list is heavily skewed — on a real 13-item ad, two items were 75%
 * of it and the bottom six were under 4%. Showing every row with equal weight
 * hides that, and at a few hundred UPCs it's unreadable. So rows are ranked by
 * what they contribute and cut into A/B/C tiers on cumulative share, which is
 * the standard ABC split merchandisers already use for exactly this problem.
 *
 * Nothing here grades an item. A C-tier row isn't bad — it's small. The only
 * judgement this module makes is in `exceptionsFor`, and those are all
 * statements about the *forecast's* reliability or cost, not about the item.
 */

export type Tier = "A" | "B" | "C";

/** Cumulative-share cut points. A is the ad, B supports it, C is the tail. */
const A_CUT = 0.8;
const B_CUT = 0.95;

export interface RankEntry {
  /** 1-based position by contribution. The ranking, stated outright. */
  rank: number;
  /** Share of the selection's forecast total, 0–1. */
  share: number;
  /** Running total through this row once sorted by contribution, 0–1. */
  cumulative: number;
  tier: Tier;
  /** Share of the selection's markdown, 0–1. */
  markdownShare: number;
}

/**
 * Rank rows by forecast total, descending.
 *
 * Returns a lookup rather than a sorted array so callers keep control of their
 * own ordering — the grid still has a user-driven sort on every column.
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
    // A zero total makes every share 0 — which is right. It also stops the
    // cumulative from ever advancing, so every row lands in A. That's the
    // honest answer when there's nothing to apportion.
    const share = total > 0 ? row.fcstTotal / total : 0;

    // The tier is decided by the cumulative BEFORE this row is added, so the
    // item that carries the running total past 80% is itself an A. Deciding it
    // afterwards would drop an 11%-of-the-ad item into B for the crime of
    // being the one that crossed the line.
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

/** What each band means, in the buyer's terms rather than the model's. The
 *  A/B/C letters stay on the band chip so the ABC framing is still legible to
 *  anyone who thinks in it, but nothing is labelled by letter alone. */
export const TIER_LABEL: Record<Tier, string> = {
  A: "Driving",
  B: "Supporting",
  C: "Tail",
};

/** Left-edge stripe. A navy ramp — this is weight, not a verdict, so it stays
 *  out of the red/amber/green register the graded pages own. */
export const TIER_STRIPE: Record<Tier, string> = {
  A: "border-l-[#1e2a4a]",
  B: "border-l-[#8a93a8]",
  C: "border-l-[#dfe2e9]",
};

/**
 * Filter-chip treatment, borrowed from the Performance pages' severity chips:
 * a tinted fill always, a ring on the active one. Same shape and behaviour,
 * navy ramp instead of the severity palette — these are weights, not verdicts.
 */
export const TIER_CHIP_BASE: Record<Tier, string> = {
  A: "bg-[#1e2a4a]/10 text-[#1e2a4a]",
  B: "bg-[#8a93a8]/25 text-content",
  C: "bg-[#dfe2e9] text-content",
};

export const TIER_CHIP_ON: Record<Tier, string> = {
  A: "ring-2 ring-[#1e2a4a]/40 shadow-sm",
  B: "ring-2 ring-[#8a93a8]/60 shadow-sm",
  C: "ring-2 ring-[#8a93a8]/45 shadow-sm",
};

/** On the navy band bar, where a light chip would disappear. */
export const TIER_CHIP_ON_NAVY: Record<Tier, string> = {
  A: "bg-custom-white text-[#1e2a4a]",
  B: "bg-custom-white text-[#1e2a4a]",
  C: "bg-custom-white text-[#1e2a4a]",
};

export const tierCounts = (ranks: Map<string, RankEntry>) => {
  const counts: Record<Tier, number> = { A: 0, B: 0, C: 0 };
  for (const entry of ranks.values()) counts[entry.tier] += 1;
  return counts;
};

export type ExceptionKind = "thin" | "untested" | "costly" | "record";

export interface Exception {
  kind: ExceptionKind;
  /** Shown on hover — says what was measured, not what to do about it. */
  detail: string;
}

/**
 * How much the markdown share has to exceed the revenue share before the row is
 * worth pointing at. 1.5x is deliberately loose: on a real ad plenty of items
 * run slightly markdown-heavy, and a flag that fires on a third of the list
 * stops being a flag.
 */
const COSTLY_RATIO = 1.5;

/** Two price points is the least a demand curve can be fitted through. */
const THIN_POINTS = 2;

/**
 * Reasons this particular row's forecast deserves a second look.
 *
 * Deliberately scoped to A and B tiers for the reliability flags: a shaky
 * forecast on an item worth 0.1% of the ad is not worth anyone's attention,
 * and flagging it buries the ones that are.
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
