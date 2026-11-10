import { describe, expect, it } from "vitest";
import { planLoad as planLoadFor, toPayload as toPayloadFor } from "@/pages/exportBuilder/dev/savedExports";
import { parseConfigRow } from "@/api/savedConfigs";
import type { SavedConfigPayload } from "@/api/savedConfigs";
import type { SavedQuery } from "@/api/savedQueries";
import { initialState } from "@/features/dev/devExportBuilderSlice";
import type { ExportBuilderState } from "@/features/dev/devExportBuilderSlice";
import { SALES } from "@/pages/exportBuilder/dev/sources";

const toPayload = (config: ExportBuilderState) => toPayloadFor(config, SALES);
const planLoad = (payload: SavedConfigPayload, config: ExportBuilderState) =>
  planLoadFor(payload, config, SALES);

/** The sales lists these cases use, by the names they were first written in. */
interface Over extends Partial<ExportBuilderState> {
  saleTypes?: string[];
  selectedSaleTypes?: string[];
  vendors?: { vendor_id: string; vendor_name: string }[];
  selectedVendors?: string[];
  priceTypes?: { value: string; label: string }[];
  selectedPriceTypes?: string[];
  saleDates?: string[];
}

const columns = [
  { name: "storeid", data_type: "bigint" },
  { name: "sale_date", data_type: "timestamp without time zone" },
  { name: "total_sales", data_type: "numeric" },
];

/** September: four vendors, two stores. */
const september = (over: Over = {}): ExportBuilderState => {
  const {
    saleTypes = ["Sale", "Tender"],
    selectedSaleTypes = saleTypes,
    vendors = [
      { vendor_id: "50", vendor_name: "AWG" },
      { vendor_id: "C0021", vendor_name: "Clark" },
    ],
    selectedVendors = vendors.map((v) => v.vendor_id),
    priceTypes = [],
    selectedPriceTypes = priceTypes.map((p) => p.value),
    saleDates = ["2026-09-14", "2026-09-15"],
    ...rest
  } = over;
  return {
    ...initialState,
    loaded: true,
    columns,
    columnOrder: columns.map((c) => c.name),
    selectedColumns: columns.map((c) => c.name),
    stores: [
      { storeid: 36, store_number: "036", store_name: "036 - IGA" },
      { storeid: 41, store_number: "041", store_name: "041 - IGA" },
    ],
    selectedStoreIds: [36, 41],
    lists: {
      saleTypes: saleTypes.map((t) => ({ value: t, label: t })),
      vendorIds: vendors.map((v) => ({ value: v.vendor_id, label: v.vendor_name })),
      priceTypes,
    },
    picks: {
      saleTypes: selectedSaleTypes,
      vendorIds: selectedVendors,
      priceTypes: selectedPriceTypes,
    },
    days: saleDates,
    selectedDays: saleDates,
    ...rest,
  };
};

/** The values a load picks for one list. */
const picks = (actions: { type: string; payload?: unknown }[], type: string) => {
  const filter = { setSelectedVendors: "vendorIds", setSelectedPriceTypes: "priceTypes" }[type];
  if (filter) {
    const action = actions.find(
      (a) =>
        a.type === "devExportBuilder/setPicks" &&
        (a.payload as { filter: string }).filter === filter,
    );
    return (action?.payload as { values: string[] } | undefined)?.values;
  }
  return actions.find((a) => a.type === `devExportBuilder/${type}`)?.payload;
};

