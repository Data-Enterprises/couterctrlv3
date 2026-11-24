import { beforeEach, describe, expect, it, vi } from "vitest";

type Req = {
  url: string;
  method: string;
  data?: Record<string, any>;
  params?: Record<string, any>;
};
const ok = async (_req: Req): Promise<{ data: any }> => ({
  data: { error: 0, sales: [], subs: [] },
});
const reply = vi.fn(ok);
vi.mock("axios", () => ({ default: (req: Req) => reply(req) }));

import {
  getLedgerDailySales,
  getStoreDailySales,
  getSubDeptDailySales,
} from "./salesReads";

const U = "https://api/";
const routes = () => reply.mock.calls.map(([r]) => r.url.slice(U.length));
const bodies = () => reply.mock.calls.map(([r]) => r.data);

beforeEach(() => {
  reply.mockReset();
  reply.mockImplementation(ok);
});

describe("getStoreDailySales", () => {
  it("reads sales/daily on the dev API", async () => {
    await getStoreDailySales(U, "t", "dev", "2026-11-16", "2026-11-22", 1, 700);
    expect(routes()).toEqual(["sales/daily"]);
    expect(bodies()[0]).toMatchObject({
      useGroups: 1,
      searchValue: 700,
      singleStore: 0,
    });
  });

  it("reads sales/weekly on prod, with the same request", async () => {
    await getStoreDailySales(U, "t", "prod", "2026-11-16", "2026-11-22", 0, 12);
    expect(routes()).toEqual(["sales/weekly"]);
    expect(bodies()[0]).toEqual({
      startDate: "2026-11-16",
      endDate: "2026-11-22",
      useGroups: 0,
      searchValue: 12,
      singleStore: 1,
    });
  });
});

describe("getLedgerDailySales", () => {
  const stores = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ storeid: i + 1, active: true }));

  it("reads a whole group in one sales/daily request on the dev API", async () => {
    await getLedgerDailySales(U, "t", "dev", 5, "a", "b", 1, 700);
    expect(routes()).toEqual(["sales/daily"]);
  });

  it("reads a prod group of 30 stores or fewer in one sales/weekly request", async () => {
    reply.mockImplementation(async (r) =>
      r.url.endsWith("stores_assigned_to_user_group")
        ? { data: { error: 0, stores: stores(30) } }
        : { data: { error: 0, sales: [{ storeid: 0 }] } },
    );
    const resp = await getLedgerDailySales(U, "t", "prod", 5, "a", "b", 1, 700);
    expect(routes()).toEqual([
      "groups/stores_assigned_to_user_group",
      "sales/weekly",
    ]);
    expect(bodies()[1]).toMatchObject({
      useGroups: 1,
      searchValue: 700,
      singleStore: 0,
    });
    expect(resp.data.sales).toHaveLength(1);
  });

  it("reads a prod group of more than 30 active stores store by store, leaving failed stores out", async () => {
    const list = [...stores(31), { storeid: 99, active: false }];
    reply.mockImplementation(async (r) => {
      if (r.url.endsWith("stores_assigned_to_user_group"))
        return { data: { error: 0, stores: list } };
      if (r.data?.searchValue === 2) throw new Error("timeout");
      if (r.data?.searchValue === 3)
        return { data: { error: 1, msg: "no sales" } };
      return { data: { error: 0, sales: [{ storeid: r.data?.searchValue }] } };
    });
    const resp = await getLedgerDailySales(U, "t", "prod", 5, "a", "b", 1, 700);
    const weekly = reply.mock.calls.filter(([r]) =>
      r.url.endsWith("sales/weekly"),
    );
    expect(weekly).toHaveLength(31);
    expect(
      weekly.every(
        ([r]) => r.data?.useGroups === 0 && r.data?.singleStore === 1,
      ),
    ).toBe(true);
    expect(resp.data.error).toBe(0);
    expect(resp.data.sales).toHaveLength(29);
    expect(
      resp.data.sales.map((s: { storeid: number }) => s.storeid),
    ).not.toContain(99);
  });

  it("falls back to one group request when the prod group's stores can't be listed", async () => {
    reply.mockImplementation(async (r) => {
      if (r.url.endsWith("stores_assigned_to_user_group"))
        throw new Error("down");
      return { data: { error: 0, sales: [] } };
    });
    await getLedgerDailySales(U, "t", "prod", 5, "a", "b", 1, 700);
    expect(routes()).toEqual([
      "groups/stores_assigned_to_user_group",
      "sales/weekly",
    ]);
  });

  it("reads a prod single store without listing a group", async () => {
    await getLedgerDailySales(U, "t", "prod", 5, "a", "b", 0, 12);
    expect(routes()).toEqual(["sales/weekly"]);
  });
});

describe("getSubDeptDailySales", () => {
  it("reads subs/daily on the dev API, department filter and page passed through", async () => {
    await getSubDeptDailySales(U, "t", "dev", "a", "b", 0, 12, 5, 2);
    expect(routes()).toEqual(["subs/daily"]);
    expect(bodies()[0]).toMatchObject({
      searchValue: 12,
      singleStore: 1,
      sub_department: 5,
      page: 2,
    });
  });

  it("reads subs/sub_sales on prod for the same store and page", async () => {
    await getSubDeptDailySales(U, "t", "prod", "a", "b", 0, 12, null, 3);
    expect(routes()).toEqual(["subs/sub_sales"]);
    expect(bodies()[0]).toMatchObject({
      useGroups: 0,
      searchValue: 12,
      singleStore: 1,
      page: 3,
      consolidated: 0,
      displayHourly: 0,
    });
  });

  it("filters prod's rows to the asked department after they arrive", async () => {
    reply.mockImplementation(async () => ({
      data: {
        error: 0,
        total_pages: 1,
        subs: [
          { sub_department: 5 },
          { sub_department: 7 },
          { sub_department: 5 },
        ],
      },
    }));
    const resp = await getSubDeptDailySales(U, "t", "prod", "a", "b", 0, 12, 5);
    expect(resp.data.subs).toEqual([
      { sub_department: 5 },
      { sub_department: 5 },
    ]);
    expect(resp.data.total_pages).toBe(1);
  });

  it("hands prod's refusal back as it came", async () => {
    reply.mockImplementation(async () => ({
      data: { error: 1, msg: "no records returned" },
    }));
    const resp = await getSubDeptDailySales(U, "t", "prod", "a", "b", 0, 12, 5);
    expect(resp.data).toEqual({ error: 1, msg: "no records returned" });
  });
});
