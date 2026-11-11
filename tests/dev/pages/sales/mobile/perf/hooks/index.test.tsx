import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { setupStore } from "@/store";
import { setLastStore, setSingleDate } from "@/features/searchSlice";
import { setPerfSearched } from "@/features/dev/devSalesPerfSlice";
import { usePerfScope, usePerfWeek } from "@/pages/sales/dev/mobile/perf/hooks";

vi.stubEnv("TZ", "America/Chicago");

/*
 * Phone Performance loads a card's figures after the search. The picker is
 * shared by every page, so moving it elsewhere must not send those loads to a
 * different week or store.
 */

const render = <T,>(store: ReturnType<typeof setupStore>, hook: () => T) =>
  renderHook(hook, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    ),
  }).result.current;

describe("phone Performance's searched week and scope", () => {
  it("stays on the search when another page moves the picker", () => {
    const store = setupStore();
    store.dispatch(
      setPerfSearched({ singleDate: "11/08/2026", type: "Store", lastStore: 36, lastGroup: 0, groupName: "" }),
    );
    store.dispatch(setSingleDate("11/10/2026"));
    store.dispatch(setLastStore(99));
    expect(render(store, usePerfWeek)).toMatchObject({
      twStart: "2026-11-02",
      twEnd: "2026-11-08",
      lwStart: "2026-10-26",
      lwEnd: "2026-11-01",
    });
    expect(render(store, usePerfScope)).toEqual({ isStore: true, useGroups: 0, searchValue: 36, singleStore: 1 });
  });

  it("follows the picker before a search", () => {
    const store = setupStore();
    store.dispatch(setSingleDate("11/10/2026"));
    expect(render(store, usePerfWeek).twEnd).toBe("2026-11-10");
  });
});
