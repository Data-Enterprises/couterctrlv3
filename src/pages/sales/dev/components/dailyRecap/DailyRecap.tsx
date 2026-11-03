import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "../../../../../hooks";
import type { DayDot } from "../../../../../interfaces";
import { downloadCsv } from "../../../../../utils/csvExport";
import RecapDayBand from "./RecapDayBand";
import RecapDayBody from "./RecapDayBody";
import RecapDayHead from "./RecapDayHead";
import RecapDayRow from "./RecapDayRow";
import RecapToolbar from "./RecapToolbar";
import RecapWeekRow from "./RecapWeekRow";
import { recapCsv } from "./recapCsv";
import { buildRecapDays, buildRecapWeek, sellsByWeight } from "./recapDays";
import { dayLabel } from "./recapFormat";
import { matchesSearch } from "./recapItems";
import { subDeptsForDay } from "./recapSubDepts";
import { useDayItems } from "./useDayItems";

const subKey = (date: string, id: number) => `${date}|${id}`;

/**
 * Daily recap: the week, a day at a time.
 *
 * One row per day with the day's own totals; a day opens to its sub depts and
 * a sub dept to every item it sold that day. A day picked in the day cards
 * shows that day alone, already open, with its figures as a band.
 *
 * A summary, not a verdict: no grades, no thresholds and no last week or last
 * year anywhere on it. Always the open store, even with a comparison store
 * chosen in Stores.
 *
 * The day rows come from what the popup already loaded for Sub depts and
 * Hourly. The one new read is each day's item rows, made when the day opens.
 */
const DailyRecap = ({
  storeId,
  storeNumber,
  storeName,
  dates,
  days: dayDots,
  selectedDate,
}: {
  storeId: number;
  storeNumber: string;
  storeName: string;
  /** The week's seven dates, yyyy-mm-dd, oldest first. */
  dates: string[];
  /** The day cards' rows: their net sales and units are the day rows'. */
  days: DayDot[];
  selectedDate: string | null;
}) => {
  const { rawSubs, rawHourly } = useAppSelector((s) => s.dev.salesLedger);
  const { stateOf, request, loadAll } = useDayItems(storeId, storeNumber);

  const [openDays, setOpenDays] = useState<Set<string>>(new Set());
  const [openSubs, setOpenSubs] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadNote, setDownloadNote] = useState<string | null>(null);

  const recapDays = useMemo(
    () => buildRecapDays(dates, dayDots, rawSubs, rawHourly),
    [dates, dayDots, rawSubs, rawHourly],
  );
  const week = useMemo(() => buildRecapWeek(recapDays, rawHourly), [recapDays, rawHourly]);
  const withPounds = useMemo(() => sellsByWeight(rawSubs), [rawSubs]);
  const searching = search.trim().length > 0;
  const inView = useMemo(
    () => (selectedDate ? [selectedDate] : dates),
    [selectedDate, dates],
  );

  // A day's items are read when it is open, when it is the picked day, and
  // for every day in view while a search is running.
  useEffect(() => {
    const wanted = searching ? inView : selectedDate ? [selectedDate] : [...openDays];
    for (const d of wanted) if (stateOf(d).status === "idle") request(d);
  }, [searching, inView, selectedDate, openDays, stateOf, request]);

  const toggleDay = (date: string) =>
    setOpenDays((s) => {
      const next = new Set(s);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });

  const toggleSub = (date: string, id: number) =>
    setOpenSubs((s) => {
      const next = new Set(s);
      const k = subKey(date, id);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const allOpen = dates.every((d) => openDays.has(d));
  const toggleAll = () => {
    setOpenDays(allOpen ? new Set() : new Set(dates));
    if (allOpen) setOpenSubs(new Set());
  };

  const download = async () => {
    setDownloading(true);
    setDownloadNote(null);
    try {
      const loaded = await loadAll(inView);
      const failed = loaded.filter((d) => "failed" in d).map((d) => dayLabel(d.date));
      const span = inView.length === 1 ? inView[0] : `${inView[0]}_${inView[inView.length - 1]}`;
      const safe = storeName.replace(/[^\w-]+/g, "_").replace(/^_+|_+$/g, "");
      downloadCsv(recapCsv(loaded, withPounds), `${safe}_daily_recap_${span}.csv`);
      if (failed.length) {
        setDownloadNote(`Downloaded without ${failed.join(", ")}: those days' items could not be read.`);
      }
    } finally {
      setDownloading(false);
    }
  };

  const bodyFor = (date: string, showTotal: boolean) => {
    const { rows, leftOut } = subDeptsForDay(rawSubs, date);
    return (
      <RecapDayBody
        subs={rows}
        leftOut={leftOut}
        itemsState={stateOf(date)}
        withPounds={withPounds}
        openSubs={new Set(rows.filter((r) => openSubs.has(subKey(date, r.id))).map((r) => r.id))}
        onToggleSub={(id) => toggleSub(date, id)}
        search={search}
        showTotal={showTotal}
      />
    );
  };

  /** While searching, a day whose items are in and hold no match drops out. */
  const dayHasMatch = (date: string) => {
    const st = stateOf(date);
    return st.status !== "ready" || st.items.some((i) => matchesSearch(i, search));
  };

  const toolbar = (
    <RecapToolbar
      search={search}
      onSearch={setSearch}
      allOpen={allOpen}
      onToggleAll={toggleAll}
      showToggleAll={!selectedDate && !searching}
      onDownload={download}
      downloading={downloading}
      note={
        downloadNote ??
        (selectedDate
          ? `${dayLabel(selectedDate)} only. All week on the day cards brings every day back.`
          : undefined)
      }
    />
  );

  if (selectedDate) {
    const day = recapDays.find((d) => d.date === selectedDate);
    const st = stateOf(selectedDate);
    return (
      <div className="flex flex-col h-full min-h-0">
        {day && (
          <RecapDayBand
            day={day}
            itemsSold={st.status === "ready" ? st.items.length : null}
            withPounds={withPounds}
          />
        )}
        {toolbar}
        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
          {bodyFor(selectedDate, true)}
        </div>
      </div>
    );
  }

  const shownDays = searching ? recapDays.filter((d) => dayHasMatch(d.date)) : recapDays;

  return (
    <div className="flex flex-col h-full min-h-0">
      {toolbar}
      <RecapDayHead withPounds={withPounds} />
      <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
        {shownDays.map((day) => {
          const open = searching || openDays.has(day.date);
          return (
            <div key={day.date}>
              <RecapDayRow
                day={day}
                withPounds={withPounds}
                open={open}
                onToggle={() => toggleDay(day.date)}
              />
              {open && (
                <div className="pl-8 border-l-2 border-row_selected_border">
                  {bodyFor(day.date, false)}
                </div>
              )}
            </div>
          );
        })}
        {searching && shownDays.length === 0 && (
          <div className="px-3 py-6 text-center text-[12px] text-content">
            Nothing sold this week matches the search.
          </div>
        )}
        {!searching && <RecapWeekRow week={week} withPounds={withPounds} />}
      </div>
      <div className="px-3 py-2 text-[11.5px] text-content flex-shrink-0">
        Click a day for its sub depts and every item it sold.
      </div>
    </div>
  );
};

export default DailyRecap;
