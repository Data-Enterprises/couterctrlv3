import axios from "axios";

export const getSaleTypes = async (
  url: string,
  token: string,
  startDate: string,
  endDate: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
  saleTypes: string[] = [""]
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "cashiers/preflight",
    data: {
      startDate,
      endDate,
      useGroups,
      searchValue,
      singleStore,
      saleTypes,
    },
  });
  return json;
};

export const getCashierDetails = async (
  url: string,
  token: string,
  startDate: string,
  endDate: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
  saleTypes: string[]
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "cashiers/",
    data: {
      startDate,
      endDate,
      useGroups,
      searchValue,
      singleStore,
      saleTypes,
    },
  });
  return json;
};

export const getCashierTransactions = async (
  url: string,
  token: string,
  transactionDate: string,
  saleid: string,
  storeid: number
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "cashiers/transaction",
    data: {
      transactionDate,
      saleid,
      storeid,
    },
  });
  return json;
};
