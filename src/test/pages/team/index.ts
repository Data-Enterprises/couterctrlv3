export const baseGroupResp = {
  data: {
    error: 0,
    success: true,
    groups: [
      {
        id: 59,
        name: "Simple Test",
        active: 1,
      },
      {
        id: 1,
        name: "TEST GROUP",
        active: 1,
      },
      {
        id: 41,
        name: "Test Portal group",
        active: 0,
      },
      {
        id: 28,
        name: "Test Restaraunt",
        active: 0,
      },
    ],
  },
};

export const qsUserResp = {
  data: {
    error: 0,
    success: true,
    users: ["test@example.com", "test3@example.com"],
  },
};

export const allUsersResp = {
  data: {
    error: 0,
    success: true,
    msg: "Success",
    users: [
      {
        id: 1,
        username: "test1",
        password: "SomeR@ndomPassword123!",
        user_level: 7,
        last_visit: null,
        join_date: null,
        first_name: "one",
        last_name: "test",
        email: "test@example.com",
        companies: [
          {
            id: 4,
            company: 5,
            userid: 1,
            name: "DCR",
            username: "tguy",
          },
        ],
        active: 1,
        template: 1,
        security: 1,
        role: 5,
        password_change_needed: 0,
        logged_in: 1,
        security_question_id: 1,
        security_answer: "",
      },
      {
        id: 2,
        username: "test2",
        password: "",
        user_level: 5,
        last_visit: null,
        join_date: null,
        first_name: "two",
        last_name: "fake",
        email: "test2@example.com",
        companies: [
          {
            id: 1,
            company: 1,
            userid: 1,
            name: "Test Company 1",
            username: "tguy",
          },
        ],
        active: 1,
        template: 1,
        security: null,
        role: null,
        password_change_needed: 0,
        logged_in: 1,
        security_question_id: 1,
        security_answer: "",
      },
      {
        id: 3,
        username: "test3",
        password: "",
        user_level: 0,
        last_visit: null,
        join_date: null,
        first_name: "three",
        last_name: "example",
        email: "test3@example.com",
        companies: [
          {
            id: 1,
            company: 1,
            userid: 1,
            name: "Test Company 1",
            username: "tguy",
          },
        ],
        active: 1,
        template: 1,
        security: 1,
        role: null,
        password_change_needed: 0,
        logged_in: 1,
        security_question_id: 1,
        security_answer: "",
      },
      {
        id: 4,
        username: "test4",
        password: "",
        user_level: 5,
        last_visit: null,
        join_date: null,
        first_name: "four",
        last_name: "notreal",
        email: "test4@example.com",
        companies: [],
        active: 1,
        template: 1,
        security: null,
        role: null,
        password_change_needed: 0,
        logged_in: 1,
        security_question_id: 1,
        security_answer: "",
      },
      {
        id: 5,
        username: "test5",
        password: "",
        user_level: 5,
        last_visit: null,
        join_date: null,
        first_name: "five",
        last_name: "who",
        email: "test5@example.com",
        companies: [],
        active: 1,
        template: 1,
        security: null,
        role: null,
        password_change_needed: 0,
        logged_in: 1,
        security_question_id: 1,
        security_answer: "",
      },
      {
        id: 6,
        username: "test6",
        password: "",
        user_level: 5,
        last_visit: null,
        join_date: null,
        first_name: "six",
        last_name: "Jenkins",
        email: "test6@example.com",
        companies: [],
        active: 1,
        template: 1,
        security: null,
        role: null,
        password_change_needed: 0,
        logged_in: 1,
        security_question_id: 1,
        security_answer: "",
      },
    ],
  },
};

export const updateUserResp = {
  data: {
    error: 0,
    success: true,
    msg: "User updated successfully",
  },
};

export const deleteUpdateBaseGroupLinkResp = {
  data: {
    error: 0,
    success: true,
  },
};

export const defaultResp = { data: { error: 0 } };
export const defaultErrorResp = new Error("An error occurred");

