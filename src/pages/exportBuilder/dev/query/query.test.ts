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
  { name: "product_description", data_type: "character varying" },
  { name: "total_sales", data_type: "numeric" },
  { name: "qty", data_type: "numeric" },
  { name: "void_flag", data_type: "smallint" },
];

const rows: ExportRow[] = [
  { storeid: 36, sale_date: "2026-09-14T08:00:00", sale_type: "Sale", vendor_id: "50", product_description: "WHOLE MILK", total_sales: 10, qty: 1, void_flag: 0 },
  { storeid: 36, sale_date: "2026-09-14T09:00:00", sale_type: "Sale", vendor_id: "50", product_description: "BREAD", total_sales: 5, qty: 2, void_flag: 0 },
  { storeid: 36, sale_date: "2026-09-15T10:00:00", sale_type: "Tender", vendor_id: "C0021", product_description: null, total_sales: 25, qty: null, void_flag: 1 },
  { storeid: 41, sale_date: "2026-09-15T11:00:00", sale_type: "Sale", vendor_id: "50", product_description: "2% MILK", total_sales: 3, qty: 1, void_flag: null },
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
    expect(run("select product_description where product_description ilike '%milk%'").rows).toHaveLength(2);
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
    expect(fails("select product_description, sum(qty) group by storeid").message).toMatch(
      /product_description has to be in the GROUP BY/,
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
      "devExportBuilder/setComputed",
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
      "select * where product_description like '%MILK%' or storeid = 36 limit 5",
    );
    expect(out.leftBehind.join(" ")).toMatch(/OR or NOT/);
    expect(out.leftBehind.join(" ")).toMatch(/LIMIT/);
  });

  it("carries a description search into the products filter", () => {
    // The % marks come off: the filter is a contains already, so putting them
    // in the term would look for a literal percent sign.
    const out = plan("select * where product_description ilike '%milk%'");
    expect(out.applied.join(" ")).toMatch(/Descriptions holding "milk"/);
  });

  it("carries the name a measure was given into the file", () => {
    const out = plan("select storeid, sum(qty) as pieces group by storeid");
    const measures = out.actions.find(
      (a) => a.type === "devExportBuilder/setAggregates",
    )?.payload as { alias?: string }[];
    expect(measures[0].alias).toBe("pieces");
    expect(out.leftBehind.join(" ")).not.toMatch(/qty_sum/);
  });

  it("leaves a name the endpoint could not use to the endpoint", () => {
    // A quoted alias can be anything in Postgres; a column of a CSV that a
    // client opens in Excel should not be.
    const out = plan(
      'select storeid, sum(qty) as "pieces sold!" group by storeid',
    );
    const measures = out.actions.find(
      (a) => a.type === "devExportBuilder/setAggregates",
    )?.payload as { alias?: string }[];
    expect(measures[0].alias).toBeUndefined();
    expect(out.leftBehind.join(" ")).toMatch(/plain identifier|only letters/);
  });
});

