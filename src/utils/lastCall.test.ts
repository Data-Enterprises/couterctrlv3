import axios from "axios";
import { beforeEach, describe, expect, it } from "vitest";
import {
  armLastCall,
  clearLastCall,
  getLastCall,
  lastCallAsFile,
} from "./lastCall";

armLastCall();

/** Push a response through the registered interceptors the way axios does. */
const pass = (url: string, data: unknown, method = "get", status = 200) => {
  const handlers = (
    axios.interceptors.response as unknown as {
      handlers: { fulfilled: (r: unknown) => unknown }[];
    }
  ).handlers.filter(Boolean);
  for (const h of handlers) {
    h.fulfilled({ config: { url, method }, status, data });
  }
};

describe("lastCall", () => {
  beforeEach(clearLastCall);

  it("keeps the last response", () => {
    pass("https://api.example.com/sales/weekly?store=369", { rows: [1, 2] });
    const call = getLastCall();
    expect(call?.path).toBe("/sales/weekly");
    expect(call?.method).toBe("GET");
    expect(JSON.parse(call!.body)).toEqual({ rows: [1, 2] });
  });

  it("drops the query string, which is where ids end up", () => {
    pass("https://api.example.com/sales/weekly?token=abc&store=369", {});
    expect(getLastCall()?.path).toBe("/sales/weekly");
    expect(getLastCall()?.body).not.toContain("abc");
  });

  it.each([
    "/auth/token",
    "/auth/login",
    "/forgot_password/start",
    "/users/create",
  ])("never captures %s", (path) => {
    pass(`https://api.example.com${path}`, { secret: "shibboleth" });
    expect(getLastCall()).toBeNull();
  });

  it("caps a large body and says so", () => {
    pass("https://api.example.com/sales/export_preview", {
      rows: Array.from({ length: 20000 }, (_, i) => ({ i, pad: "x".repeat(40) })),
    });
    const call = getLastCall();
    expect(call?.truncated).toBe(true);
    expect(call!.body.endsWith("[truncated]")).toBe(true);
    // A few hundred KB, not half a megabyte.
    expect(call!.body.length).toBeLessThan(300 * 1024);
  });

  it("leaves a small body whole", () => {
    pass("https://api.example.com/tickets/lookups", { categories: [] });
    expect(getLastCall()?.truncated).toBe(false);
  });

  it("names the file after the path and declares its type", () => {
    pass("https://api.example.com/sub_dept/margins", { ok: true });
    const file = lastCallAsFile(getLastCall()!);
    expect(file.name).toBe("response-sub-dept-margins.json");
    // One of the three the endpoint accepts — a .json labelled text/html is
    // refused, so the type is set rather than left to the browser.
    expect(file.type).toBe("application/json");
  });

  it("survives a body it cannot serialise", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() => pass("https://api.example.com/x", circular)).not.toThrow();
    expect(getLastCall()).toBeNull();
  });
});
