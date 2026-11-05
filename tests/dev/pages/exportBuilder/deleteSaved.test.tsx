import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { setupStore } from "@/store";
import { setConfig, setSaved } from "@/features/dev/devExportBuilderSlice";
import type { SavedConfig } from "@/api/savedConfigs";
import { useExportBuilderCtx } from "@/pages/exportBuilder/dev/hooks";

vi.mock("@/components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    error: () => {},
    success: () => {},
    info: () => {},
    warning: () => {},
    warn: () => {},
  }),
}));

const deleteSavedConfig = vi.fn();
vi.mock("@/api/savedConfigs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/savedConfigs")>()),
  deleteSavedConfig: (...args: unknown[]) => deleteSavedConfig(...args),
}));

const saved = { id: 12, name: "By vendor", payload: { source: "sales" } } as SavedConfig;

const setup = () => {
  const store = setupStore();
  store.dispatch(
    setConfig({
      source: "sales",
      stores: [],
      lists: {},
      dateFormats: [],
      days: [],
      columns: [],
      rows: [],
      hasData: true,
      message: null,
    }),
  );
  store.dispatch(setSaved({ source: "sales", saved: [saved] }));
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  const { result } = renderHook(() => useExportBuilderCtx(), { wrapper });
  return { store, result };
};

describe("deleting a saved export", () => {
  beforeEach(() => deleteSavedConfig.mockReset());

  it("keeps it in the list when the answer carries an error", async () => {
    // The house convention: a 200 with `error: 1` inside.
    deleteSavedConfig.mockResolvedValue({ data: { error: 1, success: false } });
    const { store, result } = setup();
    result.current.deleteSaved(12);
    await waitFor(() =>
      expect(store.getState().dev.exportBuilder.savedError).toBe("That did not delete."),
    );
    expect(store.getState().dev.exportBuilder.saved.map((s) => s.id)).toEqual([12]);
  });

  it("takes it off the list when the delete went through", async () => {
    deleteSavedConfig.mockResolvedValue({ data: { error: 0, success: true } });
    const { store, result } = setup();
    result.current.deleteSaved(12);
    await waitFor(() => expect(store.getState().dev.exportBuilder.saved).toEqual([]));
  });
});
