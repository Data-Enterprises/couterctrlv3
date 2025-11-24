import axios from "axios";

export const getGroups = async (url: string, token: string) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "groups/",
  });

  return json;
};

export const createGroup = async (
  url: string,
  token: string,
  userid: number,
  group_name: string
) => {
  const json = await axios({
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    url: url + "groups/create",
    data: {
      userid,
      group_name,
    },
  });

  return json;
};

export const deleteGroup = async (url: string, token: string, id: number) => {
  const json = await axios({
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    url: url + "groups/delete",
    params: {
      id,
    },
  });

  return json;
};

export const getStoresAssignedToUserGroup = async (
  url: string,
  token: string,
  userid: number,
  groupid: number
) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "groups/stores_assigned_to_user_group",
    params: {
      userid,
      groupid,
    },
  });
  return json;
};

export const addStoreToGroup = async (
  url: string,
  token: string,
  userid: number,
  groupid: number,
  storeid: number
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "groups/assign_users_store_to_user_group",
    params: {
      userid,
      groupid,
      storeid,
    },
  });
  return json;
};

export const removeStoreFromGroup = async (
  url: string,
  token: string,
  userid: number,
  groupid: number,
  storeid: number
) => {
  const json = await axios({
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "groups/unassign_users_store_to_user_group",
    params: {
      userid,
      groupid,
      storeid,
    },
  });
  return json;
};
