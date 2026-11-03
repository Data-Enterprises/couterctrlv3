import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "../../../../../hooks";
import type { DayDot } from "../../../../../interfaces";
import RecapDayDetail from "./RecapDayDetail";
import RecapDayHead from "./RecapDayHead";
import RecapDayRow from "./RecapDayRow";
import RecapWeekBand from "./RecapWeekBand";
import { buildRecapDays, buildRecapWeek, sellsByWeight } from "./recapDays";
import { moneyForDay } from "./recapMoney";
import { useDayMix } from "./useDayMix";

/**
 * Daily recap: the week, a day at a time.
 *
 * The week's headline figures, then one row per day with its own totals and
 * the shape of its hours. A day opens to the rest of that day: its shape by
 * hour, its baskets, its money, and its refunds and price mix. A day picked
 * in the day cards shows that day alone, already open.
 *
 * A summary, not a verdict: no grades, no thresholds and no last week or last
 * year anywhere on it. Always the open store, even with a comparison store
 * chosen in Stores. Its download is Daily Recap in Export CSV.
 *
 * Everything but the refunds and price mix comes from what the popup already
 * loaded for Sub depts and Hourly; those two read the day's item rows when
 * the day is opened.
 */
const DailyRecap = ({
  storeId,
  storeNumber,
  dates,
  days: dayDots,
  selectedDate,
}: {
  storeId: number;
  storeNumber: string;
  /** The week's seven dates, yyyy-mm-dd, oldest first. */
  dates: string[];
  /** The day cards' rows: their net sales and units are the day rows'. */
  days: DayDot[];
  selectedDate: string | null;
}) => {
  const { rawSubs, rawHourly } = useAppSelector((s) => s.dev.salesLedger);
  const { stateOf, request } = useDayMix(storeId, storeNumber);
  const [openDay, setOpenDay] = useState<string | null>(null);

  const recapDays = useMemo(
    () => buildRecapDays(dates, dayDots, rawSubs, rawHourly),
    [dates, dayDots, rawSubs, rawHourly],
  );
  const week = useMemo(() => buildRecapWeek(recapDays), [recapDays]);
  const withPounds = useMemo(() => sellsByWeight(rawSubs), [rawSubs]);
  const topNet = Math.max(0, ...recapDays.map((d) => d.net));

  const shown = selectedDate ? recapDays.filter((d) => d.date === selectedDate) : recapDays;
  const isOpen = (date: string) => date === selectedDate || date === openDay;

  // The open day (or the picked one) reads its item rows for the mix.
  const wanted = selectedDate ?? openDay;
  useEffect(() => {
    if (wanted && stateOf(wanted).status === "idle") request(wanted);
  }, [wanted, stateOf, request]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {!selectedDate && <RecapWeekBand week={week} withPounds={withPounds} />}
      <div
        className={`flex-1 min-h-0 mx-3.5 mb-3.5 flex flex-col overflow-hidden rounded-[10px] border border-gray-200 bg-brand_paper ${
          selectedDate ? "mt-3" : ""
        }`}
      >
        <RecapDayHead withPounds={withPounds} />
        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
          {shown.map((day) => (
            <div key={day.date}>
              <RecapDayRow
                day={day}
                topNet={topNet}
                withPounds={withPounds}
                open={isOpen(day.date)}
                onToggle={
                  selectedDate
                    ? undefined
                    : () => setOpenDay((d) => (d === day.date ? null : day.date))
                }
              />
              {isOpen(day.date) && (
                <RecapDayDetail
                  day={day}
                  money={moneyForDay(rawSubs, day.date, day.net)}
                  mix={stateOf(day.date)}
                  withPounds={withPounds}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DailyRecap;
