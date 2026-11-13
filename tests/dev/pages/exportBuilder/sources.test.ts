import { describe, expect, it } from "vitest";
import { INVOICES, MARKDOWNS, ORDERS, SALES, SOURCES, filterNames, sourceFor } from "@/pages/exportBuilder/dev/sources";
import { filterSampleRows, rowFiltersFor } from "@/pages/exportBuilder/dev/sampleRows";
import { toExportBody, type ExportParams, type ExportRow } from "@/api/salesExport";
import { configProject } from "@/api/savedConfigs";

/**
 * What the router takes for each table, as GET export/tables lists it
 * (api/models/export.py on the backend). Copied rather than fetched: the
 * point is to notice when the two drift apart.
 */
const ROUTER_FILTERS: Record<string, string[]> = {
  sales: [
    "saleTypes", "priceTypes", "itemRingTypes", "subDepartments", "vendorIds",
    "cashierNumbers", "productDescriptions", "productCodes", "saleDates",
    "voidFlag", "refundFlag",
  ],
  invoices: [
    "vendorIds", "productCodes", "productDescriptions", "subDepartments", "categories",
    "statuses", "cashierNumbers", "invoiceDates", "voidFlag", "refundFlag", "returnFlag",
  ],
  orders: [
    "orderTypes", "statuses", "vendorIds", "productCodes", "productDescriptions",
    "subDepartments", "categories", "orderDates",
  ],
  markdowns: [
    "types", "vendorIds", "productCodes", "productDescriptions", "subDepartments",
    "categories", "orderDates",
  ],
};

/** Each table's preview lists, in the shapes the router sends them. */
const FACETS: Record<string, Record<string, unknown>> = {
  orders: {
    orderTypes: ["DAM", "INV", "ORD"],
    statuses: ["Closed", "Open"],
    vendors: [{ vendor_id: "148", vendor_name: "AWG" }],
    subDepartments: [{ sub_department: 5, sub_department_description: "Tobacco" }],
    categories: [{ category: 40, category_description: "Snacks" }],
  },
  invoices: {
    // Spelled as the invoices table spells them.
    vendors: [{ vendorid: "B3389", vendor_name: "Coke" }],
    subDepartments: [{ subdepartment: 12, subdepartment_description: "Dairy" }],
    categories: [{ category: 40, category_description: "Snacks" }],
    statuses: ["Posted"],
  },
  markdowns: {
    types: ["Reduced", "Waste"],
    vendors: [{ vendor_id: null, vendor_name: "Local" }, { vendor_id: "148", vendor_name: "AWG" }],
    subDepartments: [{ sub_department: 5, sub_department_description: "Tobacco" }],
    categories: [{ category: 40, category_description: null }],
  },
};

describe("the sources", () => {
  it("are the search card's four, in its order", () => {
    expect(SOURCES.map((s) => s.label)).toEqual(["Sales", "Orders", "Invoices", "Markdowns"]);
    expect(SOURCES.map((s) => s.key)).toEqual(["sales", "orders", "invoices", "markdowns"]);
  });

  it.each(SOURCES.map((s) => [s.key, s] as const))(
    "%s sends only filter names the router takes for it",
    (key, source) => {
      const names = filterNames(source);
      expect(names.filter((n) => !ROUTER_FILTERS[key].includes(n))).toEqual([]);
      // And no name twice: the request is a map.
      expect(new Set(names).size).toBe(names.length);
    },
  );

  it("never sends cashier numbers for invoices", () => {
    expect(filterNames(INVOICES)).not.toContain("cashierNumbers");
    expect(INVOICES.lists.map((l) => l.label)).not.toContain("Cashiers");
  });

  it("files each source's configurations under its own label", () => {
    expect(configProject("sales")).toBe("sales_export");
    expect(new Set(SOURCES.map((s) => configProject(s.key))).size).toBe(4);
  });

  it("falls back to Sales for a table it does not know", () => {
    expect(sourceFor("stock")).toBe(SALES);
    expect(sourceFor("markdowns")).toBe(MARKDOWNS);
  });
});

