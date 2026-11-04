import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../../hooks";
import { cacheRecapItems, cacheRecapMix } from "../../../../../features/dev/devSalesLedgerSlice";
import { foldItems } from "./recapItems";
import { dayKey as mixKey, isCacheableDay } from "./recapKeys";
import { loadDayRows } from "./recapLoad";
import { mixForDay } from "./recapMix";
import type { DayItemsState, DayMixState, RecapItem } from "./recapTypes";

/**
 * Days whose item rows are on the wire right now, so a second ask (a tab
 * switch back, StrictMode's double mount) waits on the first instead of
 * sending another. Keys only, emptied as each read lands.
 */
const inFlight = new Set<string>();

/**
 * Each day's item count and price mix, and its items, from that day's item
 * rows.
 *
 * The mix is kept in the Sales ledger slice (`recapMix`), so a day is read
 * once per store location however often Summary is opened, switched away
 * from or come back to; sign-out clears it with the rest of the dev
 * namespace. One store, one day, every sub dept per read.
 *
 * The same read keeps the day's items, folded one row per item, for the
 * Daily Recap export and the item view (`recapItems`), so neither reads a
 * day Summary has seen. Not today, which is still changing: today's items are
 * held here only while Summary is open, and read again next time.
 *
 * The mix alone is asked for with `request`/`requestAll`; the items with
 * `requestItems`, which also reads a day whose mix is held but whose items
 * are not (today, or a day the export cache has since let go).
 *
 * A day that fails is not retried by itself: `requestAll` and `requestItems`
 * pass over it, so a failing endpoint cannot loop. Asking for that one day
 * (`request`, which picking it does) tries again once.
 */
export const useDayMix = (storeId: number, storeNumber: string) => {
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((s) => s.app);
  const cache = useAppSelector((s) => s.dev.salesLedger.recapMix);
  const keptItems = useAppSelector((s) => s.dev.salesLedger.recapItems);
  const [freshItems, setFreshItems] = useState<Record<string, RecapItem[]>>({});
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const [, setPending] = useState(0);

  // Read through refs so `request` keeps one identity: an effect that calls
  // it must not re-run, and retry, every time the cache or a failure moves.
  const cacheRef = useRef(cache);
  cacheRef.current = cache;
  const itemsRef = useRef({ kept: keptItems, fresh: freshItems });
  itemsRef.current = { kept: keptItems, fresh: freshItems };
  const failedRef = useRef(failed);
  failedRef.current = failed;

  const start = useCallback(
    (date: string, wantItems: boolean) => {
      const key = mixKey(storeId, storeNumber, date);
      const held = itemsRef.current;
      const itemsHeld = !!(held.kept[key] || held.fresh[key]);
      if (inFlight.has(key) || (cacheRef.current[key] && (!wantItems || itemsHeld))) return;
      inFlight.add(key);
      setPending((n) => n + 1);
      setFailed((f) => {
        if (!f.has(key)) return f;
        const next = new Set(f);
        next.delete(key);
        return next;
      });
      loadDayRows(url, token, storeId, storeNumber, date)
        .then((rows) => {
          dispatch(cacheRecapMix({ key, mix: mixForDay(rows) }));
          const items = foldItems(rows);
          if (isCacheableDay(date)) dispatch(cacheRecapItems({ key, items }));
          else setFreshItems((f) => ({ ...f, [key]: items }));
        })
        .catch(() => {
          setFailed((f) => new Set(f).add(key));
        })
        .finally(() => {
          inFlight.delete(key);
          setPending((n) => n + 1);
        });
    },
    [url, token, storeId, storeNumber, dispatch],
  );

  /** One day, retrying it if it failed before. */
  const request = useCallback((date: string) => start(date, false), [start]);

  /** Every day not already held, in flight or failed. */
  const requestAll = useCallback(
    (dates: string[]) => {
      for (const d of dates) {
        if (!failedRef.current.has(mixKey(storeId, storeNumber, d))) start(d, false);
      }
    },
    [start, storeId, storeNumber],
  );

  /** Every day's items not already held, in flight or failed. */
  const requestItems = useCallback(
    (dates: string[]) => {
      for (const d of dates) {
        if (!failedRef.current.has(mixKey(storeId, storeNumber, d))) start(d, true);
      }
    },
    [start, storeId, storeNumber],
  );

  // A new store or location starts with a clean failure list.
  const storeKey = `${storeId}__${storeNumber}`;
  const lastStore = useRef(storeKey);
  useEffect(() => {
    if (lastStore.current === storeKey) return;
    lastStore.current = storeKey;
    setFailed(new Set());
  }, [storeKey]);

  const stateOf = useCallback(
    (date: string): DayMixState => {
      const key = mixKey(storeId, storeNumber, date);
      const mix = cache[key];
      if (mix) return { status: "ready", mix };
      if (failed.has(key)) return { status: "error" };
      return inFlight.has(key) ? { status: "loading" } : { status: "idle" };
    },
    [cache, failed, storeId, storeNumber],
  );

  const itemsOf = useCallback(
    (date: string): DayItemsState => {
      const key = mixKey(storeId, storeNumber, date);
      const items = keptItems[key] ?? freshItems[key];
      if (items) return { status: "ready", items };
      if (failed.has(key)) return { status: "error" };
      return inFlight.has(key) ? { status: "loading" } : { status: "idle" };
    },
    [keptItems, freshItems, failed, storeId, storeNumber],
  );

  return { stateOf, itemsOf, request, requestAll, requestItems };
};
