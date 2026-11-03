import { fetchSubDeptRowsOrEmpty } from "../../../../../utils/marginRows";
import { scopeToStoreNumber } from "../../../../../utils/storeIdentity";
import { foldItems } from "./recapItems";
import type { RecapItem } from "./recapTypes";

/**
 * One day's items for one store location.
 *
 * `subs/subs` for that store and that day, every sub dept at once (sub dept
 * 0), cut to the location being looked at and folded to one row per item. A
 * day that sold nothing comes back empty; a failed request still rejects.
 */
export const loadDayItems = async (
  url: string,
  token: string,
  storeId: number,
  storeNumber: string,
  date: string,
): Promise<RecapItem[]> => {
  const rows = await fetchSubDeptRowsOrEmpty(url, token, 0, date, date, 0, storeId, 1);
  return foldItems(scopeToStoreNumber(rows, storeNumber));
};

/**
 * Every day of the week, for the export.
 *
 * A day at a time, all at once, so a big store's week is seven modest reads
 * rather than one huge one. A day that fails comes back empty and marked, so
 * the file can say which days it is missing instead of sinking the rest.
 */
export const loadWeekItems = (
  url: string,
  token: string,
  storeId: number,
  storeNumber: string,
  dates: string[],
): Promise<{ date: string; items: RecapItem[]; failed?: true }[]> =>
  Promise.all(
    dates.map((date) =>
      loadDayItems(url, token, storeId, storeNumber, date)
        .then((items) => ({ date, items }))
        .catch(() => ({ date, items: [] as RecapItem[], failed: true as const })),
    ),
  );
