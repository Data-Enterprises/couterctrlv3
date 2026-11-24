// Utils
import { formatCurrency2 } from "../../../../../utils";
import {
  bestDay,
  dayMargin,
  dayShare,
  formatSignedPct,
  vsSellingAverage,
  windowTotals,
} from "../utils";

// Interfaces
import type { DayBucket, MarginResult } from "../../interfaces";

// Components
import Tile from "./Tile";

interface HeadlineTilesProps {
  timeline: DayBucket[];
  /** The scoped day, or null for the whole window. */
  day: DayBucket | null;
  isSale: boolean;
  margin: MarginResult;
}

/** The figures under the headline: a scoped day's share, pace, margin and
 *  cost, or the window's per-day pace, margin and COGS (best day and shelf
 *  price when there is no cost). */
const HeadlineTiles = ({
  timeline,
  day,
  isSale,
  margin,
}: HeadlineTilesProps) => {
  const totals = windowTotals(timeline);
  const best = bestDay(timeline);
  const weighed = margin.weighed;
  const rate = weighed ? "/lb" : " ea";
  const share = day ? dayShare(day, totals.revenue) : null;
  const vsAvg = day ? vsSellingAverage(day, timeline) : null;
  const dayMarginPct = day ? dayMargin(day) : null;
  const windowMarginPct =
    totals.hasCost && totals.revenue > 0
      ? ((totals.revenue - totals.cost) / totals.revenue) * 100
      : null;

  return (
    <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line_hair pt-2">
      {day ? (
        <>
          <Tile
            label="Share of window"
            value={share === null ? "—" : `${share.toFixed(1)}%`}
          />
          <Tile
            label="vs typical day"
            value={vsAvg === null ? "—" : formatSignedPct(vsAvg)}
          />
          {isSale && dayMarginPct !== null && (
            <Tile label="Margin" value={`${dayMarginPct.toFixed(1)}%`} />
          )}
          {isSale && day.hasCost && day.units > 0 && (
            <Tile
              label="Cost"
              value={`${formatCurrency2(day.cost / day.units)}${rate}`}
            />
          )}
        </>
      ) : (
        <>
          <Tile
            label="Per selling day"
            value={
              totals.sellingDays > 0
                ? formatCurrency2(totals.revenue / totals.sellingDays)
                : "—"
            }
          />
          <Tile
            label={weighed ? "Lb per day" : "Units per day"}
            value={
              totals.sellingDays > 0
                ? (totals.units / totals.sellingDays).toLocaleString("en-US", {
                    minimumFractionDigits: weighed ? 2 : 0,
                    maximumFractionDigits: weighed ? 2 : 0,
                  })
                : "—"
            }
          />
          {isSale && windowMarginPct !== null ? (
            <>
              <Tile label="Margin" value={`${windowMarginPct.toFixed(1)}%`} />
              <Tile label="COGS" value={formatCurrency2(totals.cost)} />
            </>
          ) : (
            <>
              <Tile
                label="Best day"
                value={best ? best.label : "—"}
                sub={best ? formatCurrency2(best.revenue) : undefined}
              />
              <Tile
                label="Shelf price"
                value={`${formatCurrency2(margin.listPrice)}${rate}`}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default HeadlineTiles;
