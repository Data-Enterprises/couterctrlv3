// API
import { getDailySales, getSubs, getSubsDaily, getWeekly } from "./sales";
import { getStoresAssignedToUserGroup } from "./groups";

/**
 * The sales reads the endpoint refactor moved. The dev API answers from the
 * refactor's routes; prod keeps its own until the refactor reaches the prod
 * API. Both trees call these, so a promoted page calls prod's routes in prod
 * without a change. Drop the prod side once the backend refactor is on prod.
 */

type ApiEnv = "dev" | "prod";

/** Prod's ledger reads a group of more than this many stores store by store. */
export const LEDGER_GROUP_SPLIT = 30;

/**
 * Daily store sales: `sales/daily` on dev, `sales/weekly` on prod. Same
 * request, same `sales` rows. `searchValue` is a store id, or a group id when
 * `useGroups` is 1.
 */
export const getStoreDailySales = (
  url: string,
  token: string,
  apiEnv: ApiEnv,
  startDate: string,
  endDate: string,
  useGroups: number,
  searchValue: number,
) =>
  apiEnv === "dev"
    ? getDailySales(url, token, startDate, endDate, useGroups, searchValue)
    : getWeekly(
        url,
        token,
        startDate,
        endDate,
        useGroups,
        searchValue,
        useGroups === 1 ? 0 : 1,
      );

/** A group's active stores, or none when the list can't be had. */
const activeGroupStores = async (
  url: string,
  token: string,
  userid: number,
  groupid: number,
) => {
  try {
    const resp = await getStoresAssignedToUserGroup(
      url,
      token,
      userid,
      groupid,
    );
    if (resp.data.error !== 0) return [];
    return (resp.data.stores as { storeid: number; active: boolean }[]).filter(
      (s) => s.active,
    );
  } catch {
    return [];
  }
};

/**
 * The Sales ledger's daily store sales. As getStoreDailySales, except that on
 * prod a group of more than 30 active stores is read one store at a time, as
 * prod's ledger has always read it: `sales/weekly` for a whole large group is
 * too slow. A store whose read fails is left out rather than failing the rest.
 */
export const getLedgerDailySales = async (
  url: string,
  token: string,
  apiEnv: ApiEnv,
  userid: number,
  startDate: string,
  endDate: string,
  useGroups: number,
  searchValue: number,
): Promise<{ data: any }> => {
  if (apiEnv !== "dev" && useGroups === 1) {
    const stores = await activeGroupStores(url, token, userid, searchValue);
    if (stores.length > LEDGER_GROUP_SPLIT) {
      const settled = await Promise.allSettled(
        stores.map((s) =>
          getWeekly(url, token, startDate, endDate, 0, s.storeid, 1),
        ),
      );
      const sales = settled.flatMap((r) =>
        r.status === "fulfilled" && r.value.data.error === 0
          ? r.value.data.sales
          : [],
      );
      return { data: { error: 0, success: true, sales } };
    }
  }
  return getStoreDailySales(
    url,
    token,
    apiEnv,
    startDate,
    endDate,
    useGroups,
    searchValue,
  );
};

/**
 * One page of daily sub-department sales: `subs/daily` on dev, `subs/sub_sales`
 * on prod. For one store both give the same per-store, per-day rows and the
 * same `subs` / `total_pages` envelope. Prod has no department filter, so a
 * `sub_department` above 0 is applied to the page after it arrives; and prod
 * merges a group's stores, so group callers get one row per day per
 * department there, not one per store.
 */
export const getSubDeptDailySales = async (
  url: string,
  token: string,
  apiEnv: ApiEnv,
  startDate: string,
  endDate: string,
  useGroups: number,
  searchValue: number,
  sub_department: number | null = null,
  page: number = 1,
): Promise<{ data: any }> => {
  if (apiEnv === "dev")
    return getSubsDaily(
      url,
      token,
      startDate,
      endDate,
      useGroups,
      searchValue,
      sub_department,
      page,
    );
  const resp = await getSubs(
    url,
    token,
    startDate,
    endDate,
    useGroups,
    searchValue,
    useGroups === 1 ? 0 : 1,
    0,
    0,
    page,
  );
  if (!sub_department || resp.data.error !== 0) return resp;
  return {
    ...resp,
    data: {
      ...resp.data,
      subs: (resp.data.subs as { sub_department: number }[]).filter(
        (s) => s.sub_department === sub_department,
      ),
    },
  };
};
