import { describe, expect, it } from "vitest";
import { accessTypeLabel, grantFor } from "@/pages/organization/dev/baseGroups/grantFor";

describe("a group added on its Users sub-tab", () => {
  it("is granted By store, every store picked, to someone By store", () => {
    expect(grantFor({ access_mode: "selected" }, [301, 302])).toEqual({
      mode: "selected",
      storeids: [301, 302],
    });
  });

  it("is granted By group to everyone else", () => {
    expect(grantFor({ access_mode: "all" }, [301])).toEqual({ mode: "all" });
    expect(grantFor({ access_mode: null }, [301])).toEqual({ mode: "all" });
    expect(grantFor({ access_mode: "mixed" }, [301])).toEqual({ mode: "all" });
    expect(grantFor(undefined, [301])).toEqual({ mode: "all" });
  });

  it("names each person's type", () => {
    expect(accessTypeLabel({ access_mode: "selected" })).toBe("By store");
    expect(accessTypeLabel({ access_mode: null })).toBe("No type on file");
  });
});
