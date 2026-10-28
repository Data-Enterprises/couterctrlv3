import axios from "axios";
import type { UserData } from "../features/usersSlice";
import type { GrantMode } from "../interfaces";

/**
 * Every base group in the user's companies, split by whether they hold it.
 *
 * Returns `{ active, inactive }` — **not** `{ groups }`. The name and the old
 * comment both said `base_groups_assigned_to_user`, which is a real endpoint
 * returning the other shape, and three callers read `j.groups` off this one
 * and silently got `undefined`. It calls the `_split` twin; the name is left
 * alone because four other callers already read it correctly.
 *
 * `active` rows are the ones the user holds, each carrying its `mode` —
 * `all` or `selected`. That is the whole list Edit user needs: no filtering,
 * because the split already did it.
 */
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
/**
 * Grant base groups to a user, in one mode.
 *
 * `all` hands over the whole group and whatever is added to it later; the
 * endpoint writes the roster into `assigned` and records no provenance,
 * because the group itself is the reason.
 *
 * `selected` hands over `storeids` only, and they must already be in the
 * group — the endpoint drops any that are not rather than granting a store
 * the group does not contain. Those picks are recorded in `assigned_via`, so
 * revoking the group later removes exactly them and leaves alone any store
 * another group still accounts for.
 *
 * One mode per call, so a user holding East as `all` and South as `selected`
 * is two calls. See `useAccessSave`.
 *
 * **`mode` is required, deliberately.** There is no safe default to fall back
 * on: the server's own is `'selected'`, and `'selected'` with no storeids is
 * refused outright — so a caller that omits it does not get the old
 * behaviour, it gets a 400. Defaulting to `'all'` here instead would be worse
 * in a different way, silently handing over a whole group and every store
 * later added to it. Required means the question gets answered at each call
 * site, and a new caller that forgets will not compile.
 */
export const assignBaseGroupToUser = async (
  url: string,
  token: string,
  userid: number,
  groupid: number[],
  mode: GrantMode,
  storeids?: number[],
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
      mode,
      ...(mode === "selected" ? { storeids: storeids ?? [] } : {}),
    },
  });
  return json;
};

/**
 * Which stores a user picked, and through which group.
 *
 * The other half of `mode`: that says a group is held as `selected`, this
 * says which stores were selected in it. A group held as `all` has no rows
 * here at all, and its absence is the answer rather than a gap.
 *
 * Replaces the guess the access panel used to make — a store from
 * `users/stores` carried no group, so it was tagged with group 0.
 */
export const getUserGroupPicks = async (
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
    url: url + "groups/user_group_picks",
    params: { userid },
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

/** What `users/set_active` says about each name it was given. */
export interface SetActiveResult {
  error: number;
  success: boolean;
  msg?: string;
  /** Moved to the requested state. */
  changed: string[];
  /** Found and allowed, but already in that state. Not a failure. */
  unchanged: string[];
  /** Found, but a guard said no. `reason` is written to be shown as is. */
  refused: { username: string; reason: string }[];
  not_found: string[];
}

/**
 * Deactivate (`active: 0`) or reactivate (`active: 1`) a list of users.
 *
 * The guarded replacement for `deleteUser` / `reactivateUser`, which check
 * nothing — any signed-in caller could deactivate anyone, themselves
 * included. This refuses, per name: outside the caller's companies, the
 * caller, anyone at a higher level, and a username shared by several
 * accounts. The rest change in one statement, and every name comes back in
 * exactly one of the four lists, so a confirmation that promised a list of
 * people can answer for each of them.
 *
 * Only `users.active` moves; links and assignments are untouched, so a
 * reactivated user gets back exactly the access they had. Deactivating also
 * ends a signed-in session on its next request.
 */
export const setUsersActive = async (
  url: string,
  token: string,
  usernames: string[],
  active: 0 | 1,
) => {
  const json = await axios<SetActiveResult>({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "users/set_active",
    data: { usernames, active },
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

export const checkEmail = async (url: string, token: string, email: string) => {
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

export const reactivateUser = async (url: string, token: string, username: string) => {
  const json = await axios({
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "users/reactivate_user",
    data: {
      username,
    },
  });
  return json;
};
