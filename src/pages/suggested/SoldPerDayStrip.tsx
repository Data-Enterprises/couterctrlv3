import { useMemo } from "react";
import { fmtLb0, dayLabel } from ".";
import type { SuggestedDailyPoint } from "../../interfaces";

/**
 * What the department actually moved, day by day.
 *
 * The backward-looking half of the panel, and the reason it sits directly under
 * the forecast cards: those are an AVERAGE Friday, this is the Fridays that
 * happened. A production manager reads the gap between them — a run of bars
 * under the line where the weekday profile says the day should be heavy is a
 * department producing to a stale plan.
 *
 * Bars rather than a table, against this app's usual preference: 28 dates is
 * past the count where a reader compares numbers, and the only question asked
 * of it is shape — which days are heavy, which collapsed. Every bar still
 * carries its exact pounds on hover, and the strip states its own extremes so
 * the two figures anyone would actually quote are readable without pointing.
 *
 * The baseline is `daily_avg` — the mean of days that HAVE sales, which the
 * endpoint computes. The window mean would be diluted by days the department
 * was shut, and a closed Sunday would drag the line down and paint every
 * trading day as above average.
 */
interface SoldPerDayStripProps {
  daily: SuggestedDailyPoint[];
  dailyAvg: number;
}

/** Sat/Sun. The weekend build is the single biggest shape in perishable
 *  volume, and tinting it stops a reader mistaking the weekly sawtooth for
 *  something going wrong. */
const isWeekend = (iso: string) => {
  const d = new Date(`${iso}T12:00:00`).getDay();
  return d === 0 || d === 6;
};

const SoldPerDayStrip = ({ daily, dailyAvg }: SoldPerDayStripProps) => {
  const stats = useMemo(() => {
    if (daily.length === 0) return null;
    // Scale to the tallest bar, not to the average: the peak is the number a
    // manager is planning capacity against, and a fixed scale would flatten a
    // steady department into a straight line.
    const max = Math.max(...daily.map((d) => d.weight));
    const peak = daily.reduce((a, b) => (b.weight > a.weight ? b : a));
    const low = daily.reduce((a, b) => (b.weight < a.weight ? b : a));
    return { max, peak, low };
  }, [daily]);

  if (!stats || stats.max <= 0) return null;

  const { max, peak, low } = stats;
  // Where the average line sits as a percentage of the plot height. Only drawn
  // when there is an average to draw — a department with no trading days has no
  // normal day, and a line at zero would read as one.
  const avgPct = dailyAvg > 0 ? (dailyAvg / max) * 100 : null;

  return (
    <div className="flex-shrink-0 px-3 pt-2 pb-2.5 border-b border-gray-100 bg-gray-50">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[12px] font-semibold uppercase tracking-wide text-content/85">
          Sold per day
          <span className="ml-1.5 font-normal normal-case tracking-normal">
            {dayLabel(daily[0].date)} – {dayLabel(daily[daily.length - 1].date)}
          </span>
        </span>
        <span className="text-[12px] text-content/85 tabular-nums">
          peak {fmtLb0(peak.weight)} · low {fmtLb0(low.weight)} · avg{" "}
          <span className="font-semibold text-content">{fmtLb0(dailyAvg)}</span>{" "}
          lb
        </span>
      </div>

      <div className="relative flex items-end gap-[2px] h-11">
        {avgPct !== null && (
          <div
            className="absolute left-0 right-0 border-t border-dashed border-[#1e2a4a]/40 pointer-events-none"
            style={{ bottom: `${Math.min(avgPct, 100)}%` }}
          />
        )}
        {daily.map((d) => (
          <div
            key={d.date}
            title={`${dayLabel(d.date)} — ${fmtLb0(d.weight)} lb, ${d.items} item${
              d.items === 1 ? "" : "s"
            }`}
            className="flex-1 rounded-t-sm transition-colors hover:bg-[#1e2a4a]"
            style={{
              // A floor of 2px so a real but tiny day is still a mark. Zero
              // stays zero: a day the department sold nothing is a gap, and
              // drawing it as a sliver would hide a closure.
              height: d.weight > 0 ? `${Math.max((d.weight / max) * 100, 4)}%` : 0,
              background: isWeekend(d.date) ? "#1e2a4a" : "#1e2a4a99",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default SoldPerDayStrip;
