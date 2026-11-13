import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import type { ReactNode } from "react";
import { setupStore } from "@/store";
import { setLastGroup, setLastStore, setType } from "@/features/searchSlice";
import { setAssignedStores } from "@/features/userSlice";
import { finishMarkdownsSearch, setMarkdownFilters } from "@/features/dev/devMarkdownsSlice";
import { useLoadMarkdowns } from "@/pages/markdowns/dev/hooks";

// Interfaces
import type { MarkdownItem } from "@/interfaces/markdowns";
import type { Store } from "@/interfaces";

const getMarkdowns = vi.fn();
vi.mock("@/api/markdowns", () => ({
  getMarkdowns: (...args: unknown[]) => getMarkdowns(...args),
}));
const toast = { warn: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() };
vi.mock("@/components/toasts/hooks/useToast", () => ({ useToast: () => toast }));

const row = (id: number) => ({ id, storeid: 301, product_code: String(id) }) as unknown as MarkdownItem;
const page = (n: number, total: number, ids: number[]) => ({
  data: {
    error: 0,
    success: true,
    msg: "Success",
    store_count: 1,
    total_pages: total,
    total_records: ids.length * total,
    page: n,
    count: ids.length,
    markdowns: ids.map(row),
  },
});

const setup = () => {
  const store = setupStore();
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  const { result } = renderHook(() => useLoadMarkdowns(), { wrapper });
  return { store, load: () => result.current() };
};

