import axios from "axios";
import type { UserData } from "../features/usersSlice";

// groups/base_groups_assigned_to_user
export const getBaseGroupsAssignedToUser = async (
  url: string,
  token: string,
  userid: number,
) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "groups/base_groups_assigned_to_user_split",
    params: {
      userid,
    },
  });
  return json;
};

// groups/assign_base_group_to_user
export const assignBaseGroupToUser = async (
  url: string,
  token: string,
  userid: number,
  groupid: number[],
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "groups/assign_base_group_to_user",
    data: {
      userid,
      groupid,
    },
  });
  return json;
};

// groups/delete_user_base_group_link
export const deleteUserBaseGroupLink = async (
  url: string,
  token: string,
  userid: number,
  groupid: number[],
) => {
  const json = await axios({
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "groups/delete_user_base_group_link",
    data: {
      userid,
      groupid,
    },
  });
  return json;
};

export const createUser = async (
  url: string,
  token: string,
  data: UserData,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "users/create_user",
    data: {
      ...data,
      company: 0,
    },
  });
  return json;
};

export const updateUser = async (
  url: string,
  token: string,
  data: UserData,
  security: number,
  template: number,
) => {
  const json = await axios({
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "users/update_user",
    data: {
      ...data,
      security,
      template,
    },
  });

  return json;
};

export const deleteUser = async (
  url: string,
  token: string,
  username: string,
) => {
  const json = await axios({
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "users/delete_user",
    data: {
      username,
    },
  });
  return json;
};

// For store assigning/unassigning
export const assignUserToStore = async (
  url: string,
  token: string,
  userid: number,
  storeids: number[],
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "stores/assign_store",
    data: {
      userid,
      storeids,
    },
  });
  return json;
};

export const unassignUserFromStore = async (
  url: string,
  token: string,
  userid: number,
  storeids: number[],
) => {
  const json = await axios({
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "stores/unassign_store",
    data: {
      userid,
      storeids,
    },
  });
  return json;
};

export const resetUserSecurityQuestion = async (
  url: string,
  token: string,
  userid: number,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "forgot_password/reset_security",
    params: {
      userid,
    },
  });
  return json;
};

export const getUserLevels = async (url: string, token: string) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "users/user_levels",
  });
  return json;
};

export const checkUsername = async (
  url: string,
  token: string,
  username: string,
) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "users/is_username_available",
    params: {
      username,
    },
  });
  return json;
};

export const checkEmail = async (
  url: string,
  token: string,
  email: string,
) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "users/is_email_available",
    params: {
      email,
    },
  });
  return json;
};
