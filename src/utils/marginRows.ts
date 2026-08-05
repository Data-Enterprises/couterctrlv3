import { getSubMargins } from "../api/subMargins";
import type { SubDeptMargin, SubMarginsJsonResp } from "../interfaces";

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
 */
export const fetchSubDeptRows = async (
  url: string,
  token: string,
  subDeptId: number,
  start: string,
  end: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
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
  if (j.error !== 0) throw new Error(j.msg ?? "Failed to load margins");

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
