import { describe, expect, it } from "vitest";
import { Decimal } from "../../core/Decimal";
import { parseAwgFile } from ".";
import { AWG_FILE_SPEC } from "./schema";
import { applyEdits, type InvoiceEdit } from "./applyEdit";
import { rebuildAwgFile } from "./rebuildFile";
import { encodeOverpunch } from "../../core/encodeField";

/**
 * The file Send uploads.
 *
 * The server decodes what it receives, so these hold the one property that
 * matters: a corrected figure reaches the file, and nothing else in it moves.
 * A fixed-width file gives no sign it has been corrupted — every later column
 * still lines up, it just means something else — so "nothing else moves" is
 * asserted line by line rather than trusted.
 */

/**
 * A billed-item record, built from the schema rather than from counted
 * columns. Blank spans decode to zero or empty, so only the fields a test
 * reads are filled — and the schema supplies their widths, which is the part
 * that is easy to get wrong by hand.
 */
const LINE_FIELDS = AWG_FILE_SPEC.schemas["01"].fields;

const lineRecord = (
  values: Record<string, string> = {},
): string => {
  const filled: Record<string, string> = {
    store_nbr: "5401",
    invoice_nbr: "0087755",
    retail_dept: "010",
    delv_date: "20260426",
    // 10 cases, five wide, no decimals.
    case_qty_billed: "0001{",
    // $210.00, thirteen wide, two decimals.
    cost_ext: "000000002100{",
    upc_code: "000007003866473",
    item_code_bil: "166473",
    item_desc: "BST CH KETTL JALPENO",
    size: "8 OZ",
    ...values,
  };

  let line = " ".repeat(AWG_FILE_SPEC.recordLength);
  const put = (start: number, text: string) =>
    (line = line.slice(0, start - 1) + text + line.slice(start - 1 + text.length));

  put(1, "01");
  for (const field of LINE_FIELDS) {
    const text = filled[field.name];
    if (text === undefined) continue;
    const width = field.end - field.start + 1;
    if (text.length > width) {
      throw new Error(`${field.name}: "${text}" wider than ${width}`);
    }
    put(field.start, text.padEnd(width, " "));
  }
  return line;
};

describe("encodeOverpunch", () => {
  it("folds the sign into the last digit", () => {
    expect(encodeOverpunch(new Decimal(2440n, 2), 8, 2)).toBe("0000244{");
    expect(encodeOverpunch(new Decimal(-2440n, 2), 8, 2)).toBe("0000244}");
  });

  it("scales to the column's decimals, not the value's", () => {
    // 24.40 at two places into a four-place column is 244000, not 2440 --
    // writing the raw units would divide the figure by a hundred.
    expect(encodeOverpunch(new Decimal(2440n, 2), 8, 4)).toBe("0024400{");
  });

  it("round-trips every digit's overpunch character", () => {
    for (let d = 0; d <= 9; d += 1) {
      const positive = encodeOverpunch(new Decimal(BigInt(d), 0), 2, 0);
      expect(positive).toBe(`0${"{ABCDEFGHI"[d]}`);
      const negative = encodeOverpunch(new Decimal(BigInt(-d), 0), 2, 0);
      expect(negative).toBe(`0${d === 0 ? "{" : "}JKLMNOPQR"[d]}`);
    }
  });

  it("refuses a number too wide for its column", () => {
    expect(() => encodeOverpunch(new Decimal(123456789n, 0), 4, 0)).toThrow();
  });
});

describe("rebuilding the file", () => {
  const FILE = [lineRecord(), lineRecord(), ""].join("\n");

  const rebuildWith = (edits: InvoiceEdit[]) => {
    const parsed = parseAwgFile(FILE);
    return rebuildAwgFile(FILE, applyEdits(parsed.invoices, edits));
  };

  it("is byte-identical when nothing was corrected", () => {
    const out = rebuildWith([]);
    expect(out.text).toBe(FILE);
    expect(out.changedLines).toBe(0);
  });

  it("writes a corrected cost into its own column", () => {
    const out = rebuildWith([
      {
        docId: "5401-0087755",
        kind: "line",
        field: "cost_ext",
        value: "99.99",
        rowIndex: 0,
      },
    ]);
    expect(out.changedLines).toBe(1);
    expect(out.refused).toEqual([]);
    // Re-reading the rebuilt file is the real assertion: whatever we wrote,
    // the decoder has to get the corrected figure back out of it.
    const again = parseAwgFile(out.text);
    const line = again.invoices[0].lineItems[0];
    expect(String(line.fields.cost_ext)).toBe("99.99");
  });

  it("leaves every other line and column untouched", () => {
    const out = rebuildWith([
      {
        docId: "5401-0087755",
        kind: "line",
        field: "cost_ext",
        value: "99.99",
        rowIndex: 0,
      },
    ]);
    const before = FILE.split("\n");
    const after = out.text.split("\n");
    expect(after).toHaveLength(before.length);
    // The second record shares every value with the first and must not move.
    expect(after[1]).toBe(before[1]);
    // On the changed line, only the cost's own span differs.
    const differing: number[] = [];
    for (let i = 0; i < before[0].length; i += 1) {
      if (before[0][i] !== after[0][i]) differing.push(i + 1);
    }
    // cost_ext occupies 30-42.
    expect(Math.min(...differing)).toBeGreaterThanOrEqual(30);
    expect(Math.max(...differing)).toBeLessThanOrEqual(42);
  });

  it("carries a corrected description", () => {
    const out = rebuildWith([
      {
        docId: "5401-0087755",
        kind: "line",
        field: "item_desc",
        value: "CORRECTED NAME",
        rowIndex: 0,
      },
    ]);
    const again = parseAwgFile(out.text);
    expect(again.invoices[0].lineItems[0].fields.item_desc).toBe(
      "CORRECTED NAME",
    );
  });

  it("carries a header correction onto the invoice's records", () => {
    // `delv_date` is corrected on the invoice, not on a record, so without
    // special handling it would never reach the file at all.
    const out = rebuildWith([
      {
        docId: "5401-0087755",
        kind: "header",
        field: "delv_date",
        value: "2026-05-01",
      },
    ]);
    expect(out.changedLines).toBe(2);
    const again = parseAwgFile(out.text);
    expect(again.invoices[0].deliveryDate).toBe("2026-05-01");
  });

  it("refuses a value too wide for its column rather than truncating", () => {
    const out = rebuildWith([
      {
        docId: "5401-0087755",
        kind: "line",
        field: "item_desc",
        // The description column is 23 wide.
        value: "X".repeat(40),
        rowIndex: 0,
      },
    ]);
    expect(out.refused).toHaveLength(1);
    expect(out.refused[0]).toContain("item_desc");
    // And the line keeps what it had, rather than a trimmed lie.
    const again = parseAwgFile(out.text);
    expect(again.invoices[0].lineItems[0].fields.item_desc).toBe(
      "BST CH KETTL JALPENO",
    );
  });

  it("reports whether the page was reading with suggested corrections", () => {
    expect(rebuildWith([]).suggestedApplied).toBe(false);
    const on = rebuildWith([
      { docId: "*", kind: "suggested", field: "", value: "" },
    ]);
    expect(on.suggestedApplied).toBe(true);
  });
});
