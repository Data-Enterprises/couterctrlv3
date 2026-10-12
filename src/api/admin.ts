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

/**
 * A store record that did not exist before.
 *
 * `company` is the company ID, the same number `Store.company` carries — not
 * the name beside it. The row is created active: `deactivated_at` is left
 * null by the insert.
 */
export const createNewStore = async (
  url: string,
  token: string,
  store_number: string,
  store_name: string,
  company: number,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "stores/create_new_store",
    data: { store_number, store_name, company },
  });
  return json;
};

/**
 * Stamp or clear a store's `deactivated_at`.
 *
 * Both are idempotent by construction — one sets the column to now(), the
 * other to null — so sending either twice is harmless. That matters here,
 * because nothing the frontend fetches reports which state a store is
 * currently in: `Store` carries no `deactivated_at`, and the activity figures
 * are about sales posted, which is a different question.
 */
export const deactivateStore = async (
  url: string,
  token: string,
  storeid: number,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "stores/deactivate_store",
    data: { storeid },
  });
  return json;
};

export const reactivateStore = async (
  url: string,
  token: string,
  storeid: number,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "stores/reactivate_store",
    data: { storeid },
  });
  return json;
};

export const getAllStoreActivity = async (
  url: string,
  token: string,
  startdate: string,
  enddate: string,
  companies: number,
) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "company/allActivityStores",
    params: {
      startdate,
      enddate,
      companies,
    },
  });
  return json;
};
