import axios from "axios";

export const setNewStoreName = async (
  url: string,
  token: string,
  storeid: number,
  new_name: string,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "stores/change_store_name",
    data: {
      storeid,
      new_name,
    },
  });
  return json;
};

export const getStoresMissingSales = async (
  url: string,
  token: string,
  companyid: number,
  sale_date: string,
) => {
  // sale_date should be in format YYYY-MM-DD
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "stores/stores_missing_sales",
    params: {
      companyid,
      sale_date,
    },
  });
  return json;
};
