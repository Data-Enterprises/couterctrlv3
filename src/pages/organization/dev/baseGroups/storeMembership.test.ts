import { describe, it, expect } from "vitest";
import {
  callReason,
  summarizeAssign,
  summarizeUnassign,
  type StoreOutcome,
} from "./storeMembership";

const added = (storeid: number, granted = 12, skippedSingleStore = 0): StoreOutcome => ({
  storeid,
  ok: true,
  granted,
  skippedSingleStore,
});

const removed = (storeid: number, revoked: number): StoreOutcome => ({
  storeid,
  ok: true,
  revoked,
});

const refused = (storeid: number, reason: string): StoreOutcome => ({
  storeid,
  ok: false,
  reason,
});

describe("summarizeAssign", () => {
  it("counts the auto holders once, not once per store", () => {
    // The trap: granted_to_users is a property of the GROUP, identical on
    // every call. Summed, four stores into a twelve-holder group would claim
    // forty-eight people gained access.
    const s = summarizeAssign([added(1), added(2), added(3), added(4)], "Zone 1");
    expect(s.text).toContain("4 stores added to Zone 1");
    expect(s.text).toContain("12 users with automatic access gained them");
    expect(s.text).not.toContain("48");
  });

  it("says plainly when nobody holds the group automatically", () => {
    const s = summarizeAssign([added(1, 0)], "Zone 1");
    expect(s.text).toContain("Nobody holds this group automatically");
    expect(s.tone).toBe("success");
  });

  it("reads singular for one store", () => {
    const s = summarizeAssign([added(1, 1)], "Zone 1");
    expect(s.text).toContain("1 store added");
    expect(s.text).toContain("1 user with automatic access gained it");
  });

  it("reports single-store users the server would not widen", () => {
    const s = summarizeAssign([added(1, 12, 2)], "Zone 1");
    expect(s.text).toContain("2 single-store users skipped");
  });

  it("is an error when every store was refused, and gives the reason", () => {
    const s = summarizeAssign(
      [refused(1, "store 1 is company 7; base group 9 is not")],
      "Zone 1",
    );
    expect(s.tone).toBe("error");
    expect(s.text).toContain("No stores were added");
    expect(s.text).toContain("company 7");
  });

  it("does not report a partial failure as a clean success", () => {
    const s = summarizeAssign([added(1), refused(2, "nope")], "Zone 1");
    expect(s.tone).toBe("error");
    expect(s.text).toContain("1 store added");
    expect(s.text).toContain("1 could not be added");
    expect(s).toMatchObject({ ok: 1, failed: 1 });
  });
});

describe("summarizeUnassign", () => {
  it("sums revocations, because each store's are its own", () => {
    const s = summarizeUnassign([removed(1, 4), removed(2, 5)], "Zone 1");
    expect(s.text).toContain("2 stores removed from Zone 1");
    expect(s.text).toContain("9 store grants revoked");
  });

  it("says grants rather than users, since one person can lose several", () => {
    const s = summarizeUnassign([removed(1, 3)], "Zone 1");
    expect(s.text).toContain("store grants revoked");
    expect(s.text).not.toMatch(/\d+ users? (lost|revoked)/);
  });

  it("explains a removal that revoked nothing rather than looking broken", () => {
    // The careful case: everyone still reaches those stores another way.
    const s = summarizeUnassign([removed(1, 0), removed(2, 0)], "Zone 1");
    expect(s.tone).toBe("success");
    expect(s.text).toContain("Nobody lost access");
  });

  it("is an error when nothing was removed", () => {
    const s = summarizeUnassign([refused(1, "gone")], "Zone 1");
    expect(s.tone).toBe("error");
    expect(s.text).toContain("No stores were removed");
  });
});

describe("callReason", () => {
  it("prefers FastAPI's detail, which is where the company guard speaks", () => {
    // A 400 throws, so this never reaches a .then — and err.message alone
    // would say "Request failed with status code 400" to somebody who needs
    // to be told the store belongs to another company.
    expect(
      callReason({
        response: { data: { detail: "store 5 is company 7; base group 9 is not" } },
        message: "Request failed with status code 400",
      }),
    ).toContain("company 7");
  });

  it("falls back to a body msg", () => {
    expect(callReason({ response: { data: { msg: "boom" } } })).toBe("boom");
  });

  it("falls back to the network message", () => {
    expect(callReason({ message: "Network Error" })).toBe("Network Error");
  });

  it("always says something", () => {
    expect(callReason({})).toBe("The server refused it.");
  });
});