describe("useLoadMarkdowns", () => {
  beforeEach(() => {
    getMarkdowns.mockReset();
    Object.values(toast).forEach((f) => f.mockReset());
  });

  it("reads page 1, then every other page in order, and keeps all the rows", async () => {
    getMarkdowns
      .mockResolvedValueOnce(page(1, 3, [1, 2]))
      .mockResolvedValueOnce(page(2, 3, [3, 4]))
      .mockResolvedValueOnce(page(3, 3, [5]));
    const { store, load } = setup();
    act(() => { store.dispatch(setLastStore(301)); });

    await act(load);

    expect(getMarkdowns.mock.calls.map((c) => c[6])).toEqual([1, 2, 3]);
    const s = store.getState().dev.markdowns;
    expect(s.markdowns.map((r) => r.id)).toEqual([1, 2, 3, 4, 5]);
    expect(s.loading).toBe(false);
    expect(s.progress).toBeNull();
  });

  it("keeps each row's store under the name the user's stores give it", async () => {
    getMarkdowns.mockResolvedValueOnce({
      data: { ...page(1, 1, [1]).data, markdowns: [{ ...row(1), storename: "FG HAYTI #301" }] },
    });
    const { store, load } = setup();
    act(() => {
      store.dispatch(setAssignedStores([{ storeid: 301, store_name: "Food Giant Hayti" } as Store]));
      store.dispatch(setLastStore(301));
    });

    await act(load);

    expect(store.getState().dev.markdowns.markdowns[0].storename).toBe("Food Giant Hayti");
  });

  it("names the page in flight while it waits for it", async () => {
    let release!: (v: unknown) => void;
    getMarkdowns
      .mockResolvedValueOnce(page(1, 3, [1]))
      .mockReturnValueOnce(new Promise((res) => { release = res; }))
      .mockResolvedValueOnce(page(3, 3, [3]));
    const { store, load } = setup();
    act(() => { store.dispatch(setLastStore(301)); });

    let done!: Promise<void>;
    await act(async () => { done = load(); });
    expect(store.getState().dev.markdowns.progress).toEqual({ page: 2, total: 3 });

    await act(async () => { release(page(2, 3, [2])); await done; });
    expect(store.getState().dev.markdowns.progress).toBeNull();
  });

  it("sends a store search as a store and a group search as a group", async () => {
    getMarkdowns.mockResolvedValue(page(1, 1, [1]));
    const { store, load } = setup();
    act(() => { store.dispatch(setLastStore(301)); });
    act(() => { store.dispatch(setLastGroup(77)); });

    await act(load);
    // searchValue, useGroups
    expect(getMarkdowns.mock.calls[0].slice(4, 6)).toEqual([301, 0]);

    act(() => { store.dispatch(setType("Group")); });
    await act(load);
    expect(getMarkdowns.mock.calls[1].slice(4, 6)).toEqual([77, 1]);
  });

  it("says so when nothing came back, and reads no more pages", async () => {
    getMarkdowns.mockResolvedValueOnce({
      data: { error: 0, success: true, msg: "Success", total_pages: 0, total_records: 0, page: 1, count: 0, markdowns: [] },
    });
    const { store, load } = setup();

    await act(load);

    expect(getMarkdowns).toHaveBeenCalledTimes(1);
    expect(store.getState().dev.markdowns.notice).toBe("No markdowns came back for this search.");
    expect(store.getState().dev.markdowns.markdowns).toEqual([]);
  });

  it("shows the backend's own message when it refuses the search", async () => {
    getMarkdowns.mockRejectedValueOnce({
      message: "Request failed with status code 404",
      response: { data: { msg: "No stores found" } },
    });
    const { store, load } = setup();

    await act(load);

    expect(toast.error).toHaveBeenCalledWith("No stores found");
    expect(store.getState().dev.markdowns.loading).toBe(false);
  });

  it("ignores an older search's late pages once a newer search has started", async () => {
    let releaseOld: (v: unknown) => void = () => {};
    getMarkdowns
      .mockReturnValueOnce(new Promise((r) => { releaseOld = r; })) // first search, page 1: slow
      .mockResolvedValueOnce(page(1, 1, [9])); // second search
    const { store, load } = setup();

    let first!: Promise<void>;
    act(() => { first = load(); });
    await act(load);
    await act(async () => {
      releaseOld(page(1, 1, [1, 2]));
      await first;
    });

    expect(store.getState().dev.markdowns.markdowns.map((r) => r.id)).toEqual([9]);
  });

  it("ignores an old search's pages after the page was left and a new search started", async () => {
    let releaseOld: (v: unknown) => void = () => {};
    getMarkdowns
      .mockResolvedValueOnce(page(1, 2, [1, 2])) // old search, page 1
      .mockReturnValueOnce(new Promise((r) => { releaseOld = r; })) // old search, page 2: slow
      .mockResolvedValueOnce(page(1, 1, [9])); // new search
    const store = setupStore();
    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

    // Start the old search, then leave the page while page 2 is in flight.
    const first = renderHook(() => useLoadMarkdowns(), { wrapper });
    let old!: Promise<void>;
    await act(async () => { old = first.result.current(); await Promise.resolve(); });
    first.unmount();

    // Come back: a fresh mount runs a new search.
    const second = renderHook(() => useLoadMarkdowns(), { wrapper });
    await act(() => second.result.current());
    await act(async () => { releaseOld(page(2, 2, [3, 4])); await old; });

    const s = store.getState().dev.markdowns;
    expect(s.markdowns.map((r) => r.id)).toEqual([9]);
    expect(s.loading).toBe(false);
  });

  it("shows nothing rather than part of the search when a later page is refused", async () => {
    getMarkdowns
      .mockResolvedValueOnce(page(1, 3, [1, 2]))
      .mockResolvedValueOnce({ data: { error: 1, success: false, msg: "Query timed out" } });
    const { store, load } = setup();

    await act(load);

    const s = store.getState().dev.markdowns;
    expect(getMarkdowns).toHaveBeenCalledTimes(2);
    expect(s.markdowns).toEqual([]);
    expect(s.notice).toBe("Page 2 of 3 didn't load, so nothing is shown. Search again.");
    expect(toast.error).toHaveBeenCalledWith("Query timed out");
    expect(s.loading).toBe(false);
  });

  describe("a re-search over results already on screen", () => {
    const hayti = { scope: "Food Giant Hayti", startDate: "11/03/2026", endDate: "11/05/2026" };
    // Last week's results, with a filter picked, before the new search.
    const withResults = () => {
      const ctx = setup();
      act(() => {
        ctx.store.dispatch(finishMarkdownsSearch({ rows: [row(70), row(71)], searched: hayti }));
        ctx.store.dispatch(setMarkdownFilters({ types: ["Waste"] }));
        ctx.store.dispatch(setLastStore(301));
      });
      return ctx;
    };
    const unchanged = (store: ReturnType<typeof setupStore>) => {
      const s = store.getState().dev.markdowns;
      expect(s.markdowns.map((r) => r.id)).toEqual([70, 71]);
      expect(s.filters.types).toEqual(["Waste"]);
      expect(s.searched).toEqual(hayti);
      expect(s.loading).toBe(false);
    };

    it("keeps them when a later page fails, and says they are the last results", async () => {
      getMarkdowns
        .mockResolvedValueOnce(page(1, 3, [1, 2]))
        .mockRejectedValueOnce({ message: "Network Error" });
      const { store, load } = withResults();

      await act(load);

      unchanged(store);
      expect(store.getState().dev.markdowns.notice).toBe(
        "Page 2 of 3 didn't load, so the last results are still shown. Search again.",
      );
      expect(toast.error).toHaveBeenCalledWith("Network Error");
    });

    it("keeps them when the first page fails", async () => {
      getMarkdowns.mockRejectedValueOnce({ message: "Network Error" });
      const { store, load } = withResults();

      await act(load);

      unchanged(store);
      expect(toast.error).toHaveBeenCalledWith("Network Error");
    });

    it("keeps them when the backend refuses the search", async () => {
      getMarkdowns.mockResolvedValueOnce({ data: { error: 1, success: false, msg: "No stores found" } });
      const { store, load } = withResults();

      await act(load);

      unchanged(store);
      expect(toast.warn).toHaveBeenCalledWith("No stores found");
    });

    it("keeps showing them while the new search loads", async () => {
      let release!: (v: unknown) => void;
      getMarkdowns.mockReturnValueOnce(new Promise((res) => { release = res; }));
      const { store, load } = withResults();

      let done!: Promise<void>;
      await act(async () => { done = load(); });
      expect(store.getState().dev.markdowns.markdowns.map((r) => r.id)).toEqual([70, 71]);

      await act(async () => { release(page(1, 1, [1])); await done; });
      expect(store.getState().dev.markdowns.markdowns.map((r) => r.id)).toEqual([1]);
    });

    it("replaces them, and the old picks, once every page of the new search is in", async () => {
      getMarkdowns
        .mockResolvedValueOnce(page(1, 2, [1]))
        .mockResolvedValueOnce(page(2, 2, [2]));
      const { store, load } = withResults();

      await act(load);

      const s = store.getState().dev.markdowns;
      expect(s.markdowns.map((r) => r.id)).toEqual([1, 2]);
      expect(s.filters.types).toEqual([]);
      expect(s.searched).not.toEqual(hayti);
      expect(s.notice).toBeNull();
    });
  });

  it("does the same when a later page fails on the network", async () => {
    getMarkdowns
      .mockResolvedValueOnce(page(1, 2, [1]))
      .mockRejectedValueOnce({ message: "Network Error" });
    const { store, load } = setup();

    await act(load);

    expect(store.getState().dev.markdowns.markdowns).toEqual([]);
    expect(store.getState().dev.markdowns.notice).toBe("Page 2 of 2 didn't load, so nothing is shown. Search again.");
    expect(toast.error).toHaveBeenCalledWith("Network Error");
  });
});
