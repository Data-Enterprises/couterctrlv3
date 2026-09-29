import { getSubMargins } from "../api/subMargins";
import type { SubDeptMargin, SubMarginsJsonResp } from "../interfaces";

/**
 * The paged read, with one decision left to the caller.
 *
 * `subs/subs` answers a department that sold nothing in the window with
 * `error: 1` — the same shape a genuine failure takes. Nothing in the body
 * tells the two apart, so what an error MEANS depends on why the window is
 * being read, and that is the one thing this takes as an argument.
 */
const loadRows = async (
  url: string,
  token: string,
  subDeptId: number,
  start: string,
  end: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
  onBodyError: "throw" | "empty",
): Promise<SubDeptMargin[]> => {
  const resp = await getSubMargins(
    url,
    token,
    subDeptId,
    start,
    end,
    useGroups,
    searchValue,
    singleStore,
  );
  const j: SubMarginsJsonResp = resp.data;
  if (j.error !== 0) {
    if (onBodyError === "empty") return [];
    throw new Error(j.msg ?? "Failed to load margins");
  }

  let data: SubDeptMargin[] = j.subs;
  if (j.total_pages > 1) {
    const extras = await Promise.all(
      Array.from({ length: j.total_pages - 1 }, (_, i) =>
        getSubMargins(
          url,
          token,
          subDeptId,
          start,
          end,
          useGroups,
          searchValue,
          singleStore,
          i + 2,
        ),
      ),
    );
    for (const r of extras) {
      const pj: SubMarginsJsonResp = r.data;
      if (pj.error === 0) data = [...data, ...pj.subs];
    }
  }
  return data;
};

/**
 * Item-level rows from `subs/subs`, paged.
 *
 * That endpoint is the only place item rows carry both their cost columns and
 * their `vendor_id` / `sub_department`, which makes it the source for every
 * page that grades below the sub-department line — Sub Dept Margins by
 * department, Vendors by supplier.
 *
 * It takes one sub department per call, so a whole store is a fan-out: get the
 * department list from `subs/sub_sales` first, then N calls here, times three
 * periods. Page 1 reports `total_pages` and the remainder go out together, so a
 * ten-page department costs one round trip rather than ten.
 *
 * Anything short of a clean body throws, including "no records". Callers that
 * read a window rather than compare one want `fetchSubDeptRowsOrEmpty` below.
 */
export const fetchSubDeptRows = (
  url: string,
  token: string,
  subDeptId: number,
  start: string,
  end: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
): Promise<SubDeptMargin[]> =>
  loadRows(
    url,
    token,
    subDeptId,
    start,
    end,
    useGroups,
    searchValue,
    singleStore,
    "throw",
  );

/** Same, but a failure resolves to an empty array.
 *
 *  Used for the comparison periods: losing last year's rows for one department
 *  should leave that department ungraded, not take down the whole search. */
export const fetchSubDeptRowsSafe = async (
  url: string,
  token: string,
  subDeptId: number,
  start: string,
  end: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
): Promise<SubDeptMargin[]> => {
  try {
    return await fetchSubDeptRows(
      url,
      token,
      subDeptId,
      start,
      end,
      useGroups,
      searchValue,
      singleStore,
    );
  } catch {
    return [];
  }
};

/**
 * Same, but "no records" resolves empty while a real failure still throws.
 *
 * For a window the caller is READING rather than comparing, throwing on an
 * empty body is wrong twice over: a department that sold nothing this week is
 * a real answer the screen should show, and swallowing everything the way
 * `fetchSubDeptRowsSafe` does would let an outage read as an empty week.
 *
 * So the split is by where the failure came from. A body reporting an error is
 * the endpoint saying "nothing here" and resolves empty; anything that rejects
 * — network, auth, 5xx — is still thrown for the caller to surface.
 */
export const fetchSubDeptRowsOrEmpty = (
  url: string,
  token: string,
  subDeptId: number,
  start: string,
  end: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
): Promise<SubDeptMargin[]> =>
  loadRows(
    url,
    token,
    subDeptId,
    start,
    end,
    useGroups,
    searchValue,
    singleStore,
    "empty",
  );
