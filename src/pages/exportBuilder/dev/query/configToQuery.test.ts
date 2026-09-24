import { describe, expect, it } from "vitest";
import { configToQuery } from "./configToQuery";
import { parseQuery } from "./parseQuery";
import { planApply } from "./applyQuery";
import { initialState } from "../../../../features/dev/devExportBuilderSlice";
import type { ExportBuilderState } from "../../../../features/dev/devExportBuilderSlice";

const columns = [
  { name: "storeid", data_type: "bigint" },
  { name: "sale_type", data_type: "character varying" },
  { name: "vendor_id", data_type: "character varying" },
  { name: "product_description", data_type: "character varying" },
  { name: "total_sales", data_type: "numeric" },
  { name: "qty", data_type: "numeric" },
];

const loaded = (over: Partial<ExportBuilderState> = {}): ExportBuilderState => ({
  ...initialState,
  columns,
  columnOrder: columns.map((c) => c.name),
  selectedColumns: columns.map((c) => c.name),
  stores: [{ storeid: 36, store_number: "036", store_name: "036 - IGA" }],
  selectedStoreIds: [36],
  saleTypes: ["Sale", "Tender"],
  selectedSaleTypes: ["Sale", "Tender"],
  vendors: [
    { vendor_id: "50", vendor_name: "AWG" },
    { vendor_id: "C0021", vendor_name: "Clark" },
  ],
  selectedVendors: ["50", "C0021"],
  ...over,
});

const write = (config: ExportBuilderState) =>
  configToQuery(
    config,
    config.groupBy.length > 0 || config.aggregates.length > 0,
    config.aggregates.map((m) => ({
      alias: m.alias ?? `${m.column}_${m.fn}`,
      expr: { kind: "agg" as const, fn: m.fn, column: m.column },
    })),
    config.columnOrder.filter((n) => config.selectedColumns.includes(n)),
  );

describe("the configuration, written as a query", () => {
  it("says select * when nothing is narrowed", () => {
    expect(write(loaded())).toBe("select *");
  });

  it("writes one filter per narrowed list", () => {
    const sql = write(
      loaded({ selectedSaleTypes: ["Sale"], selectedVendors: ["50"] }),
    );
    expect(sql).toContain("where sale_type = 'Sale'");
    expect(sql).toContain("and vendor_id = '50'");
  });

  it("writes a rollup as a rollup", () => {
    const sql = write(
      loaded({
        groupBy: ["storeid"],
        aggregates: [{ column: "total_sales", fn: "sum" }],
        orderBy: [{ key: "total_sales_sum", desc: true }],
      }),
    );
    expect(sql).toContain("select storeid, sum(total_sales)");
    expect(sql).toContain("group by storeid");
    expect(sql).toContain("order by total_sales_sum desc");
  });

  it("names a measure only when the name is not the one it would get", () => {
    const derived = write(
      loaded({ groupBy: ["storeid"], aggregates: [{ column: "qty", fn: "sum" }] }),
    );
    expect(derived).toContain("sum(qty)");
    expect(derived).not.toContain(" as qty_sum");

    const named = write(
      loaded({
        groupBy: ["storeid"],
        aggregates: [{ column: "qty", fn: "sum", alias: "pieces" }],
      }),
    );
    expect(named).toContain("sum(qty) as pieces");
  });

  it("doubles a quote rather than breaking the query", () => {
    const sql = write(loaded({ productCodes: ["O'BRIEN"] }));
    expect(sql).toContain("product_code = 'O''BRIEN'");
    expect(() => parseQuery(sql)).not.toThrow();
  });
});

describe("the round trip", () => {
  /** What comes out has to be readable by the thing that reads it back. */
  const roundTrip = (config: ExportBuilderState) => {
    const plan = planApply(parseQuery(write(config)), config);
    const picked = (type: string) =>
      plan.actions.find((a) => a.type === `devExportBuilder/${type}`)?.payload;
    return { plan, picked };
  };

  it("brings the filters back as they went out", () => {
    const { picked } = roundTrip(
      loaded({ selectedSaleTypes: ["Sale"], selectedVendors: ["C0021"] }),
    );
    expect(picked("setSelectedSaleTypes")).toEqual(["Sale"]);
    expect(picked("setSelectedVendors")).toEqual(["C0021"]);
  });

  it("brings a two-term description search back as two terms", () => {
    // It goes out as an OR, which the configuration reads as the set it is.
    const { picked, plan } = roundTrip(
      loaded({ productDescriptions: ["MILK", "BREAD"] }),
    );
    expect(picked("setProductDescriptions")).toEqual(["MILK", "BREAD"]);
    expect(plan.leftBehind.join(" ")).not.toMatch(/OR or NOT/);
  });

  it("brings a rollup back as the same rollup", () => {
    const { picked } = roundTrip(
      loaded({
        groupBy: ["storeid"],
        aggregates: [{ column: "total_sales", fn: "sum", alias: "dollars" }],
      }),
    );
    expect(picked("setGroupBy")).toEqual(["storeid"]);
    expect(picked("setAggregates")).toEqual([
      { column: "total_sales", fn: "sum", alias: "dollars" },
    ]);
  });
});
