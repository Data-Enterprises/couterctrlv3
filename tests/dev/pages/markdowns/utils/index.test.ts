import { describe, expect, it } from "vitest";
import {
  MARKDOWN_COLUMNS,
  filterRows,
  fmtDmy,
  fmtDmyTime,
  sortRows,
} from "@/pages/markdowns/dev/utils";

// Interfaces
import type { MarkdownFilters, MarkdownItem } from "@/interfaces/markdowns";

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

describe("the grid's columns", () => {
  it("are the 25 shown: id, Date, Store, then the rest, without storeid or storenumber", () => {
    const labels = MARKDOWN_COLUMNS.map((c) => c.label);
    expect(labels).toHaveLength(25);
    expect(labels.slice(0, 3)).toEqual(["id", "Date", "Store"]);
    expect(labels).not.toContain("storeid");
    expect(labels).not.toContain("storenumber");
    expect(labels.at(-1)).toBe("scalable");
  });

  it("show money, percent, dates and blanks the way a person reads them", () => {
    const r = row({});
    const show = (label: string) => MARKDOWN_COLUMNS.find((c) => c.label === label)!.show(r);
    expect(show("Date")).toBe("03/11/2026");
    expect(show("original_price")).toBe("$3.99");
    expect(show("markdown_percent")).toBe("25.06%");
    expect(show("weight")).toBe("—");
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
