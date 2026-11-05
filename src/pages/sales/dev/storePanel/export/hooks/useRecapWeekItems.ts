import { useCallback, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../../../../../hooks";
import {
  cacheRecapItems,
  touchRecapItems,
} from "../../../../../../features/dev/devSalesLedgerSlice";
import { dayKey, isCacheableDay } from "../../summary/utils/recapKeys";
import { loadDayItems } from "../../summary/utils/recapLoad";
import type { RecapItem } from "../../summary/types/index";

/** One day for the export: its items, and whether they could be read. */
export interface WeekDayItems {
  date: string;
  items: RecapItem[];
  failed?: true;
}

/**
 * The Items Sold export's reader: the ticked days' items, a day at a time.
 *
 * Takes every finished day Summary has already read from the cache and reads
 * only the rest, a day at a time, all at once. Usually that is just today,
 * which is never kept because it is still changing; a day read here is kept
 * for next time on the same rule. A day that fails comes back empty and
 * marked, so the file can say which days it is missing instead of sinking the
 * rest.
 */
export const useRecapWeekItems = (storeId: number, storeNumber: string) => {
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((s) => s.app);
  const held = useAppSelector((s) => s.dev.salesLedger.recapItems);
  const heldRef = useRef(held);
  heldRef.current = held;

  return useCallback(
    (dates: string[]): Promise<WeekDayItems[]> =>
      Promise.all(
        dates.map(async (date): Promise<WeekDayItems> => {
          const key = dayKey(storeId, storeNumber, date);
          const cached = heldRef.current[key];
          if (cached) {
            dispatch(touchRecapItems(key));
            return { date, items: cached };
          }
          try {
            const items = await loadDayItems(url, token, storeId, storeNumber, date);
            if (isCacheableDay(date)) dispatch(cacheRecapItems({ key, items }));
            return { date, items };
          } catch {
            return { date, items: [], failed: true };
          }
        }),
      ),
    [url, token, storeId, storeNumber, dispatch],
  );
};