describe("what a saved export holds", () => {
  it("saves a narrowed list by value and a whole one as every", () => {
    // The distinction that matters a month later: "these two vendors" has to
    // survive, and "all of them" has to mean all of next month's.
    const payload = toPayload(
      september({ selectedVendors: ["50"], selectedSaleTypes: ["Sale", "Tender"] }),
    );
    expect(payload.filters.vendorIds).toEqual(["50"]);
    expect(payload.filters.saleTypes).toBeNull();
  });

  it("never saves the dates", () => {
    const payload = toPayload(september());
    expect(Object.keys(payload)).not.toContain("saleDates");
    expect(JSON.stringify(payload)).not.toContain("2026-09-14");
  });

  it("keeps the column order, not just the ticks", () => {
    const payload = toPayload(
      september({
        columnOrder: ["total_sales", "storeid", "sale_date"],
        selectedColumns: ["storeid", "total_sales"],
      }),
    );
    expect(payload.columns).toEqual(["total_sales", "storeid"]);
  });
});

describe("loading one onto a different range", () => {
  it("expands an unnarrowed list to what this range holds", () => {
    const saved = toPayload(september());
    // October has a third vendor. "Every vendor" has to mean that one too.
    const october = september({
      vendors: [
        { vendor_id: "50", vendor_name: "AWG" },
        { vendor_id: "C0021", vendor_name: "Clark" },
        { vendor_id: "F0007", vendor_name: "Frito" },
      ],
    });
    const plan = planLoad(saved, october);
    expect(picks(plan.actions, "setSelectedVendors")).toEqual([
      "50",
      "C0021",
      "F0007",
    ]);
  });

  it("says which of its picks this range does not have", () => {
    // Two of the three that traded in September, so the list is saved by
    // value rather than as "every vendor".
    const saved = toPayload(
      september({
        vendors: [
          { vendor_id: "50", vendor_name: "AWG" },
          { vendor_id: "C0021", vendor_name: "Clark" },
          { vendor_id: "F0007", vendor_name: "Frito" },
        ],
        selectedVendors: ["50", "C0021"],
      }),
    );
    const october = september({
      vendors: [{ vendor_id: "50", vendor_name: "AWG" }],
      selectedVendors: ["50"],
    });
    const plan = planLoad(saved, october);
    expect(picks(plan.actions, "setSelectedVendors")).toEqual(["50"]);
    expect(plan.missing.join(" ")).toMatch(/1 vendors this range does not have/);
  });

  it("falls back to everything rather than to an empty file", () => {
    // Every saved vendor gone is not a filter of none — the export would read
    // an empty list as no filter at all, so this widens and says so.
    const saved = toPayload(september({ selectedVendors: ["C0021"] }));
    const october = september({
      vendors: [{ vendor_id: "F0007", vendor_name: "Frito" }],
      selectedVendors: ["F0007"],
    });
    const plan = planLoad(saved, october);
    expect(picks(plan.actions, "setSelectedVendors")).toEqual(["F0007"]);
    expect(plan.missing.join(" ")).toMatch(/does not have/);
  });

  it("drops a measure whose column is not in this table", () => {
    const saved = toPayload(
      september({
        groupBy: ["storeid", "gone_column"],
        aggregates: [
          { column: "total_sales", fn: "sum" },
          { column: "gone_column", fn: "sum" },
        ],
      }),
    );
    const plan = planLoad(saved, september());
    expect(picks(plan.actions, "setGroupBy")).toEqual(["storeid"]);
    expect(picks(plan.actions, "setAggregates")).toEqual([
      { column: "total_sales", fn: "sum" },
    ]);
  });

  it("keeps a sort on a row count", () => {
    const saved = toPayload(
      september({
        groupBy: ["storeid"],
        aggregates: [{ column: "*", fn: "count" }],
        orderBy: [{ key: "row_count", desc: true }],
      }),
    );
    const plan = planLoad(saved, september());
    expect(picks(plan.actions, "setOrderBy")).toEqual([{ key: "row_count", desc: true }]);
    expect(plan.missing.join(" ")).not.toMatch(/sort/);
  });

  it("says that the days came back ticked", () => {
    const plan = planLoad(toPayload(september()), september());
    expect(plan.missing.join(" ")).toMatch(/Days are not saved/);
  });
});

