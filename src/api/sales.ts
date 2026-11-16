import axios from "axios";
import type { SEARCH_TYPE } from "../features/searchSlice";

// Getting data back now
export const getTopTen = async (
  url: string,
  token: string,
  storeid: number,
  searchType: SEARCH_TYPE,
  startDate: string,
  endDate: string,
) => {
  const formData = new FormData();
  formData.append("storeid", storeid.toString());
  formData.append("searchType", searchType);
  formData.append("startDate", startDate);
  formData.append("endDate", endDate);
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "sales/topten",
    data: formData,
  });
  return json;
};

export const getHourlyStoreDepts = async (
  url: string,
  token: string,
  storeid: number,
  startDate: string,
  endDate: string,
) => {
  const formData = new FormData();
  formData.append("storeid", storeid.toString());
  formData.append("startDate", startDate);
  formData.append("endDate", endDate);
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "sales/storedepts",
    data: formData,
  });
  return json;
};

export const getSalesPanels = async (
  url: string,
  token: string,
  startDate: string,
  endDate: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "sales/weekly",
    data: {
      startDate,
      endDate,
      useGroups,
      searchValue,
      singleStore,
    },
  });
  return json;
};

/**
 * Each store's totals per day, from `sales/daily`: the same request and `sales`
 * rows `sales/weekly` gave. Replaces `sales/weekly` for the dev tree on the
 * endpoint refactor; prod keeps `getWeekly` until it is promoted.
 *
 * `searchValue` is a store id, or a group id when `useGroups` is 1.
 */
export const getDailySales = async (
  url: string,
  token: string,
  startDate: string,
  endDate: string,
  useGroups: number,
  searchValue: number,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "sales/daily",
    data: {
      startDate,
      endDate,
      useGroups,
      searchValue,
      singleStore: useGroups === 1 ? 0 : 1,
    },
  });

  return json;
};

/**
 * One page of daily sub-department totals, from `subs/daily`: the `SubSale`
 * rows `subs/sub_sales` gave. Replaces `subs/sub_sales` for the dev tree on the
 * endpoint refactor; prod keeps `getSubs` until it is promoted.
 *
 * A group comes back one row per store, not merged, and pages hold 5,000 rows,
 * so a big group needs every page. `sub_department` null or 0 is every
 * department. `searchValue` is a store id, or a group id when `useGroups` is 1.
 */
export const getSubsDaily = async (
  url: string,
  token: string,
  startDate: string,
  endDate: string,
  useGroups: number,
  searchValue: number,
  sub_department: number | null = null,
  page: number = 1,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "subs/daily",
    data: {
      startDate,
      endDate,
      useGroups,
      searchValue,
      singleStore: useGroups === 1 ? 0 : 1,
      sub_department,
      page,
    },
  });
  return json;
};

export const getWeekly = async (
  url: string,
  token: string,
  startDate: string,
  endDate: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "sales/weekly",
    data: {
      startDate,
      endDate,
      useGroups,
      searchValue,
      singleStore,
    },
  });
  return json;
};

export const getHourly = async (
  url: string,
  token: string,
  startDate: string,
  endDate: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "hourly/hourly",
    data: {
      startDate,
      endDate,
      useGroups,
      searchValue,
      singleStore,
    },
  });
  return json;
};

export const getCats = async (
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
      Authorization: "Bearer " + token,
    },
    url: url + "categories/cat_sales",
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

export const getSubs = async (
  url: string,
  token: string,
  startDate: string,
  endDate: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
  consolidated: number = 0,
  displayHourly: number = 0,
  pageNum: number = 1,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "subs/sub_sales",
    data: {
      startDate,
      endDate,
      useGroups,
      searchValue,
      singleStore,
      page: pageNum,
      consolidated,
      displayHourly,
    },
  });
  return json;
};

// This is setup to handle the single store sub dept comparison
/**
 * `subs/sales_tracker` — day-level sub-department totals for an explicit list
 * of dates.
 *
 * Dates rather than a range, because an LY tracker week is not seven
 * contiguous days: `sameWeekDayLastYear` snaps a holiday to its real date last
 * year, so a range would either miss the snapped day or pull in one the
 * pairing never asked for.
 *
 * Unpaged by design. A tracker needs every day of a week to total it, so a
 * page boundary would silently truncate one — which is the failure `sub_sales`
 * paging could produce and nothing downstream could detect.
 *
 * Group responses carry no store columns. The tracker never reads them, and
 * omitting them is most of why the payload is smaller.
 */
export const getSalesTracker = async (
  url: string,
  token: string,
  dates: string[],
  useGroups: number,
  searchValue: number,
  singleStore: number,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "subs/sales_tracker",
    data: { dates, useGroups, searchValue, singleStore },
  });
  return json;
};

export const getSubsComp = async (
  url: string,
  token: string,
  startDate: string,
  endDate: string,
  searchValue: number,
  useGroups: number = 0,
  singleStore: number = 1,
  consolidated: number = 0,
  displayHourly: number = 0,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
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
    },
  });
  return json;
};
