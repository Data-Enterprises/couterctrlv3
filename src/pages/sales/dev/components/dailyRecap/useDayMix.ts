import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../../hooks";
import { cacheRecapMix } from "../../../../../features/dev/devSalesLedgerSlice";
import { loadDayRows } from "./recapLoad";
import { mixForDay } from "./recapMix";
import type { DayMixState } from "./recapTypes";

/**
 * Days whose item rows are on the wire right now, so a second ask (a tab
 * switch back, StrictMode's double mount) waits on the first instead of
 * sending another. Keys only, emptied as each read lands.
 */
const inFlight = new Set<string>();

const mixKey = (storeId: number, storeNumber: string, date: string) =>
  `${storeId}__${storeNumber}__${date}`;

/**
 * Each day's item count and price mix, from that day's item rows.
 *
 * The answer is kept in the Sales ledger slice (`recapMix`), so a day is read
 * once per store location however often Summary is opened, switched away
 * from or come back to; sign-out clears it with the rest of the dev
 * namespace. One store, one day, every sub dept per read.
 *
 * A day that fails is not retried by itself: `requestAll` passes over it, so
 * a failing endpoint cannot loop. Asking for that one day (`request`, which
 * picking it does) tries again once.
 */
export const useDayMix = (storeId: number, storeNumber: string) => {
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((s) => s.app);
  const cache = useAppSelector((s) => s.dev.salesLedger.recapMix);
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const [, setPending] = useState(0);

  // Read through refs so `request` keeps one identity: an effect that calls
  // it must not re-run, and retry, every time the cache or a failure moves.
  const cacheRef = useRef(cache);
  cacheRef.current = cache;
  const failedRef = useRef(failed);
  failedRef.current = failed;

  const start = useCallback(
    (date: string) => {
      const key = mixKey(storeId, storeNumber, date);
      if (cacheRef.current[key] || inFlight.has(key)) return;
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
  const request = useCallback((date: string) => start(date), [start]);

  /** Every day not already held, in flight or failed. */
  const requestAll = useCallback(
    (dates: string[]) => {
      for (const d of dates) {
        if (!failedRef.current.has(mixKey(storeId, storeNumber, d))) start(d);
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

  return { stateOf, request, requestAll };
};
