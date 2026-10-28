import { describe, expect, it } from "vitest";
import { Decimal } from "../../core/Decimal";
import type { ParsedRecord } from "../../core/types";
import type { AwgInvoice } from "./group";
import { dealAllowances, dealsByLine } from "./allowances";
import { layoutDate, productCode } from "./exportLines";
import { ORDER_COLUMNS, awgInvoicesToOrdersCsv } from "./exportOrders";

/**
 * The orders export, and the arithmetic under it.
 *
 * The export writes a file that goes into the POS, so the figures in it are
 * worth holding to. These cover the three things most likely to drift: the
 * per-case division, the per-pound deal correction the invoice total depends
 * on, and the column mapping's own rules.
 */

const record = (
  recordType: string,
  fields: Record<string, unknown>,
): ParsedRecord =>
  ({ recordType, lineNumber: 1, known: true, raw: "", fields }) as ParsedRecord;

const line = (fields: Record<string, unknown>) => record("01", fields);
const deal = (fields: Record<string, unknown>) => record("02", fields);

const invoiceOf = (over: Partial<AwgInvoice> = {}): AwgInvoice => ({
  storeNbr: "5401",
  invoiceNbr: "0087755",
  retailDept: "01",
  deliveryDate: "2026-04-26",
  lineItems: [],
  deals: [],
  palletAllowances: [],
  taxes: [],
  exceptions: [],
  shipperComponents: [],
  deliveryCharges: [],
  total: null,
  ...over,
});

/** A plain cased line: 10 cases, pack 12, $21.00 a case, $210.00 extended. */
const casedLine = () =>
  line({
    item_desc: "BST CH KETTL JALPENO",
    size: "8 OZ",
    upc_code: "000007003866473",
    item_code_bil: "166473",
    case_qty_billed: new Decimal(10n, 0),
    pack: new Decimal(12n, 0),
    mbr_case_cost: new Decimal(2100n, 2),
    mbr_ext_case_cost: new Decimal(21000n, 2),
    cost_ext: new Decimal(21000n, 2),
    retail_price: new Decimal(299n, 2),
    retail_pricing_unit: new Decimal(1n, 0),
    rwi: "N",
  });

const cells = (csv: string, row: number): Record<string, string> => {
  const lines = csv.split("\n");
  const head = lines[0].split(",");
  const values = lines[row].split(",");
  return Object.fromEntries(head.map((name, i) => [name, values[i] ?? ""]));
};

describe("the orders export", () => {
  it("writes the header, then one row per billed line", () => {
    const { csv } = awgInvoicesToOrdersCsv(
      [invoiceOf({ lineItems: [casedLine(), casedLine()] })],
    );
    const lines = csv.split("\n");
    expect(lines[0]).toBe(ORDER_COLUMNS.join(","));
    expect(lines).toHaveLength(3);
  });

  it("leaves storeid and vendor_id to the pipeline", () => {
    // Neither is in the file and neither can be asked for honestly: a file
    // carries several AWG stores, and there is no vendor in the line schema
    // at all. `storenumber` and `vendor_name` are what the file does know.
    const { csv } = awgInvoicesToOrdersCsv([
      invoiceOf({ lineItems: [casedLine()] }),
    ]);
    const row = cells(csv, 1);
    expect(row.storeid).toBe("");
    expect(row.storename).toBe("");
    expect(row.vendor_id).toBe("");
    expect(row.storenumber).toBe("5401");
    expect(row.vendor_name).toBe("AWG");
  });

  it("divides cost by the cases, at four places", () => {
    const { csv } = awgInvoicesToOrdersCsv(
      [invoiceOf({ lineItems: [casedLine()] })]);
    const row = cells(csv, 1);
    expect(row.qty).toBe("10");
    expect(row.casesize).toBe("12");
    expect(row.base_cost).toBe("21.0000");
    expect(row.net_cost).toBe("21.0000");
  });

  it("marks an invoice's own line count and type", () => {
    const { csv } = awgInvoicesToOrdersCsv(
      [invoiceOf({ lineItems: [casedLine(), casedLine()] })],
    );
    const row = cells(csv, 1);
    expect(row.record_count).toBe("2");
    expect(row.order_type).toBe("INV");
    expect(row.status).toBe("OPEN");
    expect(row.line_number).toBe("1");
    expect(cells(csv, 2).line_number).toBe("2");
  });

  it("skips an invoice that billed nothing", () => {
    const { csv } = awgInvoicesToOrdersCsv(
      [invoiceOf({ lineItems: [] }), invoiceOf({ lineItems: [casedLine()] })],
    );
    expect(csv.split("\n")).toHaveLength(2);
  });
});

