import { getSubs } from "../../api/sales";
import { fetchAllPages } from "../../utils/paging";
import type { SubSale, SubSalesJsonResp } from "../../interfaces";

/**
 * Sub-department rows for one store or group over a window.
 *
 * `subs/sub_sales` pages at a fixed size in date order, and over a multi-week
 * window a single store runs well past one page. Reading page 1 alone silently
 * drops the **end** of the window — the most recent weeks, the ones anybody
 * looking at a tracker cares about most — so every read goes through
 * `fetchAllPages`.
 *
 * `consolidated: 0` is required rather than incidental: consolidating drops
 * `sale_date`, and without a date per row there is nothing to bucket into weeks
 * or days.
 */
export const fetchSubSales = async (
  url: string,
  token: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
  start: string,
  end: string,
): Promise<SubSale[]> => {
  const call = (page: number) =>
    getSubs(
      url,
      token,
      start,
      end,
      useGroups,
      searchValue,
      singleStore,
      0,
      0,
      page,
    );

  const first = await call(1);
  const body: SubSalesJsonResp = first.data;
  if (body.error !== 0)
    throw new Error(body.msg ?? "Failed to load sub departments");

  return fetchAllPages(body, body.subs ?? [], async (page) => {
    try {
      const r = await call(page);
      const j: SubSalesJsonResp = r.data;
      return j.error === 0 ? (j.subs ?? []) : [];
    } catch {
      return [];
    }
  });
};
