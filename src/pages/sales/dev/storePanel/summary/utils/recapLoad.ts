// Utils
import { countedRows } from "../../../../../../utils/hashSubs";
import { fetchSubDeptRowsOrEmpty } from "../../../../../../utils/marginRows";
import { scopeToStoreNumber } from "../../../../../../utils/storeIdentity";
import { foldItems } from "./recapItems";

// Interfaces
import type { SubDeptMargin } from "../../../../../../interfaces";
import type { RecapItem } from "../interfaces/index";

/**
 * One day's item rows for one store location, counted sub depts only.
 *
 * `subs/subs` for that store and that day, every sub dept at once (sub dept
 * 0), cut to the location being looked at. A day that sold nothing comes back
 * empty; a failed request still rejects.
 */
export const loadDayRows = async (
  url: string,
  token: string,
  storeId: number,
  storeNumber: string,
  date: string,
): Promise<SubDeptMargin[]> => {
  const rows = await fetchSubDeptRowsOrEmpty(url, token, 0, date, date, 0, storeId, 1);
  return countedRows(scopeToStoreNumber(rows, storeNumber));
};

/** One day's items, one row per item. */
export const loadDayItems = async (
  url: string,
  token: string,
  storeId: number,
  storeNumber: string,
  date: string,
): Promise<RecapItem[]> =>
  foldItems(await loadDayRows(url, token, storeId, storeNumber, date));
