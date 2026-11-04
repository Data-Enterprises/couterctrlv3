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
    expect(csv[0]).toBe("date,sub_department,product_code,description,vendor,qty,net_sales");
    expect(csv.slice(1)).toEqual([
      "2026-10-29,Drinks,a,Cola,,1,2.50",
      "2026-10-30,Drinks,c,Item,,1,3.00",
      "2026-10-30,Snacks,b,Item,,1,1.00",
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
    expect(both).toBe("2026-10-30,Drinks,a,Item,AWG; Pepsi,1,3.00");
    expect(none).toBe("2026-10-30,Drinks,b,Item,,1,1.00");
  });

  it("carries pounds only for a store that sells by weight", () => {
    const [head, row] = recapCsv(
      [{ date: "2026-10-30", items: [item({ pounds: 1.25 })] }],
      true,
    ).split("\n");
    expect(head).toContain(",pounds,");
    expect(row).toBe("2026-10-30,Drinks,1,Item,,1,1.25,1.00");
  });
});
