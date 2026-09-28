import axios from "axios";
import { beforeEach, describe, expect, it } from "vitest";
import {
  armPageCalls,
  clearPageCalls,
  consolidate,
  getPageCalls,
  groupAsFile,
  groupNote,
  withinBudget,
  type CallGroup,
} from "./pageCalls";

armPageCalls();

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

const API = "https://api.example.com";
const kb = (n: number) => `${n} KB`;

describe("pageCalls", () => {
  beforeEach(clearPageCalls);

  it("keeps every call the page made, not just the last", () => {
    pass(`${API}/sales/weekly`, { a: 1 });
    pass(`${API}/subs/subs`, { b: 2 });
    pass(`${API}/hourly/hourly`, { c: 3 });
    expect(getPageCalls().map((c) => c.path)).toEqual([
      "/sales/weekly",
      "/subs/subs",
      "/hourly/hourly",
    ]);
  });

  it("offers only the page's own datasets, by name", () => {
    pass(`${API}/sales/weekly`, { a: 1 });
    // The shell asks for these on every page and neither is ever the
    // culprit; the 300 KB one used to crowd out the page's own data.
    pass(`${API}/stores/unassigned_stores`, { stores: [1, 2, 3] });
    pass(`${API}/user_preferences/prefs`, { theme: "light" });
    pass(`${API}/groups/`, { groups: [] });

    const groups = consolidate();
    expect(groups.map((g) => g.label)).toEqual(["Weekly sales"]);
  });

  it("drops the query string, which is where ids and page numbers live", () => {
    pass(`${API}/sales/weekly?token=abc&page=2`, {});
    expect(getPageCalls()[0].path).toBe("/sales/weekly");
    expect(getPageCalls()[0].body).not.toContain("abc");
  });

  it.each([
    "/auth/token",
    "/auth/login",
    "/forgot_password/start",
    "/users/create",
    // The report form fetches its own pickers; a ticket about Sales should
    // not arrive carrying the ticket system's categories.
    "/tickets/lookups",
  ])("never captures %s", (path) => {
    pass(`${API}${path}`, { secret: "shibboleth" });
    expect(getPageCalls()).toHaveLength(0);
  });

  it("consolidates the pages of one endpoint into one entry", () => {
    pass(`${API}/cashiers/transaction_ids?page=1`, { rows: [1] });
    pass(`${API}/cashiers/transaction_ids?page=2`, { rows: [2] });
    pass(`${API}/cashiers/transaction_ids?page=3`, { rows: [3] });
    pass(`${API}/sales/weekly`, { total: 9 });

    const groups = consolidate();
    expect(groups).toHaveLength(2);
    const paged = groups.find((g) => g.path === "/cashiers/transaction_ids")!;
    expect(paged.calls).toHaveLength(3);
    // How many requests it took is ours to know, not something a client
    // reads off a tick box.
    expect(groupNote(paged, kb)).not.toContain("pages");
  });

  it("keeps a different method to the same path apart", () => {
    pass(`${API}/orders/all_orders`, { a: 1 }, "get");
    pass(`${API}/orders/all_orders`, { b: 2 }, "post");
    expect(consolidate()).toHaveLength(2);
  });

  it("drops the largest groups first when over budget", () => {
    const big = (path: string, size: number) =>
      pass(`${API}${path}`, { pad: "x".repeat(size) });
    big("/categories/cats", 100);
    big("/subs/subs", 4000);
    big("/sales/topten", 40000);

    const { kept, dropped } = withinBudget(consolidate(), 10000);
    expect(kept.map((g) => g.label).sort()).toEqual([
      "Categories",
      "Sub departments",
    ]);
    expect(dropped.map((g) => g.label)).toEqual(["Top ten items"]);
  });

  it("writes every page into one file, with a marker each", () => {
    pass(`${API}/cashiers/transaction_ids?page=1`, { rows: [1] });
    pass(`${API}/cashiers/transaction_ids?page=2`, { rows: [2] });
    const file = groupAsFile(consolidate()[0]);
    expect(file.name).toBe("get-cashiers-transaction-ids.json");
    // One of the three the endpoint accepts — a .json labelled text/html is
    // refused, so the type is set rather than left to the browser.
    expect(file.type).toBe("application/json");
  });

  it("caps a large body and says so", () => {
    pass(`${API}/sales/topten`, {
      rows: Array.from({ length: 20000 }, (_, i) => ({
        i,
        pad: "x".repeat(40),
      })),
    });
    const call = getPageCalls()[0];
    expect(call.truncated).toBe(true);
    expect(call.body.endsWith("[truncated]")).toBe(true);
    expect(call.body.length).toBeLessThan(300 * 1024);
    expect(groupNote(consolidate()[0], kb)).toContain("shortened");
  });

  it("survives a body it cannot serialise", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() => pass(`${API}/sales/weekly`, circular)).not.toThrow();
    expect(getPageCalls()).toHaveLength(0);
  });

  it("returns nothing to attach when the page made no calls", () => {
    const { kept, dropped } = withinBudget(consolidate([]));
    expect(kept).toEqual([] as CallGroup[]);
    expect(dropped).toEqual([] as CallGroup[]);
  });
});
