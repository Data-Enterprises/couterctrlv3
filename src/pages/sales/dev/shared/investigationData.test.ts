import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AllOrder, SubDeptMargin } from "../../../../interfaces";

const getSubMarginsWithPricePoints = vi.fn();
const getAllOrders = vi.fn();
const searchReceiversByItem = vi.fn();

vi.mock("../../../../api/subMargins", () => ({
  getSubMarginsWithPricePoints: (...a: unknown[]) =>
    getSubMarginsWithPricePoints(...a),
}));
vi.mock("../../../../api/orders", () => ({
  getAllOrders: (...a: unknown[]) => getAllOrders(...a),
}));
vi.mock("../../../../api/receivers", () => ({
  searchReceiversByItem: (...a: unknown[]) => searchReceiversByItem(...a),
}));

const {
  SUPPLY_LOOKBACK_DAYS,
  codesIn,
  fetchOrders,
  fetchReceipts,
  fetchSales,
  supplyWindow,
} = await import("./investigationData");

const scope = {
  url: "u/",
  token: "t",
  mine: { storeid: 1, storeNumber: "010", name: "Leitchfield" },
  theirs: { storeid: 2, storeNumber: "440", name: "Mt Carmel" },
  subDept: 7,
  tw: { start: "2026-09-28", end: "2026-10-04" },
  lw: { start: "2026-09-21", end: "2026-09-27" },
  ly: { start: "2025-09-29", end: "2025-10-05" },
  metric: "sales" as const,
};

const row = (over: Partial<SubDeptMargin> = {}) =>
  ({
    product_code: "A",
    store_number: "010",
    product_description: "Thing",
    vendor_name: "Acme",
    total_sales: 0,
    total_tax: 0,
    qty: 0,
    ...over,
  }) as SubDeptMargin;

const order = (over: Partial<AllOrder> = {}) =>
  ({
    storeid: 1,
    storenumber: "010",
    product_code: "A",
    qty: 1,
    sub_department: 7,
    ...over,
  }) as AllOrder;

const subsOk = (subs: SubDeptMargin[], extra: Record<string, unknown> = {}) => ({
  data: { error: 0, subs, total_pages: 1, ...extra },
});

beforeEach(() => {
  getSubMarginsWithPricePoints.mockReset();
  getAllOrders.mockReset();
  searchReceiversByItem.mockReset();
});

describe("supplyWindow", () => {
  it("reads back from the sales week's END, not its start", () => {
    expect(supplyWindow(scope.tw)).toEqual({
      start: "2026-08-23",
      end: "2026-10-04",
    });
  });

  /** The span is the constant's, not the sales window's: a year of sales
   *  still reads six weeks of supply. */
  it("is six weeks, independent of how long the sales window is", () => {
    expect(SUPPLY_LOOKBACK_DAYS).toBe(42);
    const long = supplyWindow({ start: "2026-01-01", end: "2026-10-04" });
    expect(long.start).toBe("2026-08-23");
  });
});

describe("codesIn", () => {
  it("collects every code across both stores and all three periods, once", () => {
    const codes = codesIn({
      mineTw: [row({ product_code: "A" })],
      mineLw: [row({ product_code: "B" })],
      mineLy: [row({ product_code: "A" })],
      theirsTw: [row({ product_code: "C" })],
      theirsLw: [],
      theirsLy: [row({ product_code: "B" })],
      minePoints: [],
      theirsPoints: [],
    });
    expect(codes.sort()).toEqual(["A", "B", "C"]);
  });

  /**
   * The field is typed `string` and the payload does not always agree.
   *
   * A sub-department line with no item behind it comes back carrying a
   * numeric 0. `item_search` validates its body, so one of those took the
   * whole receipt request down with a 422 — no deliveries for any item in
   * the department, and every row stuck reading "still reading deliveries".
   */
  it("drops a code the payload sent as a number instead of a string", () => {
    const codes = codesIn({
      mineTw: [
        row({ product_code: "A" }),
        row({ product_code: 0 as unknown as string }),
      ],
      mineLw: [], mineLy: [],
      theirsTw: [row({ product_code: "" })],
      theirsLw: [], theirsLy: [],
      minePoints: [],
      theirsPoints: [],
    });
    expect(codes).toEqual(["A"]);
    expect(codes.every((c) => typeof c === "string")).toBe(true);
  });
});

