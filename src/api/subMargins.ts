import axios from "axios";

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

export const getSubMargins = async (
  url: string,
  token: string,
  sub_department: number,
  startDate: string,
  endDate: string,
  useGroups: string,
  searchValue: number,
  singlestore: number,
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
      singlestore,
      page,
      download,
    },
  });
  return json;
};
