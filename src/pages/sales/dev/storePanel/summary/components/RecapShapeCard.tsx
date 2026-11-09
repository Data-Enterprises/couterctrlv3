// Hooks
import { useCursorTip } from "../../../../../../components-dev/tooltip/useCursorTip";

// Utils
import { niceTicks } from "../utils/recapAxis";
import { perTradingHour } from "../utils/recapDays";
import {
  count,
  hourRange,
  hourSpan,
  hourTick,
  money,
  money0,
  one,
} from "../utils/recapFormat";
import { DAY_CARD } from "../utils/recapGrid";
import { fact } from "../utils/facts";
import { HEADROOM_PX } from "../utils";

// Interfaces
import type { RecapDay } from "../interfaces/index";

// Components
import RecapHourTip from "./RecapHourTip";

/**
 * Net sales by hour, across the whole second row (boards 15 and 16).
 *
 * For the week each hour is that hour summed across the seven days: hourly
 * still, never by day, which the day cards above already give.
 *
 * The hour facts sit in a column on the left, behind a navy divider:
 * busiest, slowest (full hour), sales per hour, baskets per hour (an hour is
 * one the store traded, a day's first sale's hour to its last, the week's
 * days added up).
 * The chart sits on the right, against round dollar gridlines, its bars light
 * and the busiest in navy with its figure above it. A measure, not a grade.
 * Hovering an hour shows its figures in a tip that follows the mouse. On a
 * narrow panel the facts run across the top instead.
 *
 * No fixed height of its own: it fills its grid row and keeps a floor, so it
 * is never squeezed below its contents.
 */
const RecapShapeCard = ({
  day,
  period,
  narrow,
  short,
}: {
  day: RecapDay;
  /** Says which period, for the chart's spoken label: "on Thu Oct 30",
   *  "across the week". */
  period: string;
  narrow: boolean;
  short: boolean;
}) => {
  const shape = day.hours;
  const top = shape.peak?.net ?? 0;
  const ticks = niceTicks(top);
  const axisTop = ticks[ticks.length - 1] || 1;
  const dayNet = shape.hours.reduce((t, h) => t + h.net, 0);
  const salesPerHour = perTradingHour(day.net, day);
  const basketsPerHour = day.transactions > 0 ? perTradingHour(day.transactions, day) : null;
  const { tip, track, clear } = useCursorTip<number>();
  const tipHour = tip ? shape.hours.find((h) => h.hour === tip.key) : undefined;
  const at = (v: number) => `calc((100% - ${HEADROOM_PX}px) * ${v / axisTop})`;

  const facts = [
    fact(
      "Busiest",
      shape.peak ? hourSpan(shape.peak.hour) : "—",
      shape.peak ? money0(shape.peak.net) : "",
      true,
    ),
    fact(
      "Slowest",
      shape.slowest ? hourSpan(shape.slowest.hour) : "—",
      shape.slowest ? money0(shape.slowest.net) : "",
      false,
    ),
    fact("Sales per hour", salesPerHour === null ? "—" : money(salesPerHour), "", false),
    fact(
      "Baskets per hour",
      basketsPerHour === null ? "—" : one(basketsPerHour),
      day.transactions > 0 ? `${count(day.transactions)} total` : "",
      false,
    ),
  ];

  return (
    <section
      aria-label="Hourly"
      className={`${DAY_CARD} h-full min-w-0 flex ${narrow ? "flex-col" : "flex-row"} overflow-visible`}
    >
      <aside
        className={
          narrow
            ? "flex-none mx-3.5 pt-3 pb-2 border-b-2 border-brand_navy/85"
            : `flex-none w-[250px] my-3.5 px-[18px] border-r-2 border-brand_navy/85 flex flex-col`
        }
      >
        <h4 className="mb-0.5 text-[14px] font-semibold text-content">Hourly</h4>
        <div
          className={
            narrow
              ? "grid grid-cols-2 gap-x-5"
              : `flex-1 flex flex-col ${short ? "justify-start" : "justify-between"}`
          }
        >
          {facts}
        </div>
      </aside>

      <div className={`flex-1 min-w-0 flex flex-col pl-2.5 pr-[18px] ${short ? "py-2.5" : "pt-3.5 pb-3"}`}>
        {shape.hours.length === 0 ? (
          <div className="pl-2 text-[13px] text-content">No hourly sales {period}.</div>
        ) : (
          <>
            <div
              role="img"
              aria-label={`Net sales by hour ${period}${
                shape.peak ? `, busiest ${hourRange(shape.peak.hour)}` : ""
              }`}
              className={`flex-1 ${short ? "min-h-[110px]" : "min-h-[140px]"} grid grid-cols-[48px_minmax(0,1fr)]`}
            >
              <div className="relative" aria-hidden="true">
                {ticks.map((t) => (
                  <span
                    key={t}
                    className="absolute right-2.5 text-[12px] text-content tabular-nums leading-none"
                    style={{ bottom: `calc(${at(t)} - 6px)` }}
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
                    className="absolute inset-x-0 border-t border-gray-100"
                    style={{ bottom: at(t) }}
                  />
                ))}
                <div
                  className="absolute inset-x-0 bottom-0 flex items-end gap-[7px]"
                  style={{ top: HEADROOM_PX }}
                  onMouseLeave={clear}
                >
                  {shape.hours.map((h) => {
                    const isPeak = h.hour === shape.peak?.hour;
                    const height = `${Math.max(0.5, (Math.max(0, h.net) / axisTop) * 100)}%`;
                    return (
                      <span
                        key={h.hour}
                        data-hour={h.hour}
                        onMouseMove={track(h.hour)}
                        className="relative flex-1 min-w-0 h-full flex items-end cursor-default"
                      >
                        {isPeak && (
                          <span
                            className="absolute left-1/2 -translate-x-1/2 text-[13px] font-bold text-content whitespace-nowrap tabular-nums"
                            style={{ bottom: `calc(${height} + 5px)` }}
                          >
                            {money0(h.net)}
                          </span>
                        )}
                        <span
                          className={`w-full rounded-t-[4px] transition-colors ${
                            isPeak
                              ? "bg-brand_navy"
                              : tip?.key === h.hour
                                ? "bg-brand_navy/50"
                                : "bg-brand_navy/30"
                          }`}
                          style={{ height }}
                        />
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-[48px_minmax(0,1fr)] flex-shrink-0">
              <span />
              <div className="flex gap-[7px] pt-1.5 border-t border-content">
                {shape.hours.map((h, i) => (
                  <span
                    key={h.hour}
                    className="flex-1 min-w-0 text-center text-[12px] text-content whitespace-nowrap"
                  >
                    {i % 2 === 0 ? hourTick(h.hour) : ""}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      {tip && tipHour && <RecapHourTip hour={tipHour} dayNet={dayNet} x={tip.x} y={tip.y} />}
    </section>
  );
};

export default RecapShapeCard;
