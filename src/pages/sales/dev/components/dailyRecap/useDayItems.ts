import { useCallback, useEffect, useRef, useState } from "react";
import { useAppSelector } from "../../../../../hooks";
import { loadDayItems } from "./recapLoad";
import type { DayItemsState, RecapItem } from "./recapTypes";

/**
 * A day's item rows, read when the day is opened and kept while the store is.
 *
 * The day rows need nothing new, so this is the tab's only read: one store,
 * one day, every sub dept at once. One day is a seventh of a week's rows,
 * which is what makes reading it on demand affordable for a big grocery store.
 *
 * Kept in the hook, not in Redux: it belongs to this tab for this store, and
 * nothing needs it after the popup closes, so there is nothing for sign-out to
 * have to clear. A change of store starts again from empty, and an answer for
 * the previous store that lands late is dropped.
 *
 * The export reads the week itself (recapLoad's `loadWeekItems`): the modal
 * outlives nothing of this tab's, and may be opened without it.
 */
export const useDayItems = (storeId: number, storeNumber: string) => {
  const { url, token } = useAppSelector((s) => s.app);
  const [byDate, setByDate] = useState<Record<string, DayItemsState>>({});
  const pending = useRef(new Map<string, Promise<RecapItem[]>>());
  const storeKey = `${storeId}__${storeNumber}`;
  const current = useRef(storeKey);

  useEffect(() => {
    current.current = storeKey;
    pending.current = new Map();
    setByDate({});
  }, [storeKey]);

  /** Start a day's read. Once per day; a failed day is forgotten so asking
   *  again retries. The failure itself lands in `stateOf`. */
  const request = useCallback(
    (date: string) => {
      if (pending.current.has(date)) return;
      const key = storeKey;
      setByDate((s) => ({ ...s, [date]: { status: "loading" } }));
      const read = loadDayItems(url, token, storeId, storeNumber, date);
      pending.current.set(date, read);
      read
        .then((items) => {
          if (current.current !== key) return;
          setByDate((s) => ({ ...s, [date]: { status: "ready", items } }));
        })
        .catch(() => {
          if (current.current !== key) return;
          pending.current.delete(date);
          setByDate((s) => ({ ...s, [date]: { status: "error" } }));
        });
    },
    [url, token, storeId, storeNumber, storeKey],
  );

  const stateOf = useCallback(
    (date: string): DayItemsState => byDate[date] ?? { status: "idle" },
    [byDate],
  );

  return { stateOf, request };
};
