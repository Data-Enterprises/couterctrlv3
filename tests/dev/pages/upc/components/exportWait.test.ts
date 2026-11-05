import { describe, expect, it } from "vitest";
import { exportWaitReason, type ExportWaitInput } from "@/pages/upc/dev/components/exportWait";

const base: ExportWaitInput = {
  tab: "salesComp",
  preset: "all",
  shape: "summary",
  searchedUpcs: ["4011", "4046"],
  selectedUpcs: ["4011", "4046"],
  salesCompCoverage: ["4011", "4046"],
  salesCompLYLoading: false,
  priceOptCoverage: ["4011", "4046"],
  trendCoverage: ["4011", "4046"],
  movementCoverage: ["4011", "4046"],
  associationSeedReady: true,
  associationSeedError: null,
  associationRerootUpc: null,
  associationRerootLoaded: false,
};

describe("exportWaitReason", () => {
  it("lets a loaded tab download", () => {
    for (const tab of ["salesComp", "priceOpt", "movement", "trend", "association"] as const) {
      expect(exportWaitReason({ ...base, tab })).toBeNull();
    }
  });

  it("waits while UPCs the file would hold haven't loaded", () => {
    expect(exportWaitReason({ ...base, salesCompCoverage: ["4011"] })).toBe(
      "Sales Comp hasn't loaded for 1 UPC yet. Download is ready once it has.",
    );
    expect(exportWaitReason({ ...base, tab: "movement", movementCoverage: [] })).toBe(
      "Movement hasn't loaded for 2 UPCs yet. Download is ready once it has.",
    );
  });

  it("only counts the UPCs the chosen preset exports", () => {
    // 4046 is unloaded but not ticked, so "Selected UPCs" doesn't need it.
    const p = { ...base, tab: "priceOpt" as const, priceOptCoverage: ["4011"], selectedUpcs: ["4011"] };
    expect(exportWaitReason({ ...p, preset: "selected" })).toBeNull();
    expect(exportWaitReason({ ...p, preset: "all" })).not.toBeNull();
  });

  it("waits for last year only on the summary, and only while it loads", () => {
    const loading = { ...base, salesCompLYLoading: true };
    expect(exportWaitReason(loading)).toBe("Last year is still loading. Download is ready once it has.");
    expect(exportWaitReason({ ...loading, shape: "detail" })).toBeNull();
  });

  it("says when nothing is ticked on the tabs that only export ticked UPCs", () => {
    expect(exportWaitReason({ ...base, tab: "trend", selectedUpcs: [] })).toBe("No UPCs selected.");
    expect(exportWaitReason({ ...base, tab: "association", selectedUpcs: [] })).toBe(
      "No UPCs selected.",
    );
  });

  it("waits for a re-rooted item's associations", () => {
    expect(
      exportWaitReason({ ...base, tab: "association", associationRerootUpc: "4046" }),
    ).toBe("Associations for 4046 are still loading. Download is ready once it has.");
    expect(
      exportWaitReason({
        ...base,
        tab: "association",
        associationRerootUpc: "4046",
        associationRerootLoaded: true,
      }),
    ).toBeNull();
  });
});

describe("exportWaitReason for a seed that failed", () => {
  it("says why instead of waiting", () => {
    expect(
      exportWaitReason({
        ...base,
        tab: "association",
        associationSeedReady: false,
        associationSeedError: "error 500",
      }),
    ).toBe("Associations didn't load: error 500.");
  });
});
