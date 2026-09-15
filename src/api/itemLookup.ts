import axios from "axios";
import { isSaleRow } from "../utils/saleType";

export const getItemLookup = async (
  url: string,
  token: string,
  upc: string,
) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "items/itemlookup",
    params: {
      upc,
    },
  });
  return json;
};

export const getStoreList = async (
  url: string,
  token: string,
  email: string,
) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "items/storelist",
    params: {
      email,
    },
  });
  return json;
};

export const getItemLookupSingleStore = async (
  url: string,
  token: string,
  upc: string,
  storeId: number,
  daysback: number = 14,
) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + `items/itemlookup/${storeId}`,
    params: {
      upc,
      daysback,
    },
  });
  // `history` stays Sale-only, matching the response's own totals, so every
  // screen that sums it keeps meaning sales. All line types — Backup,
  // Cancelled, Voided — are kept as `history_all` for the sale-type breakdown.
  // See utils/saleType.
  const data = json.data;
  if (data && Array.isArray(data.history)) {
    data.history_all = data.history;
    data.history = data.history.filter(isSaleRow);
  }
  return json;
};
