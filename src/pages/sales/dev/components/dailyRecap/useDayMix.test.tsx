import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { setupStore } from "../../../../../store";
import type { SubDeptMargin } from "../../../../../interfaces";
import { useDayMix } from "./useDayMix";

const fetchRows = vi.fn();
vi.mock("../../../../../utils/marginRows", () => ({
  fetchSubDeptRowsOrEmpty: (...args: unknown[]) => fetchRows(...args),
}));

const row = (store_number: string, over: Partial<SubDeptMargin> = {}) =>
  ({
    store_number,
    product_code: "a",
    sale_type: "Sale",
    price_type: "REG",
    total_sales: 10,
    total_tax: 0,
    qty: 1,
    weight: 0,
    ...over,
  }) as SubDeptMargin;

const setup = (store = setupStore()) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(({ id, num }) => useDayMix(id, num), {
    wrapper,
    initialProps: { id: 685, num: "369" },
  });
};

describe("a day's mix", () => {
  beforeEach(() => fetchRows.mockReset());

  it("reads one store and one day, every sub dept, and only this location", async () => {
    fetchRows.mockResolvedValue([row("369"), row("370", { total_sales: 500 })]);
    const { result } = setup();
    act(() => result.current.request("2026-10-30"));
    await waitFor(() => expect(result.current.stateOf("2026-10-30").status).toBe("ready"));
    expect(fetchRows.mock.calls[0].slice(2)).toEqual([0, "2026-10-30", "2026-10-30", 0, 685, 1]);
    const st = result.current.stateOf("2026-10-30");
    expect(st.status === "ready" && st.mix.regular).toBe(10);
  });

  it("leaves excluded sub depts out of the mix", async () => {
    fetchRows.mockResolvedValue([row("369"), row("369", { is_hash: true, total_sales: 900 })]);
    const { result } = setup();
    act(() => result.current.request("2026-10-30"));
    await waitFor(() => expect(result.current.stateOf("2026-10-30").status).toBe("ready"));
    const st = result.current.stateOf("2026-10-30");
    expect(st.status === "ready" && st.mix.regular).toBe(10);
  });

  it("reads a day once however often it is asked for", async () => {
    fetchRows.mockResolvedValue([]);
    const { result } = setup();
    act(() => {
      result.current.request("2026-10-30");
      result.current.request("2026-10-30");
    });
    await waitFor(() => expect(result.current.stateOf("2026-10-30").status).toBe("ready"));
    expect(fetchRows).toHaveBeenCalledTimes(1);
  });

  it("reads every day of the week when asked, once each", async () => {
    fetchRows.mockResolvedValue([]);
    const { result } = setup();
    act(() => result.current.requestAll(["2026-10-29", "2026-10-30"]));
    await waitFor(() => expect(result.current.stateOf("2026-10-30").status).toBe("ready"));
    act(() => result.current.request("2026-10-30"));
    expect(fetchRows).toHaveBeenCalledTimes(2);
  });

  it("says when a day failed, and tries again when asked again", async () => {
    fetchRows.mockRejectedValueOnce(new Error("502")).mockResolvedValue([]);
    const { result } = setup();
    act(() => result.current.request("2026-10-30"));
    await waitFor(() => expect(result.current.stateOf("2026-10-30").status).toBe("error"));
    act(() => result.current.request("2026-10-30"));
    await waitFor(() => expect(result.current.stateOf("2026-10-30").status).toBe("ready"));
    expect(fetchRows).toHaveBeenCalledTimes(2);
  });

  it("drops a late answer for the store it has moved away from", async () => {
    let finish: (rows: SubDeptMargin[]) => void = () => {};
    fetchRows.mockReturnValueOnce(new Promise((r) => (finish = r)));
    const { result, rerender } = setup();
    act(() => result.current.request("2026-10-30"));
    rerender({ id: 700, num: "12" });
    await act(async () => finish([row("369")]));
    expect(result.current.stateOf("2026-10-30").status).toBe("idle");
  });

  it("keeps a day's answer across a remount, so coming back to Summary reads nothing", async () => {
    fetchRows.mockResolvedValue([row("369")]);
    const store = setupStore();
    const first = setup(store);
    act(() => first.result.current.request("2026-10-30"));
    await waitFor(() => expect(first.result.current.stateOf("2026-10-30").status).toBe("ready"));
    first.unmount();
    const again = setup(store);
    act(() => again.result.current.requestAll(["2026-10-30"]));
    expect(again.result.current.stateOf("2026-10-30").status).toBe("ready");
    expect(fetchRows).toHaveBeenCalledTimes(1);
  });

  it("does not send a second read for a day already on the wire", async () => {
    let finish: (rows: SubDeptMargin[]) => void = () => {};
    fetchRows.mockReturnValueOnce(new Promise((r) => (finish = r)));
    const store = setupStore();
    const a = setup(store);
    const b = setup(store);
    act(() => {
      a.result.current.request("2026-10-31");
      b.result.current.request("2026-10-31");
    });
    await act(async () => finish([]));
    await waitFor(() => expect(b.result.current.stateOf("2026-10-31").status).toBe("ready"));
    expect(fetchRows).toHaveBeenCalledTimes(1);
  });

  it("does not retry a failed day on its own when the week is asked for again", async () => {
    fetchRows.mockRejectedValue(new Error("502"));
    const { result } = setup();
    act(() => result.current.requestAll(["2026-11-01"]));
    await waitFor(() => expect(result.current.stateOf("2026-11-01").status).toBe("error"));
    act(() => result.current.requestAll(["2026-11-01"]));
    expect(fetchRows).toHaveBeenCalledTimes(1);
  });
});
