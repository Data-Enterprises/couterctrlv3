import { describe, expect, it } from "vitest";
import { Decimal } from "../../core/Decimal";
import type { ParsedRecord } from "../../core/types";
import type { AwgInvoice } from "./group";
import { applyEdits, isValidEdit, type InvoiceEdit } from "./applyEdit";

const line = (fields: Record<string, unknown>): ParsedRecord =>
  ({
    recordType: "01",
    lineNumber: 1,
    known: true,
    raw: "",
    fields,
  }) as ParsedRecord;

const invoice = (): AwgInvoice => ({
  storeNbr: "5401",
  invoiceNbr: "0087755",
  retailDept: "01",
  deliveryDate: "2026-04-26",
  lineItems: [
    line({
      item_desc: "BST CH KETTL JALPENO",
      upc_code: "0007003866473",
      item_code_bil: "166473",
      size: "8 OZ",
      case_qty_billed: new Decimal(2440n, 0),
      mbr_case_cost: new Decimal(2100n, 2),
      cost_ext: new Decimal(21000n, 2),
      ba_retail_ext: new Decimal(18400n, 2),
    }),
    line({
      item_desc: "LA FF SSND CHKN FRY",
      upc_code: "0003915600412",
      item_code_bil: "104412",
      size: "22 OZ",
      case_qty_billed: new Decimal(3860n, 0),
      mbr_case_cost: new Decimal(1730n, 2),
      cost_ext: new Decimal(34700n, 2),
      ba_retail_ext: new Decimal(38600n, 2),
    }),
  ],
  deals: [],
  palletAllowances: [],
  taxes: [],
  exceptions: [],
  shipperComponents: [],
  deliveryCharges: [],
  total: null,
});

const DOC = "5401-0087755";

const edit = (over: Partial<InvoiceEdit>): InvoiceEdit => ({
  docId: DOC,
  kind: "line",
  field: "cost_ext",
  value: "0",
  rowIndex: 0,
  ...over,
});

describe("applyEdits", () => {
  it("parses a money field to an exact Decimal at the field's own scale", () => {
    const [result] = applyEdits(
      [invoice()],
      [edit({ field: "cost_ext", value: "123.45" })],
    );
    const value = result.lineItems[0].fields.cost_ext as Decimal;
    expect(value).toBeInstanceOf(Decimal);
    expect(value.units).toBe(12345n);
    expect(value.decimals).toBe(2);
    expect(value.toString()).toBe("123.45");
  });

  it("parses a count field at zero decimals", () => {
    const [result] = applyEdits(
      [invoice()],
      [edit({ field: "case_qty_billed", value: "17" })],
    );
    const value = result.lineItems[0].fields.case_qty_billed as Decimal;
    expect(value.units).toBe(17n);
    expect(value.decimals).toBe(0);
  });

  it("takes a text field as typed", () => {
    const [result] = applyEdits(
      [invoice()],
      [edit({ field: "item_desc", value: "BST CH KETTLE JALAPENO" })],
    );
    expect(result.lineItems[0].fields.item_desc).toBe("BST CH KETTLE JALAPENO");
  });

  it("keeps an id field's leading zeros", () => {
    // AWG codes and UPCs are `id` fields, so they pass through as typed.
    // Coercing them as numbers would turn 016647 into 16647 and quietly
    // change which item the line is about.
    const [result] = applyEdits(
      [invoice()],
      [edit({ field: "item_code_bil", value: "016647" })],
    );
    expect(result.lineItems[0].fields.item_code_bil).toBe("016647");

    const [upc] = applyEdits(
      [invoice()],
      [edit({ field: "upc_code", value: "0007003866473" })],
    );
    expect(upc.lineItems[0].fields.upc_code).toBe("0007003866473");
  });

  it("rejects an unreadable money value and leaves the invoice alone", () => {
    const before = invoice();
    const [result] = applyEdits(
      [before],
      [edit({ field: "cost_ext", value: "12.4.5" })],
    );
    expect(result.lineItems[0].fields.cost_ext).toBe(
      before.lineItems[0].fields.cost_ext,
    );
  });

  it("does not recompute neighbouring fields", () => {
    // The whole point: a correction fixes what the file says. Recomputing
    // ext cost from qty would erase the disagreement reconciliation exists
    // to surface.
    const before = invoice();
    const [result] = applyEdits(
      [before],
      [edit({ field: "case_qty_billed", value: "1" })],
    );
    const row = result.lineItems[0];
    expect((row.fields.cost_ext as Decimal).toString()).toBe("210.00");
    expect((row.fields.mbr_case_cost as Decimal).toString()).toBe("21.00");
    expect((row.fields.ba_retail_ext as Decimal).toString()).toBe("184.00");
  });

  it("touches only the row it names", () => {
    const [result] = applyEdits(
      [invoice()],
      [edit({ field: "item_desc", value: "CHANGED", rowIndex: 0 })],
    );
    expect(result.lineItems[1].fields.item_desc).toBe("LA FF SSND CHKN FRY");
  });

  it("applies header edits, and reads a blank date as no date", () => {
    const [dept] = applyEdits(
      [invoice()],
      [edit({ kind: "header", field: "retail_dept", value: "07", rowIndex: undefined })],
    );
    expect(dept.retailDept).toBe("07");

    const [cleared] = applyEdits(
      [invoice()],
      [edit({ kind: "header", field: "delv_date", value: "   ", rowIndex: undefined })],
    );
    expect(cleared.deliveryDate).toBeNull();
  });

  it("ignores an edit for an invoice that is not in the file", () => {
    const before = invoice();
    const [result] = applyEdits([before], [edit({ docId: "9999-0000000" })]);
    expect(result).toBe(before);
  });

  it("ignores a row index the invoice does not have", () => {
    const before = invoice();
    const [result] = applyEdits([before], [edit({ rowIndex: 99 })]);
    expect(result.lineItems).toBe(before.lineItems);
  });

  it("replays edits in order, so the last one wins", () => {
    const [result] = applyEdits(
      [invoice()],
      [
        edit({ field: "cost_ext", value: "1.00" }),
        edit({ field: "cost_ext", value: "2.00" }),
      ],
    );
    expect((result.lineItems[0].fields.cost_ext as Decimal).toString()).toBe(
      "2.00",
    );
  });

  it("returns the same array when there is nothing to apply", () => {
    const rows = [invoice()];
    expect(applyEdits(rows, [])).toBe(rows);
  });
});

describe("isValidEdit", () => {
  it("accepts a well-formed amount and refuses a malformed one", () => {
    expect(isValidEdit("cost_ext", "10.00")).toBe(true);
    expect(isValidEdit("cost_ext", "-10.00")).toBe(true);
    expect(isValidEdit("cost_ext", "banana")).toBe(false);
  });

  it("accepts anything for a text field", () => {
    expect(isValidEdit("item_desc", "")).toBe(true);
    expect(isValidEdit("size", "8 OZ")).toBe(true);
  });
});
