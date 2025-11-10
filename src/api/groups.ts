import axios from "axios";

export const getGroups = async (url: string, token: string) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "groups/",
  });

  return json;
};

// export const createGroup = (groupName: string, storeIds: number[]) => {};

// export const deleteGroup = (groupId: number) => {};

// export const updateGroup = (groupId: number, groupName: string, storeIds: number[]) => {};
