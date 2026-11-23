import { describe, expect, it } from "vitest";
import {
  isNarrowed,
  listItems,
  listLabel,
  listNames,
  pickItems,
  sameFilter,
} from "@/pages/sales/prod/storePanel/subDepts/utils";
import type { GradedItem } from "@/pages/sales/prod/storePanel/subDepts/interfaces";

const item = (upc: string, desc: string, sev: GradedItem["sev"]): GradedItem => ({
  productCode: upc, upc, desc, sev,
  tyNet: 1, tyQty: 1, tyWeight: 0, lwNet: 1, lwQty: 1, lwWeight: 0, lyNet: 1, lyQty: 1, lyWeight: 0,
});
const active = [item("1", "PEPSI 2 L", "critical"), item("2", "COKE 2 L", "critical"), item("3", "PEPSI 20 OZ", "healthy")];
const inactive = [item("4", "PEPSI 12 PK", "critical")];

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

describe("pickItems", () => {
  it("lists active then inactive with the picker open", () => {
    expect(pickItems(active, inactive, "").map((i) => i.upc)).toEqual(["1", "2", "3", "4"]);
    expect(pickItems(active, inactive, "inactive").map((i) => i.upc)).toEqual(["4"]);
  });
});

describe("listItems", () => {
  it("applies the grade, the search and the picker together", () => {
    expect(listItems(active, inactive, { sev: "critical", text: "pepsi", active: "" }).map((i) => i.upc)).toEqual(["1", "4"]);
    expect(listItems(active, inactive, { sev: "critical", text: "pepsi", active: "active" }).map((i) => i.upc)).toEqual(["1"]);
  });
});

describe("listLabel", () => {
  it("names a list by its filters", () => {
    expect(listLabel({ sev: "critical", text: " pepsi ", active: "" })).toBe("Crit | pepsi");
    expect(listLabel({ sev: "healthy", text: "", active: "inactive" })).toBe("OK | Inactive");
    expect(listLabel({ sev: "all", text: "", active: "" })).toBe("All items");
  });
});

describe("listNames", () => {
  it("names two lists by what tells them apart", () => {
    const crit = (text: string) => ({ sev: "critical" as const, text, active: "" });
    expect(listNames(crit("pepsi"), crit("coke"))).toEqual(["pepsi", "coke"]);
    expect(listNames(crit("pepsi"), { sev: "watch", text: "Pepsi", active: "" })).toEqual(["Crit", "Watch"]);
    expect(listNames(crit("pepsi"), { sev: "watch", text: "coke", active: "" })).toEqual(["Crit pepsi", "Watch coke"]);
  });

  it("keeps a list's own name when all its filters are shared", () => {
    expect(listNames({ sev: "critical", text: "", active: "" }, { sev: "critical", text: "pepsi", active: "" })).toEqual(["Crit", "pepsi"]);
    expect(listNames({ sev: "all", text: "", active: "" }, { sev: "critical", text: "", active: "" })).toEqual(["All items", "Crit"]);
  });
});

describe("sameFilter", () => {
  it("ignores case and spaces in the search", () => {
    expect(sameFilter({ sev: "critical", text: "Pepsi ", active: "" }, { sev: "critical", text: "pepsi", active: "" })).toBe(true);
    expect(sameFilter({ sev: "critical", text: "pepsi", active: "" }, { sev: "critical", text: "coke", active: "" })).toBe(false);
  });
});
