import { describe, it, expect } from "vitest";
import {
  leftWithNothing,
  planAdd,
  planRemove,
  summarize,
  type MemberUser,
  type UserOutcome,
} from "./companyMembership";

const user = (id: number, companies: number[]): MemberUser => ({
  id,
  companies,
});

describe("planAdd", () => {
  it("sends the user's WHOLE list, not just the company being added", () => {
    // The endpoint replaces: it deletes every company_link row the user has
    // and inserts what it is given. Sending [21] alone would silently strip
    // companies 7 and 9, with nothing erroring and the panel looking right.
    expect(planAdd([user(1, [7, 9])], 21)).toEqual([
      { userid: 1, companies: [7, 9, 21] },
    ]);
  });

  it("gives a user with no companies exactly the one being added", () => {
    expect(planAdd([user(1, [])], 21)).toEqual([
      { userid: 1, companies: [21] },
    ]);
  });

  it("skips a user who already holds it", () => {
    // Re-sending would delete and re-insert every row they have, for nothing,
    // and would report them in a count of users actually changed.
    expect(planAdd([user(1, [21]), user(2, [7])], 21)).toEqual([
      { userid: 2, companies: [7, 21] },
    ]);
  });

  it("does not duplicate when the list already contains it twice", () => {
    expect(planAdd([user(1, [7, 7])], 21)[0].companies).toEqual([7, 21]);
  });

  it("drops junk ids rather than sending them on", () => {
    expect(planAdd([user(1, [0, 7])], 21)[0].companies).toEqual([7, 21]);
  });

  it("is empty when nobody needs changing", () => {
    expect(planAdd([user(1, [21])], 21)).toEqual([]);
  });
});

describe("planRemove", () => {
  it("keeps every other company the user holds", () => {
    expect(planRemove([user(1, [7, 9, 21])], 21)).toEqual([
      { userid: 1, companies: [7, 9] },
    ]);
  });

  it("allows removing the last one, leaving an empty list", () => {
    expect(planRemove([user(1, [21])], 21)).toEqual([
      { userid: 1, companies: [] },
    ]);
  });

  it("skips a user who does not hold it", () => {
    expect(planRemove([user(1, [7])], 21)).toEqual([]);
  });
});

describe("leftWithNothing", () => {
  it("names the users who would hold no company", () => {
    expect(leftWithNothing(planRemove([user(1, [21]), user(2, [7, 21])], 21))).toEqual([1]);
  });

  it("is empty when everyone keeps something", () => {
    expect(leftWithNothing(planAdd([user(1, [7])], 21))).toEqual([]);
  });
});

describe("summarize", () => {
  const ok = (userid: number): UserOutcome => ({ userid, ok: true });
  const bad = (userid: number, reason: string): UserOutcome => ({
    userid,
    ok: false,
    reason,
  });

  it("counts what changed", () => {
    const s = summarize([ok(1), ok(2)], "Food Giant", "in");
    expect(s.text).toBe("2 users added to Food Giant.");
    expect(s.tone).toBe("success");
  });

  it("reads singular for one", () => {
    expect(summarize([ok(1)], "Food Giant", "out").text).toBe(
      "1 user removed from Food Giant.",
    );
  });

  it("says so when the selection needed no change at all", () => {
    // An empty plan is not a failure — everyone picked already held it.
    const s = summarize([], "Food Giant", "in");
    expect(s.tone).toBe("success");
    expect(s.text).toContain("already holds Food Giant");
  });

  it("does not report a partial failure as a clean success", () => {
    const s = summarize([ok(1), bad(2, "nope")], "Food Giant", "in");
    expect(s.tone).toBe("error");
    expect(s.text).toContain("1 user added");
    expect(s.text).toContain("1 could not be changed");
  });

  it("gives the reason when everything failed", () => {
    const s = summarize([bad(1, "server said no")], "Food Giant", "in");
    expect(s.tone).toBe("error");
    expect(s.text).toContain("server said no");
  });
});
