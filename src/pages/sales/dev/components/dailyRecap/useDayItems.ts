import { useCallback, useEffect, useRef, useState } from "react";
import { useAppSelector } from "../../../../../hooks";
import { fetchSubDeptRowsOrEmpty } from "../../../../../utils/marginRows";
import { scopeToStoreNumber } from "../../../../../utils/storeIdentity";
import { foldItems } from "./recapItems";
import type { DayItemsState, RecapItem } from "./recapTypes";

/**
 * A day's item rows, read when the day is opened and kept while the store is.
 *
 * The day rows need nothing new, so this is the tab's only read: `subs/subs`
 * for one store and one day, every sub dept at once. One day is a seventh of
 * a week's rows, which is what makes reading it on demand affordable for a
 * big grocery store.
 *
 * Kept in the hook, not in Redux: it belongs to this tab for this store, and
 * nothing needs it after the popup closes, so there is nothing for sign-out to
 * have to clear. A change of store starts again from empty, and an answer for
 * the previous store that lands late is dropped.
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

  const load = useCallback(
    (date: string): Promise<RecapItem[]> => {
      const held = pending.current.get(date);
      if (held) return held;
      const key = storeKey;
      setByDate((s) => ({ ...s, [date]: { status: "loading" } }));
      const read = fetchSubDeptRowsOrEmpty(url, token, 0, date, date, 0, storeId, 1)
        .then((rows) => {
          const items = foldItems(scopeToStoreNumber(rows, storeNumber));
          if (current.current === key) {
            setByDate((s) => ({ ...s, [date]: { status: "ready", items } }));
          }
          return items;
        })
        .catch((err: unknown) => {
          if (current.current === key) {
            // Forgotten, so opening the day again tries again.
            pending.current.delete(date);
            setByDate((s) => ({ ...s, [date]: { status: "error" } }));
          }
          throw err;
        });
      pending.current.set(date, read);
      return read;
    },
    [url, token, storeId, storeNumber, storeKey],
  );

  /** Every day, for the download and for a search across the week. A day
   *  that fails comes back empty rather than sinking the rest. */
  const loadAll = useCallback(
    (dates: string[]) =>
      Promise.all(
        dates.map((date) =>
          load(date)
            .then((items) => ({ date, items }))
            .catch(() => ({ date, items: [] as RecapItem[], failed: true })),
        ),
      ),
    [load],
  );

  /** Start a day's read for the screen. The failure is already in `stateOf`,
   *  so the promise's own rejection has nobody left to tell. */
  const request = useCallback(
    (date: string) => {
      load(date).catch(() => undefined);
    },
    [load],
  );

  const stateOf = useCallback(
    (date: string): DayItemsState => byDate[date] ?? { status: "idle" },
    [byDate],
  );

  return { stateOf, request, loadAll };
};
