import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosMock = vi.fn(async () => ({ data: {} }));
vi.mock("axios", () => ({ default: (...args: unknown[]) => axiosMock(...(args as [])) }));

import { getItemActions } from "./subMargins";

const sent = () => (axiosMock.mock.calls.at(-1) as unknown as [{ data: Record<string, unknown> }])[0].data;

describe("getItemActions", () => {
  beforeEach(() => axiosMock.mockClear());

  it("scopes to one store", async () => {
    await getItemActions("u/", "t", "2026-10-18", "2026-10-24", 0, 101, 1, ["1200000088"]);
    expect(sent()).toMatchObject({ singleStore: 1, searchValue: 101, useGroups: 0 });
  });

  it("scopes to one group", async () => {
    await getItemActions("u/", "t", "2026-10-18", "2026-10-24", 1, 57, 0, ["1200000088"]);
    expect(sent()).toMatchObject({ useGroups: 1, searchValue: 57, singleStore: 0 });
  });

  // The endpoint resolves stores from the triple above and nothing else. A
  // list would be dropped unread, so a caller with several stores makes
  // several calls -- see the Movement tab.
  it("never sends a store list", async () => {
    await getItemActions("u/", "t", "2026-10-18", "2026-10-24", 0, 101, 1, ["1200000088"]);
    expect(sent()).not.toHaveProperty("storeids");
  });
});
