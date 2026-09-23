import { describe, expect, it } from "vitest";
import { parseQuery, QueryError } from "./parseQuery";
import { evalQuery } from "./evalQuery";
import { planApply } from "./applyQuery";
import { initialState } from "../../../../features/dev/devExportBuilderSlice";
import type { ExportColumn, ExportRow } from "../../../../api/salesExport";

const columns: ExportColumn[] = [
  { name: "storeid", data_type: "bigint" },
  { name: "sale_date", data_type: "timestamp without time zone" },
  { name: "sale_type", data_type: "character varying" },
  { name: "vendor_id", data_type: "character varying" },
  { name: "description", data_type: "character varying" },
  { name: "total_sales", data_type: "numeric" },
  { name: "qty", data_type: "numeric" },
  { name: "void_flag", data_type: "smallint" },
];

const rows: ExportRow[] = [
  { storeid: 36, sale_date: "2026-09-14T08:00:00", sale_type: "Sale", vendor_id: "50", description: "WHOLE MILK", total_sales: 10, qty: 1, void_flag: 0 },
  { storeid: 36, sale_date: "2026-09-14T09:00:00", sale_type: "Sale", vendor_id: "50", description: "BREAD", total_sales: 5, qty: 2, void_flag: 0 },
  { storeid: 36, sale_date: "2026-09-15T10:00:00", sale_type: "Tender", vendor_id: "C0021", description: null, total_sales: 25, qty: null, void_flag: 1 },
  { storeid: 41, sale_date: "2026-09-15T11:00:00", sale_type: "Sale", vendor_id: "50", description: "2% MILK", total_sales: 3, qty: 1, void_flag: null },
];

const run = (sql: string) => evalQuery(parseQuery(sql), rows, columns);

describe("running a query against the sample", () => {
  it("selects columns in the order they were asked for", () => {
    const out = run("select sale_type, storeid limit 2");
    expect(out.columns).toEqual(["sale_type", "storeid"]);
    expect(out.rows).toHaveLength(2);
    expect(out.rows[0]).toEqual({ sale_type: "Sale", storeid: 36 });
  });

  it("takes the whole row for a star", () => {
    expect(run("select *").columns).toEqual(columns.map((c) => c.name));
  });

  it("filters, groups and sorts", () => {
    const out = run(
      "select storeid, sum(total_sales), count(*) where sale_type = 'Sale' group by storeid order by 2 desc",
    );
    expect(out.columns).toEqual(["storeid", "total_sales_sum", "row_count"]);
    expect(out.rows).toEqual([
      { storeid: 36, total_sales_sum: 15, row_count: 2 },
      { storeid: 41, total_sales_sum: 3, row_count: 1 },
    ]);
  });

  it("names a measure the way the file will, unless it is told otherwise", () => {
    expect(run("select storeid, sum(qty) group by storeid").columns).toEqual([
      "storeid",
      "qty_sum",
    ]);
    expect(
      run("select storeid, sum(qty) as pieces group by storeid").columns,
    ).toEqual(["storeid", "pieces"]);
  });

  it("compares numbers as numbers", () => {
    // The trap this avoids: "10" sorting below "5" as text.
    expect(run("select storeid where total_sales > 9").rows).toHaveLength(2);
  });

  it("says when case is the reason nothing matched", () => {
    const out = run("select * where sale_type = 'SALE'");
    expect(out.rows).toHaveLength(0);
    expect(out.note).toMatch(/if case is ignored/);
  });

  it("does ilike for when case is not the point", () => {
    expect(run("select description where description ilike '%milk%'").rows).toHaveLength(2);
  });

  it("treats a null as matching nothing, including a comparison to null", () => {
    expect(run("select qty where qty > 0").rows).toHaveLength(3);
    expect(run("select qty where qty is null").rows).toHaveLength(1);
    expect(run("select qty where qty = null").rows).toHaveLength(0);
  });

  it("handles in, between and not", () => {
    expect(run("select storeid where storeid in (41, 99)").rows).toHaveLength(1);
    expect(run("select storeid where total_sales between 4 and 11").rows).toHaveLength(2);
    expect(run("select storeid where sale_type not in ('Tender')").rows).toHaveLength(3);
  });

  it("groups with no measures into the distinct combinations", () => {
    const out = run("select sale_type group by sale_type");
    expect(out.rows).toEqual([{ sale_type: "Sale" }, { sale_type: "Tender" }]);
  });

  it("aggregates the lot when there is nothing to group by", () => {
    expect(run("select count(*), sum(total_sales)").rows).toEqual([
      { row_count: 4, total_sales_sum: 43 },
    ]);
  });
});

