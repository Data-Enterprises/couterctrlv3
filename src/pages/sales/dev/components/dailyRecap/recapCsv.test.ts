import { describe, expect, it } from "vitest";
import { recapCsv } from "./recapCsv";
import type { RecapItem } from "./recapTypes";

const item = (over: Partial<RecapItem>): RecapItem => ({
  code: "1",
  name: "Item",
  subDeptId: 1,
  subDeptName: "Drinks",
  units: 1,
  pounds: 0,
  net: 1,
  vendors: [],
  ...over,
});

describe("the recap download", () => {
  it("is one row per item per day, with the day and sub dept on each", () => {
    const csv = recapCsv(
      [
        { date: "2026-10-29", items: [item({ code: "a", name: "Cola", net: 2.5 })] },
        {
          date: "2026-10-30",
          items: [
            item({ code: "b", subDeptName: "Snacks", net: 1 }),
            item({ code: "c", subDeptName: "Drinks", net: 3 }),
          ],
        },
      ],
      false,
    ).split("\n");
    expect(csv[0]).toBe("date,product_code,description,sub_department,vendor,net_sales,qty");
    expect(csv.slice(1)).toEqual([
      "2026-10-29,a,Cola,Drinks,,2.50,1",
      "2026-10-30,c,Item,Drinks,,3.00,1",
      "2026-10-30,b,Item,Snacks,,1.00,1",
    ]);
  });

  it("names every vendor that sold the item that day, and none for No Vendor", () => {
    const part = (vendor: string, net: number) => ({ vendor, units: 1, pounds: 0, net });
    const [, both, none] = recapCsv(
      [
        {
          date: "2026-10-30",
          items: [
            item({ code: "a", net: 3, vendors: [part("AWG", 2), part("Pepsi", 1)] }),
            item({ code: "b", net: 1, vendors: [part("No Vendor", 1)] }),
          ],
        },
      ],
      false,
    ).split("\n");
    expect(both).toBe("2026-10-30,a,Item,Drinks,AWG; Pepsi,3.00,1");
    expect(none).toBe("2026-10-30,b,Item,Drinks,,1.00,1");
  });

  it("carries pounds only for a store that sells by weight", () => {
    const [head, row] = recapCsv(
      [{ date: "2026-10-30", items: [item({ pounds: 1.25 })] }],
      true,
    ).split("\n");
    expect(head.endsWith(",qty,pounds")).toBe(true);
    expect(row).toBe("2026-10-30,1,Item,Drinks,,1.00,1,1.25");
  });
});
