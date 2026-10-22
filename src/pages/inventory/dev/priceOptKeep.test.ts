import { beforeEach, describe, expect, it, vi } from "vitest";
import reducer, {
  patchSubDeptView,
  patchVendorView,
} from "../../../features/dev/devPriceOptSlice";

vi.mock("../../../utils/marginRows", () => ({
  fetchSubDeptRows: vi.fn(),
  fetchSubDeptRowsSafe: vi.fn(async () => [
    {
      vendor_id: "00123",
      vendor_name: "COKE",
      product_code: "4900002468",
      product_description: "COKE 6PK .5LT",
      total_sales: 10,
      total_tax: 0.7,
      qty: 3,
      weight: 0,
    },
  ]),
}));

import { fetchSubDeptRowsSafe } from "../../../utils/marginRows";
import { fetchVendors } from "./inventoryData";

const scope = {
  url: "https://dev-api/",
  token: "t",
  storeid: 695,
  start: "2026-10-14",
  end: "2026-10-20",
};

describe("fetchVendors", () => {
  beforeEach(() => vi.mocked(fetchSubDeptRowsSafe).mockClear());

  it("reads every department in one call", () => {
    // It used to ask for the department list, then fire one subs/subs per
    // department at once: 27 calls for one store-week (finding I).
    return fetchVendors(scope).then((vendors) => {
      expect(fetchSubDeptRowsSafe).toHaveBeenCalledTimes(1);
      // sub_department 0 asks for all of them.
      expect(vi.mocked(fetchSubDeptRowsSafe).mock.calls[0][2]).toBe(0);
      expect(vendors.map((v) => v.vendorName)).toEqual(["COKE"]);
    });
  });
});

describe("Price Opt keeps its result", () => {
  it("holds the store and dates, not the token", () => {
    // The page rebuilds its scope from the session, so a kept result can't
    // carry a token a re-login has replaced (finding K).
    const state = reducer(
      undefined,
      patchVendorView({
        window: { storeid: 695, start: "2026-10-14", end: "2026-10-20" },
      }),
    );
    expect(state.vendor.window).toEqual({
      storeid: 695,
      start: "2026-10-14",
      end: "2026-10-20",
    });
    expect(JSON.stringify(state)).not.toContain("token");
  });

  it("keeps the two pages apart", () => {
    const state = reducer(undefined, patchSubDeptView({ openSubDept: 40 }));
    expect(state.subDept.openSubDept).toBe(40);
    expect(state.vendor.openVendor).toBeNull();
  });
});