describe("a query the window will not run", () => {
  const fails = (sql: string) => {
    try {
      run(sql);
    } catch (e) {
      return e as QueryError;
    }
    throw new Error(`${sql} was expected to fail`);
  };

  it("names a column that does not exist, and guesses", () => {
    const e = fails("select total_sale");
    expect(e.message).toMatch(/no column called total_sale/);
    expect(e.hint).toMatch(/total_sales/);
  });

  it("refuses what it cannot do rather than guessing", () => {
    expect(fails("select * from sample join other on 1=1").message).toMatch(/joins/);
    expect(fails("delete from sample").message).toMatch(/writes/);
    expect(fails("select median(qty)").message).toMatch(/not one of the functions/);
  });

  it("catches a column that is neither grouped nor measured", () => {
    expect(fails("select description, sum(qty) group by storeid").message).toMatch(
      /description has to be in the GROUP BY/,
    );
  });

  it("reads a bare word where a value belongs as a missing quote", () => {
    const e = fails("select * where sale_type = Sale");
    expect(e.hint).toMatch(/single quotes/);
  });

  it("says when ORDER BY points at nothing", () => {
    expect(fails("select storeid order by 4").message).toMatch(/past the end/);
    expect(fails("select storeid order by qty").message).toMatch(/not one of the columns/);
  });
});

describe("turning a query into the configuration", () => {
  const config = {
    ...initialState,
    columns,
    columnOrder: columns.map((c) => c.name),
    selectedColumns: columns.map((c) => c.name),
    stores: [
      { storeid: 36, store_number: "036", store_name: "036 - IGA" },
      { storeid: 41, store_number: "041", store_name: "041 - IGA" },
    ],
    saleTypes: ["Sale", "Tender"],
    vendors: [{ vendor_id: "50", vendor_name: "AWG" }],
  };

  const plan = (sql: string) => planApply(parseQuery(sql), config);

  it("makes a summary out of a grouped query", () => {
    const out = plan("select storeid, sum(total_sales) group by storeid");
    expect(out.actions.map((a) => a.type)).toEqual([
      "devExportBuilder/setMode",
      "devExportBuilder/setGroupBy",
      "devExportBuilder/setAggregates",
    ]);
    expect(out.applied[0]).toMatch(/grouped by storeid/);
  });

  it("turns equality and IN into the ticks they mean", () => {
    const out = plan(
      "select * where sale_type = 'sale' and storeid in (36, 41) and void_flag = 0",
    );
    // Matched case-insensitively against what the range actually holds, so a
    // lower-cased value still finds Sale.
    expect(out.applied).toContain("Sale types: Sale");
    expect(out.applied).toContain("2 stores");
    expect(out.applied).toContain("Voids: excluded");
  });

  it("says what it could not carry over instead of dropping it quietly", () => {
    const out = plan(
      "select * where description like '%MILK%' or storeid = 36 limit 5",
    );
    expect(out.leftBehind.join(" ")).toMatch(/OR or NOT/);
    expect(out.leftBehind.join(" ")).toMatch(/LIMIT/);
  });

  it("warns that the file names a measure its own way", () => {
    const out = plan("select storeid, sum(qty) as pieces group by storeid");
    expect(out.leftBehind.join(" ")).toMatch(/names this qty_sum/);
  });
});
