import { useEffect, useMemo } from "react";
import { useAppSelector } from "../../../../../hooks";
import type { DayDot } from "../../../../../interfaces";
import RecapDayView from "./RecapDayView";
import { buildRecapDays, sellsByWeight, weekOf } from "./recapDays";
import { dayLabel } from "./recapFormat";
import { moneyForDates } from "./recapMoney";
import { combineMix } from "./recapPeriod";
import { useDayMix } from "./useDayMix";
import { usePanelSize } from "./usePanelSize";
import { useWeekExceptions } from "./useWeekExceptions";

/**
 * Summary: the week, or one day of it, in one view.
 *
 * The day cards above the tabs are the filter, as on every other tab: All
 * week shows the week's figures, a day's card the same cards with that day's.
 * Nothing on the tab picks a day itself.
 *
 * A summary, not a verdict: no grades, no thresholds and no last week or last
 * year anywhere on it. Always the open store, even with a comparison store
 * chosen in Stores. Its download is Daily Recap in Export CSV.
 *
 * Everything but a day's item count and price mix, and the week's exceptions,
 * comes from what the popup already loaded for Sub depts and Hourly. The item
 * rows are read a day at a time; the exceptions once for the week, from
 * /cashiers/exceptions.
 *
 * Laid out for the panel's own width and height, which the screen does not
 * decide: browser zoom and the panel's place beside the ledger both change
 * them.
 */
const DailyRecap = ({
  storeId,
  storeNumber,
  dates: datesIn,
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
  // The popup rebuilds its date list on every render; key it on its content
  // so nothing below re-runs (or re-asks) unless the week really changed.
  const datesKey = datesIn.join(",");
  const dates = useMemo(() => datesIn, [datesKey]);
  const { stateOf, request, requestAll } = useDayMix(storeId, storeNumber);
  const { ref, narrow, short } = usePanelSize();
  const exceptions = useWeekExceptions(
    storeId,
    storeNumber,
    dates[0] ?? "",
    dates[dates.length - 1] ?? "",
  );

  const recapDays = useMemo(
    () => buildRecapDays(dates, dayDots, rawSubs, rawHourly),
    [dates, dayDots, rawSubs, rawHourly],
  );
  const withPounds = useMemo(() => sellsByWeight(rawSubs), [rawSubs]);
  const picked = selectedDate ? recapDays.find((d) => d.date === selectedDate) : undefined;
  const period = useMemo(
    () => (picked ? picked : weekOf(recapDays, rawHourly)),
    [picked, recapDays, rawHourly],
  );
  const periodDates = useMemo(() => (picked ? [picked.date] : dates), [picked, dates]);
  const mix = useMemo(
    () => (picked ? stateOf(picked.date) : combineMix(dates.map(stateOf))),
    [picked, dates, stateOf],
  );
  const money = useMemo(
    () => moneyForDates(rawSubs, periodDates, period.net),
    [rawSubs, periodDates, period.net],
  );

  // Item rows: the week reads every day, for its items and price mix; a
  // picked day reads just itself (and is usually already in hand).
  useEffect(() => {
    if (selectedDate) request(selectedDate);
    else requestAll(dates);
  }, [selectedDate, dates, request, requestAll]);

  return (
    <div ref={ref} className="h-full min-h-0 min-w-0">
      <RecapDayView
        day={period}
        dates={periodDates}
        period={picked ? `on ${dayLabel(picked.date)}` : "across the week"}
        money={money}
        mix={mix}
        exceptions={exceptions}
        withPounds={withPounds}
        narrow={narrow}
        short={short}
      />
    </div>
  );
};

export default DailyRecap;
