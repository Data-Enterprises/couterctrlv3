import axios from "axios";

export const getStoreCards = async (
  url: string,
  userid: number,
  startDate: string,
  endDate: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
  api_key: string,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    url: url + "cashiers/store_card",
    data: {
      userid,
      startDate,
      endDate,
      useGroups,
      searchValue,
      singleStore,
      api_key,
    },
  });

  return json;
};

export const getCashierCards = async (
  url: string,
  userid: number,
  startDate: string,
  endDate: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
  api_key: string,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    url: url + "cashiers/cashier_card",
    data: {
      userid,
      startDate,
      endDate,
      useGroups,
      searchValue,
      singleStore,
      api_key,
    },
  });

  return json;
};
