import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { setupStore } from "@/store";
import { setLastStore, setSingleDate } from "@/features/searchSlice";
import { setSearchedScope } from "@/features/dev/devLossPreventionSlice";
import { useLossPreventionCtx } from "@/pages/lossPrevention/dev/hooks";

/*
 * Loss Prevention's later fetches and labels use what was searched. The search
 * picker is shared by every page, so another page moving its date or store
 * must not send a store click or a sale-type change to a different week or store.
 */

const ctxFor = (store: ReturnType<typeof setupStore>) =>
  renderHook(() => useLossPreventionCtx(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    ),
  }).result.current;

describe("Loss Prevention's searched scope", () => {
  it("keeps the searched week and store when another page moves the picker", () => {
    const store = setupStore();
    store.dispatch(setSearchedScope({ singleDate: "11/08/2026", type: "Store", lastStore: 36, lastGroup: 0 }));
    store.dispatch(setSingleDate("11/10/2026"));
    store.dispatch(setLastStore(99));
    const ctx = ctxFor(store);
    expect(ctx.weekDate).toBe("11/08/2026");
    expect(ctx.params).toMatchObject({
      searchValue: 36,
      useGroups: 0,
      singleStore: 1,
      lpStart: "2026-11-02",
      lpEnd: "2026-11-08",
      lpBaseStart: "2026-10-19",
      lpBaseEnd: "2026-11-01",
    });
  });

  it("follows the picker before a search", () => {
    const store = setupStore();
    store.dispatch(setSingleDate("11/10/2026"));
    store.dispatch(setLastStore(99));
    const ctx = ctxFor(store);
    expect(ctx.weekDate).toBe("11/10/2026");
    expect(ctx.params.searchValue).toBe(99);
  });
});
