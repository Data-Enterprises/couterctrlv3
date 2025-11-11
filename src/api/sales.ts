import axios from "axios";
import type { SEARCH_TYPE } from "../features/searchSlice";

// Getting data back now
export const getTopTen = async (
  url: string,
  token: string,
  storeid: number,
  searchType: SEARCH_TYPE,
  startDate: string,
  endDate: string
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
  endDate: string
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

export const salesTwoDates = async (
  url: string,
  token: string,
  startDate: string,
  endDate: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
  storeid: number = 0
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "sales/salestwodates",
    data: {
      storeid,
      startDate,
      endDate,
      useGroups,
      searchValue,
      singleStore,
    },
  });
  return json;
};

export const getWeekly = async (
  url: string,
  token: string,
  storeid: number,
  startDate: string,
  endDate: string
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
    url: url + "sales/weekly",
    data: formData,
  });
  return json;
};
