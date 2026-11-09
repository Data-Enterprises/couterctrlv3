import { describe, expect, it } from "vitest";
import reducer, {
  clearMarkdownFilters,
  setLoading,
  setMarkdownFilters,
  setMarkdowns,
  setNotice,
  setProgress,
} from "@/features/dev/devMarkdownsSlice";
import { setupStore } from "@/store";
import { resetAppSlice } from "@/features/appSlice";

// Interfaces
import type { MarkdownItem } from "@/interfaces/markdowns";

const fresh = () => reducer(undefined, { type: "@@init" });
const rows = [{ id: 1, storeid: 301, product_code: "4900000634" }] as unknown as MarkdownItem[];

describe("the Markdowns slice", () => {
  it("starts empty, not loading, with no progress or notice", () => {
    const s = fresh();
    expect(s.markdowns).toEqual([]);
    expect(s.loading).toBe(false);
    expect(s.progress).toBeNull();
    expect(s.notice).toBeNull();
    expect(s.filters.subIds).toEqual([]);
    expect(s.filters.search).toBe("");
  });

  it("sets one filter and leaves the others alone", () => {
    let s = reducer(fresh(), setMarkdownFilters({ subIds: [5, 12] }));
    s = reducer(s, setMarkdownFilters({ search: "milk" }));
    expect(s.filters.subIds).toEqual([5, 12]);
    expect(s.filters.search).toBe("milk");
    expect(s.filters.storeNumbers).toEqual([]);
  });

  it("clears every filter back to where it started", () => {
    let s = reducer(fresh(), setMarkdownFilters({ subIds: [5], search: "milk", minPercent: 30 }));
    s = reducer(s, clearMarkdownFilters());
    expect(s.filters).toEqual(fresh().filters);
  });

  it("shows loading progress, then clears it", () => {
    let s = reducer(fresh(), setLoading(true));
    s = reducer(s, setProgress({ page: 2, total: 4 }));
    expect(s.progress).toEqual({ page: 2, total: 4 });
    s = reducer(s, setProgress(null));
    s = reducer(s, setLoading(false));
    expect(s.progress).toBeNull();
    expect(s.loading).toBe(false);
  });

  it("is empty again after sign-out", () => {
    const store = setupStore();
    store.dispatch(setMarkdowns(rows));
    store.dispatch(setMarkdownFilters({ subIds: [5], search: "milk" }));
    store.dispatch(setNotice("No markdowns came back for this search."));
    store.dispatch(resetAppSlice());
    expect(store.getState().dev.markdowns).toEqual(fresh());
  });
});
