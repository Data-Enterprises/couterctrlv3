// Utils
import { formatCurrency2 } from "../../../../../utils";
import { dayUnitCost, formatUnits } from "../../utils";
import { dayLabel, dayMargin } from "../utils";

// Interfaces
import type { DayBucket } from "../../interfaces";

// Components
import { TY_COLOR } from "../../../../../components-dev/mobile/perf/perfColors";

interface LookupDayRowsProps {
  buckets: DayBucket[];
  /** Scale item: the unit is pounds, and the rate is per pound. */
  weighed: boolean;
  /** The scoped day, highlighted here as well as in the chart — the list stays
   *  on screen while a day is picked, so it has to say which row that is. */
  selected: string | null;
  /** "Sale", or the line type this timeline belongs to. Cost and margin only
   *  mean something for Sale. */
  isSale: boolean;
}

/**
 * The window's days, newest first, two lines each, the same row as
 * `PerfDrillList`. Read-only: the chart is the one filter, and a row highlights
 * when the chart scopes its day.
 */
const LookupDayRows = ({ buckets, weighed, selected, isSale }: LookupDayRowsProps) => {
  const max = buckets.reduce((m, b) => Math.max(m, b.revenue), 0) || 1;
  const rate = weighed ? "/lb" : " ea";

  return (
    <div>
      {[...buckets].reverse().map((b, i) => {
        const isSel = selected === b.date;
        const unitCost = dayUnitCost(b);
        const margin = dayMargin(b);

        if (!b.hasSale) {
          return (
            <div
              key={b.date}
              className={`border-t border-gray-100 px-3.5 py-2.5 ${
                i === 0 ? "border-t-0" : ""
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-display text-[13px] font-medium text-content/95">
                  {dayLabel(b.date)}
                </span>
                <span className="text-[12px] text-content/95">no sales</span>
              </div>
            </div>
          );
        }

        return (
          <div
            key={b.date}
            className={`border-t border-gray-100 px-3.5 py-2.5 first:border-t-0 ${
              isSel ? "bg-row_selected" : "odd:bg-row_stripe"
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="min-w-0 flex-1 truncate font-display text-[13px] font-semibold text-content">
                {dayLabel(b.date)}
              </span>
              <span className="flex-none text-[13px] font-bold text-content">
                {formatCurrency2(b.revenue)}
              </span>
            </div>

            <div className="mt-0.5 flex items-baseline gap-3 text-[11px] text-content/95">
              <span className="font-semibold text-content">
                {formatUnits(b.units, weighed)}
              </span>
              {/* The price it actually went out at that day (moves with
                  promotions). */}
              {b.units > 0 && (
                <span>
                  {formatCurrency2(b.revenue / b.units)}
                  {rate}
                </span>
              )}
              {isSale && unitCost !== null && (
                <span>
                  cost {formatCurrency2(unitCost)}
                  {rate}
                </span>
              )}
              {isSale && margin !== null && (
                <span className="font-semibold text-content">
                  {margin.toFixed(1)}%
                </span>
              )}
            </div>

            {/* The day against the biggest day in the window. The chart above
                says the same thing, but the list outlives a scroll past it. */}
            <span
              className="mt-1.5 block h-[3px] rounded-sm"
              style={{
                width: `${Math.max((b.revenue / max) * 100, 2)}%`,
                background: TY_COLOR,
                opacity: 0.85,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default LookupDayRows;
