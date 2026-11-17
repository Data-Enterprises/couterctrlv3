// Utils
import { formatCurrency2 } from "../../../../../utils";
import { formatUnits } from "../../utils";
import { dayLabel, windowTotals } from "../utils";

// Interfaces
import type { DayBucket, MarginResult, TrendResult } from "../../interfaces";

// Components
import ItemDayChart from "./ItemDayChart";
import HeadlineTiles from "./HeadlineTiles";

interface HeadlineCardProps {
  timeline: DayBucket[];
  selectedDay: string | null;
  day: DayBucket | null;
  onPickDay: (iso: string) => void;
  isSale: boolean;
  margin: MarginResult;
  trend: TrendResult;
  /** Days since the item last sold, counted from the sales timeline. */
  activeGapDays: number;
}

/** The window and the figure it comes to: the day chart, the headline dollars
 *  and units for the window or the scoped day, its tiles, and the notices. */
const HeadlineCard = ({
  timeline,
  selectedDay,
  day,
  onPickDay,
  isSale,
  margin,
  trend,
  activeGapDays,
}: HeadlineCardProps) => {
  const totals = windowTotals(timeline);
  const weighed = margin.weighed;
  const rate = weighed ? "/lb" : " ea";
  const isNegative = margin.marginPct !== null && margin.marginPct < 0;

  return (
    <section data-testid="lookup-headline" className="cc-card-phone">
      {isNegative && (
        <p className="border-b border-line_hair bg-fill_muted px-3.5 py-2 text-[11.5px] font-semibold text-content">
          Selling below cost
        </p>
      )}

      <div className="px-2.5 pb-1 pt-2.5">
        <ItemDayChart
          buckets={timeline}
          selected={selectedDay}
          onToggle={onPickDay}
        />
        <p className="px-1.5 pt-1 text-[12px] text-content/95">
          {selectedDay
            ? "Tap the selected day again for the whole window."
            : "Tap a day to scope this item to it."}
        </p>
      </div>

      <div className="px-3.5 pb-3 pt-1.5">
        <div className="text-[9.5px] font-semibold uppercase tracking-wider text-content/95">
          {day
            ? dayLabel(day.date)
            : `Sold · ${totals.sellingDays} of ${totals.windowDays} days`}
        </div>
        <div className="mt-0.5 font-display text-[31px] font-extrabold leading-none tracking-tight text-content">
          {formatCurrency2(day ? day.revenue : totals.revenue)}
        </div>
        <div className="mt-1 text-[12px] text-content/95">
          <span className="font-semibold text-content">
            {formatUnits(day ? day.units : totals.units, weighed)}
          </span>
          {(day ? day.units : totals.units) > 0 && (
            <>
              {day ? " at " : " at an average of "}
              {formatCurrency2(
                (day ? day.revenue : totals.revenue) /
                  (day ? day.units : totals.units),
              )}
              {rate}
            </>
          )}
        </div>

        <HeadlineTiles
          timeline={timeline}
          day={day}
          isSale={isSale}
          margin={margin}
        />
      </div>

      {/* Said once, in a sentence — not in two columns, thirteen times. */}
      {isSale && margin.costMissing && (
        <p className="border-t border-line_hair bg-bkg px-3.5 py-2 text-[11.5px] text-content/95">
          No cost on file for this item, so COGS and margin are unavailable.
        </p>
      )}

      {/* Window-level readings, hidden while a day is scoped (they
          describe the fortnight, not the day). */}
      {!day && isSale && trend.isSlowing && (
        <p className="border-t border-severity_watch_text/20 bg-severity_watch_bg px-3.5 py-2 text-[11.5px] font-semibold text-severity_watch_text">
          Slowing down — {formatUnits(trend.firstHalfUnits, weighed)} the first
          week, {formatUnits(trend.secondHalfUnits, weighed)} this week.
        </p>
      )}
      {!day && isSale && activeGapDays >= 2 && (
        <p className="border-t border-severity_watch_text/20 bg-severity_watch_bg px-3.5 py-2 text-[11.5px] font-semibold text-severity_watch_text">
          No sales in the last {activeGapDays} days.
        </p>
      )}
    </section>
  );
};

export default HeadlineCard;
