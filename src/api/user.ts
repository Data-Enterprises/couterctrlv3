import axios from "axios";

interface PrefsParams {
  userid: number;
  last_search?: number;
  last_group?: number;
  template?: number;
  last_search_type?: string;
  last_route?: string;
}

// getting all stores for the user, their assigned stores, and their unassigned stores
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

// getting all users for Team.tsx
export const getAllUsers = async (url: string, token: string) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    url: url + "users/",
  });
  return json;
};
