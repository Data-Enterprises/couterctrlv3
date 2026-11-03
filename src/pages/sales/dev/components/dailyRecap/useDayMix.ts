import { useCallback, useEffect, useRef, useState } from "react";
import { useAppSelector } from "../../../../../hooks";
import { loadDayRows } from "./recapLoad";
import { mixForDay } from "./recapMix";
import type { DayMixState } from "./recapTypes";

/**
 * Each day's item count, refunds and price mix, read a day at a time and kept
 * while the store is.
 *
 * Everything else on the tab comes from what the popup already holds; only
 * these need the day's item rows, which carry a product code, a sale type
 * and a price type. The week view asks for all seven days so its Items column
 * fills in day by day; the day view then finds its day already read. One
 * store, one day, every sub dept per read: seven modest reads rather than one
 * week-sized one, the same load as the Daily Recap export.
 *
 * Kept in the hook, not in Redux: it belongs to this tab for this store, and
 * nothing needs it after the popup closes, so there is nothing for sign-out to
 * have to clear. A change of store starts again from empty, and an answer for
 * the previous store that lands late is dropped.
 */
export const useDayMix = (storeId: number, storeNumber: string) => {
  const { url, token } = useAppSelector((s) => s.app);
  const [byDate, setByDate] = useState<Record<string, DayMixState>>({});
  const asked = useRef(new Set<string>());
  const storeKey = `${storeId}__${storeNumber}`;
  const current = useRef(storeKey);

  useEffect(() => {
    current.current = storeKey;
    asked.current = new Set();
    setByDate({});
  }, [storeKey]);

  /** Start a day's read. Once per day; a failed day is forgotten so asking
   *  again retries. The outcome lands in `stateOf`. */
  const request = useCallback(
    (date: string) => {
      if (asked.current.has(date)) return;
      asked.current.add(date);
      const key = storeKey;
      setByDate((s) => ({ ...s, [date]: { status: "loading" } }));
      loadDayRows(url, token, storeId, storeNumber, date)
        .then((rows) => {
          if (current.current !== key) return;
          setByDate((s) => ({ ...s, [date]: { status: "ready", mix: mixForDay(rows) } }));
        })
        .catch(() => {
          if (current.current !== key) return;
          asked.current.delete(date);
          setByDate((s) => ({ ...s, [date]: { status: "error" } }));
        });
    },
    [url, token, storeId, storeNumber, storeKey],
  );

  /** Every day not yet asked for. */
  const requestAll = useCallback(
    (dates: string[]) => {
      for (const d of dates) request(d);
    },
    [request],
  );

  const stateOf = useCallback(
    (date: string): DayMixState => byDate[date] ?? { status: "idle" },
    [byDate],
  );

  return { stateOf, request, requestAll };
};
