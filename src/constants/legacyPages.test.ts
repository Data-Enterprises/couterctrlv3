import { describe, expect, it } from "vitest";
import { hasLegacyPage, legacyEntryPath } from "./legacyPages";

describe("where switching into Legacy leaves you", () => {
  it("stays put when the page exists in legacy", () => {
    expect(legacyEntryPath("/loss-prevention", "sales")).toBeNull();
    expect(legacyEntryPath("/", "sales")).toBeNull();
  });

  it("returns to where you last were in legacy", () => {
    // Vendors has no legacy version.
    expect(legacyEntryPath("/vendors", "cashiers")).toBe("/cashiers");
  });

  it("falls back to Sales when the remembered route is not a legacy page", () => {
    expect(legacyEntryPath("/vendors", "item-report")).toBe("/sales");
    expect(legacyEntryPath("/categories", "")).toBe("/sales");
  });

  it("does not build a double slash out of Home", () => {
    expect(legacyEntryPath("/vendors", "/")).toBe("/");
  });

  it("knows which routes legacy has", () => {
    expect(hasLegacyPage("/sub-dept-margins")).toBe(true);
    expect(hasLegacyPage("coupon-sales")).toBe(false);
  });
});
