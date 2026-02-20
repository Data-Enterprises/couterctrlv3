import type { Group } from "../../../features/groupSlice";

export const fakeStores = [
  {
    storeid: 1,
    store_number: "001",
    store_name: "Store One",
    company: 1,
    company_name: "Test Company"
  },
  {
    storeid: 2,
    store_number: "002",
    store_name: "Store Two",
    company: 1,
    company_name: "Test Company"
  },
  {
    storeid: 3,
    store_number: "003",
    store_name: "Store Three",
    company: 1,
    company_name: "Test Company"
  },
];

export const fakeGroups: Group[] = [
  {
    id: 1,
    userid: 1,
    group_name: "Group One",
  },
  {
    id: 2,
    userid: 1,
    group_name: "Group Two",
  },
  {
    id: 3,
    userid: 1,
    group_name: "Group Three",
  },
];
