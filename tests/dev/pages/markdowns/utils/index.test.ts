import { describe, expect, it } from "vitest";
import {
  GRID_COLUMNS,
  MARKDOWN_COLUMNS,
  filterRows,
  fmtDmy,
  fmtDmyTime,
  sortRows,
  withStoreNames,
} from "@/pages/markdowns/dev/utils";

// Interfaces
import type { MarkdownFilters, MarkdownItem } from "@/interfaces/markdowns";
import type { Store } from "@/interfaces";

const row = (over: Partial<MarkdownItem>): MarkdownItem => ({
  id: 1,
  storeid: 1301,
  storenumber: "301",
  storename: "Food Giant Hayti",
  userid: "jmartin",
  order_date: "2026-11-03T00:00:00",
  product_code: "0033383004012",
  original_price: 3.99,
  new_price: 2.99,
  markdown: 1,
  markdown_percent: 25.06,
  markdown_id: 88213,
  type: "Price",
  qty: 14,
  weight: null,
  retail: 41.86,
  description: "Strawberries 1lb",
  category: 12,
  category_description: "Fruit",
  sub_department: 5,
  sub_department_description: "Produce",
  case_size: 8,
  vendor_id: "V1021",
  vendor_name: "Driscoll",
  last_update_time: "2026-11-03T06:12:00",
  case_cost: 23.94,
  scalable: 0,
  ...over,
});

const none: MarkdownFilters = {
  types: [],
  storeNumbers: [],
  dates: [],
  subIds: [],
  categories: [],
  vendorIds: [],
  productCodes: [],
  userIds: [],
  minPercent: null,
};

describe("dates", () => {
  it("writes a date dd/mm/yyyy", () => {
    expect(fmtDmy("2026-11-03T00:00:00")).toBe("03/11/2026");
    expect(fmtDmy("2026-01-09")).toBe("09/01/2026");
    expect(fmtDmy(null)).toBe("—");
  });

  it("writes a timestamp dd/mm/yyyy hh:mm", () => {
    expect(fmtDmyTime("2026-11-03T06:12:00")).toBe("03/11/2026 06:12");
  });
});

describe("the columns", () => {
  it("export 25 under plain headings, without storeid or storenumber", () => {
    const labels = MARKDOWN_COLUMNS.map((c) => c.label);
    expect(labels).toHaveLength(25);
    expect(labels.slice(0, 7)).toEqual(["Date", "ID", "Markdown #", "Type", "Store", "UPC", "Description"]);
    expect(labels.at(-1)).toBe("Updated");
    expect(labels.every((l) => !l.includes("_"))).toBe(true);
    expect(MARKDOWN_COLUMNS.map((c) => c.key)).not.toContain("storeid");
    expect(MARKDOWN_COLUMNS.map((c) => c.key)).not.toContain("storenumber");
  });

  it("put the sub department and category numbers and the vendor id in the export only", () => {
    const grid = GRID_COLUMNS.map((c) => c.label);
    expect(grid).toEqual([
      "Date", "ID", "Markdown #", "Type", "Store", "UPC", "Description",
      "Orig Price", "New Price", "Markdown", "MD %", "Qty", "Weight", "Retail",
      "Case Size", "Case Cost", "Sub Dept", "Category", "Vendor", "User",
      "Scalable", "Updated",
    ]);
    const labels = MARKDOWN_COLUMNS.map((c) => c.label);
    expect(labels.indexOf("Sub Dept #")).toBe(labels.indexOf("Sub Dept") - 1);
    expect(labels.indexOf("Category #")).toBe(labels.indexOf("Category") - 1);
    expect(labels.indexOf("Vendor ID")).toBe(labels.indexOf("Vendor") - 1);
  });

  it("show money, percent, dates, yes/no and blanks the way a person reads them", () => {
    const r = row({});
    const show = (label: string) => MARKDOWN_COLUMNS.find((c) => c.label === label)!.show(r);
    expect(show("Date")).toBe("03/11/2026");
    expect(show("Orig Price")).toBe("$3.99");
    expect(show("MD %")).toBe("25.06%");
    expect(show("Weight")).toBe("—");
    expect(show("Scalable")).toBe("No");
  });
});

describe("withStoreNames", () => {
  const store = (storeid: number, store_name: string) => ({ storeid, store_name }) as Store;
  const names = (rs: MarkdownItem[]) => rs.map((r) => r.storename);

  it("names each store as the user's stores do, not as the payload does", () => {
    const rows = [row({ storeid: 1301, storename: "FG HAYTI #301" })];
    expect(names(withStoreNames(rows, [store(1301, "Food Giant Hayti")], []))).toEqual(["Food Giant Hayti"]);
  });

  it("falls back to the group search's stores, then to the store number", () => {
    const rows = [
      row({ storeid: 1302, storenumber: "302", storename: "x" }),
      row({ storeid: 1303, storenumber: "303", storename: "y" }),
    ];
    expect(names(withStoreNames(rows, [], [store(1302, "Food Giant Kennett")]))).toEqual([
      "Food Giant Kennett",
      "Store 303",
    ]);
  });

  it("names a storeid that covers two stores by each one's own number", () => {
    const rows = [
      row({ storeid: 685, storenumber: "369" }),
      row({ storeid: 685, storenumber: "370" }),
    ];
    expect(names(withStoreNames(rows, [store(685, "Bruces Foodland 369")], []))).toEqual([
      "Bruces Foodland 369",
      "Bruces Foodland 370",
    ]);
  });
});

describe("filterRows", () => {
  const rows = [
    row({ id: 1, type: "Price", sub_department: 5, markdown_percent: 25 }),
    row({ id: 2, type: "Waste", sub_department: 2, markdown_percent: 100 }),
    row({ id: 3, type: "Perc", sub_department: 5, markdown_percent: 10, order_date: "2026-11-04T00:00:00" }),
  ];
  const ids = (rs: MarkdownItem[]) => rs.map((r) => r.id);

  it("keeps everything when nothing is picked", () => {
    expect(ids(filterRows(rows, none))).toEqual([1, 2, 3]);
  });

  it("narrows by each filter and by them together", () => {
    expect(ids(filterRows(rows, { ...none, types: ["Waste"] }))).toEqual([2]);
    expect(ids(filterRows(rows, { ...none, subIds: [5] }))).toEqual([1, 3]);
    expect(ids(filterRows(rows, { ...none, subIds: [5], dates: ["2026-11-04"] }))).toEqual([3]);
  });

  it("keeps rows marked down by at least the minimum percent", () => {
    expect(ids(filterRows(rows, { ...none, minPercent: 25 }))).toEqual([1, 2]);
  });
});

describe("sortRows", () => {
  const rows = [
    row({ id: 1, markdown_percent: 25, storename: "B store" }),
    row({ id: 2, markdown_percent: null, storename: "A store" }),
    row({ id: 3, markdown_percent: 40, storename: "C store" }),
  ];
  const ids = (rs: MarkdownItem[]) => rs.map((r) => r.id);

  it("keeps the backend's order with no sort", () => {
    expect(ids(sortRows(rows, null))).toEqual([1, 2, 3]);
  });

  it("sorts numbers either way, blanks last", () => {
    expect(ids(sortRows(rows, { col: "markdown_percent", dir: "desc" }))).toEqual([3, 1, 2]);
    expect(ids(sortRows(rows, { col: "markdown_percent", dir: "asc" }))).toEqual([1, 3, 2]);
  });

  it("sorts text alphabetically", () => {
    expect(ids(sortRows(rows, { col: "storename", dir: "asc" }))).toEqual([2, 1, 3]);
  });
});
