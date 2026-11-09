import { describe, expect, it } from "vitest";
import {
  activeFilterCount,
  availableOptions,
  buildOptions,
} from "@/pages/markdowns/dev/config/utils";

// Interfaces
import type { MarkdownFilters, MarkdownItem } from "@/interfaces/markdowns";

const row = (over: Partial<MarkdownItem>) =>
  ({
    id: 1,
    storenumber: "301",
    storename: "Food Giant Hayti",
    userid: "jmartin",
    order_date: "2026-11-03T00:00:00",
    product_code: "0033383004012",
    description: "Strawberries 1lb",
    type: "Price",
    sub_department: 5,
    sub_department_description: "Produce",
    category: 12,
    category_description: "Fruit",
    vendor_id: "V1021",
    vendor_name: "Driscoll",
    markdown_percent: 25,
    ...over,
  }) as MarkdownItem;

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

const rows = [
  row({ id: 1, type: "Price", sub_department: 5, order_date: "2026-11-03T00:00:00" }),
  row({ id: 2, type: "Waste", sub_department: 2, sub_department_description: "Fresh Meat", order_date: "2026-11-04T00:00:00" }),
  row({ id: 3, type: "Price", sub_department: 2, sub_department_description: "Fresh Meat", order_date: "2026-11-05T00:00:00" }),
];

describe("buildOptions", () => {
  it("offers only values that came back, each once, with readable labels", () => {
    const o = buildOptions(rows);
    expect(o.types.map((x) => x.value)).toEqual(["Price", "Waste"]);
    expect(o.subIds).toEqual([
      { value: "2", label: "Fresh Meat" },
      { value: "5", label: "Produce" },
    ]);
    expect(o.storeNumbers).toEqual([{ value: "301", label: "Food Giant Hayti" }]);
  });

  it("lists dates newest first, written dd/mm/yyyy", () => {
    expect(buildOptions(rows).dates.map((d) => d.label)).toEqual(["05/11/2026", "04/11/2026", "03/11/2026"]);
  });
});

describe("availableOptions", () => {
  it("leaves out what the other filters have ruled out", () => {
    const a = availableOptions(rows, { ...none, types: ["Waste"] });
    expect([...a.subIds]).toEqual(["2"]);
    expect([...a.dates]).toEqual(["2026-11-04"]);
  });

  it("ignores a filter's own picks, so a second value can still be picked", () => {
    const a = availableOptions(rows, { ...none, types: ["Waste"] });
    expect([...a.types].sort()).toEqual(["Price", "Waste"]);
  });
});

describe("activeFilterCount", () => {
  it("counts the filters that are narrowing, including the minimum percent", () => {
    expect(activeFilterCount(none)).toBe(0);
    expect(activeFilterCount({ ...none, types: ["Price"], subIds: [2, 5], minPercent: 20 })).toBe(3);
  });
});
