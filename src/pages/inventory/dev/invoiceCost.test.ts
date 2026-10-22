import { describe, expect, it } from "vitest";
import { latestInvoiceCost, resolveUnitCost } from "./invoiceCost";
import { itemCostStats, type ProductSummary } from "./inventoryData";
import { estimatedPricePoints } from "../../../utils/pricePoints";
import type {
  ReceiverItemSearchReceiver,
  SubDeptMargin,
} from "../../../interfaces";

/**
 * COKE 6PK at store 695: the item file said $4.91 a unit, the 10/16 Coke
 * invoice said $3.13, and Price Opt flagged a $3.33 sale "below cost" at -47%
 * (dev board review, findings O and W). Decided 2026-10-22: invoice first,
 * item file as the fallback.
 */
const receiver = (
  date: string,
  ucost: number,
  product_code = "4900002468",
): ReceiverItemSearchReceiver =>
  ({
    invoiceid: Number(date.replace(/-/g, "")),
    invoice_date: date,
    vendor_name: "COKE",
    lines: [
      {
        product_code,
        product_description: "COKE 6PK .5LT",
        qty: 224,
        cases: 56,
        ucost,
        retail: 4.49,
        free: 0,
        item_return: 0,
      },
    ],
  }) as unknown as ReceiverItemSearchReceiver;

describe("latestInvoiceCost", () => {
  it("takes the most recent delivery inside the window", () => {
    const got = latestInvoiceCost(
      [receiver("2026-09-20", 3.05), receiver("2026-10-16", 3.13)],
      "4900002468",
      "2026-10-20",
    );
    expect(got?.unitCost).toBe(3.13);
    expect(got?.date).toBe("2026-10-16");
  });

  it("ignores a delivery after the window ends", () => {
    // It can't be the cost of anything sold inside the window.
    const got = latestInvoiceCost(
      [receiver("2026-10-16", 3.13), receiver("2026-10-22", 2.99)],
      "4900002468",
      "2026-10-20",
    );
    expect(got?.unitCost).toBe(3.13);
  });

  it("ignores other items on the same invoice", () => {
    const got = latestInvoiceCost(
      [receiver("2026-10-16", 1.0, "1200000001")],
      "4900002468",
      "2026-10-20",
    );
    expect(got).toBeNull();
  });

  it("ignores a line with no cost", () => {
    expect(
      latestInvoiceCost([receiver("2026-10-16", 0)], "4900002468", "2026-10-20"),
    ).toBeNull();
  });
});

describe("resolveUnitCost", () => {
  const invoice = { unitCost: 3.13, date: "2026-10-16", invoiceId: 83374 };

  it("prefers what the store paid", () => {
    const got = resolveUnitCost(4.91, invoice, false);
    expect(got.source).toBe("invoice");
    expect(got.unitCost).toBe(3.13);
  });

  it("falls back to the item file with no invoice", () => {
    const got = resolveUnitCost(4.91, null, false);
    expect(got.source).toBe("item file");
    expect(got.unitCost).toBe(4.91);
  });

  it("keeps a weighed item on the item file", () => {
    // Sales count pounds; an invoice can bill per case or per pack.
    const got = resolveUnitCost(2.95, invoice, true);
    expect(got.source).toBe("item file");
    expect(got.unitCost).toBe(2.95);
  });
});

describe("one cost under every table", () => {
  const row = (over: Partial<SubDeptMargin>): SubDeptMargin =>
    ({
      sale_type: "Sale",
      sale_date: "2026-10-16T00:00:00",
      price_type: "REG",
      total_sales: 33.3,
      net_sales: 33.3,
      total_tax: 0,
      qty: 10,
      weight: 0,
      net_cost: 49.1,
      cost: 4.91,
      case_size: 1,
      ...over,
    }) as SubDeptMargin;
  const product: ProductSummary = {
    productCode: "4900002468",
    description: "COKE 6PK .5LT",
    sales: 33.3,
    qty: 10,
    units: 10,
    rows: [row({})],
  };

  it("holds the header to the invoice cost", () => {
    const stats = itemCostStats(product, 3.13);
    expect(stats.unitCost).toBe(3.13);
    expect(stats.cogs).toBeCloseTo(31.3, 10);
  });

  it("holds the left table to the same cost", () => {
    // Ten at $3.33 against $3.13 is a profit, not the -47% loss the item file
    // reported.
    const [point] = estimatedPricePoints(product.rows, 3.13);
    expect(point.marginPerUnit).toBeCloseTo(0.2, 10);
  });

  it("costs each row from its own fields without an override", () => {
    expect(itemCostStats(product).unitCost).toBeGreaterThan(4);
  });
});
