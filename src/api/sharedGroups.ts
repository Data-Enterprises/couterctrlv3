import axios from "axios";

/**
 * The shared_groups router: store groups an owner builds and shares with other
 * users. They behave like the user's own store groups, except other people can
 * search with them. Nothing here grants or revokes store access.
 *
 * No company and no userid anywhere — who's calling comes from the login token,
 * and every call acts on the caller's own groups. Below owner level (7) the
 * router answers HTTP 403 rather than the usual `{ error: 1 }` envelope — see
 * `isForbidden`. Recipients never call it: groups shared with them come from
 * `GET /groups/` like their own.
 */

const call = (
  url: string,
  token: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  data?: unknown,
) =>
  axios({
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "shared_groups/" + path,
    ...(data !== undefined ? { data } : {}),
  });

/** The router's level gate answers with a status, not an envelope. */
export const isForbidden = (err: unknown) =>
  (err as { response?: { status?: number } })?.response?.status === 403;

/** The caller's own shared groups, each with its stores and recipients. */
export const getSharedGroups = (url: string, token: string) =>
  call(url, token, "GET", "");

/** People the caller can share with, each with `user_level` and which of the
 *  caller's groups they already have. */
export const getSharedGroupUsers = (url: string, token: string) =>
  call(url, token, "GET", "users");

/** `storeids` is optional: a group can start empty, like a user group. */
export const createSharedGroup = (
  url: string,
  token: string,
  name: string,
  storeids?: number[],
) => call(url, token, "POST", "", storeids ? { name, storeids } : { name });

export const renameSharedGroup = (url: string, token: string, groupid: number, name: string) =>
  call(url, token, "PUT", String(groupid), { name });

/** Removes it for the caller and everyone it's shared with. */
export const deleteSharedGroup = (url: string, token: string, groupid: number) =>
  call(url, token, "DELETE", String(groupid));

/** The store picker: every store the caller is assigned to, `active` if it's
 *  in the group, plus any store still in the group they've lost access to
 *  (`assigned: 0`). */
export const getSharedGroupStores = (url: string, token: string, groupid: number) =>
  call(url, token, "GET", `${groupid}/stores`);

/** Reaches everyone it's shared with. */
export const addSharedGroupStores = (
  url: string,
  token: string,
  groupid: number,
  storeids: number[],
) => call(url, token, "POST", `${groupid}/stores`, { storeids });

/** A shared group can't be emptied; the router says so. */
export const removeSharedGroupStores = (
  url: string,
  token: string,
  groupid: number,
  storeids: number[],
) => call(url, token, "DELETE", `${groupid}/stores`, { storeids });

export const shareSharedGroups = (
  url: string,
  token: string,
  sharedGroupIds: number[],
  userids: number[],
) => call(url, token, "POST", "share", { shared_group_ids: sharedGroupIds, userids });

export const unshareSharedGroups = (
  url: string,
  token: string,
  sharedGroupIds: number[],
  userids: number[],
) => call(url, token, "POST", "unshare", { shared_group_ids: sharedGroupIds, userids });
