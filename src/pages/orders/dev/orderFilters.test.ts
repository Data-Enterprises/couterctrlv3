import { describe, it, expect } from "vitest";
import { availableOptions, markAvailability } from "./orderFilters";
import type { AllOrder } from "../../../interfaces";

const line = (over: Partial<AllOrder>): AllOrder =>
  ({
    order_type: "REG",
    storenumber: "010",
    order_date: "2026-10-19",
    sub_department: 21,
    product_code: "A",
    order_id: 1,
    ...over,
  }) as AllOrder;

const NONE = {
  orderTypes: [],
  storeNumbers: [],
  dates: [],
  subIds: [],
  productCodes: [],
  orderIds: [],
};

const rows = [
  line({ order_type: "REG", order_date: "2026-10-19", storenumber: "010", order_id: 1 }),
  line({ order_type: "PER", order_date: "2026-10-20", storenumber: "011", order_id: 2 }),
  line({ order_type: "PER", order_date: "2026-10-20", storenumber: "010", order_id: 3 }),
];

describe("availableOptions", () => {
  it("offers everything when nothing is filtered", () => {
    const a = availableOptions(rows, NONE);
    expect([...a.orderTypes].sort()).toEqual(["PER", "REG"]);
    expect([...a.dates].sort()).toEqual(["2026-10-19", "2026-10-20"]);
  });

  it("narrows the other filters to what the picked one leaves", () => {
    const a = availableOptions(rows, { ...NONE, orderTypes: ["PER"] });
    expect([...a.dates]).toEqual(["2026-10-20"]);
    expect([...a.orderIds].sort()).toEqual(["2", "3"]);
  });

  it("leaves a filter's own list alone, so a second pick is possible", () => {
    // Narrowing a list by its own selection collapses it to what is already
    // chosen, and nothing else can ever be added.
    const a = availableOptions(rows, { ...NONE, orderTypes: ["PER"] });
    expect([...a.orderTypes].sort()).toEqual(["PER", "REG"]);
  });

  it("narrows in every direction, not just forwards", () => {
    const a = availableOptions(rows, { ...NONE, dates: ["2026-10-19"] });
    expect([...a.orderTypes]).toEqual(["REG"]);
    expect([...a.storeNumbers]).toEqual(["010"]);
  });

  it("intersects two picks", () => {
    const a = availableOptions(rows, {
      ...NONE,
      orderTypes: ["PER"],
      storeNumbers: ["010"],
    });
    expect([...a.orderIds]).toEqual(["3"]);
  });

  it("leaves a filter empty when the picks cannot be satisfied together", () => {
    const a = availableOptions(rows, {
      ...NONE,
      orderTypes: ["REG"],
      dates: ["2026-10-20"],
    });
    expect([...a.orderIds]).toEqual([]);
  });

  it("skips rows with nothing in the column", () => {
    const a = availableOptions(
      [line({ sub_department: null as unknown as number })],
      NONE,
    );
    expect([...a.subIds]).toEqual([]);
  });
});

describe("markAvailability", () => {
  const opts = [
    { value: "a", label: "A" },
    { value: "b", label: "B" },
    { value: "c", label: "C" },
  ];

  it("marks what the other filters have ruled out", () => {
    const out = markAvailability(opts, new Set(["a"]), []);
    expect(out.map((o) => o.unavailable)).toEqual([false, true, true]);
  });

  it("leads with a pick of your own that has gone dead", () => {
    // It is the reason the screen is empty, and in a list of two thousand
    // items it is the one thing worth finding.
    const out = markAvailability(opts, new Set(["a"]), ["c"]);
    expect(out[0].value).toBe("c");
    expect(out[0].unavailable).toBe(true);
  });

  it("leaves the order alone when every pick still works", () => {
    const out = markAvailability(opts, new Set(["a", "b", "c"]), ["b"]);
    expect(out.map((o) => o.value)).toEqual(["a", "b", "c"]);
  });
});
