import { describe, expect, it } from "vitest";
import { groupStoresConfirm, peopleConfirm } from "./bulkConfirm";

describe("Unassign all and Assign all", () => {
  it("always ask before taking something off people, naming you", () => {
    expect(peopleConfirm({ direction: "out", ids: [1, 2, 3], me: 2, what: "Food Giant" })).toEqual({
      message: "Take Food Giant off 3 people, including you?",
      confirmLabel: "Yes, take it off",
    });
    expect(peopleConfirm({ direction: "out", ids: [7], me: 2, what: "store 301" })?.message).toBe(
      "Take store 301 off 1 person?",
    );
  });

  it("ask before giving something to more than a handful", () => {
    expect(peopleConfirm({ direction: "in", ids: [1, 2], me: 9, what: "East" })).toBeNull();
    expect(
      peopleConfirm({ direction: "in", ids: [1, 2, 3, 4, 5, 6], me: 9, what: "East" })?.message,
    ).toBe("Give East to 6 people?");
  });

  it("say what taking stores out of a group does to its holders", () => {
    expect(groupStoresConfirm({ direction: "out", count: 2, group: "East" })?.message).toMatch(
      /Everyone who holds East loses them/,
    );
    expect(groupStoresConfirm({ direction: "in", count: 3, group: "East" })).toBeNull();
  });
});

describe("on the Companies tab", () => {
  it("asks even for one person, so the list of who is moving always shows", () => {
    expect(peopleConfirm({ direction: "in", ids: [7], me: 2, what: "Bruces Foodland", always: true })?.message).toBe(
      "Give Bruces Foodland to 1 person?",
    );
  });
});
