import { describe, expect, it } from "vitest";
import { isNarrowed } from "@/pages/sales/dev/storePanel/subDepts/utils";

describe("isNarrowed", () => {
  it("is false with every filter open", () => {
    expect(isNarrowed("all", "  ", "")).toBe(false);
  });

  it("is true for a grade, a search or the active picker", () => {
    expect(isNarrowed("critical", "", "")).toBe(true);
    expect(isNarrowed("all", "pepsi", "")).toBe(true);
    expect(isNarrowed("all", "", "inactive")).toBe(true);
  });
});