describe("the UPC rule", () => {
  it("drops AWG's two zeros of padding", () => {
    expect(productCode("000007003866473")).toBe("0007003866473");
  });

  it("blanks a line with no UPC rather than writing zeros", () => {
    // Random-weight meat carries no UPC. A code of zeros is not a code.
    expect(productCode("000000000000000")).toBe("");
  });

  it("leaves a code that is not 15 wide alone", () => {
    expect(productCode("0007003866473")).toBe("0007003866473");
  });
});

describe("the delivery date", () => {
  it("reads the file's own form", () => {
    expect(layoutDate("2020-08-31")).toBe("8/31/2020 12:00:00 AM");
  });

  it("reads the form it writes back out", () => {
    // The delivery date is hand-correctable, and this is what gets typed.
    // Taking only the ISO form meant the row exported with no date at all.
    expect(layoutDate("08/31/2020")).toBe("8/31/2020 12:00:00 AM");
    expect(layoutDate("8/31/2020")).toBe("8/31/2020 12:00:00 AM");
  });

  it("refuses a date that is not one, rather than guessing", () => {
    expect(layoutDate("31/04/2020")).toBeNull();
    expect(layoutDate("2020-02-30")).toBeNull();
    expect(layoutDate("last tuesday")).toBeNull();
    expect(layoutDate("")).toBeNull();
    expect(layoutDate(null)).toBeNull();
  });

  it("names the invoices whose date could not be read", () => {
    const { csv, undatedInvoices } = awgInvoicesToOrdersCsv(
      [
        invoiceOf({ invoiceNbr: "111", deliveryDate: "nonsense", lineItems: [casedLine()] }),
        invoiceOf({ invoiceNbr: "222", lineItems: [casedLine()] }),
      ],
    );
    expect(undatedInvoices).toEqual(["111"]);
    expect(cells(csv, 1).order_date).toBe("");
    expect(cells(csv, 2).order_date).toBe("4/26/2026 12:00:00 AM");
  });
});

/**
 * The allowances refactor split `dealAllowances` into a per-line grouping.
 * These hold it to what it returned before, which is what the invoice total
 * and the four reconciliation checks are built on.
 */
describe("deals, grouped by line", () => {
  const rwiLine = () =>
    line({
      rwi: "Y",
      // The line carries 000100; its deals extend it as 000101, 000102.
      deal_seqnum: "000100",
      pallet_weight: new Decimal(7619n, 2),
    });
  const plainLine = () => line({ rwi: "N", deal_seqnum: "000200" });

  it("takes a plain line's deal at face value", () => {
    const l = plainLine();
    const totals = dealAllowances(
      invoiceOf({
        lineItems: [l],
        deals: [deal({ deal_seqnum: "000201", deal_amount: new Decimal(500n, 2) })],
      }),
    );
    expect(totals.total.toString()).toBe("5.000000");
    // Face value is what the line was netted by, so nothing is left over.
    expect(totals.unnetted.toString()).toBe("0.000000");
  });

  it("reads a random-weight deal as rate times weight", () => {
    // $0.10/lb over 76.19 lb is $7.619, and the line was netted by $0.10.
    const l = rwiLine();
    const totals = dealAllowances(
      invoiceOf({
        lineItems: [l],
        deals: [deal({ deal_seqnum: "000101", deal_amount: new Decimal(1000n, 4) })],
      }),
    );
    expect(totals.total.toString()).toBe("7.619000");
    expect(totals.unnetted.toString()).toBe("7.519000");
  });

  it("adds up several deals on one line", () => {
    const l = plainLine();
    const totals = dealAllowances(
      invoiceOf({
        lineItems: [l],
        deals: [
          deal({ deal_seqnum: "000201", deal_amount: new Decimal(500n, 2) }),
          deal({ deal_seqnum: "000202", deal_amount: new Decimal(250n, 2) }),
        ],
      }),
    );
    expect(totals.total.toString()).toBe("7.500000");
  });

  it("still counts a deal whose line is missing, at face value", () => {
    // The grouping skips it -- there is no line to group it under -- so the
    // total adds it back explicitly. Dropping it would quietly shrink the
    // invoice's allowances.
    const totals = dealAllowances(
      invoiceOf({
        lineItems: [plainLine()],
        deals: [deal({ deal_seqnum: "999901", deal_amount: new Decimal(500n, 2) })],
      }),
    );
    expect(totals.total.toString()).toBe("5.000000");
    expect(totals.unnetted.toString()).toBe("0.000000");
  });

  it("reads deals at face value when per-pound is off", () => {
    // As-printed: no suggested corrections, so no rate-times-weight.
    const l = rwiLine();
    const grouped = dealsByLine(
      invoiceOf({
        lineItems: [l],
        deals: [deal({ deal_seqnum: "000101", deal_amount: new Decimal(1000n, 4) })],
      }),
      false,
    );
    const held = [...grouped.values()][0];
    expect(held.total.toString()).toBe(held.netted.toString());
  });
});
