import axios from "axios";

export const getBaseGroups = async (
  url: string,
  token: string,
  company: number,
) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "groups/base_groups",
    params: {
      company,
    },
  });
  return json;
};

export const createBaseGroup = async (
  url: string,
  token: string,
  name: string,
  company: number,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "groups/create_base_group",
    data: {
      name,
      company,
    },
  });
  return json;
};

export const updateBaseGroup = async (
  url: string,
  token: string,
  id: number,
  name: string,
  company: number,
) => {
  const json = await axios({
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "groups/update_base_group",
    data: {
      id,
      name,
      company,
    },
  });
  return json;
};

export const deleteBaseGroup = async (
  url: string,
  token: string,
  id: number,
) => {
  const json = await axios({
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "groups/delete_base_group",
    params: {
      id,
    },
  });
  return json;
};

export const assignStoreToBaseGroup = async (
  url: string,
  token: string,
  storeids: number[],
  groupid: number,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "stores/assign_store_to_base_group_link",
    data: {
      storeids,
      groupid,
    },
  });
  return json;
};

export const unAssignStoreToBaseGroup = async (
  url: string,
  token: string,
  storeids: number[],
  groupid: number,
) => {
  const json = await axios({
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "stores/delete_store_to_base_group_link",
    data: {
      storeids,
      groupid,
    },
  });
  return json;
};

export const getAllStoresInBaseGroup = async (
  url: string,
  token: string,
  groupid: number,
) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "applicatio/json",
      Authorization: "Bearer " + token,
    },
    url: url + "groups/all_stores_in_base_group",
    params: {
      groupid,
    },
  });
  return json;
};

export const getBGAssignedToUserSplit = async (
  url: string,
  token: string,
  userid: number,
) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "groups/base_groups_assigned_to_user_split",
    params: {
      userid,
    },
  });
  return json;
};
