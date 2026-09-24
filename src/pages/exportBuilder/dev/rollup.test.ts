import { describe, expect, it } from "vitest";
import { rollupSampleRows } from "./rollup";
import { aliasFor, fnsFor } from "./aggregates";
import type { ExportColumn, ExportRow } from "../../../api/salesExport";

const columns: ExportColumn[] = [
  { name: "storeid", data_type: "bigint" },
  { name: "sale_date", data_type: "timestamp without time zone" },
  { name: "total_sales", data_type: "numeric" },
  { name: "qty", data_type: "numeric" },
  { name: "sub_department", data_type: "bigint" },
  // Looks like a number, is not. The endpoint refuses sum and avg on these.
  { name: "member_level", data_type: "character varying" },
];

const rows: ExportRow[] = [
  { storeid: 36, sale_date: "2026-09-14", total_sales: 10, qty: 1, sub_department: 5, member_level: "9" },
  { storeid: 36, sale_date: "2026-09-14", total_sales: 5, qty: 2, sub_department: 5, member_level: "10" },
  { storeid: 36, sale_date: "2026-09-15", total_sales: 20, qty: null, sub_department: null, member_level: null },
  { storeid: 41, sale_date: "2026-09-15", total_sales: 2.5, qty: 3, sub_department: 30, member_level: "2" },
];

const spec = (over: Partial<Parameters<typeof rollupSampleRows>[1]> = {}) => ({
  groupBy: ["storeid"],
  aggregates: [{ column: "total_sales", fn: "sum" as const }],
  columns,
  ordered: false,
  ...over,
});

describe("the summary a rollup would produce", () => {
  it("makes one row per combination of the keys", () => {
    const out = rollupSampleRows(rows, spec({ groupBy: ["storeid", "sale_date"] }));
    expect(out.columns).toEqual(["storeid", "sale_date", "total_sales_sum"]);
    expect(out.rows).toHaveLength(3);
    expect(out.rows[0]).toEqual({
      storeid: 36,
      sale_date: "2026-09-14",
      total_sales_sum: 15,
    });
  });

  it("gives a null key its own row, as the file does", () => {
    // The tender lines land there — the sub-department rollup on the endpoint
    // shows exactly one of these.
    const out = rollupSampleRows(rows, spec({ groupBy: ["sub_department"] }));
    expect(out.rows.map((r) => r.sub_department)).toEqual([5, null, 30]);
  });

  it("counts values for a column and rows for count(*)", () => {
    // qty is null on one line: SQL counts values, not rows.
    const out = rollupSampleRows(
      rows,
      spec({
        groupBy: ["storeid"],
        aggregates: [
          { column: "qty", fn: "count" },
          { column: "*", fn: "count" },
        ],
      }),
    );
    expect(out.columns).toEqual(["storeid", "qty_count", "row_count"]);
    expect(out.rows[0]).toEqual({ storeid: 36, qty_count: 2, row_count: 3 });
  });

  it("averages over the values it actually had", () => {
    const out = rollupSampleRows(
      rows,
      spec({ aggregates: [{ column: "qty", fn: "avg" }] }),
    );
    // Store 36: qty 1 and 2, with the null ignored rather than counted as 0.
    expect(out.rows[0].qty_avg).toBe(1.5);
  });

  it("compares a text column as text, which is what the endpoint does", () => {
    // member_level is varchar, so "9" is above "10" — surprising, and the
    // truth about the file.
    const text = rollupSampleRows(
      rows,
      spec({ aggregates: [{ column: "member_level", fn: "max" }] }),
    );
    expect(text.rows[0].member_level_max).toBe("9");

    const numeric = rollupSampleRows(
      rows,
      spec({ aggregates: [{ column: "total_sales", fn: "max" }] }),
    );
    expect(numeric.rows[0].total_sales_max).toBe(20);
  });

  it("counts distinct values", () => {
    const out = rollupSampleRows(
      rows,
      spec({ aggregates: [{ column: "sale_date", fn: "count_distinct" }] }),
    );
    expect(out.rows[0].sale_date_count_distinct).toBe(2);
  });

  it("sorts by the group keys when the file is sorted, nulls last", () => {
    const out = rollupSampleRows(
      rows,
      spec({ groupBy: ["sub_department"], ordered: true }),
    );
    expect(out.rows.map((r) => r.sub_department)).toEqual([5, 30, null]);
  });

  it("has nothing to show without a measure", () => {
    expect(rollupSampleRows(rows, spec({ aggregates: [] })).rows).toEqual([]);
  });

  it("rolls the lot into one row when there are no keys", () => {
    // Which is what the query window does for `select sum(total_sales)`. The
    // page itself never asks for this: the endpoint requires a key, and the
    // export is blocked until there is one.
    expect(rollupSampleRows(rows, spec({ groupBy: [] })).rows).toEqual([
      { total_sales_sum: 37.5 },
    ]);
  });
});

describe("what a measure may be", () => {
  it("keeps sum and avg away from a column that only looks numeric", () => {
    // Summing a varchar fails inside the export, after RDS has begun writing.
    expect(fnsFor("member_level", columns)).not.toContain("sum");
    expect(fnsFor("member_level", columns)).not.toContain("avg");
    expect(fnsFor("member_level", columns)).toContain("max");
    expect(fnsFor("total_sales", columns)).toContain("sum");
  });

  it("offers count and nothing else for all rows", () => {
    expect(fnsFor("*", columns)).toEqual(["count"]);
  });

  it("names a measure the way the file will", () => {
    expect(aliasFor("total_sales", "sum")).toBe("total_sales_sum");
    expect(aliasFor("*", "count")).toBe("row_count");
  });
});
