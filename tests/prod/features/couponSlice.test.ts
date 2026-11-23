import { describe, expect, it } from "vitest";
import reducer, {
  resetCouponMobilePlace,
  setCouponGridFilter,
  setCouponMobilePlace,
  setCouponSearched,
  setCouponSelectedKey,
  setCouponSortMetric,
  setIsFetching,
} from "@/features/couponSlice";
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

describe("Coupons' place on the page", () => {
  const home = {
    screen: "entry",
    storeId: null,
    storeNumber: null,
    tab: "subdept",
    section: null,
  };

  it("starts on all stores, sorted by amount, with the phone on its search card", () => {
    const s = fresh();
    expect(s.selectedKey).toBe("");
    expect(s.sortMetric).toBe("amount");
    expect(s.mobile).toEqual(home);
  });

  it("keeps the picked store and the sort", () => {
    let s = reducer(fresh(), setCouponSelectedKey("36__036"));
    s = reducer(s, setCouponSortMetric("qty"));
    expect(s.selectedKey).toBe("36__036");
    expect(s.sortMetric).toBe("qty");
  });

  it("moves the phone one field at a time, and back home on reset", () => {
    let s = reducer(
      fresh(),
      setCouponMobilePlace({
        storeId: 36,
        storeNumber: "036",
        screen: "overview",
      }),
    );
    s = reducer(
      s,
      setCouponMobilePlace({ section: { key: "DAIRY", label: "Dairy" } }),
    );
    expect(s.mobile).toEqual({
      ...home,
      screen: "overview",
      storeId: 36,
      storeNumber: "036",
      section: { key: "DAIRY", label: "Dairy" },
    });
    s = reducer(s, resetCouponMobilePlace());
    expect(s.mobile).toEqual(home);
  });

  it("is cleared on sign-out", () => {
    const store = setupStore();
    store.dispatch(setCouponSelectedKey("36__036"));
    store.dispatch(setCouponSortMetric("qty"));
    store.dispatch(setCouponMobilePlace({ screen: "detail", tab: "date" }));
    store.dispatch(resetAppSlice());
    const c = store.getState().dev.coupons;
    expect(c.selectedKey).toBe("");
    expect(c.sortMetric).toBe("amount");
    expect(c.mobile).toEqual(home);
  });
});

describe("The search the loaded coupons answer", () => {
  const scope = {
    type: "Group" as const,
    startDate: "11/03/2026",
    endDate: "11/09/2026",
    lastStore: 0,
    lastGroup: 12,
    selectedGroup: { id: 12, group_name: "North" } as never,
  };

  it("is empty before the first search", () => {
    expect(fresh().searched).toBeNull();
  });

  it("is kept as searched, whatever the picker does after", () => {
    const s = reducer(fresh(), setCouponSearched(scope));
    expect(s.searched).toEqual(scope);
  });

  it("is cleared on sign-out", () => {
    const store = setupStore();
    store.dispatch(setCouponSearched(scope));
    store.dispatch(resetAppSlice());
    expect(store.getState().dev.coupons.searched).toBeNull();
  });
});
