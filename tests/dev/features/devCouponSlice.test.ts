import { describe, expect, it } from "vitest";
import reducer, {
  setCouponGridFilter,
  setIsFetching,
} from "@/features/dev/devCouponSlice";
import { setupStore } from "@/store";
import { resetAppSlice } from "@/features/appSlice";

const fresh = () => reducer(undefined, { type: "@@init" });
const none = { upc: "", product: "", subDept: "", amount: null };

describe("Coupons' applied grid filters", () => {
  it("start empty", () => {
    expect(fresh().gridFilters).toEqual(none);
  });

  it("set one filter without touching the others", () => {
    let s = reducer(fresh(), setCouponGridFilter({ upc: "4900000634" }));
    s = reducer(s, setCouponGridFilter({ amount: { op: "gt", amount: 1 } }));
    expect(s.gridFilters).toEqual({
      ...none,
      upc: "4900000634",
      amount: { op: "gt", amount: 1 },
    });
  });

  it("clear when a new search starts, as the panel's remount did", () => {
    let s = reducer(fresh(), setCouponGridFilter({ product: "milk" }));
    s = reducer(s, setIsFetching(false));
    expect(s.gridFilters.product).toBe("milk");
    s = reducer(s, setIsFetching(true));
    expect(s.gridFilters).toEqual(none);
  });

  it("are cleared on sign-out", () => {
    const store = setupStore();
    store.dispatch(setCouponGridFilter({ subDept: "DAIRY" }));
    store.dispatch(resetAppSlice());
    expect(store.getState().dev.coupons.gridFilters).toEqual(none);
  });
});
