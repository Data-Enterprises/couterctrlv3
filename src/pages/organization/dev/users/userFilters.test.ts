import { describe, expect, it } from "vitest";
import type { User } from "../../../../interfaces";
import { filterUsers, NO_COMPANY_VALUE } from "./userFilters";

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
