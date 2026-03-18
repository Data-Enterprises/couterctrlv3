import type { Store } from "../../../../interfaces";

export const assignedStores: Store[] = [
  {
    storeid: 1,
    company: 1,
    store_name: "Store 1",
    company_name: "Test Company 1",
    store_number: "1",
  },
  {
    storeid: 2,
    company: 2,
    store_name: "Store 2",
    company_name: "Test Company 2",
    store_number: "2",
  },
  {
    storeid: 3,
    company: 3,
    store_name: "Store 3",
    company_name: "Test Company 3",
    store_number: "3",
  },
  {
    storeid: 4,
    company: 4,
    store_name: "Store 4",
    company_name: "Test Company 4",
    store_number: "4",
  },
];

export const unassignedStores: Store[] = [
  {
    storeid: 5,
    company: 5,
    store_name: "Store 5",
    company_name: "Test Company 5",
    store_number: "5",
  },
  {
    storeid: 6,
    company: 6,
    store_name: "Store 6",
    company_name: "Test Company 6",
    store_number: "6",
  },
];

export const storesMissingSaleResp = {
  data: {
    error: 0,
    success: true,
    missing_store_count: 2,
    missing: [
      {
        storeid: 1,
        store_number: "1",
        store_name: "Store 1",
      },
      {
        storeid: 2,
        store_number: "2",
        store_name: "Store 2",
      },
    ],
  },
};
