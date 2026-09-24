import { describe, expect, it } from "vitest";
import { sortRows } from "./sortRows";
import type { ExportColumn, ExportRow } from "../../../api/salesExport";

const columns: ExportColumn[] = [
  { name: "vendor_id", data_type: "character varying" },
  { name: "sub_department", data_type: "bigint" },
  { name: "total_sales_sum", data_type: "numeric" },
];

const rows: ExportRow[] = [
  { vendor_id: "C0021", sub_department: 30, total_sales_sum: 5 },
  { vendor_id: "50", sub_department: 5, total_sales_sum: 20 },
  { vendor_id: "50", sub_department: 30, total_sales_sum: 9 },
  { vendor_id: "50", sub_department: null, total_sales_sum: 1 },
];

const by = (rs: ExportRow[], key: string) => rs.map((r) => r[key]);

describe("the order the file will be written in", () => {
  it("sorts by one key, then the next", () => {
    const out = sortRows(
      rows,
      [
        { key: "vendor_id", desc: false },
        { key: "sub_department", desc: false },
      ],
      columns,
    );
    expect(by(out, "vendor_id")).toEqual(["50", "50", "50", "C0021"]);
    // Nulls last within the vendor, rather than sorting as the smallest.
    expect(by(out, "sub_department")).toEqual([5, 30, null, 30]);
  });

  it("compares a text column as text and a number as a number", () => {
    // sub_department is a bigint, so 5 is below 30 — as text it would not be.
    expect(
      by(sortRows(rows, [{ key: "sub_department", desc: false }], columns), "sub_department"),
    ).toEqual([5, 30, 30, null]);
    expect(
      by(sortRows(rows, [{ key: "vendor_id", desc: false }], columns), "vendor_id"),
    ).toEqual(["50", "50", "50", "C0021"]);
  });

  it("turns a key around without moving the nulls", () => {
    const out = sortRows(rows, [{ key: "total_sales_sum", desc: true }], columns);
    expect(by(out, "total_sales_sum")).toEqual([20, 9, 5, 1]);
  });

  it("sorts a measure the columns know nothing about", () => {
    // lossGain is computed: there is no column type behind it, and it still
    // has to sort as the number it is.
    const measured: ExportRow[] = [
      { storeid: 1, lossGain: 2 },
      { storeid: 2, lossGain: 10 },
      { storeid: 3, lossGain: -4 },
    ];
    expect(
      by(sortRows(measured, [{ key: "lossGain", desc: true }], columns), "lossGain"),
    ).toEqual([10, 2, -4]);
  });

  it("leaves the rows alone when nothing is sorted", () => {
    expect(sortRows(rows, [], columns)).toBe(rows);
  });
});
