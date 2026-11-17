// Hooks
import { useEffect, useState } from "react";
import { useSalesCtx } from "../../../hooks";

// API
import { getHourly } from "../../../../../../api/sales";

// Utils
import { shiftIso } from "../../../../../../utils/grading";
import { sameWeekDayLastYear } from "../../../../../../utils";
import { scopeToStoreNumber } from "../../../utils/ledgerUtils";
import { day, type HourWeeks } from "../utils";

// Interfaces
import type { HourlySale } from "../../../../../../interfaces";

/**
 * The counterpart store's three weeks of hours, for the store-against-store
 * view: this week, last week and last year, narrowed to the same days as the
 * open store's (or to the one day picked in the strip above).
 *
 * `theirs` is null while they load, and again whenever the store or window
 * changes.
 */
export const useCounterpartHours = (args: {
  compareStoreId: number;
  /** Co-located stores share a storeid, so the rows are narrowed by number
   *  as well. */
  compareStoreNumber: string;
  twStart: string;
  twEnd: string;
  lwStart: string;
  lwEnd: string;
  lyStart: string;
  lyEnd: string;
  lwWeekDates: string[];
  lyWeekDates: string[];
}) => {
  const {
    compareStoreId,
    compareStoreNumber,
    twStart,
    twEnd,
    lwStart,
    lwEnd,
    lyStart,
    lyEnd,
    lwWeekDates,
    lyWeekDates,
  } = args;
  // A day picked in the strip above narrows both sides to that day.
  const { selectedDate, url, token } = useSalesCtx();
  const [theirs, setTheirs] = useState<HourWeeks | null>(null);
  const [failed, setFailed] = useState(false);

  const lwKey = lwWeekDates.join(",");
  const lyKey = lyWeekDates.join(",");

  useEffect(() => {
    let live = true;
    setTheirs(null);
    setFailed(false);

    const ask = (from: string, to: string) =>
      getHourly(url, token, from, to, 0, compareStoreId, 1);

    Promise.all([ask(twStart, twEnd), ask(lwStart, lwEnd), ask(lyStart, lyEnd)])
      .then(([tw, lw, ly]) => {
        if (!live) return;
        // The house convention: a 200 carrying `error`, so `error === 0` is
        // the success test. Scoped by store NUMBER, because co-located stores
        // share an id.
        const take = (resp: { data: { error: number; subs: HourlySale[] } }) =>
          resp.data.error === 0
            ? scopeToStoreNumber(resp.data.subs ?? [], compareStoreNumber)
            : [];

        // Narrowed exactly as the open store's were on the way in.
        const lwSet = new Set(lwWeekDates);
        const lySet = new Set(lyWeekDates);
        const lwDay = selectedDate ? shiftIso(selectedDate, -7) : null;
        const lyDay = selectedDate
          ? sameWeekDayLastYear(selectedDate).date
          : null;

        setTheirs({
          tw: selectedDate
            ? take(tw).filter((h) => day(h.sale_date) === selectedDate)
            : take(tw),
          lw: take(lw).filter((h) =>
            lwDay ? day(h.sale_date) === lwDay : lwSet.has(day(h.sale_date)),
          ),
          ly: take(ly).filter((h) =>
            lyDay ? day(h.sale_date) === lyDay : lySet.has(day(h.sale_date)),
          ),
        });
      })
      .catch(() => live && setFailed(true));

    return () => {
      live = false;
    };
  }, [
    url,
    token,
    twStart,
    twEnd,
    lwStart,
    lwEnd,
    lyStart,
    lyEnd,
    compareStoreId,
    compareStoreNumber,
    lwKey,
    lyKey,
    selectedDate,
    lwWeekDates,
    lyWeekDates,
  ]);

  return { theirs, failed };
};
