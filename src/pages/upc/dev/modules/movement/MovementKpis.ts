// Utils
import {
  fmtMovement,
  fmtRate,
  latestVsPrior,
  perStorePerWeek,
  shortDate,
  type MovementGrid,
} from "./movementStats";

// Interfaces
import type { KpiCell } from "../../interfaces";

/**
 * The strip above Movement, for the item the grid is showing.
 *
 * One item rather than every ticked UPC: a rate per store per week means
 * nothing across a mix of items, least of all when one is counted in pounds
 * and another in units. The two totals the strip used to carry repeated the
 * grid's bottom row; these two say what the grid leaves you to work out:
 * how fast the item sells where it is carried, and which way it is heading.
 */
export function getMovementKpis(grid: MovementGrid, weeks: number, weekEnding: string): KpiCell[] {
  const unit = grid.weighed ? "lbs" : "units";
  const rate = perStorePerWeek(grid);
  const trend = latestVsPrior(grid);

  const trendCell: KpiCell = (() => {
    if (!trend) return { label: "Last week vs average", value: "—", sub: "needs 2 weeks or more" };
    const pair = `${fmtMovement(trend.latest, grid.weighed)} vs ${fmtRate(trend.priorAvg, grid.weighed)} avg`;
    if (trend.pct === null) {
      return {
        label: "Last week vs average",
        value: trend.latest > 0 ? "New" : "—",
        sub: trend.latest > 0 ? "nothing in the weeks before" : "no movement",
      };
    }
    const sign = trend.pct > 0 ? "+" : trend.pct < 0 ? "−" : "";
    return {
      label: "Last week vs average",
      value: `${sign}${Math.abs(trend.pct).toFixed(1)}%`,
      sub: pair,
      variant: trend.pct > 0 ? "up" : trend.pct < 0 ? "down" : undefined,
    };
  })();

  return [
    {
      label: "Weeks",
      value: String(weeks),
      sub: weekEnding ? `ending ${shortDate(weekEnding)}` : undefined,
    },
    {
      label: "Stores moving it",
      value: `${rate?.stores ?? 0} of ${grid.rows.length}`,
    },
    {
      label: "Per store per week",
      value: rate ? fmtRate(rate.value, grid.weighed) : "—",
      sub: rate ? `${unit}, at the ${rate.stores} selling` : unit,
    },
    trendCell,
  ];
}
