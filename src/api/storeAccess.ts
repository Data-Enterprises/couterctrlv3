import axios from "axios";

/**
 * Who holds a store, and moving people in and out of it.
 *
 * Store-centric, unlike `stores/assign_store` and `stores/unassign_store`,
 * which take one user and many stores. A panel organised around one store
 * hands over one store and many users, so these are the mirror of that pair
 * and the reason they exist.
 */

/** One row of the assigned column. */
export interface StoreUserRow {
  userid: number;
  username: string;
  email: string | null;
  /**
   * The base group that accounts for this person holding the store, or null
   * for a direct assignment.
   *
   * Null means nothing but this screen granted it, and no group change can
   * take it away. A name means the opposite: the grant belongs to that group,
   * and this screen will refuse to remove it.
   */
  via: string | null;
}

/** One row of the unassigned column, which has no `via` to have. */
export interface StoreCandidateRow {
  userid: number;
  username: string;
  email: string | null;
}

/** A user the server declined to change, and why. */
export interface SkippedUser {
  userid: number;
  reason: string;
  /** The group doing the granting, when that is the reason. */
  via: string | null;
}

/**
 * Both columns for one store, in one call.
 *
 * Scoped server-side to the store's own company, so the unassigned column is
 * the people who could hold it rather than every user in the system.
 */
export const getStoreUsers = async (
  url: string,
  token: string,
  storeid: number,
) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "stores/store_users",
    params: { storeid },
  });
  return json;
};

/**
 * Give a store to several users at once.
 *
 * Writes a plain `assigned` row and no `assigned_via`, which makes it **fixed
 * access**: no group change can ever revoke it, and Edit user shows it as
 * `direct`. That is a different kind of grant from the Companies and Base
 * Groups tabs, which hand over something a group can later take back.
 */
export const assignStoreToUsers = async (
  url: string,
  token: string,
  storeid: number,
  userids: number[],
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "stores/assign_store_to_users",
    data: { storeid, userids },
  });
  return json;
};

/**
 * Take a store back off several users.
 *
 * Users who hold it through a base group come back in `skipped` rather than
 * being removed. Deleting such a row would leave the group link, the group's
 * membership and the store all intact with nothing re-adding it — the removal
 * would look like it worked and then the next re-grant of that group would
 * quietly undo it. The fix for those is on the group.
 */
export const unassignStoreFromUsers = async (
  url: string,
  token: string,
  storeid: number,
  userids: number[],
) => {
  const json = await axios({
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "stores/unassign_store_from_users",
    data: { storeid, userids },
  });
  return json;
};