describe("fetchSales", () => {
  it("asks six times — two stores by three periods", async () => {
    getSubMarginsWithPricePoints.mockResolvedValue(subsOk([]));
    await fetchSales(scope);
    expect(getSubMarginsWithPricePoints).toHaveBeenCalledTimes(6);
  });

  it("narrows a co-located store's rows by number", async () => {
    getSubMarginsWithPricePoints.mockResolvedValue(
      subsOk([
        row({ product_code: "A", store_number: "010" }),
        row({ product_code: "B", store_number: "011" }),
      ]),
    );
    const out = await fetchSales(scope);
    expect(out.mineTw.map((r) => r.product_code)).toEqual(["A"]);
  });

  it("reads price points for this week only, never the comparison weeks", async () => {
    // searchValue (the storeid) is argument 6; page is argument 8.
    getSubMarginsWithPricePoints.mockImplementation((...a: unknown[]) => {
      const storeid = a[6] as number;
      const start = a[3] as string;
      return Promise.resolve(
        subsOk([], {
          price_points: [
            { product_code: "p", store_number: "x", price: 1, storeid, start },
          ],
        }),
      );
    });
    const out = await fetchSales(scope);
    expect(out.minePoints).toHaveLength(1);
    expect(out.theirsPoints).toHaveLength(1);
    // Both ladders are THIS week's; last week and last year are not asked.
    expect(out.minePoints[0]).toMatchObject({ storeid: 1, start: "2026-09-28" });
    expect(out.theirsPoints[0]).toMatchObject({ storeid: 2, start: "2026-09-28" });
  });

  it("treats error 1 as no records, not as a failure", async () => {
    getSubMarginsWithPricePoints.mockResolvedValue({
      data: { error: 1, msg: "no records" },
    });
    await expect(fetchSales(scope)).resolves.toMatchObject({ mineTw: [] });
  });

  it("walks every page, because rows are ordered by date", async () => {
    getSubMarginsWithPricePoints.mockImplementation(
      (...a: unknown[]) => {
        const page = (a[8] as number) ?? 1;
        return Promise.resolve(
          subsOk([row({ product_code: "p" + page })], { total_pages: 3 }),
        );
      },
    );
    const out = await fetchSales(scope);
    expect(out.mineTw.map((r) => r.product_code)).toEqual(["p1", "p2", "p3"]);
  });

  it("throws when a later page fails rather than losing the end of the window", async () => {
    getSubMarginsWithPricePoints.mockImplementation((...a: unknown[]) => {
      const page = (a[8] as number) ?? 1;
      return Promise.resolve(
        page === 1
          ? subsOk([row()], { total_pages: 2 })
          : { data: { error: 1, msg: "boom" } },
      );
    });
    await expect(fetchSales(scope)).rejects.toThrow();
  });
});

