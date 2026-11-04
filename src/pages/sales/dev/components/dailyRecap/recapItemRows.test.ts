import { describe, expect, it } from "vitest";
import {
  filterItemRows,
  itemTotals,
  mergeItems,
  periodItems,
  subDeptOptions,
  vendorOptions,
} from "./recapItemRows";
import type { RecapItem, RecapVendorPart } from "./recapTypes";

const part = (vendor: string, net: number, units = 1, pounds = 0): RecapVendorPart => ({
  vendor,
  units,
  pounds,
  net,
});

const item = (code: string, name: string, dept: string, vendors: RecapVendorPart[]): RecapItem => ({
  code,
  name,
  subDeptId: 1,
  subDeptName: dept,
  units: vendors.reduce((t, v) => t + v.units, 0),
  pounds: vendors.reduce((t, v) => t + v.pounds, 0),
  net: vendors.reduce((t, v) => t + v.net, 0),
  vendors,
});

const thu = [
  item("1", "Soda", "Drinks", [part("Pepsi", 10, 2)]),
  item("2", "Ribeye", "Meat", [part("Tyson", 40, 1, 2.5)]),
];
const fri = [
  item("1", "SODA 12 OZ", "Drinks", [part("Pepsi", 30, 6), part("AWG", 5, 1)]),
  item("3", "Chips", "Snacks", [part("AWG", 8, 2)]),
];

describe("the item view's rows", () => {
  it("lists an item once for the week, every day's units, weight and sales added", () => {
    const rows = mergeItems([thu, fri], []);
    expect(rows.map((r) => r.code).sort()).toEqual(["1", "2", "3"]);
    const soda = rows.find((r) => r.code === "1")!;
    expect(soda).toMatchObject({ units: 9, net: 45, name: "SODA 12 OZ" });
    expect(soda.vendors).toEqual(["Pepsi", "AWG"]);
    expect(rows.find((r) => r.code === "2")).toMatchObject({ pounds: 2.5 });
  });

  it("counts only the ticked vendors' share, and drops what they did not sell", () => {
    const rows = mergeItems([thu, fri], ["AWG"]);
    expect(rows.map((r) => [r.code, r.units, r.net])).toEqual([
      ["1", 1, 5],
      ["3", 2, 8],
    ]);
  });

  it("reads a day kept before vendors were recorded as one part with no vendor", () => {
    const old = { ...thu[0], vendors: undefined } as unknown as RecapItem;
    const [soda] = mergeItems([[old]], []);
    expect(soda).toMatchObject({ net: 10, vendors: ["No Vendor"] });
  });

  it("filters by sub dept and by name or UPC", () => {
    const rows = mergeItems([thu, fri], []);
    expect(filterItemRows(rows, ["Meat", "Snacks"], "").map((r) => r.code).sort()).toEqual(["2", "3"]);
    expect(filterItemRows(rows, [], "soda").map((r) => r.code)).toEqual(["1"]);
    expect(filterItemRows(rows, [], "3").map((r) => r.code)).toEqual(["3"]);
  });

  it("totals the whole filtered list", () => {
    expect(itemTotals(mergeItems([thu, fri], []))).toEqual({ items: 3, units: 12, pounds: 2.5, net: 93 });
  });
});

describe("the filters' options", () => {
  const all = mergeItems([thu, fri], []);

  it("offers every sub dept, dropping the ones the ticked vendors sold nothing in", () => {
    const opts = subDeptOptions(all, mergeItems([thu, fri], ["Tyson"]));
    expect(opts.map((o) => [o.value, !!o.unavailable])).toEqual([
      ["Drinks", true],
      ["Meat", false],
      ["Snacks", true],
    ]);
  });

  it("offers every vendor, dropping the ones with nothing in the ticked sub depts", () => {
    const opts = vendorOptions(all, ["Drinks"]);
    expect(opts.map((o) => [o.value, !!o.unavailable])).toEqual([
      ["AWG", false],
      ["Pepsi", false],
      ["Tyson", true],
    ]);
  });
});

describe("a period's items", () => {
  const ready = (items: RecapItem[]) => ({ status: "ready" as const, items });

  it("is ready only once every day is", () => {
    expect(periodItems(["a", "b"], [ready(thu), { status: "loading" }]).status).toBe("loading");
    expect(periodItems(["a", "b"], [ready(thu), ready(fri)])).toEqual({
      status: "ready",
      days: [thu, fri],
    });
  });

  it("names the days that could not be read", () => {
    expect(periodItems(["a", "b"], [{ status: "error" }, { status: "loading" }])).toEqual({
      status: "error",
      dates: ["a"],
    });
  });
});
