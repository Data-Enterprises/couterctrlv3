import RecapHourTip from "./RecapHourTip";
import { CARD, CARD_TITLE } from "./recapGrid";
import { dayLabel, hourLabel, hourRange, money0 } from "./recapFormat";
import type { RecapDayHours } from "./recapTypes";
import { useCursorTip } from "./useCursorTip";

/** One fact beside (or under) the chart. */
const fact = (label: string, value: string, sub: string | null, big = false) => (
  <div key={label} className="min-w-0">
    <div className="text-[12px] text-content">{label}</div>
    <div className={`${big ? "text-[18px]" : "text-[16px]"} font-bold text-content whitespace-nowrap`}>
      {value}
    </div>
    {sub && <div className="text-[12px] text-content tabular-nums">{sub}</div>}
  </div>
);

/**
 * The day's shape: net sales by hour, filling the height the view gives it.
 *
 * The chart grows into whatever height is spare and shrinks to a floor; below
 * that the view scrolls rather than clipping it. Its facts sit beside it on a
 * wide panel and in a row under it on a narrow one.
 *
 * Every bar is navy; the busiest is full strength and carries its figure, the
 * rest at 60%. That marks the peak, it does not grade the others. Hovering an
 * hour shows its figures in a tip that follows the mouse; the facts panel sits
 * on the theme's grey ground to set it apart from the chart.
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
  const dayNet = shape.hours.reduce((t, h) => t + h.net, 0);
  const { tip, track, clear } = useCursorTip<number>();
  const tipHour = tip ? shape.hours.find((h) => h.hour === tip.key) : undefined;
  const facts = [
    fact(
      "Busiest",
      shape.peak ? hourRange(shape.peak.hour) : "—",
      shape.peak ? `${money0(shape.peak.net)} in net sales` : null,
      true,
    ),
    fact(
      "Slowest full hour",
      shape.slowest ? hourRange(shape.slowest.hour) : "—",
      shape.slowest ? money0(shape.slowest.net) : null,
    ),
    fact(
      "Trading",
      shape.first !== null && shape.last !== null
        ? `${hourLabel(shape.first)} – ${hourLabel(shape.last + 1)}`
        : "—",
      null,
    ),
  ];

  return (
    <section
      aria-label="The day's shape"
      className={`${CARD} flex-1 px-4 ${short ? "py-2" : "py-3"} grid gap-5 ${
        narrow
          ? `grid-cols-1 grid-rows-[minmax(0,1fr)_auto] gap-y-3 ${short ? "min-h-[220px]" : "min-h-[260px]"}`
          : `grid-cols-[minmax(0,1fr)_220px] ${short ? "min-h-[180px]" : "min-h-[220px]"}`
      }`}
    >
      <div className="flex flex-col min-w-0 min-h-0">
        <div className={CARD_TITLE}>The day's shape · net sales by hour</div>
        {shape.hours.length === 0 ? (
          <div className="mt-2 text-[12px] text-content">No hourly sales for this day.</div>
        ) : (
          <>
            <div
              role="img"
              aria-label={`Net sales by hour on ${dayLabel(date)}${
                shape.peak ? `, busiest ${hourRange(shape.peak.hour)}` : ""
              }`}
              className={`flex-1 ${short ? "min-h-[90px] mt-3" : "min-h-[110px] mt-4"} flex items-end gap-1`}
              onMouseLeave={clear}
            >
              {shape.hours.map((h) => {
                const isPeak = h.hour === shape.peak?.hour;
                const height = top > 0 ? Math.max(3, (Math.max(0, h.net) / top) * 100) : 3;
                return (
                  <span
                    key={h.hour}
                    data-hour={h.hour}
                    onMouseMove={track(h.hour)}
                    className="relative flex-1 min-w-0 h-full flex flex-col justify-end items-center cursor-default"
                  >
                    {isPeak && (
                      <span
                        className="absolute text-[11px] font-bold text-content whitespace-nowrap tabular-nums"
                        style={{ bottom: `calc(${height}% + 4px)` }}
                      >
                        {money0(h.net)}
                      </span>
                    )}
                    <span
                      className={`w-full rounded-t-[3px] transition-colors ${
                        isPeak ? "bg-brand_navy" : tip?.key === h.hour ? "bg-brand_navy/80" : "bg-brand_navy/60"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </span>
                );
              })}
            </div>
            <div className="flex gap-1 mt-1 pt-1 border-t border-brand_line_2 flex-shrink-0">
              {shape.hours.map((h, i) => (
                <span
                  key={h.hour}
                  className="flex-1 min-w-0 text-center text-[10px] font-semibold text-content whitespace-nowrap"
                >
                  {i % 3 === 0 ? hourLabel(h.hour) : ""}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
      <div
        className={`rounded-lg bg-bkg/60 ${
          narrow
            ? "flex flex-wrap justify-between gap-x-6 gap-y-2 px-4 py-2.5"
            : "flex flex-col justify-center gap-3 px-5 py-3"
        }`}
      >
        {facts}
      </div>
      {tip && tipHour && (
        <RecapHourTip hour={tipHour} dayNet={dayNet} x={tip.x} y={tip.y} />
      )}
    </section>
  );
};

export default RecapShapeCard;
