import axios from "axios";
import type {
  SubDeptMargin,
  SubsPricePoint,
} from "../interfaces";

export const getSubDepts = async (
  url: string,
  token: string,
  startDate: string,
  endDate: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
  consolidated: number = 0,
  displayHourly: number = 0,
  page: number = 1,
  download: number = 0,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "subs/sub_sales",
    data: {
      startDate,
      endDate,
      useGroups,
      searchValue,
      singleStore,
      consolidated,
      displayHourly,
      page,
      download,
    },
  });
  return json;
};

/**
 * `subs/subs` with the price-point payload switched on.
 *
 * A separate function rather than a flag on `getSubMargins`, because that call
 * serves Sales, Vendors, Sub Dept Margins and Inventory, and none of them want
 * a second aggregate they never read.
 *
 * What the extra payload is: the item rows are grouped by day, so an item that
 * sold at two prices in one day collapses to a blended average that nobody
 * actually paid. `price_points` regroups the same underlying lines by the price
 * each one rang at, with its own unit and transaction counts.
 *
 * Two things to know before consuming it:
 *
 *  - It is repeated IN FULL on every page, while `subs` is what actually pages.
 *    So it is requested on page 1 ONLY, and the flag is derived from `page`
 *    rather than passed in — asking again on page 2 would re-run the whole
 *    aggregate server-side and ship a second identical copy, which costs time
 *    on both ends and, if it were ever concatenated, would multiply every point
 *    by the page count.
 *  - It is pre-discount. The qty=0 coupon and "DC" rows divide to a null price
 *    and are filtered out, so a point's `net_sales` is what rang, before any
 *    discount row reversed part of it.
 */
export const getSubMarginsWithPricePoints = async (
  url: string,
  token: string,
  sub_department: number,
  startDate: string,
  endDate: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
  page: number = 1,
  download: number = 0,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "subs/subs",
    data: {
      sub_department,
      startDate,
      endDate,
      useGroups,
      searchValue,
      singleStore,
      page,
      download,
      // Page 1 only. The payload is identical on every page, so any later page
      // pays for the aggregate twice and returns a duplicate.
      include_price_points: page === 1 ? 1 : 0,
    },
  });
  return json;
};

export const getSubMargins = async (
  url: string,
  token: string,
  sub_department: number,
  startDate: string,
  endDate: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
  page: number = 1,
  download: number = 0,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "subs/subs",
    data: {
      sub_department,
      startDate,
      endDate,
      useGroups,
      searchValue,
      singleStore,
      page,
      download,
    },
  });
  return json;
};

/**
 * The response from `subs/item_actions`.
 *
 * Note `data`, not `subs` — the key differs from `subs/subs` and reading the
 * wrong one yields an empty report rather than an error.
 */
export interface ItemActionsResp {
  error: number;
  success: boolean;
  msg?: string;
  store_count: number;
  storeids: number[];
  requested_codes: number;
  found_codes: number;
  /** Codes that sold nothing in the window. A real answer, not a failure. */
  missing_codes: string[];
  total_records: number;
  data: SubDeptMargin[];
  price_point_count: number;
  price_points: SubsPricePoint[];
}

/** The endpoint's ceiling on `product_codes` per request. */
export const ITEM_ACTIONS_MAX_CODES = 2000;

/**
 * `subs/subs` for a known list of items.
 *
 * The same numbers, narrowed to the codes asked about by pushing them into the
 * base CTE before the grouping. Measured on the busiest store over a week:
 * 11,799 rows in 781ms for the whole store against 100 rows in 109ms for 100
 * codes — and 100 rows sits inside one page, so the count, the OFFSET and the
 * concurrent page burst stop happening rather than merely getting cheaper.
 *
 * Unpaged by design: the code cap is what bounds the response, so there is no
 * page argument and no `total_pages` to follow.
 *
 * Price points always come back — there is no flag. Over a whole store they
 * are a second expensive query and `subs/subs` still gates them; narrowed they
 * are 111 rows in 94ms, so the switch would only be something to get wrong.
 *
 * Codes go out as they are held. The backend matches the column raw rather
 * than through `replace(product_code, '.0', '')`, having verified the suffix
 * is gone from `sales_partitioned` — and this page normalises on the way in
 * anyway, so both sides are already on the bare form.
 */
export const getItemActions = async (
  url: string,
  token: string,
  startDate: string,
  endDate: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
  product_codes: string[],
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "subs/item_actions",
    data: {
      startDate,
      endDate,
      useGroups,
      searchValue,
      singleStore,
      product_codes,
    },
  });
  return json;
};
