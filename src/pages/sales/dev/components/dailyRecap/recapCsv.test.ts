import { describe, expect, it } from "vitest";
import { recapCsv } from "./recapCsv";
import type { RecapItemRow } from "./recapTypes";

const row = (over: Partial<RecapItemRow>): RecapItemRow => ({
  code: "1",
  name: "Item",
  subDeptName: "Drinks",
  vendors: [],
  units: 1,
  pounds: 0,
  net: 1,
  ...over,
});

describe("the Items Sold download", () => {
  it("is the item grid: one row per UPC, its columns in the grid's order, biggest sales first", () => {
    const csv = recapCsv(
      [
        row({ code: "b", name: "Chips", subDeptName: "Snacks", net: 1, units: 2 }),
        row({ code: "a", name: "Cola", net: 12.5, units: 9, vendors: ["AWG", "Pepsi"] }),
      ],
      false,
    ).split("\n");
    expect(csv[0]).toBe("product_code,description,sub_department,vendor,net_sales,qty");
    expect(csv.slice(1)).toEqual(["a,Cola,Drinks,AWG; Pepsi,12.50,9", "b,Chips,Snacks,,1.00,2"]);
  });

  it("leaves No Vendor blank", () => {
    const [, line] = recapCsv([row({ vendors: ["No Vendor"] })], false).split("\n");
    expect(line).toBe("1,Item,Drinks,,1.00,1");
  });

  it("carries pounds, to three places, only for a store that sells by weight", () => {
    const [head, line] = recapCsv([row({ pounds: 1.25 })], true).split("\n");
    expect(head.endsWith(",qty,pounds")).toBe(true);
    expect(line).toBe("1,Item,Drinks,,1.00,1,1.250");
  });
});
