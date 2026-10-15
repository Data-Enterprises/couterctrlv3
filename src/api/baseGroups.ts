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

/**
 * Put a store in base groups, and hand it to everyone holding them as `all`.
 *
 * The `groups/` pair, not the older `stores/*_store_to_base_group_link` pair
 * that prod and legacy still call. Those two write `store_base_group_link` and
 * stop, so a store added to a group reached nobody who held it — the roster
 * grew and the access did not, which is the whole thing base group access was
 * rebuilt to fix.
 *
 * One store per call, many groups. The caller fans out across a selection; see
 * `pages/organization/dev/baseGroups/storeMembership`.
 *
 * Rejects a store whose company differs from the group's, as a 400 rather than
 * a body with `error: 1` — nothing in the schema ties the two together, so
 * without the check a group id from another company hands out its stores.
 */
export const assignStoreToBaseGroups = async (
  url: string,
  token: string,
  storeid: number,
  groupid: number[],
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "groups/assign_store_to_base_group",
    data: { storeid, groupid },
  });
  return json;
};

/**
 * Take a store out of one base group, and out of the users it reached through
 * it.
 *
 * A user who can still reach the store another way keeps it — through a group
 * they hold as `all` that also contains it, through a pick made in another
 * group, or because it was assigned to them directly and no group ever
 * explained it.
 *
 * A DELETE carrying a body, which is what the endpoint takes — hence `data`.
 */
export const unassignStoreFromBaseGroup = async (
  url: string,
  token: string,
  storeid: number,
  groupid: number,
) => {
  const json = await axios({
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "groups/unassign_store_from_base_group",
    data: { storeid, groupid },
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

/**
 * Everyone a base group's Users tab needs, in one call: `assigned` (linked to
 * the group) and `unassigned` (active users of the company who aren't).
 * Replaces one base_groups_assigned_to_user_split call per candidate.
 */
export const getBaseGroupUsers = async (
  url: string,
  token: string,
  groupid: number,
  company: number,
) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "groups/base_group_users",
    params: { groupid, company },
  });
  return json;
};
