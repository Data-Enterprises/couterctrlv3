import { describe, expect, it } from "vitest";
import reducer, {
  beginMarkdownsRequest,
  finishMarkdownsSearch,
  clearMarkdownFilters,
  setLoading,
  setMarkdownFilters,
  setMarkdowns,
  setNotice,
  setProgress,
  toggleMarkdownSort,
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
    expect(s.filters.productCodes).toEqual([]);
    expect(s.sort).toBeNull();
  });

  it("sets one filter and leaves the others alone", () => {
    let s = reducer(fresh(), setMarkdownFilters({ subIds: [5, 12] }));
    s = reducer(s, setMarkdownFilters({ productCodes: ["4900000634"] }));
    expect(s.filters.subIds).toEqual([5, 12]);
    expect(s.filters.productCodes).toEqual(["4900000634"]);
    expect(s.filters.storeNumbers).toEqual([]);
  });

  it("clears every filter back to where it started", () => {
    let s = reducer(fresh(), setMarkdownFilters({ subIds: [5], productCodes: ["4900000634"], minPercent: 30 }));
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
    store.dispatch(setMarkdownFilters({ subIds: [5], types: ["Waste"] }));
    store.dispatch(toggleMarkdownSort("markdown_percent"));
    store.dispatch(beginMarkdownsRequest({ id: "a" }));
    store.dispatch(finishMarkdownsSearch({ rows, searched: { scope: "Food Giant Hayti", startDate: "11/03/2026", endDate: "11/05/2026" } }));
    store.dispatch(setNotice("No markdowns came back for this search."));
    store.dispatch(resetAppSlice());
    expect(store.getState().dev.markdowns).toEqual(fresh());
  });

  it("sorts a column descending, then ascending, then back to the backend's order", () => {
    let s = reducer(fresh(), toggleMarkdownSort("markdown_percent"));
    expect(s.sort).toEqual({ col: "markdown_percent", dir: "desc" });
    s = reducer(s, toggleMarkdownSort("markdown_percent"));
    expect(s.sort).toEqual({ col: "markdown_percent", dir: "asc" });
    s = reducer(s, toggleMarkdownSort("markdown_percent"));
    expect(s.sort).toBeNull();
  });

  it("lets the newest search win, and leaves what is shown alone until it finishes", () => {
    const hayti = { scope: "Hayti", startDate: "11/03/2026", endDate: "11/05/2026" };
    let s = reducer(fresh(), finishMarkdownsSearch({ rows, searched: hayti }));
    s = reducer(s, setMarkdownFilters({ types: ["Waste"] }));
    s = reducer(s, beginMarkdownsRequest({ id: "a" }));
    s = reducer(s, beginMarkdownsRequest({ id: "b" }));
    expect(s.requestId).toBe("b");
    expect(s.markdowns).toEqual(rows);
    expect(s.filters.types).toEqual(["Waste"]);
    expect(s.searched).toEqual(hayti);
  });

  it("swaps a finished search in at once: its rows and name, with no old picks or notice", () => {
    const tupelo = { scope: "Tupelo", startDate: "11/01/2026", endDate: "11/02/2026" };
    let s = reducer(fresh(), setMarkdownFilters({ types: ["Waste"] }));
    s = reducer(s, setNotice("Page 2 of 3 didn't load, so nothing is shown. Search again."));
    s = reducer(s, finishMarkdownsSearch({ rows: rows.slice(0, 1), searched: tupelo }));
    expect(s.markdowns).toEqual(rows.slice(0, 1));
    expect(s.searched).toEqual(tupelo);
    expect(s.filters.types).toEqual([]);
    expect(s.notice).toBeNull();
  });

  it("starts a new column descending", () => {
    let s = reducer(fresh(), toggleMarkdownSort("markdown_percent"));
    s = reducer(s, toggleMarkdownSort("order_date"));
    expect(s.sort).toEqual({ col: "order_date", dir: "desc" });
  });
});
