import axios from "axios";

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

// GET
export const getAllUsers = async () => {};

// POST
export const createUser = async () => {};

// PUT
export const updateUser = async () => {};

// DELETE
export const deleteUser = async () => {};
