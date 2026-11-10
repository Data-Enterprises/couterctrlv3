import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import type { ReactNode } from "react";
import { setupStore } from "@/store";
import { setLastGroup, setLastStore, setType } from "@/features/searchSlice";
import { useLoadMarkdowns } from "@/pages/markdowns/dev/hooks";

// Interfaces
import type { MarkdownItem } from "@/interfaces/markdowns";

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
