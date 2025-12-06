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

export const getStoresWithGroupStatusResp = {
  data: {
    error: 0,
    success: true,
    stores: [
      {
        store_number: "1",
        store_name: "Store 1",
        storeid: 1,
        active: 1,
      },
      {
        store_number: "10",
        store_name: "Store 10",
        storeid: 2,
        active: 0,
      },
      {
        store_number: "11",
        store_name: "Store 11",
        storeid: 3,
        active: 1,
      },
      {
        store_number: "116",
        store_name: "Store 116",
        storeid: 4,
        active: 0,
      },
      {
        store_number: "12",
        store_name: "Store 12",
        storeid: 5,
        active: 0,
      },
      {
        store_number: "15",
        store_name: "Store 15",
        storeid: 6,
        active: 1,
      },
    ],
  },
};
