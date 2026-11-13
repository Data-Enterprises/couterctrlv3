import { describe, expect, it } from "vitest";
import { configToQuery } from "@/pages/exportBuilder/dev/query/configToQuery";
import { parseQuery } from "@/pages/exportBuilder/dev/query/parseQuery";
import { planApply } from "@/pages/exportBuilder/dev/query/applyQuery";
import { initialState } from "@/features/dev/devExportBuilderSlice";
import type { ExportBuilderState } from "@/features/dev/devExportBuilderSlice";
import { SALES } from "@/pages/exportBuilder/dev/sources";

/** The sales picks these cases narrow, by the names they were written in. */
interface Over extends Partial<ExportBuilderState> {
  selectedSaleTypes?: string[];
  selectedVendors?: string[];
}

const columns = [
  { name: "storeid", data_type: "bigint" },
  { name: "sale_type", data_type: "character varying" },
  { name: "vendor_id", data_type: "character varying" },
  { name: "product_description", data_type: "character varying" },
  { name: "total_sales", data_type: "numeric" },
  { name: "qty", data_type: "numeric" },
];

const loaded = (over: Over = {}): ExportBuilderState => {
  const { selectedSaleTypes = ["Sale", "Tender"], selectedVendors = ["50", "C0021"], ...rest } =
    over;
  return {
    ...initialState,
    columns,
    columnOrder: columns.map((c) => c.name),
    selectedColumns: columns.map((c) => c.name),
    stores: [{ storeid: 36, store_number: "036", store_name: "036 - IGA" }],
    selectedStoreIds: [36],
    lists: {
      saleTypes: [
        { value: "Sale", label: "Sale" },
        { value: "Tender", label: "Tender" },
      ],
      vendorIds: [
        { value: "50", label: "AWG" },
        { value: "C0021", label: "Clark" },
      ],
    },
    picks: { saleTypes: selectedSaleTypes, vendorIds: selectedVendors },
    ...rest,
  };
};

const write = (config: ExportBuilderState) =>
  configToQuery(
    config,
    SALES,
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
    const plan = planApply(parseQuery(write(config)), config, SALES);
    const picked = (type: string) => {
      // A list's picks, by the old name of the setter that used to carry them.
      const filter = { setSelectedSaleTypes: "saleTypes", setSelectedVendors: "vendorIds" }[type];
      const action = plan.actions.find((a) =>
        filter
          ? a.type === "devExportBuilder/setPicks" &&
            (a.payload as { filter: string }).filter === filter
          : a.type === `devExportBuilder/${type}`,
      );
      return filter ? (action?.payload as { values: string[] } | undefined)?.values : action?.payload;
    };
    return { plan, picked };
  };

  it("brings the filters back as they went out", () => {
    const { picked } = roundTrip(
      loaded({ selectedSaleTypes: ["Sale"], selectedVendors: ["C0021"] }),
    );
    expect(picked("setSelectedSaleTypes")).toEqual(["Sale"]);
    expect(picked("setSelectedVendors")).toEqual(["C0021"]);
  });

  it("keeps a narrowed store pick through Apply", () => {
    const twoStores = {
      stores: [
        { storeid: 36, store_number: "036", store_name: "036 - IGA" },
        { storeid: 111, store_number: "111", store_name: "111 - IGA" },
      ],
    };
    expect(write(loaded({ ...twoStores, selectedStoreIds: [111] }))).toMatch(
      /storeid = 111/,
    );
    const { picked } = roundTrip(loaded({ ...twoStores, selectedStoreIds: [111] }));
    expect(picked("setSelectedStoreIds")).toEqual([111]);
  });

  it("says nothing about stores when every one is picked", () => {
    const all = loaded({
      stores: [
        { storeid: 36, store_number: "036", store_name: "036 - IGA" },
        { storeid: 111, store_number: "111", store_name: "111 - IGA" },
      ],
      selectedStoreIds: [36, 111],
    });
    expect(write(all)).not.toMatch(/storeid/);
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
