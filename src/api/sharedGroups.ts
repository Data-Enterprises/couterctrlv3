import axios from "axios";

/**
 * The shared_groups router: store groups an owner builds and shares with other
 * users. They behave like the user's own store groups, except other people can
 * search with them. Nothing here grants or revokes store access.
 *
 * No companies and no base groups: a shared group is a user group its creator
 * can share. Only the creator manages it; who's calling comes from the login
 * token, and nothing takes a company or userid. Below owner level (7) the
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

/** The shared groups the caller created, sorted by name, each with its stores
 *  and who it's shared with. */
export const getSharedGroups = (url: string, token: string) =>
  call(url, token, "GET", "");

/** Active users who share a company with the caller (not the caller), plus
 *  anyone who already has one of their groups — each with `user_level` and
 *  which of the caller's groups they have. */
export const getSharedGroupUsers = (url: string, token: string) =>
  call(url, token, "GET", "users");

/** Just a name, like a user group; `storeids` is optional. */
export const createSharedGroup = (
  url: string,
  token: string,
  name: string,
  storeids?: number[],
) => call(url, token, "POST", "", storeids?.length ? { name, storeids } : { name });

export const renameSharedGroup = (url: string, token: string, groupid: number, name: string) =>
  call(url, token, "PUT", String(groupid), { name });

/** Removes it for the caller and everyone it's shared with. */
export const deleteSharedGroup = (url: string, token: string, groupid: number) =>
  call(url, token, "DELETE", String(groupid));

/** The store picker for a group: every store the caller is assigned to,
 *  `active` if in the group, plus any store still in the group they've lost
 *  access to (`assigned: 0`). */
export const getSharedGroupStores = (url: string, token: string, groupid: number) =>
  call(url, token, "GET", `${groupid}/stores`);

/** Reaches everyone it's shared with. */
export const addSharedGroupStores = (
  url: string,
  token: string,
  groupid: number,
  storeids: number[],
) => call(url, token, "POST", `${groupid}/stores`, { storeids });

/** Once a group is shared it can't be emptied; the router says so. */
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
