import axios from "axios";

// groups/base_groups_assigned_to_user
export const getBaseGroupsAssignedToUser = async (
  url: string,
  token: string,
  userid: number
) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "groups/base_groups_assigned_to_user",
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
  groupid: number
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
  groupid: number
) => {
  const json = await axios({
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "groups/delete_user_base_group_link",
    params: {
      userid,
      groupid,
    },
  });
  return json;
};
