import axios from "axios";
import { beforeEach, describe, expect, it } from "vitest";
import {
  armPageCalls,
  clearPageCalls,
  consolidate,
  getPageCalls,
  groupAsFile,
  withinBudget,
  type CallGroup,
} from "./pageCalls";

armPageCalls();

/** Push a response through the registered interceptors the way axios does. */
const pass = (
  url: string,
  data: unknown,
  method = "get",
  status = 200,
  sent?: unknown,
) => {
  const handlers = (
    axios.interceptors.response as unknown as {
      handlers: { fulfilled: (r: unknown) => unknown }[];
    }
  ).handlers.filter(Boolean);
  for (const h of handlers) {
    h.fulfilled({ config: { url, method, data: sent }, status, data });
  }
};

const API = "https://api.example.com";

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
    // One dataset, whatever it took to fetch — the row shows only its name.
    expect(paged.label).toBe("Transactions");
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
    // Recorded for the tech in the file, not shown to whoever is filing.
    expect(groupAsFile(consolidate()[0]).name).toBe("get-sales-topten.json");
  });

  it("records what each call asked for, so two windows are told apart", () => {
    // Loss Prevention asks one endpoint for the baseline and then for the
    // current week. Same path, same method, one dataset, two windows.
    const body = (startDate: string, endDate: string) =>
      JSON.stringify({ startDate, endDate, singleStore: 2 });
    pass(
      `${API}/cashiers/cashier_table`,
      { rows: [1] },
      "post",
      200,
      body("2026-09-14", "2026-09-20"),
    );
    pass(
      `${API}/cashiers/cashier_table`,
      { rows: [2] },
      "post",
      200,
      body("2026-09-21", "2026-09-27"),
    );

    const group = consolidate()[0];
    expect(group.calls).toHaveLength(1 + 1);
    expect(group.calls[0].request).toContain("2026-09-14");
    expect(group.calls[1].request).toContain("2026-09-21");
  });

  it("takes a GET's question off the query string", () => {
    pass(`${API}/sales/weekly?startDate=2026-09-21&endDate=2026-09-27`, {});
    expect(getPageCalls()[0].request).toContain("startDate=2026-09-21");
    // Still off the stored path, which is what the label is keyed on.
    expect(getPageCalls()[0].path).toBe("/sales/weekly");
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
