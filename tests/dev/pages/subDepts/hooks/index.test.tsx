import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { setupStore } from "@/store";
import { setSingleDate } from "@/features/searchSlice";
import { setSearchedDate } from "@/features/dev/devSubMarginSlice";
import { useSubMarginCtx } from "@/pages/subDepts/dev/hooks";

/*
 * Sub Dept Margins' panels read the week that was searched. The search date is
 * shared by every page, so another page moving it must not re-label the week.
 */

const ctxFor = (store: ReturnType<typeof setupStore>) =>
  renderHook(() => useSubMarginCtx(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    ),
  }).result.current;

describe("Sub Dept Margins' week", () => {
  it("stays on the searched week when another page moves the shared date", () => {
    const store = setupStore();
    store.dispatch(setSingleDate("11/08/2026"));
    store.dispatch(setSearchedDate("11/08/2026"));
    store.dispatch(setSingleDate("11/10/2026"));
    const ctx = ctxFor(store);
    expect(ctx.weekDate).toBe("11/08/2026");
    expect(ctx.singleDate).toBe("11/10/2026");
  });

  it("follows the picker before a search", () => {
    const store = setupStore();
    store.dispatch(setSingleDate("11/10/2026"));
    expect(ctxFor(store).weekDate).toBe("11/10/2026");
  });
});
