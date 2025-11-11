import axios from "axios";

/**
 *     {
      "userid": 517,
      "last_search": null,
      "last_group": 30,
      "template": 1,
      "last_search_type": "2",
      "last_route": "groups"
    }
 */
interface PrefsParams {
  userid: number;
  last_search?: number;
  last_group?: number;
  template?: number;
  last_search_type?: string;
  last_route?: string;
}

// GET
export const getUserStores = async (
  url: string,
  token: string,
  userid: number
) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "stores/unassigned_stores",
    params: {
      userid,
    },
  });
  return json;
};

export const getUserPrefs = async (url: string, token: string) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "user_preferences/prefs",
  });
  return json;
};

export const setUserPrefs = async (
  url: string,
  token: string,
  prefs: PrefsParams
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "user_preferences/update",
    data: prefs,
  });
  return json;
};

// GET
export const getAllUsers = async () => {};

// POST
export const createUser = async () => {};

// PUT
export const updateUser = async () => {};

// DELETE
export const deleteUser = async () => {};
