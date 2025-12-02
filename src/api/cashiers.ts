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

export const getCashierTable = async (
  url: string,
  token: string,
  startDate: string,
  endDate: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
  saleTypes: string[],
  page: number = 1
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "cashiers/cashier_table",
    data: {
      startDate,
      endDate,
      useGroups,
      searchValue,
      singleStore,
      saleTypes,
      page,
    },
  });
  return json;
};

export const getTransactionList = async (
  url: string,
  token: string,
  transaction_ids: string[],
  page: number = 1
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "cashiers/transaction_list",
    data: {
      transaction_ids,
      page,
    },
  });
  return json;
};

export const emailTransaction = async (
  url: string,
  token: string,
  transaction_id: string
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "cashiers/email_transaction",
    data: {
      transaction_id,
    },
  });
  return json;
};