describe("fetchOrders", () => {
  it("asks once for both stores, not once each", async () => {
    getAllOrders.mockResolvedValue({ data: { error: 0, orders: [] } });
    await fetchOrders(scope);
    expect(getAllOrders).toHaveBeenCalledTimes(1);
    expect(getAllOrders.mock.calls[0][4]).toEqual([1, 2]);
  });

  it("asks over the supply window, not the sales week", async () => {
    getAllOrders.mockResolvedValue({ data: { error: 0, orders: [] } });
    await fetchOrders(scope);
    expect(getAllOrders.mock.calls[0][2]).toBe("2026-08-23");
    expect(getAllOrders.mock.calls[0][3]).toBe("2026-10-04");
  });

  it("keeps only this department's lines", async () => {
    getAllOrders.mockResolvedValue({
      data: {
        error: 0,
        orders: [
          order({ product_code: "in", sub_department: 7 }),
          order({ product_code: "out", sub_department: 9 }),
        ],
      },
    });
    const out = await fetchOrders(scope);
    expect(out.mine.map((o) => o.product_code)).toEqual(["in"]);
  });

  it("splits the one response by store", async () => {
    getAllOrders.mockResolvedValue({
      data: {
        error: 0,
        orders: [
          order({ product_code: "mine", storeid: 1, storenumber: "010" }),
          order({ product_code: "theirs", storeid: 2, storenumber: "440" }),
        ],
      },
    });
    const out = await fetchOrders(scope);
    expect(out.mine.map((o) => o.product_code)).toEqual(["mine"]);
    expect(out.theirs.map((o) => o.product_code)).toEqual(["theirs"]);
  });

  it("separates co-located stores sharing one storeid", async () => {
    getAllOrders.mockResolvedValue({
      data: {
        error: 0,
        orders: [
          order({ product_code: "here", storeid: 1, storenumber: "010" }),
          order({ product_code: "next door", storeid: 1, storenumber: "011" }),
        ],
      },
    });
    const out = await fetchOrders(scope);
    expect(out.mine.map((o) => o.product_code)).toEqual(["here"]);
  });

  it("resolves empty rather than throwing, so the grid survives", async () => {
    getAllOrders.mockRejectedValue(new Error("network"));
    await expect(fetchOrders(scope)).resolves.toEqual({
      ok: false,
      inWindow: 0,
      mine: [],
      theirs: [],
      allMine: [],
      allTheirs: [],
    });
  });

  it("treats error 1 the same way", async () => {
    getAllOrders.mockResolvedValue({ data: { error: 1, msg: "nope" } });
    await expect(fetchOrders(scope)).resolves.toEqual({
      ok: false,
      inWindow: 0,
      mine: [],
      theirs: [],
      allMine: [],
      allTheirs: [],
    });
  });

  /** The receipts search finds this department by product code and was
   *  returning deliveries on windows where the department filter alone
   *  returned no orders at all. An order line's `sub_department` comes off
   *  the item master at order time; the sales rows' comes off the
   *  transaction, and the two can disagree about the same item. */
  it("claims an order line by product code when the department disagrees", async () => {
    getAllOrders.mockResolvedValue({
      data: {
        error: 0,
        orders: [order({ product_code: "A", sub_department: 999 })],
      },
    });
    const out = await fetchOrders(scope, ["A"]);
    expect(out.mine).toHaveLength(1);
  });

  /** Plenty came back and none of it is this department: a different answer
   *  from nothing coming back, and the panel says a different thing. */
  it("counts what came back before the department filter", async () => {
    getAllOrders.mockResolvedValue({
      data: {
        error: 0,
        orders: [
          order({ product_code: "Z", sub_department: 999 }),
          order({ product_code: "Y", sub_department: 999 }),
        ],
      },
    });
    const out = await fetchOrders(scope, ["A"]);
    expect(out.inWindow).toBe(2);
    expect(out.mine).toEqual([]);
  });

  /** An empty window and a window that could not be read are different
   *  answers, and the panel says different things about them. */
  it("marks a window that answered with nothing in it as read", async () => {
    getAllOrders.mockResolvedValue({ data: { error: 0, orders: [] } });
    const out = await fetchOrders(scope);
    expect(out.ok).toBe(true);
    expect(out.inWindow).toBe(0);
    expect(out.mine).toEqual([]);
  });

  /** `sub_department` is typed as a number and the payload does not always
   *  agree. A strict === against a string dropped every order in the
   *  department, and the panel then reported that neither store ordered. */
  it("matches the department whether it arrives as a number or a string", async () => {
    getAllOrders.mockResolvedValue({
      data: {
        error: 0,
        orders: [
          order({ sub_department: String(scope.subDept) as unknown as number }),
        ],
      },
    });
    const out = await fetchOrders(scope);
    expect(out.mine).toHaveLength(1);
  });
});

describe("fetchReceipts", () => {
  const recvOk = (
    receivers: Array<Record<string, unknown>>,
    total_pages = 1,
  ) => ({ data: { error: 0, receivers, total_pages } });

  it("asks once per store", async () => {
    searchReceiversByItem.mockResolvedValue(recvOk([]));
    await fetchReceipts(scope, ["A"]);
    expect(searchReceiversByItem).toHaveBeenCalledTimes(2);
  });

  it("does not call at all without codes to look for", async () => {
    await fetchReceipts(scope, []);
    expect(searchReceiversByItem).not.toHaveBeenCalled();
  });

  it("walks every page — it pages by RECEIVER, so page 1 alone drops deliveries", async () => {
    searchReceiversByItem.mockImplementation((...a: unknown[]) => {
      const page = (a[6] as number) ?? 1;
      return Promise.resolve(
        recvOk([{ invoiceid: page, store_number: "010", lines: [] }], 3),
      );
    });
    const out = await fetchReceipts(scope, ["A"]);
    expect(out.mine.map((r) => r.invoiceid)).toEqual([1, 2, 3]);
  });

  it("narrows a co-located store's receivers by number", async () => {
    searchReceiversByItem.mockResolvedValue(
      recvOk([
        { invoiceid: 1, store_number: "010", lines: [] },
        { invoiceid: 2, store_number: "011", lines: [] },
      ]),
    );
    const out = await fetchReceipts(scope, ["A"]);
    expect(out.mine.map((r) => r.invoiceid)).toEqual([1]);
  });

  it("resolves empty on failure rather than taking the screen down", async () => {
    searchReceiversByItem.mockRejectedValue(new Error("network"));
    await expect(fetchReceipts(scope, ["A"])).resolves.toEqual({
      mine: [],
      theirs: [],
    });
  });
});
