import { describe, expect, it } from "vitest";
import { leftOutMessage, onlyAssigned } from "./assignedStores";

/** A shared group can hold stores the user isn't assigned; the backend refuses
 *  a list naming any of them, so they are left out before sending. */
describe("onlyAssigned", () => {
  const group = [{ storeid: 1 }, { storeid: 2 }, { storeid: 3 }];

  it("keeps the user's own stores", () => {
    expect(onlyAssigned(group, [{ storeid: 3 }, { storeid: 1 }])).toEqual([{ storeid: 1 }, { storeid: 3 }]);
  });

  it("leaves nothing when none are the user's", () => {
    expect(onlyAssigned(group, [{ storeid: 9 }])).toEqual([]);
  });

  it("says how many were left out", () => {
    expect(leftOutMessage(1)).toBe("1 of this group's stores isn't assigned to you and was left out.");
    expect(leftOutMessage(2)).toBe("2 of this group's stores aren't assigned to you and were left out.");
  });
});
