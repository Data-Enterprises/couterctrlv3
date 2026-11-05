import { describe, expect, it } from "vitest";
import type { User } from "@/interfaces";
import {
  accessLabel,
  filterUsers,
  filtersApplied,
  NO_COMPANY_VALUE,
  sortUsers,
} from "@/pages/organization/dev/users/userFilters";

const none = {
  companyFilter: "",
  statusFilter: "",
  levelFilter: "",
  roleFilter: "",
  accessFilter: "",
  searchText: "",
  usernameFilter: "",
  emailFilter: "",
};
const u = (id: number, over: Partial<User>) =>
  ({ id, username: `u${id}`, email: `u${id}@x.test`, first_name: "A", last_name: "B", user_level: 2, role: 2, companies: [], access_mode: "all", ...over }) as User;

const users = [
  u(1, { companies: [{ company: 1 }] as User["companies"], access_mode: "selected" }),
  u(2, { first_name: "Amy" }),
];

describe("the users grid's filters, outside the grid", () => {
  it("narrow as the grid does", () => {
    expect(filterUsers(users, { ...none, companyFilter: NO_COMPANY_VALUE }).map((x) => x.id)).toEqual([2]);
    expect(filterUsers(users, { ...none, accessFilter: "selected" }).map((x) => x.id)).toEqual([1]);
    expect(filterUsers(users, { ...none, searchText: "amy" }).map((x) => x.id)).toEqual([2]);
  });

  it("leave everyone when nothing is set", () => {
    expect(filterUsers(users, none)).toHaveLength(2);
  });
});

describe("the users export", () => {
  it("calls the list filtered when a filter is set, even if it matches everyone", () => {
    expect(filtersApplied(none)).toBe(false);
    expect(filtersApplied({ ...none, statusFilter: "inactive" })).toBe(false);
    expect(filtersApplied({ ...none, roleFilter: "2" })).toBe(true);
  });

  it("names the access type as the grid does", () => {
    expect(accessLabel("selected")).toBe("By store");
    expect(accessLabel(null)).toBe("Not set");
  });
});

describe("sorting the users grid", () => {
  const people = [
    u(1, { last_name: "Smith", user_level: 5, last_visit: "2026-10-01" }),
    u(2, { last_name: "adams", user_level: 2, last_visit: null }),
    u(3, { last_name: "Jones", user_level: 7, last_visit: "2026-11-02" }),
  ];
  const role = () => "";

  it("orders a column either way, case aside", () => {
    expect(sortUsers(people, { key: "last", desc: false }, role).map((x) => x.id)).toEqual([2, 3, 1]);
    expect(sortUsers(people, { key: "level", desc: true }, role).map((x) => x.id)).toEqual([3, 1, 2]);
  });

  it("puts a missing value last either way", () => {
    expect(sortUsers(people, { key: "visited", desc: false }, role).map((x) => x.id)).toEqual([1, 3, 2]);
    expect(sortUsers(people, { key: "visited", desc: true }, role).map((x) => x.id)).toEqual([3, 1, 2]);
  });

  it("leaves the list as it came with no sort", () => {
    expect(sortUsers(people, null, role)).toBe(people);
  });
});
