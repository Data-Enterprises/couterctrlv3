import { ChartBarIcon } from "@heroicons/react/24/outline";
import RecapCard from "./RecapCard";
import RecapHourTip from "./RecapHourTip";
import { niceTicks } from "./recapAxis";
import { count, dayLabel, hourLabel, hourRange, money0 } from "./recapFormat";
import type { RecapDayHours } from "./recapTypes";
import { useCursorTip } from "./useCursorTip";

/** One fact on the rail: a small capital label, the value, a line under it. */
const fact = (label: string, value: string, sub: string | null, big: boolean, rule: boolean) => (
  <div key={label} className={`min-w-0 flex-1 px-[18px] py-3 ${rule ? "border-b border-brand_line" : ""}`}>
    <div className="text-[11px] font-bold uppercase tracking-wide text-content">{label}</div>
    <div className={`mt-0.5 ${big ? "text-[20px]" : "text-[17px]"} font-bold text-content whitespace-nowrap`}>
      {value}
    </div>
    {sub && <div className="text-[12.5px] text-content tabular-nums">{sub}</div>}
  </div>
);

/**
 * The day's shape: net sales by hour, filling the height the view gives it.
 *
 * Dollar gridlines at round figures (niceTicks) and a solid baseline give the
 * bars something to be read against. Every bar is navy; the busiest is full
 * strength and carries its figure, the rest at 60%. That marks the peak, it
 * does not grade the others. Hovering an hour shows its figures in a tip that
 * follows the mouse.
 *
 * Its facts sit on their own tinted rail: beside the chart on a wide panel,
 * under it on a narrow one. The chart grows into the spare height and shrinks
 * to a floor; below that the view scrolls rather than clipping it.
 */
const RecapShapeCard = ({
  date,
  shape,
  narrow,
  short,
}: {
  date: string;
  shape: RecapDayHours;
  narrow: boolean;
  short: boolean;
}) => {
  const top = shape.peak?.net ?? 0;
  const ticks = niceTicks(top);
  const axisTop = ticks[ticks.length - 1] || 1;
  const dayNet = shape.hours.reduce((t, h) => t + h.net, 0);
  const { tip, track, clear } = useCursorTip<number>();
  const tipHour = tip ? shape.hours.find((h) => h.hour === tip.key) : undefined;
  const trading =
    shape.first !== null && shape.last !== null ? shape.last - shape.first + 1 : null;

  const facts = [
    fact(
      "Busiest",
      shape.peak ? hourRange(shape.peak.hour) : "—",
      shape.peak ? `${money0(shape.peak.net)} in net sales` : null,
      true,
      !narrow,
    ),
    fact(
      "Slowest full hour",
      shape.slowest ? hourRange(shape.slowest.hour) : "—",
      shape.slowest ? money0(shape.slowest.net) : null,
      false,
      !narrow,
    ),
    fact(
      "Trading",
      shape.first !== null && shape.last !== null
        ? `${hourLabel(shape.first)} – ${hourLabel(shape.last + 1)}`
        : "—",
      trading === null ? null : `${count(trading)} ${trading === 1 ? "hour" : "hours"}`,
      false,
      false,
    ),
  ];

  return (
    <RecapCard
      title="The day's shape · net sales by hour"
      icon={ChartBarIcon}
      compact={short}
      className={`flex-1 ${narrow ? (short ? "min-h-[260px]" : "min-h-[300px]") : short ? "min-h-[200px]" : "min-h-[240px]"}`}
      bodyClassName={`grid h-full ${
        narrow ? "grid-cols-1 grid-rows-[minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,1fr)_240px]"
      }`}
    >
      <div className={`flex flex-col min-w-0 min-h-0 pl-2 pr-4 ${short ? "pt-2.5 pb-2" : "pt-3.5 pb-2.5"}`}>
        {shape.hours.length === 0 ? (
          <div className="px-2 text-[12px] text-content">No hourly sales for this day.</div>
        ) : (
          <>
            <div
              role="img"
              aria-label={`Net sales by hour on ${dayLabel(date)}${
                shape.peak ? `, busiest ${hourRange(shape.peak.hour)}` : ""
              }`}
              className={`flex-1 ${short ? "min-h-[90px]" : "min-h-[110px]"} grid grid-cols-[52px_minmax(0,1fr)]`}
            >
              <div className="relative" aria-hidden="true">
                {ticks.map((t) => (
                  <span
                    key={t}
                    className="absolute right-2 text-[11px] font-medium text-content tabular-nums leading-none"
                    style={{ bottom: `calc(${(t / axisTop) * 100}% - 5px)` }}
                  >
                    {money0(t)}
                  </span>
                ))}
              </div>
              <div className="relative min-w-0">
                {ticks.slice(1).map((t) => (
                  <span
                    key={t}
                    aria-hidden="true"
                    className="absolute inset-x-0 border-t border-dashed border-brand_line_2"
                    style={{ bottom: `${(t / axisTop) * 100}%` }}
                  />
                ))}
                <div className="absolute inset-0 flex items-end gap-1.5 px-0.5" onMouseLeave={clear}>
                  {shape.hours.map((h) => {
                    const isPeak = h.hour === shape.peak?.hour;
                    const height = Math.max(1, (Math.max(0, h.net) / axisTop) * 100);
                    return (
                      <span
                        key={h.hour}
                        data-hour={h.hour}
                        onMouseMove={track(h.hour)}
                        className="relative flex-1 min-w-0 h-full flex items-end cursor-default"
                      >
                        {isPeak && (
                          <span
                            className="absolute left-1/2 -translate-x-1/2 text-[12.5px] font-bold text-content whitespace-nowrap tabular-nums"
                            style={{ bottom: `calc(${height}% + 4px)` }}
                          >
                            {money0(h.net)}
                          </span>
                        )}
                        <span
                          className={`w-full rounded-t-[4px] transition-colors ${
                            isPeak
                              ? "bg-brand_navy"
                              : tip?.key === h.hour
                                ? "bg-brand_navy/80"
                                : "bg-brand_navy/50"
                          }`}
                          style={{ height: `${height}%` }}
                        />
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-[52px_minmax(0,1fr)] flex-shrink-0">
              <span />
              <div className="flex gap-1.5 px-0.5 pt-1.5 border-t-[1.5px] border-content">
                {shape.hours.map((h, i) => (
                  <span
                    key={h.hour}
                    className="flex-1 min-w-0 text-center text-[11.5px] font-medium text-content whitespace-nowrap"
                  >
                    {i % 3 === 0 ? hourLabel(h.hour) : ""}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      <div
        className={`bg-bkg/40 flex ${
          narrow
            ? "flex-row flex-wrap border-t border-brand_line"
            : "flex-col border-l border-brand_line"
        }`}
      >
        {facts}
      </div>
      {tip && tipHour && <RecapHourTip hour={tipHour} dayNet={dayNet} x={tip.x} y={tip.y} />}
    </RecapCard>
  );
};

export default RecapShapeCard;
