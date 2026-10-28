import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosMock = vi.fn(async () => ({ data: {} }));
vi.mock("axios", () => ({ default: (...args: unknown[]) => axiosMock(...(args as [])) }));

import { getItemActions } from "./subMargins";

const sent = () => (axiosMock.mock.calls.at(-1) as unknown as [{ data: Record<string, unknown> }])[0].data;

describe("getItemActions", () => {
  beforeEach(() => axiosMock.mockClear());

  it("sends an explicit store list when it has one", async () => {
    await getItemActions("u/", "t", "2026-10-18", "2026-10-24", 1, 0, 0, ["1200000088"], undefined, [101, 140]);
    expect(sent()).toMatchObject({ storeids: [101, 140], singleStore: 0, useGroups: 1, searchValue: 0 });
  });

  it("leaves the field off for a store or group search", async () => {
    await getItemActions("u/", "t", "2026-10-18", "2026-10-24", 0, 101, 1, ["1200000088"]);
    expect(sent()).not.toHaveProperty("storeids");
    expect(sent()).toMatchObject({ singleStore: 1, searchValue: 101 });
  });
});