export const allAssignedStoresResp = {
  data: {
    error: 0,
    success: true,
    all_stores_for_user: [],
    assigned_stores: [
      {
        storeid: 1,
        store_number: "1",
        store_name: "Store 1",
        company_id: 1,
        company_name: "Test Company",
      },
      {
        storeid: 2,
        store_number: "2",
        store_name: "Store 2",
        company_id: 1,
        company_name: "Test Company",
      },
      {
        storeid: 3,
        store_number: "3",
        store_name: "Store 3",
        company_id: 2,
        company_name: "Test Company 2",
      },
      {
        storeid: 4,
        store_number: "4",
        store_name: "Store 4",
        company_id: 2,
        company_name: "Test Company 2",
      },
      {
        storeid: 5,
        store_number: "5",
        store_name: "Store 5",
        company_id: 1,
        company_name: "Test Company",
      },
      {
        storeid: 6,
        store_number: "6",
        store_name: "Store 6",
        company_id: 2,
        company_name: "Test Company 2",
      },
    ],
    unassigned_stores: [],
  },
};

export const allUnassignedStoresResp = {
  data: {
    error: 0,
    success: true,
    all_stores_for_user: [],
    assigned_stores: [],
    unassigned_stores: [
      {
        storeid: 1,
        store_number: "1",
        store_name: "Store 1",
        company_id: 1,
        company_name: "Test Company",
      },
      {
        storeid: 2,
        store_number: "2",
        store_name: "Store 2",
        company_id: 1,
        company_name: "Test Company",
      },
      {
        storeid: 3,
        store_number: "3",
        store_name: "Store 3",
        company_id: 2,
        company_name: "Test Company 2",
      },
      {
        storeid: 4,
        store_number: "4",
        store_name: "Store 4",
        company_id: 2,
        company_name: "Test Company 2",
      },
      {
        storeid: 5,
        store_number: "5",
        store_name: "Store 5",
        company_id: 1,
        company_name: "Test Company",
      },
      {
        storeid: 6,
        store_number: "6",
        store_name: "Store 6",
        company_id: 2,
        company_name: "Test Company 2",
      },
    ],
  },
};

export const unassignOneStoreResp = {
  data: {
    error: 0,
    success: true,
    all_stores_for_user: [],
    assignedStores: [
      {
        storeid: 2,
        store_number: "2",
        store_name: "Store 2",
        company_id: 1,
        company_name: "Test Company",
      },
      {
        storeid: 3,
        store_number: "3",
        store_name: "Store 3",
        company_id: 2,
        company_name: "Test Company 2",
      },
      {
        storeid: 4,
        store_number: "4",
        store_name: "Store 4",
        company_id: 2,
        company_name: "Test Company 2",
      },
      {
        storeid: 5,
        store_number: "5",
        store_name: "Store 5",
        company_id: 1,
        company_name: "Test Company",
      },
      {
        storeid: 6,
        store_number: "6",
        store_name: "Store 6",
        company_id: 2,
        company_name: "Test Company 2",
      },
    ],
    unassignedStores: [
      {
        storeid: 1,
        store_number: "1",
        store_name: "Store 1",
        company_id: 1,
        company_name: "Test Company",
      },
    ],
  },
};

export const assignOneStoreResp = {
  data: {
    error: 0,
    success: true,
    all_stores_for_user: [],
    assignedStores: [
      {
        storeid: 1,
        store_number: "1",
        store_name: "Store 1",
        company_id: 1,
        company_name: "Test Company",
      },
    ],
    unassignedStores: [
      {
        storeid: 2,
        store_number: "2",
        store_name: "Store 2",
        company_id: 1,
        company_name: "Test Company",
      },
      {
        storeid: 3,
        store_number: "3",
        store_name: "Store 3",
        company_id: 2,
        company_name: "Test Company 2",
      },
      {
        storeid: 4,
        store_number: "4",
        store_name: "Store 4",
        company_id: 2,
        company_name: "Test Company 2",
      },
      {
        storeid: 5,
        store_number: "5",
        store_name: "Store 5",
        company_id: 1,
        company_name: "Test Company",
      },
      {
        storeid: 6,
        store_number: "6",
        store_name: "Store 6",
        company_id: 2,
        company_name: "Test Company 2",
      },
    ],
  },
};

