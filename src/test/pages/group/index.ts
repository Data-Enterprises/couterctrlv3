export const defaultSuccessResp = { data: { error: "0", msg: "Success" } };

export const JsonErrorResp = new Error("API request failed");

export const getGroupsSuccessResp = {
  data: {
    error: 0,
    success: true,
    msg: "Success",
    groups: [
      {
        id: 1,
        userid: 0,
        group_name: "Test Group",
      },
      {
        id: 2,
        userid: 1,
        group_name: "Admins",
      },
      {
        id: 3,
        userid: 0,
        group_name: "Managers",
      },
      {
        id: 4,
        userid: 1,
        group_name: "Random Group",
      },
    ],
  },
};

export const updatedGroupsAfterDeleteResp = {
  data: {
    error: 0,
    success: true,
    msg: "Success",
    groups: [
      {
        id: 1,
        userid: 0,
        group_name: "Test Group",
      },
      {
        id: 2,
        userid: 1,
        group_name: "Admins",
      },
      {
        id: 4,
        userid: 1,
        group_name: "Random Group",
      },
    ],
  },
};
