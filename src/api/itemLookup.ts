import axios from "axios";

export const getItemLookup = async (
  url: string,
  token: string,
  upc: string
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
  email: string
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
  storeId: number
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
    },
  });
  return json;
};
