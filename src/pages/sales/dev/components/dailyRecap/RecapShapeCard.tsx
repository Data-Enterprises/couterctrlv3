import RecapCard from "./RecapCard";
import { dayLabel, hourLabel, hourRange, money0 } from "./recapFormat";
import type { RecapDayHours } from "./recapTypes";

/**
 * The day's shape: net sales by hour, with the facts a reader looks for.
 *
 * Every bar is navy; the busiest is full strength and carries its figure, the
 * rest at 60%. That marks the peak, it does not grade the others. The hour
 * ticks are every third hour, written the way Hourly writes them.
 */
const RecapShapeCard = ({ date, shape }: { date: string; shape: RecapDayHours }) => {
  const top = shape.peak?.net ?? 0;
  if (!shape.hours.length) {
    return (
      <RecapCard title="The day's shape · net sales by hour">
        <div className="mt-2 text-[12px] text-content">No hourly sales for this day.</div>
      </RecapCard>
    );
  }
  return (
    <RecapCard title="The day's shape · net sales by hour" className="grid grid-cols-[minmax(0,1fr)_220px] gap-5">
      <div className="col-start-1 row-start-2 min-w-0">
        <div
          role="img"
          aria-label={`Net sales by hour on ${dayLabel(date)}${
            shape.peak ? `, busiest ${hourRange(shape.peak.hour)}` : ""
          }`}
          className="flex items-end gap-1 h-[110px] mt-4"
        >
          {shape.hours.map((h) => {
            const isPeak = h.hour === shape.peak?.hour;
            const height = top > 0 ? Math.max(3, (Math.max(0, h.net) / top) * 100) : 3;
            return (
              <span key={h.hour} className="relative flex-1 h-full flex flex-col justify-end items-center">
                {isPeak && (
                  <span
                    className="absolute text-[11px] font-bold text-content whitespace-nowrap tabular-nums"
                    style={{ bottom: `calc(${height}% + 4px)` }}
                  >
                    {money0(h.net)}
                  </span>
                )}
                <span
                  className={`w-full rounded-t-[3px] ${isPeak ? "bg-brand_navy" : "bg-brand_navy/60"}`}
                  style={{ height: `${height}%` }}
                />
              </span>
            );
          })}
        </div>
        <div className="flex gap-1 mt-1 pt-1 border-t border-brand_line_2">
          {shape.hours.map((h, i) => (
            <span key={h.hour} className="flex-1 text-center text-[10px] font-semibold text-content whitespace-nowrap">
              {i % 3 === 0 ? hourLabel(h.hour) : ""}
            </span>
          ))}
        </div>
      </div>
      <div className="col-start-2 row-start-1 row-span-2 flex flex-col justify-center gap-3 border-l border-gray-200 pl-5">
        <div>
          <div className="text-[12px] text-content">Busiest</div>
          <div className="text-[18px] font-bold text-content">
            {shape.peak ? hourRange(shape.peak.hour) : "—"}
          </div>
          {shape.peak && (
            <div className="text-[12px] text-content tabular-nums">
              {money0(shape.peak.net)} in net sales
            </div>
          )}
        </div>
        <div>
          <div className="text-[12px] text-content">Slowest full hour</div>
          <div className="text-[16px] font-bold text-content">
            {shape.slowest ? hourRange(shape.slowest.hour) : "—"}
          </div>
          {shape.slowest && (
            <div className="text-[12px] text-content tabular-nums">{money0(shape.slowest.net)}</div>
          )}
        </div>
        <div>
          <div className="text-[12px] text-content">Trading</div>
          <div className="text-[16px] font-bold text-content">
            {shape.first !== null && shape.last !== null
              ? `${hourLabel(shape.first)} – ${hourLabel(shape.last + 1)}`
              : "—"}
          </div>
        </div>
      </div>
    </RecapCard>
  );
};

export default RecapShapeCard;
