export const JsonErrorResp = new Error("API request failed");

export const userPrefsFalseResp = {
  data: {
    error: 1,
    success: false,
  },
};

export const userPrefsResp = {
  data: {
    error: 0,
    success: true,
    prefs: [
      {
        userid: 1,
        last_search: 1,
        last_group: 1,
        template: 1,
        last_search_type: "Store",
        last_route: "sales",
      },
    ],
  },
};

export const userPrefsResp2 = {
  data: {
    error: 0,
    success: true,
    prefs: [
      {
        userid: 1,
        last_search: 1,
        last_group: 1,
        template: 1,
        last_search_type: "2",
        last_route: "sales",
      },
    ],
  },
};
export const userPrefsResp3 = {
  data: {
    error: 0,
    success: true,
    prefs: [
      {
        userid: 1,
        last_search: 1,
        last_group: 2,
        template: 1,
        last_search_type: "3",
        last_route: "sales",
      },
    ],
  },
};

export const userPrefsResp4 = {
  data: {
    error: 0,
    success: true,
    prefs: [
      {
        userid: 1,
        last_search: 0,
        last_group: 0,
        template: 1,
        last_search_type: "",
        last_route: "",
      },
    ],
  },
};

export const userStoresResp = {
  data: {
    error: 0,
    success: true,
    all_stores_for_user: [
      {
        storeid: 1,
        store_number: "1",
        store_name: "Store 1",
        company: 1,
        company_name: "Test Company 1",
      },
    ],
    assigned_stores: [
      {
        storeid: 1,
        store_number: "1",
        store_name: "Store 1",
        company: 1,
        company_name: "Test Company 1",
      },
      {
        storeid: 2,
        store_number: "2",
        store_name: "Store 2",
        company: 1,
        company_name: "Test Company 1",
      },
      {
        storeid: 3,
        store_number: "3",
        store_name: "Store 3",
        company: 2,
        company_name: "Test Company 2",
      },
      {
        storeid: 4,
        store_number: "4",
        store_name: "Store 4",
        company: 2,
        company_name: "Test Company 2",
      },
    ],
    unassigned_stores: [
      {
        storeid: 5,
        store_number: "5",
        store_name: "Store 5",
        company: 1,
        company_name: "Test Company 1",
      },
      {
        storeid: 6,
        store_number: "6",
        store_name: "Store 6",
        company: 2,
        company_name: "Test Company 2",
      },
    ],
  },
};

export const getGroupsResp = {
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
