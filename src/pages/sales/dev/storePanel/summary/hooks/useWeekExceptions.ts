import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../../../hooks";
import { cacheRecapExceptions } from "../../../../../../features/dev/devSalesLedgerSlice";
import { exceptionsByDay } from "../utils/recapExceptions";
import { loadWeekExceptions } from "../utils/recapExceptionsLoad";
import type { WeekExceptionsState } from "../interfaces/index";

/**
 * Weeks whose exception lines are on the wire right now, so a remount or
 * StrictMode's double mount waits on the read already going rather than
 * sending another. Keys only, emptied as each read lands.
 */
const inFlight = new Set<string>();

/**
 * The week's exceptions for the open store location, rolled up by day.
 *
 * Read once per store location and week, and kept in the Sales ledger slice
 * (`recapExceptions`), so opening Summary again, switching tabs or coming
 * back to a store reads nothing; sign-out clears it with the rest of the dev
 * namespace. A failed read is not retried while the tab stays open (no loop);
 * opening the store again tries once more.
 */
export const useWeekExceptions = (
  storeId: number,
  storeNumber: string,
  startDate: string,
  endDate: string,
): WeekExceptionsState => {
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((s) => s.app);
  const key = `${storeId}__${storeNumber}__${startDate}__${endDate}`;
  const byDay = useAppSelector((s) => s.dev.salesLedger.recapExceptions[key]);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [, setPending] = useState(0);

  useEffect(() => {
    if (!startDate || !endDate || byDay || inFlight.has(key)) return;
    inFlight.add(key);
    setPending((n) => n + 1);
    loadWeekExceptions(url, token, storeId, storeNumber, startDate, endDate)
      .then((lines) => {
        dispatch(
          cacheRecapExceptions({ key, byDay: Object.fromEntries(exceptionsByDay(lines)) }),
        );
      })
      .catch(() => setFailedKey(key))
      .finally(() => {
        inFlight.delete(key);
        setPending((n) => n + 1);
      });
  }, [key, byDay, url, token, storeId, storeNumber, startDate, endDate, dispatch]);

  if (byDay) return { status: "ready", byDay };
  if (failedKey === key) return { status: "error" };
  return inFlight.has(key) ? { status: "loading" } : { status: "idle" };
};
