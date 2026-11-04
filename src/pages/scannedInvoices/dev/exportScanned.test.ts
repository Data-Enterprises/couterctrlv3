import { describe, expect, it } from "vitest";
import type { ParsedInvoice } from "../../../api/invoices";
import {
  INVOICE_COLUMNS,
  amount,
  posProductCode,
  scannedToInvoicesCsv,
  scannedToOrdersCsv,
} from "./exportScanned";
import { lineLooksOff } from "./present";

const invoice: ParsedInvoice = {
  vendor: "Frito Lay",
  invoiceNumber: "08353811",
  invoiceDate: "2026-10-14",
  account: "",
  storeName: "IGA 21",
  storeNumber: "021",
  terms: null,
  pages: null,
  lines: [
    {
      description: "TOSTITOS SCOOPS PRTY SZ 17 OZ",
      itemCode: "",
      upc: "028400083140",
      qty: 1,
      unitPrice: "5.36",
      allowance: "0.33",
      ext: "5.03",
    },
    {
      description: "RETURN",
      itemCode: "X1",
      upc: "",
      qty: -2,
      unitPrice: "2.50",
      allowance: null,
      ext: "(5.00)",
    },
  ],
  totals: {
    subtotal: "0.03",
    discount: "",
    deposit: null,
    credits: null,
    serviceFee: "",
    invoiceTotal: "0.03",
  },
};

const parse = (csv: string) => {
  const [head, ...rows] = csv.replace(/^\uFEFF/, "").split("\n");
  const cols = head.split(",");
  return rows.map((r) =>
    Object.fromEntries(r.split(",").map((v, i) => [cols[i], v])),
  );
};

describe("posProductCode", () => {
  it("drops a valid check digit and pads to 13", () => {
    expect(posProductCode("028400589277")).toBe("0002840058927");
  });
  it("keeps a code printed without its check digit", () => {
    expect(posProductCode("28400-58927")).toBe("0002840058927");
  });
  it("leaves no UPC blank", () => {
    expect(posProductCode("000000000000")).toBe("");
    expect(posProductCode(undefined)).toBe("");
  });
});

describe("amount", () => {
  it("reads the printed forms a scan produces", () => {
    expect(amount("(5.00)")?.toString()).toBe("-5.0000");
    expect(amount("5.00-")?.toString()).toBe("-5.0000");
    expect(amount("$1,234.5")?.toString()).toBe("1234.5000");
    expect(amount("12.")?.toString()).toBe("12.0000");
    expect(amount("n/a")).toBeNull();
  });
});

describe("exports", () => {
  it("writes the invoice layout, one row per line", () => {
    const csv = scannedToInvoicesCsv(104, [invoice]);
    const rows = parse(csv);
    expect(Object.keys(rows[0])).toEqual([...INVOICE_COLUMNS]);
    expect(rows[0]).toMatchObject({
      storeid: "104",
      reference_number: "08353811",
      invoice_date: "10/14/2026 12:00:00 AM",
      product_code: "0002840008314",
      base_cost: "5.3600",
      total_dollars: "5.0300",
      allowance_total: "0.3300",
      unit_net_cost: "5.0300",
      gross_purchase: "5.3600",
    });
    expect(rows[1]).toMatchObject({
      qty: "-2",
      total_dollars: "-5.0000",
      unit_net_cost: "2.5000",
      line_number: "2",
    });
  });

  it("writes the order layout", () => {
    const rows = parse(scannedToOrdersCsv(104, [invoice]));
    expect(rows[1]).toMatchObject({
      order_id: "08353811",
      order_type: "INV",
      record_count: "2",
      extended_plessy: "X1",
      net_cost: "2.5000",
      base_cost: "2.5000",
    });
  });
});

describe("lineLooksOff", () => {
  it("accepts net and gross extensions", () => {
    expect(lineLooksOff(invoice.lines[0])).toBe(false);
    expect(lineLooksOff({ ...invoice.lines[0], ext: "5.36" })).toBe(false);
    expect(lineLooksOff(invoice.lines[1])).toBe(false);
  });
  it("flags one that follows from neither", () => {
    expect(lineLooksOff({ ...invoice.lines[0], ext: "53.60" })).toBe(true);
  });
});
