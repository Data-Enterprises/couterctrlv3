import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosMock = vi.fn(async (_req?: unknown) => ({ data: {} as Record<string, unknown> }));
vi.mock("axios", () => ({ default: (req: unknown) => axiosMock(req) }));

import {
  EXPORT_TOP_LEVEL_KEYS,
  getExportPreview,
  getExportTables,
  runExport,
  toExportBody,
  type ExportParams,
} from "./salesExport";
import {
  deleteExportBuild,
  linkExportBuild,
  listExportBuilds,
  nestRequest,
} from "./exportBuilds";
import { SALES, filterNames } from "../pages/exportBuilder/dev/sources";

type Req = { url: string; method: string; data?: Record<string, unknown> };
const lastRequest = () => axiosMock.mock.calls.at(-1)![0] as Req;

const salesNames = filterNames(SALES);

/** Every field set, every sales filter included, so a field that went
 *  missing would show. */
const params: ExportParams = {
  startDate: "2026-10-18",
  endDate: "2026-10-24",
  storeids: [101, 102],
  columns: ["storeid", "sale_date"],
  groupBy: null,
  aggregates: null,
  computed: null,
  filters: {
    saleTypes: ["sale"],
    itemRingTypes: ["Item"],
    subDepartments: [12],
    vendorIds: ["00042"],
    cashierNumbers: [7],
    priceTypes: [""],
    saleDates: ["2026-10-20"],
    productCodes: ["4011"],
    productDescriptions: ["MILK"],
    voidFlag: 0,
    refundFlag: null,
  },
  orderBy: null,
  dateFormat: "us",
  fileFormat: "csv",
  filePrefix: "weekly",
  ordered: false,
  userQueryId: 9,
  dryRun: false,
};

describe("toExportBody", () => {
  it("sends every sales filter under `filters` and none at the top level", () => {
    const body = toExportBody(params, salesNames) as Record<string, unknown> & {
      filters: Record<string, unknown>;
    };
    for (const name of salesNames) {
      expect(body.filters).toHaveProperty(name, params.filters[name]);
      // Left at the top level, the router would ignore it and export
      // everything in the stores and dates.
      expect(body).not.toHaveProperty(name);
    }
  });

  it("sends the top-level fields as they are", () => {
    const body = toExportBody(params, salesNames) as Record<string, unknown>;
    for (const key of EXPORT_TOP_LEVEL_KEYS) expect(body[key]).toEqual(params[key]);
  });

  it("sends nothing outside the two lists", () => {
    const stray = {
      ...params,
      excludeVoids: true,
      filters: { ...params.filters, isHash: 1, statuses: ["open"] },
    } as unknown as ExportParams;
    const body = toExportBody(stray, salesNames) as Record<string, unknown>;
    const allowed = new Set<string>([...EXPORT_TOP_LEVEL_KEYS, "filters"]);
    expect(Object.keys(body).filter((k) => !allowed.has(k))).toEqual([]);
    // A filter the source does not have is not sent, whatever the params say.
    expect(Object.keys(body.filters as object).sort()).toEqual([...salesNames].sort());
  });
});

describe("the export router's routes", () => {
  beforeEach(() => axiosMock.mockClear());

  it("builds a file on export/sales, filters nested", async () => {
    await runExport("u/", "t", "sales", params, salesNames);
    const req = lastRequest();
    expect(req.url).toBe("u/export/sales");
    expect(req.data).toMatchObject({ storeids: [101, 102], filters: { saleTypes: ["sale"] } });
  });

  it("previews on export/sales/preview, its lists left under facets", async () => {
    axiosMock.mockResolvedValueOnce({
      data: { error: 0, stores: [], facets: { saleTypes: ["sale", "refund"] } },
    });
    const resp = await getExportPreview("u/", "t", "sales", {
      startDate: "2026-10-18",
      endDate: "2026-10-24",
      singleStore: 1,
      useGroups: 0,
      searchValue: 101,
    });
    expect(lastRequest().url).toBe("u/export/sales/preview");
    expect(resp.data.facets).toEqual({ saleTypes: ["sale", "refund"] });
  });

  it("reads what each table takes from export/tables", async () => {
    await getExportTables("u/", "t");
    expect(lastRequest()).toMatchObject({ method: "GET", url: "u/export/tables" });
  });

  it("lists, labels and deletes builds under export/sales", async () => {
    axiosMock.mockResolvedValueOnce({ data: { builds: [] } });
    await listExportBuilds("u/", "t", "sales");
    expect(lastRequest().url).toBe("u/export/sales/builds");
    await linkExportBuild("u/", "t", "sales", "b1", 9);
    expect(lastRequest().url).toBe("u/export/sales/build_link");
    await deleteExportBuild("u/", "t", "sales", "a b");
    expect(lastRequest().url).toBe("u/export/sales/builds/a%20b");
  });
});

describe("old and new build manifests", () => {
  it("nests a manifest from before the move", () => {
    // Its filters sat at the top level, beside fields the router has dropped.
    const old = { startDate: "2026-09-01", storeids: [36], saleTypes: ["sale"], voidFlag: 0 };
    expect(nestRequest(old)).toEqual({
      startDate: "2026-09-01",
      storeids: [36],
      filters: { saleTypes: ["sale"], voidFlag: 0 },
    });
  });

  it("reads a new manifest as it is", () => {
    const fresh = { startDate: "2026-11-01", filters: { saleTypes: ["sale"], voidFlag: 0 } };
    expect(nestRequest(fresh)).toEqual(fresh);
  });

  it("nests every build the list returns", async () => {
    axiosMock.mockResolvedValueOnce({
      data: { builds: [{ buildId: "b1", request: { vendorIds: ["00042"], ordered: true } }] },
    });
    const resp = await listExportBuilds("u/", "t", "sales");
    expect(resp.data.builds[0].request).toEqual({
      ordered: true,
      filters: { vendorIds: ["00042"] },
    });
  });
});
