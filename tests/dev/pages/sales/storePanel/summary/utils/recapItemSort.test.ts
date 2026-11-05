import { describe, expect, it } from "vitest";
import { DEFAULT_ITEM_SORT, nextItemSort, sortItemRows } from "@/pages/sales/dev/storePanel/summary/utils/recapItemSort";
import type { RecapItemRow } from "@/pages/sales/dev/storePanel/summary/types";

const row = (code: string, name: string, net: number, units: number, vendor = "V"): RecapItemRow => ({
  code,
  name,
  subDeptName: "Dept",
  vendors: [vendor],
  units,
  pounds: 0,
  net,
});

const rows = [row("10", "Bread", 30, 5, "Flowers"), row("9", "Apples", 50, 1, "AWG"), row("11", "Chips", 30, 9)];

describe("the item view's sort", () => {
  it("opens on net sales, biggest first, ties by name", () => {
    expect(sortItemRows(rows, DEFAULT_ITEM_SORT).map((r) => r.name)).toEqual(["Apples", "Bread", "Chips"]);
  });

  it("starts a figure column biggest first and a word column A–Z, and flips on a second click", () => {
    expect(nextItemSort(DEFAULT_ITEM_SORT, "units")).toEqual({ column: "units", direction: "desc" });
    expect(nextItemSort(DEFAULT_ITEM_SORT, "name")).toEqual({ column: "name", direction: "asc" });
    expect(nextItemSort(DEFAULT_ITEM_SORT, "net")).toEqual({ column: "net", direction: "asc" });
  });

  it("sorts UPCs as numbers and vendors by the lead vendor", () => {
    expect(sortItemRows(rows, { column: "code", direction: "asc" }).map((r) => r.code)).toEqual(["9", "10", "11"]);
    expect(sortItemRows(rows, { column: "vendor", direction: "asc" }).map((r) => r.vendors[0])).toEqual([
      "AWG",
      "Flowers",
      "V",
    ]);
  });
});
