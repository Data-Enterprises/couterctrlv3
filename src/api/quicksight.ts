import axios from "axios";

export const getEmbedUrl = async (
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
    url: url + "quicksight/embed_url",
    params: {
      email,
    },
  });
  return json;
};

export const getQuicksightStoresForUser = async (
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
    url: url + "quicksight/assigned",
    params: { email },
  });
  return json;
};

// the store id being passed is a number, but postgres expects a string for quicksight_permissions table
export const addQuicksightStoreForUser = async (
  url: string,
  token: string,
  email: string,
  storeid: string
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "quicksight/assign_user_store",
    params: { email, storeid },
  });
  return json;
};

export const removeQuicksightStoreForUser = async (
  url: string,
  token: string,
  email: string,
  storeid: string
) => {
  const json = await axios({
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "quicksight/remove_user_permission_single",
    params: { storeid, email },
  });
  return json;
};

export const removeAllPermissionsForUser = async (
  url: string,
  token: string,
  email: string
) => {
  const json = await axios({
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "quicksight/remove_all_permissions",
    params: { email },
  });
  return json;
};

export const assignAllPermissionsForUser = async (
  url: string,
  token: string,
  email: string
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "quicksight/assign_all_permissions",
    params: { email },
  });
  return json;
};

export const getQuicksightUsers = async (url: string, token: string) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "quicksight/users",
  });
  return json;
};

export const assignQsTemplate = async (
  url: string,
  token: string,
  email: string,
  stores: string
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "quicksight/assign_template",
    params: { email, stores },
  });
  return json;
};
