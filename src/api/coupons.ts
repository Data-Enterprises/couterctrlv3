import axios from "axios";

export const getCoupons = async (
  url: string,
  token: string,
  startDate: string,
  endDate: string,
  useGroups: number,
  singleStore: number,
  searchValue: number
) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "coupons/",
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
