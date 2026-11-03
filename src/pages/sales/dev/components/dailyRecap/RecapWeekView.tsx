import RecapDayHead from "./RecapDayHead";
import RecapDayRow from "./RecapDayRow";
import RecapWeekBand from "./RecapWeekBand";
import { CARD, ROW_MIN_PX } from "./recapGrid";
import type { DayMixState, RecapDay, RecapWeek } from "./recapTypes";

/**
 * The week: its four headline figures, then the days.
 *
 * The seven days share whatever height the list has, evenly: taller rows
 * when there is room, tighter ones when there is not, and only below
 * ROW_MIN_PX does the list scroll, inside its own card. A fixed row height
 * left dead space at one zoom and clipped Monday at another.
 */
const RecapWeekView = ({
  week,
  days,
  mixOf,
  withPounds,
  narrow,
  short,
}: {
  week: RecapWeek;
  days: RecapDay[];
  /** Each day's item rows, for its Items count. */
  mixOf: (date: string) => DayMixState;
  withPounds: boolean;
  narrow: boolean;
  short: boolean;
}) => (
  <div className="flex flex-col h-full min-h-0">
    <RecapWeekBand week={week} withPounds={withPounds} narrow={narrow} short={short} />
    <div className={`${CARD} flex-1 min-h-0 mx-3.5 mb-3.5 flex flex-col overflow-hidden`}>
      <div className="flex items-baseline gap-3 px-3.5 pt-2.5 pb-2 border-b border-gray-100 min-w-0 flex-shrink-0">
        <span className="flex-none text-[11px] font-bold uppercase tracking-wide text-content">
          The days
        </span>
        <span className="text-[12px] text-content truncate">
          Pick a day in the cards above for its full recap.
        </span>
      </div>
      <RecapDayHead withPounds={withPounds} narrow={narrow} />
      <div
        className="flex-1 min-h-0 overflow-y-auto thin-scrollbar grid"
        style={{ gridTemplateRows: `repeat(${days.length}, minmax(${ROW_MIN_PX}px, 1fr))` }}
      >
        {days.map((day) => (
          <RecapDayRow
            key={day.date}
            day={day}
            mix={mixOf(day.date)}
            withPounds={withPounds}
            narrow={narrow}
          />
        ))}
      </div>
    </div>
  </div>
);

export default RecapWeekView;
