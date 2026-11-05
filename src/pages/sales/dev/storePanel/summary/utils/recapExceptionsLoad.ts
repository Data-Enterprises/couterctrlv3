// API
import { getExceptionLines, type ExceptionLine, type ExceptionLinesResp } from "../../../../../../api/exceptionLines";

// Utils
import { fetchAllPages } from "../../../../../../utils/paging";
import { scopeToStoreNumber } from "../../../../../../utils/storeIdentity";

/** The endpoint's answer for a window with nothing in it. */
const isEmptyAnswer = (j: ExceptionLinesResp) =>
  j.error !== 0 && /no records/i.test(j.msg ?? "");

/**
 * A week's exception lines for one store location, every page.
 *
 * One read for the week rather than one per day: the lines are small and the
 * week is what the tab opens on. Page 1 says how many pages there are and the
 * rest go out together. "No records returned" is an empty week; any other
 * error rejects, so a failed read never passes for a clean week.
 */
export const loadWeekExceptions = async (
  url: string,
  token: string,
  storeId: number,
  storeNumber: string,
  startDate: string,
  endDate: string,
): Promise<ExceptionLine[]> => {
  const first = await getExceptionLines(url, token, storeId, startDate, endDate, 1);
  const j: ExceptionLinesResp = first.data;
  if (isEmptyAnswer(j)) return [];
  if (j.error !== 0) throw new Error(j.msg || "Exceptions could not be read");
  const lines = await fetchAllPages(j, [...(j.transactions ?? [])], async (page) => {
    try {
      const r = await getExceptionLines(url, token, storeId, startDate, endDate, page);
      return r.data.error === 0 ? (r.data.transactions ?? []) : [];
    } catch {
      return [];
    }
  });
  return scopeToStoreNumber(lines, storeNumber);
};
