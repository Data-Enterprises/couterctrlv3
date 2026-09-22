import axios from "axios";

/**
 * The shared_groups router: store groups an owner builds and shares with other
 * users. They behave like the user's own store groups, except other people can
 * search with them. Nothing here grants or revokes store access.
 *
 * Every shared group belongs to one company (the company of its stores), and
 * any owner in that company can manage it. Who's calling comes from the login
 * token; only create and the two company lists name a company — everything
 * else works it out from the group. Below owner level (7) the router answers
 * HTTP 403 rather than the usual `{ error: 1 }` envelope — see `isForbidden`.
 * Recipients never call it: groups shared with them come from `GET /groups/`
 * like their own.
 */

const call = (
  url: string,
  token: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  data?: unknown,
  params?: Record<string, unknown>,
) =>
  axios({
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "shared_groups/" + path,
    ...(data !== undefined ? { data } : {}),
    ...(params ? { params } : {}),
  });

/** The router's level gate answers with a status, not an envelope. */
export const isForbidden = (err: unknown) =>
  (err as { response?: { status?: number } })?.response?.status === 403;

/** Every shared group in the caller's companies, with its company, stores and
 *  recipients. */
export const getSharedGroups = (url: string, token: string) =>
  call(url, token, "GET", "");

/** The company's active users (not the caller), each with `user_level` and
 *  which of the company's shared groups they have. */
export const getSharedGroupUsers = (url: string, token: string, company: number) =>
  call(url, token, "GET", "users", undefined, { company });

/** The caller's assigned stores in a company — the picker for a new group. */
export const getSharedGroupCompanyStores = (url: string, token: string, company: number) =>
  call(url, token, "GET", "stores", undefined, { company });

/** A group needs a company and at least one of the caller's stores in it. */
export const createSharedGroup = (
  url: string,
  token: string,
  company: number,
  name: string,
  storeids: number[],
) => call(url, token, "POST", "", { company, name, storeids });

export const renameSharedGroup = (url: string, token: string, groupid: number, name: string) =>
  call(url, token, "PUT", String(groupid), { name });

/** Removes it for the caller and everyone it's shared with. */
export const deleteSharedGroup = (url: string, token: string, groupid: number) =>
  call(url, token, "DELETE", String(groupid));

/** The store picker for a group: the caller's assigned stores in its company,
 *  `active` if in the group, plus any store in the group the caller isn't
 *  assigned to (`assigned: 0`). */
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
