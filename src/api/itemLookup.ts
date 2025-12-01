import axios from "axios";
// add api key to both calls make call for single store
export const getItemLookup = async (
  url: string,
  upc: string,
  apikey: string
) => {
  const json = await axios({
    method: "GET",
    url: url + "items/itemlookup",
    params: {
      upc,
      apikey,
    },
  });
  return json;
};

export const getStoreList = async (
  url: string,
  email: string,
  apikey: string
) => {
  const json = await axios({
    method: "GET",
    url: url + "items/storelist",
    params: {
      email,
      apikey,
    },
  });
  return json;
};

export const getItemLookupSingleStore = async (
  url: string,
  upc: string,
  storeId: number,
  apikey: string
) => {
  const json = await axios({
    method: "GET",
    url: url + `items/itemlookup/${storeId}`,
    params: {
      upc,
      apikey,
    },
  });
  return json;
};
