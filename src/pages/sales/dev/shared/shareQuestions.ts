import { SHARE_BAND_PCT, type ShareRow } from "./shareBalance";

/**
 * The questions the rail answers before handing over to the store report.
 *
 * The rail used to restate the row that was clicked. These are the things the
 * row cannot say — whether the move is new, when in the week it happened, and
 * who took the other side — each one short enough to read at a glance and
 * each one a door into the section of the report that goes further.
 *
 * Decisions only. The sentences are assembled where they are drawn, because
 * they carry money formatted to the page's active metric.
 */

export type Direction = "down" | "up" | "level";

export interface ShareTrend {
  /** Where its share sat in each period, as a percentage. Null means the
   *  period is not on file — which is an answer, not a zero. */
  lyPct: number | null;
  lwPct: number | null;
  tyPct: number;
  /** This week against LAST WEEK, which is what "new" means: a store three
   *  weeks into a slide is not having a bad week, it is having a bad month,
   *  and the two want different conversations. */
  vsLw: Direction | null;
  /** Whether last week was already off its usual slice. A store that was
   *  light last week as well has been light for a fortnight. */
  lwOffUsual: Direction | null;
  /** True when the slide did not start this week. */
  running: boolean;
}

export const directionOf = (
  diff: number | null,
  band: number = SHARE_BAND_PCT,
): Direction | null =>
  diff === null ? null : diff < -band ? "down" : diff > band ? "up" : "level";

export const shareTrendOf = (
  row: ShareRow,
  band: number = SHARE_BAND_PCT,
): ShareTrend => {
  const vsLw = directionOf(
    row.shareLwPct === null ? null : row.sharePct - row.shareLwPct,
    band,
  );
  const lwOffUsual = directionOf(
    row.shareLwPct === null ? null : row.shareLwPct - row.usualPct,
    band,
  );
  return {
    lyPct: row.shareLyPct,
    lwPct: row.shareLwPct,
    tyPct: row.sharePct,
    vsLw,
    lwOffUsual,
    // Only a store moving the same way it was already moving is on a run.
    // One that was light last week and heavy this week has not been sliding,
    // it has been swinging.
    running:
      lwOffUsual !== null &&
      lwOffUsual !== "level" &&
      directionOf(row.changePct, band) === lwOffUsual,
  };
};

/**
 * The three readings the sparkline draws, oldest first, with the ones that
 * are missing left out rather than plotted at nought.
 */
export const trendPoints = (
  trend: ShareTrend,
): { label: "LY" | "LW" | "TY"; pct: number }[] =>
  [
    { label: "LY" as const, pct: trend.lyPct },
    { label: "LW" as const, pct: trend.lwPct },
    { label: "TY" as const, pct: trend.tyPct },
  ].filter(
    (p): p is { label: "LY" | "LW" | "TY"; pct: number } => p.pct !== null,
  );
