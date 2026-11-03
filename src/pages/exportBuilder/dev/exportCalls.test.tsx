import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { setupStore } from "../../../store";
import { setConfig } from "../../../features/dev/devExportBuilderSlice";
import { SLOW_AFTER_MS, useExportBuilderCtx } from "./hooks";

/**
 * The page's calls, driven through the real hook and store with only the
 * network faked.
 */

vi.mock("../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    error: () => {},
    success: () => {},
    info: () => {},
    warning: () => {},
    warn: () => {},
  }),
}));

const runExport = vi.fn();
vi.mock("../../../api/salesExport", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../api/salesExport")>()),
  runExport: (...args: unknown[]) => runExport(...args),
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
