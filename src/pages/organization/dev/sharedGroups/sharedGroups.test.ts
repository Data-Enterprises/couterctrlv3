import { describe, expect, it } from "vitest";
import { nameProblem, storeLabel } from "./hooks";

describe("storeLabel", () => {
  it("doesn't repeat a number the name already carries", () => {
    expect(
      storeLabel({ storeid: 13, store_number: "27", store_name: "027 - IGA GLASGOW KY" }),
    ).toBe("027 - IGA GLASGOW KY");
  });

  it("puts the number in front of a name without one", () => {
    expect(storeLabel({ storeid: 5, store_number: "12", store_name: "GROCERY BASKET" })).toBe(
      "12 - GROCERY BASKET",
    );
  });

  it("falls back when the name is missing", () => {
    expect(storeLabel({ storeid: 5, store_number: "12", store_name: null })).toBe("Store 12");
    expect(storeLabel({ storeid: 5, store_number: null, store_name: null })).toBe("Store 5");
  });
});

describe("nameProblem", () => {
  it("accepts what the router accepts", () => {
    expect(nameProblem("C-Store QSR")).toBeNull();
    expect(nameProblem("east_region 2")).toBeNull();
  });

  it("rejects an empty name and characters the router refuses", () => {
    expect(nameProblem("   ")).toMatch(/name/);
    expect(nameProblem("Houchens/IGA")).toMatch(/letters/);
    expect(nameProblem("C&S")).toMatch(/letters/);
  });
});
