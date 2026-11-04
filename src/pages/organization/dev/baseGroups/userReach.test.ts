import { describe, expect, it } from "vitest";
import { withinReachOf } from "./userReach";
import type { User } from "../../../../interfaces";

const user = (id: number, user_level: number) => ({ id, user_level }) as User;
const row = (userid: number) => ({ userid, username: `u${userid}`, email: null });

describe("withinReachOf", () => {
  const users = [user(1, 3), user(2, 7), user(3, 9)];

  it("keeps people at or below the viewer's level", () => {
    const reach = withinReachOf(users, 7);
    expect(reach(row(1))).toBe(true);
    expect(reach(row(2))).toBe(true);
    expect(reach(row(3))).toBe(false);
  });

  it("hides anyone whose level it does not know", () => {
    expect(withinReachOf(users, 9)(row(42))).toBe(false);
    expect(withinReachOf([], 9)(row(1))).toBe(false);
  });
});
