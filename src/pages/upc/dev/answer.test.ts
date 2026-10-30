import { describe, expect, it } from "vitest";
import { answerOf } from "./answer";

describe("answerOf", () => {
  it("reads error 0 as an answer with data", () => {
    expect(answerOf({ error: 0, success: true })).toBe("ok");
  });

  it("reads 'No data was returned.' as an empty answer, not a failure", () => {
    expect(answerOf({ error: 1, success: true })).toBe("empty");
  });

  it("reads a real failure as one", () => {
    expect(answerOf({ error: 1, success: false })).toBe("failed");
    // No success flag at all: nothing says the UPCs were answered.
    expect(answerOf({ error: 1 })).toBe("failed");
    expect(answerOf(undefined)).toBe("failed");
  });
});
