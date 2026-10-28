import { describe, it, expect, beforeEach, vi } from "vitest";
import { shouldSignOut, signOutReasonFor } from "./sessionGuard";

const DEV = "https://dev.example.test/";
const PROD = "https://api.example.test/";

const err = (status: number, url: string) => ({
  response: { status } as never,
  config: { url } as never,
});

const SIGNED_IN = { loggedIn: true, apiEnv: "dev" as const };

describe("shouldSignOut", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_URL_DEV", DEV);
    vi.stubEnv("VITE_API_URL_PROD", PROD);
  });

  it("signs out on a 401 from our API", () => {
    expect(shouldSignOut(err(401, DEV + "users/"), SIGNED_IN)).toBe(true);
  });

  it("counts the prod base URL as ours too", () => {
    expect(shouldSignOut(err(401, PROD + "sales/topitems"), SIGNED_IN)).toBe(true);
  });

  it("leaves a wrong password to the sign-in form", () => {
    expect(shouldSignOut(err(401, DEV + "auth/login"), SIGNED_IN)).toBe(false);
  });

  it("leaves another backend's 401 alone", () => {
    expect(shouldSignOut(err(401, "https://legacy.example.test/x"), SIGNED_IN)).toBe(false);
  });

  it("ignores anything but a 401", () => {
    expect(shouldSignOut(err(403, DEV + "users/"), SIGNED_IN)).toBe(false);
    expect(shouldSignOut(err(500, DEV + "users/"), SIGNED_IN)).toBe(false);
  });

  it("signs out once: the rest of the burst arrives already signed out", () => {
    expect(
      shouldSignOut(err(401, DEV + "users/"), { loggedIn: false, apiEnv: "dev" }),
    ).toBe(false);
  });

  it("stays out of prod mode until prod is promoted", () => {
    expect(
      shouldSignOut(err(401, PROD + "users/"), { loggedIn: true, apiEnv: "prod" }),
    ).toBe(false);
  });
});

describe("signOutReasonFor", () => {
  it("says the account was deactivated when the API says so", () => {
    expect(signOutReasonFor("This account is no longer active")).toMatch(/deactivated/);
  });

  it("says the session ended for anything else", () => {
    expect(signOutReasonFor("Invalid token, details: Signature has expired")).toMatch(
      /session has ended/,
    );
    expect(signOutReasonFor(undefined)).toMatch(/session has ended/);
  });
});