describe.each([ORDERS, INVOICES, MARKDOWNS].map((s) => [s.key, s] as const))(
  "%s",
  (key, source) => {
    it("turns every preview list into choices", () => {
      for (const list of source.lists) {
        const items = list.toItems(FACETS[key][list.facet]);
        expect(items.length, list.filter).toBeGreaterThan(0);
        for (const item of items) expect(typeof item.value).toBe("string");
      }
    });

    it("sends each of its filters under its own name, nested", () => {
      const filters = Object.fromEntries(filterNames(source).map((n) => [n, ["x"]]));
      const params = {
        startDate: "2026-10-18",
        endDate: "2026-10-24",
        storeids: [1],
        columns: ["storeid"],
        groupBy: null,
        aggregates: null,
        computed: null,
        filters,
        orderBy: null,
        dateFormat: null,
        fileFormat: "csv",
        filePrefix: null,
        ordered: false,
        userQueryId: null,
        dryRun: false,
      } as ExportParams;
      const body = toExportBody(params, filterNames(source)) as { filters: object };
      expect(Object.keys(body.filters).sort()).toEqual(filterNames(source).sort());
      expect(Object.keys(body).filter((k) => filterNames(source).includes(k))).toEqual([]);
    });
  },
);

describe("the sample, narrowed by each table's own columns", () => {
  const nothing = {
    picks: {} as Record<string, string[]>,
    selectedDays: [] as string[],
    productCodes: [] as string[],
    productDescriptions: [] as string[],
    rowFlags: {} as Record<string, number | null>,
  };

  it("orders: a count is kept and a damage dropped by order type", () => {
    const rows: ExportRow[] = [
      { order_type: "INV", description: "MILK", order_date: "2026-10-20 00:00:00" },
      { order_type: "DAM", description: "EGGS", order_date: "2026-10-21 00:00:00" },
    ];
    const kept = filterSampleRows(
      rows,
      rowFiltersFor(ORDERS, { ...nothing, picks: { orderTypes: ["INV", "PER"] } }),
    );
    expect(kept.map((r) => r.order_type)).toEqual(["INV"]);
  });

  it("orders: the description words read the description column", () => {
    const rows: ExportRow[] = [{ description: "WHOLE MILK" }, { description: "EGGS" }];
    const kept = filterSampleRows(
      rows,
      rowFiltersFor(ORDERS, { ...nothing, productDescriptions: ["milk"] }),
    );
    expect(kept).toHaveLength(1);
  });

  it("invoices: vendors and sub departments by invoices' spellings", () => {
    const rows: ExportRow[] = [
      { vendorid: "B3389", subdepartment: 12 },
      { vendorid: "148", subdepartment: 12 },
      { vendorid: "B3389", subdepartment: 7 },
    ];
    const kept = filterSampleRows(
      rows,
      rowFiltersFor(INVOICES, {
        ...nothing,
        picks: { vendorIds: ["B3389"], subDepartments: ["12"] },
      }),
    );
    expect(kept).toEqual([{ vendorid: "B3389", subdepartment: 12 }]);
  });

  it("invoices: returns only, from item_return_flag", () => {
    const rows: ExportRow[] = [
      { item_return_flag: 1 },
      { item_return_flag: null },
      { item_return_flag: 0 },
    ];
    const kept = filterSampleRows(
      rows,
      rowFiltersFor(INVOICES, { ...nothing, rowFlags: { returnFlag: 1 } }),
    );
    expect(kept).toEqual([{ item_return_flag: 1 }]);
  });

  it("invoices: days read the invoice date, a timestamp", () => {
    const rows: ExportRow[] = [
      { invoice_date: "2026-10-20 09:14:00" },
      { invoice_date: "2026-10-21 09:14:00" },
    ];
    const kept = filterSampleRows(
      rows,
      rowFiltersFor(INVOICES, { ...nothing, selectedDays: ["2026-10-21"] }),
    );
    expect(kept).toEqual([{ invoice_date: "2026-10-21 09:14:00" }]);
  });

  it("markdowns: waste alone, by type", () => {
    const rows: ExportRow[] = [
      { type: "Waste", category: 40 },
      { type: "Reduced", category: 40 },
    ];
    const kept = filterSampleRows(
      rows,
      rowFiltersFor(MARKDOWNS, { ...nothing, picks: { types: ["Waste"], categories: ["40"] } }),
    );
    expect(kept).toEqual([{ type: "Waste", category: 40 }]);
  });
});