describe("a row of a shared table", () => {
  const row = (sql: string, over: Partial<SavedQuery> = {}): SavedQuery => ({
    id: 7,
    userid: 45,
    name: "Shrink by vendor",
    description: null,
    project: "sales_export",
    sql,
    created_at: "2026-09-24T18:30:12",
    updated_at: "2026-09-24T18:30:12",
    ...over,
  });

  it("reads one of ours", () => {
    const payload = toPayload(september());
    const parsed = parseConfigRow(row(JSON.stringify(payload)));
    expect(parsed?.id).toBe(7);
    expect(parsed?.payload.groupBy).toEqual([]);
  });

  it("reads a configuration saved before there were sources, as a sales one", () => {
    // Every configuration saved before 2 November 2026 has this shape.
    const v1 = {
      v: 1,
      mode: "lines",
      columns: ["storeid"],
      columnOrder: ["storeid"],
      groupBy: [],
      aggregates: [],
      computed: [],
      orderBy: [],
      storeIds: null,
      saleTypes: ["Sale"],
      ringTypes: null,
      subDepartments: ["10"],
      vendors: ["50"],
      cashiers: [7],
      priceTypes: null,
      productCodes: ["4011"],
      productDescriptions: [],
      flags: { voidFlag: 0, refundFlag: null, dateFormat: "us", fileFormat: "csv", filePrefix: "weekly", ordered: false },
    };
    const parsed = parseConfigRow(row(JSON.stringify(v1)));
    expect(parsed?.payload).toMatchObject({
      v: 2,
      source: "sales",
      filters: { saleTypes: ["Sale"], subDepartments: ["10"], vendorIds: ["50"], cashierNumbers: ["7"] },
      productCodes: ["4011"],
      rowFlags: { voidFlag: 0, refundFlag: null },
      output: { dateFormat: "us", fileFormat: "csv", filePrefix: "weekly", ordered: false },
    });
  });

  it("skips anything that is not, rather than breaking the list", () => {
    // The table is shared with the developer query window, whose rows hold
    // real SQL. One of those in this list is a row to walk past.
    expect(parseConfigRow(row("REINDEX TABLE sales_partitioned;"))).toBeNull();
    expect(parseConfigRow(row("{}"))).toBeNull();
    expect(parseConfigRow(row('{"v":2,"mode":"lines"}'))).toBeNull();
  });
});

describe("a build reloaded onto the range that is open", () => {
  it("drops the days it pinned inside its own range", () => {
    // A build's days are absolute — the 14th and 15th of its own window — and
    // the range on screen is somebody else's. The note says so; the days go.
    const plan = planLoad(
      { ...toPayload(september()), storeIds: null },
      september({ saleDates: ["2026-10-05", "2026-10-06"] }),
    );
    expect(plan.missing.join(" ")).toMatch(/Days are not saved/);
  });

  it("checks the price types against the company that is open", () => {
    // Saved against Food Giant, reopened against a company that says REG.
    const saved = toPayload(
      september({
        priceTypes: [
          { value: "Regular", label: "Regular" },
          { value: "Sale", label: "Sale" },
        ],
        selectedPriceTypes: ["Regular"],
      }),
    );
    const plan = planLoad(
      saved,
      september({
        priceTypes: [
          { value: "REG", label: "REG" },
          { value: "", label: "(none)" },
        ],
        selectedPriceTypes: ["REG", ""],
      }),
    );
    expect(plan.missing.join(" ")).toMatch(/price types this range does not have/);
    expect(plan.missing.join(" ")).toMatch(/Regular/);
  });

  it("names the empty price type rather than showing a gap", () => {
    const saved = toPayload(
      september({
        priceTypes: [
          { value: "REG", label: "REG" },
          { value: "", label: "(none)" },
        ],
        selectedPriceTypes: [""],
      }),
    );
    const plan = planLoad(
      saved,
      september({
        priceTypes: [{ value: "REG", label: "REG" }],
        selectedPriceTypes: ["REG"],
      }),
    );
    expect(plan.missing.join(" ")).toMatch(/\(none\)/);
  });
});
