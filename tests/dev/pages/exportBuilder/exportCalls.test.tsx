import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { setupStore } from "@/store";
import { setConfig, setGroupBy } from "@/features/dev/devExportBuilderSlice";
import { SLOW_AFTER_MS, useExportBuilderCtx } from "@/pages/exportBuilder/dev/hooks";

/**
 * The page's calls, driven through the real hook and store with only the
 * network faked.
 */

vi.mock("@/components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    error: () => {},
    success: () => {},
    info: () => {},
    warning: () => {},
    warn: () => {},
  }),
}));

const runExport = vi.fn();
const getExportPreview = vi.fn();
vi.mock("@/api/salesExport", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/salesExport")>()),
  runExport: (...args: unknown[]) => runExport(...args),
  getExportPreview: (...args: unknown[]) => getExportPreview(...args),
  getExportTables: () => Promise.resolve({ data: { error: 0, tables: [] } }),
}));

// The lists a search reads beside the preview: empty, and answered.
const empty = () => Promise.resolve({ data: { error: 0, queries: [], builds: [] } });
vi.mock("@/api/savedQueries", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/savedQueries")>()),
  listSavedQueries: () => empty(),
}));
vi.mock("@/api/savedConfigs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/savedConfigs")>()),
  listSavedConfigs: () => empty(),
}));
vi.mock("@/api/exportBuilds", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/exportBuilds")>()),
  listExportBuilds: () => empty(),
}));

const setup = () => {
  const store = setupStore();
  store.dispatch(
    setConfig({
      source: "sales",
      stores: [{ storeid: 1, store_number: "001", store_name: "001 - IGA" }],
      lists: {},
      dateFormats: [],
      days: [],
      columns: [{ name: "sale_id", data_type: "bigint" }],
      rows: [],
      hasData: true,
      message: null,
    }),
  );
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  const { result } = renderHook(() => useExportBuilderCtx(), { wrapper });
  return { store, result };
};

/** Lets the rejected call's handlers run. */
const settle = () => act(async () => {
  await Promise.resolve();
  await Promise.resolve();
});

describe("a build that fails", () => {
  let reject: (err: unknown) => void = () => {};
  beforeEach(() => {
    vi.useFakeTimers();
    runExport.mockReset();
    runExport.mockReturnValue(
      new Promise((_, r) => {
        reject = r;
      }),
    );
  });
  afterEach(() => vi.useRealTimers());

  it("says the connection gave up when it had already gone slow", async () => {
    const { store, result } = setup();
    act(() => result.current.build());
    act(() => {
      vi.advanceTimersByTime(SLOW_AFTER_MS);
    });
    expect(store.getState().dev.exportBuilder.slow).toBe(true);
    // The load balancer's own error, with a status: not the CORS case.
    reject({ response: { status: 504 } });
    await settle();
    expect(store.getState().dev.exportBuilder.exportError).toMatch(/connection gave up/);
  });

  it("says the export failed when it fails quickly", async () => {
    const { store, result } = setup();
    act(() => result.current.build());
    reject({ response: { status: 500 }, message: "Request failed" });
    await settle();
    expect(store.getState().dev.exportBuilder.exportError).toMatch(/^The export failed/);
  });
});

describe("Load config on the same table and dates", () => {
  it("reads the table again, keeping its shape", async () => {
    getExportPreview.mockReset();
    getExportPreview.mockResolvedValue({
      data: {
        error: 0,
        stores: [{ storeid: 1, store_number: "001", store_name: "001 - IGA" }],
        facets: {},
        columns: [{ name: "storeid", data_type: "integer" }],
        rows: [],
        hasData: true,
        message: null,
      },
    });
    const store = setupStore();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
    const { result } = renderHook(() => useExportBuilderCtx(), { wrapper });
    const page = () => store.getState().dev.exportBuilder;

    act(() => result.current.loadConfig());
    await waitFor(() => expect(page().loaded).toBe(true));
    act(() => {
      store.dispatch(setGroupBy(["storeid"]));
    });

    // Change, then Load config with nothing changed on the card.
    act(() => result.current.loadConfig());
    await waitFor(() => expect(page().loaded).toBe(true));
    expect(getExportPreview).toHaveBeenCalledTimes(2);
    expect(page().groupBy).toEqual(["storeid"]);
  });
});
