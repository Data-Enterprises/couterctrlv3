import { useMemo, useState } from "react";
import { fmtLb, dayLabel } from ".";
import BarTooltip from "./BarTooltip";
import type { SuggestedDailyPoint } from "../../interfaces";

/**
 * What the department actually moved, day by day.
 *
 * The backward-looking half of the panel, and the reason it sits under the
 * typical week: those are an AVERAGE Friday, this is the Fridays that happened.
 * A production manager reads the gap between them — a run of bars under the
 * line where the weekday profile says the day should be heavy is a department
 * producing to a stale plan.
 *
 * Bars rather than a table, against this app's usual preference: 28 dates is
 * past the count where a reader compares numbers, and the only question asked
 * of it is shape. Every bar carries its exact pounds on hover, and the strip
 * states its own extremes so the two figures anyone would quote are readable
 * without pointing.
 *
 * The baseline is `avg` — the mean of days that HAVE sales, which the endpoint
 * computes. The window mean would be diluted by days the department was shut,
 * and a closed Sunday would drag the line down and paint every trading day as
 * above average.
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
  const [hover, setHover] = useState<number | null>(null);

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
  const hovered = hover === null ? null : daily[hover];

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
          peak {fmtLb(peak.weight)} · low {fmtLb(low.weight)} · avg{" "}
          <span className="font-semibold text-content">{fmtLb(dailyAvg)}</span>{" "}
          lb
        </span>
      </div>

      <div
        className="relative flex items-end gap-[2px] h-11"
        onMouseLeave={() => setHover(null)}
      >
        {avgPct !== null && (
          <div
            className="absolute left-0 right-0 border-t border-dashed border-[#1e2a4a]/40 pointer-events-none"
            style={{ bottom: `${Math.min(avgPct, 100)}%` }}
          />
        )}
        {daily.map((d, i) => (
          <div
            key={d.date}
            onMouseEnter={() => setHover(i)}
            // The hit area is the full column height, not the bar: a 2%-tall
            // Tuesday is otherwise almost impossible to point at.
            className="flex-1 h-full flex items-end cursor-default"
          >
            <div
              className="w-full rounded-t-sm transition-colors"
              style={{
                // A floor of 4% so a real but tiny day is still a mark. Zero
                // stays zero: a day the department sold nothing is a gap, and
                // drawing it as a sliver would hide a closure.
                height: d.weight > 0 ? `${Math.max((d.weight / max) * 100, 4)}%` : 0,
                background:
                  hover === i
                    ? "#1e2a4a"
                    : isWeekend(d.date)
                      ? "#1e2a4a"
                      : "#1e2a4a99",
                opacity: hover !== null && hover !== i ? 0.55 : 1,
              }}
            />
          </div>
        ))}

        {hovered && (
          <BarTooltip
            xPct={((hover! + 0.5) / daily.length) * 100}
            title={dayLabel(hovered.date)}
            rows={[
              { label: "Sold", value: `${fmtLb(hovered.weight)} lb` },
              {
                label: "vs avg day",
                value:
                  dailyAvg > 0
                    ? `${hovered.weight >= dailyAvg ? "+" : ""}${(
                        (hovered.weight / dailyAvg - 1) *
                        100
                      ).toFixed(1)}%`
                    : "—",
                soft: true,
              },
              {
                label: "Items sold",
                value: hovered.items.toLocaleString(),
                soft: true,
              },
            ]}
          />
        )}
      </div>
    </div>
  );
};

export default SoldPerDayStrip;
