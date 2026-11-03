import { describe, expect, it } from "vitest";
import reducer, {
  markUserInfoSaved,
  resetUserInfo,
  setSelectedUserInfo,
  setSelectedUserStores,
  setUserInfo,
} from "./devUsersSlice";
import type { User } from "../../interfaces";

const bob = {
  id: 7,
  username: "bob",
  email: "bob@example.test",
  first_name: "Bob",
  last_name: "Smith",
  user_level: 2,
  role: 2,
  companies: [{ company: 1 }],
} as unknown as User;

const opened = () => reducer(undefined, setSelectedUserInfo(bob));

describe("Edit's details as opened", () => {
  it("are recorded when the person is opened, and edits don't move them", () => {
    let s = opened();
    s = reducer(s, setUserInfo({ key: "last_name", value: "Smyth" }));
    expect(s.userInfoBefore?.last_name).toBe("Smith");
    expect(s.userInfo.last_name).toBe("Smyth");
  });

  it("become the saved details after a save", () => {
    let s = reducer(opened(), setUserInfo({ key: "last_name", value: "Smyth" }));
    s = reducer(s, markUserInfoSaved());
    expect(s.userInfoBefore?.last_name).toBe("Smyth");
  });

  it("go when the form is reset, so Add has none", () => {
    const s = reducer(opened(), resetUserInfo());
    expect(s.userInfoBefore).toBeNull();
  });
});

describe("opening another person", () => {
  it("lets go of the last person's stores", () => {
    let s = reducer(
      undefined,
      setSelectedUserStores({
        assigned: [{ storeid: 301, store_number: "301", store_name: "A's store" }],
        unassigned: [],
      } as never),
    );
    s = reducer(s, setSelectedUserInfo(bob));
    expect(s.selectedUserStores.assigned).toEqual([]);
  });
});
