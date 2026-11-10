import { describe, expect, it } from "vitest";
import { passwordOk, passwordRules } from "./passwordRules";

describe("the password rules", () => {
  it("are enforced, not just listed", () => {
    expect(passwordOk("a")).toBe(false);
    expect(passwordOk("alllowercase123!")).toBe(false);
    expect(passwordOk("Short1!")).toBe(false);
    expect(passwordOk("Long-enough-Pass1")).toBe(true);
  });

  it("say which are met, for the list beside the field", () => {
    expect(passwordRules("abcdefghijkl").map((r) => r.met)).toEqual([true, false, false, false]);
  });
});
