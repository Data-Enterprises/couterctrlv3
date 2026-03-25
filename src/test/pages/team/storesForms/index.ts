export const defaultError = new Error("Test error");
export const defaultResp = { data: { error: 0 } };

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
