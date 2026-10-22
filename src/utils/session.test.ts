import { describe, expect, it } from "vitest";
import {
  impersonatedBy,
  impersonateFailureText,
  signInRefused,
  tokenClaim,
} from "./session";

const b64url = (o: object) =>
  btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const jwt = (payload: object) => `${b64url({ alg: "HS256" })}.${b64url(payload)}.sig`;
const refused = (status: number) => ({ response: { status, data: {} } });

describe("signInRefused", () => {
  it("reads a 401 as a wrong username or password", () => {
    expect(signInRefused(refused(401))).toBe(true);
  });

  it("reads any other 4xx the same way", () => {
    expect(signInRefused(refused(404))).toBe(true);
    expect(signInRefused(refused(422))).toBe(true);
  });

  it("reads no response, or a 5xx, as the server not answering", () => {
    expect(signInRefused(new Error("Network Error"))).toBe(false);
    expect(signInRefused(refused(502))).toBe(false);
    expect(signInRefused(undefined)).toBe(false);
  });
});

describe("tokenClaim / impersonatedBy", () => {
  it("names the caller behind an impersonated token", () => {
    const t = jwt({ sub: "tjsmith", imp: "C5m7b4", exp: 1 });
    expect(tokenClaim(t, "sub")).toBe("tjsmith");
    expect(impersonatedBy(t)).toBe("C5m7b4");
  });

  it("is null for an ordinary sign-in", () => {
    expect(impersonatedBy(jwt({ sub: "tjsmith", exp: 1 }))).toBeNull();
  });

  it("survives base64url characters and missing padding", () => {
    // This payload base64s with a '+' (sent as '-') and one '=' of padding
    // (dropped), the two things a plain atob would trip on.
    const t = jwt({ sub: "a", imp: "??>>~~" });
    expect(impersonatedBy(t)).toBe("??>>~~");
  });

  it("is null for anything that is not a token", () => {
    expect(impersonatedBy("")).toBeNull();
    expect(impersonatedBy("not-a-token")).toBeNull();
    expect(impersonatedBy("a.%%%.c")).toBeNull();
  });
});

describe("impersonateFailureText", () => {
  it("says what each refusal means", () => {
    expect(impersonateFailureText(refused(404), "tjsmith")).toBe(
      "There is no user named tjsmith.",
    );
    expect(impersonateFailureText(refused(400), "tjsmith")).toMatch(/inactive/);
    expect(impersonateFailureText(refused(403), "tjsmith")).toMatch(/level 9/);
    expect(impersonateFailureText(refused(401), "tjsmith")).toMatch(/Sign out/);
    expect(impersonateFailureText(new Error("x"), "tjsmith")).toMatch(/Try again/);
  });
});
