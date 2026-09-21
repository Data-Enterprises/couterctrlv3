import axios from "axios";

/**
 * The shared_groups router: store groups an owner builds and shares with other
 * users as a search filter. Nothing here grants or revokes store access — that
 * is base groups' job (api/baseGroups.ts).
 *
 * Every call names the company. The server checks the group's stores and every
 * user belong to it. Below owner level (7) the router answers HTTP 403 rather
 * than the usual `{ error: 1 }` envelope — see `isForbidden`.
 */

const call = (
  url: string,
  token: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  opts: { params?: Record<string, unknown>; data?: unknown } = {},
) =>
  axios({
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "shared_groups/" + path,
    ...opts,
  });

/** The router's level gate answers with a status, not an envelope. */
export const isForbidden = (err: unknown) =>
  (err as { response?: { status?: number } })?.response?.status === 403;

/** Reads take every company at once: ?company=1,4,6. */
const companiesParam = (companies: number[]) => ({ company: companies.join(",") });

export const getSharedGroups = (url: string, token: string, companies: number[]) =>
  call(url, token, "GET", "", { params: companiesParam(companies) });

export const getSharedGroupUsers = (url: string, token: string, companies: number[]) =>
  call(url, token, "GET", "users", { params: companiesParam(companies) });

export const getSharedGroupTemplates = (url: string, token: string, companies: number[]) =>
  call(url, token, "GET", "templates", { params: companiesParam(companies) });

/** Every store in the companies, for picking a group's stores. */
export const getSharedGroupStores = (url: string, token: string, companies: number[]) =>
  call(url, token, "GET", "stores", { params: companiesParam(companies) });

export const createSharedGroup = (
  url: string,
  token: string,
  company: number,
  name: string,
  storeids: number[],
) => call(url, token, "POST", "", { data: { company, name, storeids } });

export const renameSharedGroup = (
  url: string,
  token: string,
  groupid: number,
  company: number,
  name: string,
) => call(url, token, "PUT", String(groupid), { data: { company, name } });

export const deleteSharedGroup = (
  url: string,
  token: string,
  groupid: number,
  company: number,
) => call(url, token, "DELETE", String(groupid), { params: { company } });

/** Reaches the owner and everyone the group is shared with. */
export const addSharedGroupStores = (
  url: string,
  token: string,
  groupid: number,
  company: number,
  storeids: number[],
) => call(url, token, "POST", `${groupid}/stores`, { data: { company, storeids } });

/** Refused if it would leave the group with no stores. */
export const removeSharedGroupStores = (
  url: string,
  token: string,
  groupid: number,
  company: number,
  storeids: number[],
) => call(url, token, "DELETE", `${groupid}/stores`, { data: { company, storeids } });

export const shareSharedGroups = (
  url: string,
  token: string,
  company: number,
  sharedGroupIds: number[],
  userids: number[],
) =>
  call(url, token, "POST", "share", {
    data: { company, shared_group_ids: sharedGroupIds, userids },
  });

export const unshareSharedGroups = (
  url: string,
  token: string,
  company: number,
  sharedGroupIds: number[],
  userids: number[],
) =>
  call(url, token, "POST", "unshare", {
    data: { company, shared_group_ids: sharedGroupIds, userids },
  });
