import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosMock = vi.fn(async (_req?: unknown) => ({ data: {} as Record<string, unknown> }));
vi.mock("axios", () => ({ default: (req: unknown) => axiosMock(req) }));

import {
  EXPORT_TOP_LEVEL_KEYS,
  SALES_FILTER_KEYS,
  getExportPreview,
  runExport,
  toExportBody,
  type ExportParams,
} from "./salesExport";
import {
  deleteExportBuild,
  flattenRequest,
  linkExportBuild,
  listExportBuilds,
} from "./exportBuilds";

type Req = { url: string; method: string; data?: Record<string, unknown> };
const lastRequest = () => axiosMock.mock.calls.at(-1)![0] as Req;

/** Every field set, so a field that went missing would show. */
const params: ExportParams = {
  startDate: "2026-10-18",
  endDate: "2026-10-24",
  storeids: [101, 102],
  columns: ["storeid", "sale_date"],
  groupBy: null,
  aggregates: null,
  computed: null,
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
  orderBy: null,
  dateFormat: "us",
  fileFormat: "csv",
  filePrefix: "weekly",
  ordered: false,
  userQueryId: 9,
  dryRun: false,
};

describe("toExportBody", () => {
  it("moves every filter under `filters` and leaves none at the top level", () => {
    const body = toExportBody(params) as Record<string, unknown> & {
      filters: Record<string, unknown>;
    };
    for (const key of SALES_FILTER_KEYS) {
      expect(body.filters).toHaveProperty(key, params[key]);
      // Left at the top level, the router would ignore it and export
      // everything in the stores and dates.
      expect(body).not.toHaveProperty(key);
    }
  });

  it("sends the top-level fields as they are", () => {
    const body = toExportBody(params) as Record<string, unknown>;
    for (const key of EXPORT_TOP_LEVEL_KEYS) expect(body[key]).toEqual(params[key]);
  });

  it("sends nothing outside the two lists", () => {
    const stray = { ...params, excludeVoids: true, isHash: 1 } as unknown as ExportParams;
    const body = toExportBody(stray) as Record<string, unknown>;
    const allowed = new Set<string>([...EXPORT_TOP_LEVEL_KEYS, "filters"]);
    expect(Object.keys(body).filter((k) => !allowed.has(k))).toEqual([]);
    expect(Object.keys(body.filters as object).sort()).toEqual([...SALES_FILTER_KEYS].sort());
  });
});

describe("the export router's routes", () => {
  beforeEach(() => axiosMock.mockClear());

  it("builds a file on export/sales, filters nested", async () => {
    await runExport("u/", "t", "sales", params);
    const req = lastRequest();
    expect(req.url).toBe("u/export/sales");
    expect(req.data).toMatchObject({ storeids: [101, 102], filters: { saleTypes: ["sale"] } });
  });

  it("previews on export/sales/preview and lifts the facets to the top", async () => {
    axiosMock.mockResolvedValueOnce({
      data: { error: 0, stores: [], facets: { saleTypes: ["sale", "refund"], vendors: [] } },
    });
    const resp = await getExportPreview("u/", "t", "sales", {
      startDate: "2026-10-18",
      endDate: "2026-10-24",
      singleStore: 1,
      useGroups: 0,
      searchValue: 101,
    });
    expect(lastRequest().url).toBe("u/export/sales/preview");
    expect(resp.data.saleTypes).toEqual(["sale", "refund"]);
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
  it("reads a manifest from before the move unchanged", () => {
    const old = { startDate: "2026-09-01", saleTypes: ["sale"] };
    expect(flattenRequest(old)).toEqual(old);
  });

  it("lifts a new manifest's filters to the top level", () => {
    const fresh = { startDate: "2026-11-01", filters: { saleTypes: ["sale"], voidFlag: 0 } };
    expect(flattenRequest(fresh)).toEqual({ startDate: "2026-11-01", saleTypes: ["sale"], voidFlag: 0 });
  });

  it("flattens every build the list returns", async () => {
    axiosMock.mockResolvedValueOnce({
      data: { builds: [{ buildId: "b1", request: { filters: { vendorIds: ["00042"] } } }] },
    });
    const resp = await listExportBuilds("u/", "t", "sales");
    expect(resp.data.builds[0].request).toEqual({ vendorIds: ["00042"] });
  });
});
