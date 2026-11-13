import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { setupStore } from "@/store";
import { useWeekExceptions } from "@/pages/sales/dev/storePanel/summary/hooks/useWeekExceptions";

const getExceptions = vi.fn();
vi.mock("@/api/exceptionLines", () => ({
  getExceptionLines: (...args: unknown[]) => getExceptions(...args),
}));

const lines = {
  data: {
    error: 0,
    total_pages: 1,
    transactions: [
      { store_number: "942", sale_type: "Voided", sale_date: "2026-10-30", sale_id: "a", net_sales: 4, qty: 1 },
    ],
  },
};

const mount = (store = setupStore(), start = "2026-10-27") => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(() => useWeekExceptions(942, "942", start, "2026-11-02"), { wrapper });
};

describe("the week's exceptions", () => {
  beforeEach(() => getExceptions.mockReset());

  it("reads the week once and rolls it up by day", async () => {
    getExceptions.mockResolvedValue(lines);
    const { result } = mount();
    await waitFor(() => expect(result.current.status).toBe("ready"));
    const st = result.current;
    expect(st.status === "ready" && st.byDay["2026-10-30"].transactions).toBe(1);
    expect(getExceptions).toHaveBeenCalledTimes(1);
  });

  it("reads nothing when Summary opens again on the same store and week", async () => {
    getExceptions.mockResolvedValue(lines);
    const store = setupStore();
    const first = mount(store, "2026-10-20");
    await waitFor(() => expect(first.result.current.status).toBe("ready"));
    first.unmount();
    const again = mount(store, "2026-10-20");
    expect(again.result.current.status).toBe("ready");
    expect(getExceptions).toHaveBeenCalledTimes(1);
  });

  it("stops after a failed read instead of asking again on every render", async () => {
    getExceptions.mockResolvedValue({ data: { error: 1, msg: "boom" } });
    const { result, rerender } = mount(setupStore(), "2026-10-13");
    await waitFor(() => expect(result.current.status).toBe("error"));
    rerender();
    rerender();
    expect(getExceptions).toHaveBeenCalledTimes(1);
  });
});
