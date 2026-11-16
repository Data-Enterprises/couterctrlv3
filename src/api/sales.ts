import axios from "axios";

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