describe("a query of the shape a client actually writes", () => {
  // Verbatim from a real one, which is what found the hole: the window
  // understood sum(qty) and had no idea what to do with the "/" in
  // max(price) / nullif(max(price_split), 0).
  const CLIENT_QUERY = `
SELECT store_number, vendor_id, sub_department, product_code, product_description, terminal,
SUM(qty) AS TotalUnits,
SUM(total_sales) AS TotalDollars,
SUM(qty)*(MAX(price)/NULLIF(MAX(price_split),0)) AS atReg,
MAX(price)/NULLIF(MAX(price_split),0) AS RegUnitPrice,
(SUM(qty)*(MAX(price)/NULLIF(MAX(price_split),0)))-SUM(total_sales) AS lossGain,
SUM(package_discount) AS PACKAGEDISC
WHERE sale_type = 'Sale'
GROUP BY store_number, vendor_id, sub_department, product_code, product_description, terminal
ORDER BY vendor_id, sub_department`;

  const shelf: ExportColumn[] = [
    { name: "store_number", data_type: "character varying" },
    { name: "terminal", data_type: "bigint" },
    { name: "sale_type", data_type: "character varying" },
    { name: "vendor_id", data_type: "character varying" },
    { name: "sub_department", data_type: "bigint" },
    { name: "product_code", data_type: "character varying" },
    { name: "product_description", data_type: "character varying" },
    { name: "qty", data_type: "numeric" },
    { name: "total_sales", data_type: "numeric" },
    { name: "price", data_type: "numeric" },
    { name: "price_split", data_type: "numeric" },
    { name: "package_discount", data_type: "numeric" },
  ];

  // Two lines of the same item: four units that should have rung at $3.00
  // each, sold for $10.00. The query exists to find the $2.00.
  const shelfRows: ExportRow[] = [
    { store_number: "036", terminal: 1, sale_type: "Sale", vendor_id: "50", sub_department: 5, product_code: "1200000088", product_description: "WHOLE MILK GAL", qty: 2, total_sales: 5, price: 3, price_split: 1, package_discount: 0.5 },
    { store_number: "036", terminal: 1, sale_type: "Sale", vendor_id: "50", sub_department: 5, product_code: "1200000088", product_description: "WHOLE MILK GAL", qty: 2, total_sales: 5, price: 3, price_split: 1, package_discount: 0.5 },
    // A tender line, which the WHERE drops.
    { store_number: "036", terminal: 1, sale_type: "Tender", vendor_id: "50", sub_department: 5, product_code: "1200000088", product_description: "WHOLE MILK GAL", qty: 9, total_sales: 99, price: 0, price_split: 0, package_discount: 0 },
  ];

  it("runs it, arithmetic and all", () => {
    const out = evalQuery(parseQuery(CLIENT_QUERY), shelfRows, shelf);
    // Column names fold to lower case as Postgres folds them, but an alias
    // is written rather than looked up — the export quotes it — so TotalUnits
    // stays TotalUnits in the header.
    expect(out.columns).toEqual([
      "store_number",
      "vendor_id",
      "sub_department",
      "product_code",
      "product_description",
      "terminal",
      "TotalUnits",
      "TotalDollars",
      "atReg",
      "RegUnitPrice",
      "lossGain",
      "PACKAGEDISC",
    ]);
    expect(out.rows).toHaveLength(1);
    expect(out.rows[0]).toMatchObject({
      TotalUnits: 4,
      TotalDollars: 10,
      RegUnitPrice: 3,
      atReg: 12,
      lossGain: 2,
      PACKAGEDISC: 1,
    });
  });

  it("divides by zero into a blank rather than falling over", () => {
    // price_split is 0 on the tender lines, which is what NULLIF is guarding.
    const out = evalQuery(
      parseQuery(
        "select store_number, max(price)/nullif(max(price_split),0) as unit group by store_number",
      ),
      shelfRows.filter((r) => r.sale_type === "Tender"),
      shelf,
    );
    expect(out.rows[0].unit).toBeNull();
  });

  it("does arithmetic per line when nothing is grouped", () => {
    const out = evalQuery(
      parseQuery("select total_sales - package_discount as net where sale_type = 'Sale'"),
      shelfRows,
      shelf,
    );
    expect(out.rows.map((r) => r.net)).toEqual([4.5, 4.5]);
  });

  it("will not take arithmetic inside an aggregate", () => {
    // sum(qty * price) is a different query from sum(qty) * max(price), and
    // guessing which one was meant is worse than saying so.
    try {
      evalQuery(parseQuery("select sum(qty * price)"), shelfRows, shelf);
    } catch (e) {
      expect((e as QueryError).message).toMatch(/takes a single column/);
      return;
    }
    throw new Error("expected that to be refused");
  });

  it("keeps the measures it can and names the ones it cannot", () => {
    const config = {
      ...initialState,
      columns: shelf,
      columnOrder: shelf.map((c) => c.name),
      selectedColumns: shelf.map((c) => c.name),
    };
    const out = planApply(parseQuery(CLIENT_QUERY), config);
    // sum(qty), sum(total_sales) and sum(package_discount) are measures the
    // endpoint can build. The three worked-out ones are not, and the export
    // would quietly come back without them if nobody said so.
    expect(out.applied.join(" ")).toMatch(/3 measures/);
    // The worked-out ones travel as computed measures now, names and all.
    expect(out.applied.join(" ")).toMatch(/3 computed/);
    const computed = out.actions.find(
      (a) => a.type === "devExportBuilder/setComputed",
    )?.payload as { alias: string }[];
    expect(computed.map((c) => c.alias)).toEqual([
      "atReg",
      "RegUnitPrice",
      "lossGain",
    ]);
  });
});

describe("a computed measure on its way to the file", () => {
  const shelf: ExportColumn[] = [
    { name: "product_code", data_type: "character varying" },
    { name: "qty", data_type: "numeric" },
    { name: "total_sales", data_type: "numeric" },
    { name: "price", data_type: "numeric" },
    { name: "price_split", data_type: "numeric" },
  ];

  const config = {
    ...initialState,
    columns: shelf,
    columnOrder: shelf.map((c) => c.name),
    selectedColumns: shelf.map((c) => c.name),
  };

  const out = planApply(
    parseQuery(
      "select product_code, sum(qty) as Units," +
        " (sum(qty) * (max(price) / nullif(max(price_split), 0))) - sum(total_sales) as lossGain" +
        " group by product_code",
    ),
    config,
  );

  const computed = out.actions.find(
    (a) => a.type === "devExportBuilder/setComputed",
  )?.payload as { alias: string; expr: unknown }[];

  it("travels as a tree, not as text", () => {
    // Nothing the client types reaches the query: the endpoint walks this and
    // renders the SQL itself, which is why there is no string here anywhere.
    expect(computed).toHaveLength(1);
    expect(computed[0].alias).toBe("lossGain");
    expect(JSON.stringify(computed[0].expr)).toContain('"kind":"binary"');
    expect(JSON.stringify(computed[0].expr)).toContain('"fn":"max"');
    expect(JSON.stringify(computed[0].expr)).toContain('"name":"nullif"');
  });

  it("leaves the plain measure plain", () => {
    const measures = out.actions.find(
      (a) => a.type === "devExportBuilder/setAggregates",
    )?.payload as { column: string; fn: string; alias?: string }[];
    expect(measures).toEqual([{ column: "qty", fn: "sum", alias: "Units" }]);
  });

  it("does not report it as dropped any more", () => {
    expect(out.leftBehind.join(" ")).not.toMatch(/lossGain/);
    expect(out.applied.join(" ")).toMatch(/1 computed/);
  });
});
