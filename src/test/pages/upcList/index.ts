export const stores = [
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
];

export const groups = [
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
];

export const getGroupStoresResp = {
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
        store_name: "Fake 10",
        storeid: 2,
        active: 0,
      },
      {
        store_number: "11",
        store_name: "Random 11",
        storeid: 3,
        active: 1,
      },
    ],
  },
};

export const JsonErrorResp = new Error("API request failed");

export const salesCompResp = {
  error: 0,
  success: true,
  elapsed: "1.018105007000031",
  startdate: "2025-11-01T00:00:00",
  end_date: "2025-11-07T00:00:00",
  total_stores: 1,
  upc_count: 4,
  daily: [
    {
      product_code: "1800000735",
      description: "PIL CRESCENT ROUNDS 8 OZ",
      week: "2025-10-27T00:00:00",
      Saturday: 2.5,
      Sunday: 2.5,
      Friday: 0,
      Thursday: 0,
      Tuesday: 0,
    },
    {
      product_code: "1800000735",
      description: "PIL CRESCENT ROUNDS 8 OZ",
      week: "2025-11-03T00:00:00",
      Saturday: 0,
      Sunday: 0,
      Friday: 15,
      Thursday: 5,
      Tuesday: 15,
    },
  ],
};