export const userStoresResp = {
  data: {
    error: 0,
    success: true,
    all_stores_for_user: [],
    assigned_stores: [
      {
        storeid: 1,
        store_number: "1",
        store_name: "Store 1",
        company_id: 1,
        company_name: "Test Company",
      },
      {
        storeid: 2,
        store_number: "2",
        store_name: "Store 2",
        company_id: 1,
        company_name: "Test Company",
      },
      {
        storeid: 3,
        store_number: "3",
        store_name: "Store 3",
        company_id: 2,
        company_name: "Test Company 2",
      },
      {
        storeid: 4,
        store_number: "4",
        store_name: "Store 4",
        company_id: 2,
        company_name: "Test Company 2",
      },
    ],
    unassigned_stores: [
      {
        storeid: 5,
        store_number: "5",
        store_name: "Store 5",
        company_id: 1,
        company_name: "Test Company",
      },
      {
        storeid: 6,
        store_number: "6",
        store_name: "Store 6",
        company_id: 2,
        company_name: "Test Company 2",
      },
    ],
  },
};

export const updatedUserStoresResp = {
  data: {
    error: 0,
    success: true,
    all_stores_for_user: [],
    assigned_stores: [
      {
        storeid: 2,
        store_number: "2",
        store_name: "Store 2",
      },
      {
        storeid: 3,
        store_number: "3",
        store_name: "Store 3",
      },
      {
        storeid: 4,
        store_number: "4",
        store_name: "Store 4",
      },
      {
        storeid: 5,
        store_number: "5",
        store_name: "Store 5",
      },
    ],
    unassigned_stores: [
      {
        storeid: 1,
        store_number: "1",
        store_name: "Store 1",
      },
      {
        storeid: 6,
        store_number: "6",
        store_name: "Store 6",
      },
    ],
  },
};

export const loggedInUserCompanies = [
  {
    id: 1,
    company: 1,
    userid: 1,
    name: "Test Company 1",
    username: "tguy",
  },
  {
    id: 2,
    company: 2,
    userid: 1,
    name: "Test Company 2",
    username: "tguy",
  },
  {
    id: 3,
    company: 3,
    userid: 1,
    name: "Test Company 3",
    username: "tguy",
  },
  {
    id: 4,
    company: 5,
    userid: 1,
    name: "DCR",
    username: "tguy",
  },
];

export const nonDCRCompanies = [
  {
    id: 1,
    company: 1,
    userid: 1,
    name: "Test Company 1",
    username: "tguy",
  },
  {
    id: 2,
    company: 2,
    userid: 1,
    name: "Test Company 2",
    username: "tguy",
  },
  {
    id: 3,
    company: 3,
    userid: 1,
    name: "Test Company 3",
    username: "tguy",
  },
];

export const nonDCRUserCompanies = [
  {
    id: 1,
    company: 1,
    userid: 1,
    name: "Test Company 1",
    username: "tguy",
  },
  {
    id: 2,
    company: 2,
    userid: 1,
    name: "Test Company 2",
    username: "tguy",
  },
  {
    id: 3,
    company: 3,
    userid: 1,
    name: "Test Company 3",
    username: "tguy",
  },
];

export const userLvlResp = {
  data: {
    error: 0,
    success: true,
    levels: [
      {
        id: 1,
        name: "Basic User",
      },
      {
        id: 2,
        name: "User",
      },
      {
        id: 5,
        name: "Manager",
      },
      {
        id: 7,
        name: "Owner",
      },
      {
        id: 8,
        name: "Ticket Tech",
      },
      {
        id: 9,
        name: "Programmer",
      },
    ],
  },
};

export const getBGResp = {
  data: {
    error: 0,
    success: true,
    group_count: 6,
    company: [
      {
        id: 1,
        name: "Food Giant",
        address: "",
        city: "",
        state: "",
        zip: 0,
        phone: "",
        contact_email: "jdilleha@dcrpos.com",
      },
    ],
    groups: [
      {
        id: 1,
        name: "All Stores",
        company: 1,
      },
      {
        id: 2,
        name: "test1",
        company: 1,
      },
      {
        id: 3,
        name: "Zone 1",
        company: 1,
      },
      {
        id: 4,
        name: "Zone 2",
        company: 1,
      },
      {
        id: 5,
        name: "Zone 3",
        company: 1,
      },
      {
        id: 6,
        name: "Zone 4",
        company: 1,
      },
    ],
  },
};

export const createUserResp = {
  data: {
    error: 0,
    success: true,
    new_userid: 50,
  },
};

export const assignedBGResp = {
  data: {
    error: 0,
    success: true,
    active: [
      {
        id: 1,
        name: "All Stores",
        company: 1,
        company_name: "Test Company 1",
        active: 1,
      },
    ],
    inactive: [],
  },
};