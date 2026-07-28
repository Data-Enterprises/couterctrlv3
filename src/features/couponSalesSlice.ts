import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CouponItem } from "../interfaces";

/** Coupon Sales grades on a dollar amount, not a percentage change, and there
 *  is no middle ground to express — a store's average coupon is either over
 *  the line or it isn't. So this is a two-tier scheme rather than the shared
 *  critical/watch/healthy Severity, which would leave a permanently empty
 *  "watch" bucket in the filter row. */
export type CouponTier = "critical" | "ok";

export type CouponTierFilter = "all" | CouponTier;

/** Which breakdown the right panel is showing beneath the selected store. */
export type CouponBreakdown = "subdept" | "date" | "cashier";

/** Dollars. Deliberately not a percentage — see couponGrading.ts. */
export const COUPON_THRESHOLD_DEFAULT = 3;

interface CouponSalesState {
  /** Raw response for the current search. Every rollup on the page derives
   *  from this one array — coupons/ returns line-level rows carrying store,
   *  sub department, cashier, date and transaction, so no tab needs its own
   *  fetch. */
  coupons: CouponItem[];
  isFetching: boolean;
  hasSearched: boolean;
  noCouponsFound: boolean;

  /** null while the numeric input is being cleared; the page keeps grading
   *  against the last valid amount so rows don't reshuffle mid-edit. */
  threshold: number | null;

  /** `storeid__store_number` — co-located stores share a storeid, so the
   *  number is part of the key. See utils/storeIdentity. */
  selectedStoreKey: string | null;
  breakdown: CouponBreakdown;
  /** Row selected within the active breakdown, e.g. a sub department id. */
  selectedSectionKey: string | null;

  tierFilter: CouponTierFilter;
  storeFilter: string;
  sectionFilter: string;
  exportOpen: boolean;
}

const initialState: CouponSalesState = {
  coupons: [],
  isFetching: false,
  hasSearched: false,
  noCouponsFound: false,
  threshold: COUPON_THRESHOLD_DEFAULT,
  selectedStoreKey: null,
  breakdown: "subdept",
  selectedSectionKey: null,
  tierFilter: "all",
  storeFilter: "",
  sectionFilter: "",
  exportOpen: false,
};

const couponSalesSlice = createSlice({
  name: "couponSales",
  initialState,
  reducers: {
    setCouponSalesData: (state, action: PayloadAction<CouponItem[]>) => {
      state.coupons = action.payload;
    },
    setCouponSalesFetching: (state, action: PayloadAction<boolean>) => {
      state.isFetching = action.payload;
    },
    setCouponSalesHasSearched: (state, action: PayloadAction<boolean>) => {
      state.hasSearched = action.payload;
    },
    setNoCouponSalesFound: (state, action: PayloadAction<boolean>) => {
      state.noCouponsFound = action.payload;
    },
    setCouponThreshold: (state, action: PayloadAction<number | null>) => {
      state.threshold = action.payload;
    },
    setSelectedCouponStore: (state, action: PayloadAction<string | null>) => {
      state.selectedStoreKey = action.payload;
      // A section/transaction from the previous store means nothing here.
      state.selectedSectionKey = null;
      state.sectionFilter = "";
    },
    setCouponBreakdown: (state, action: PayloadAction<CouponBreakdown>) => {
      state.breakdown = action.payload;
      // Section keys aren't comparable across breakdowns — a sub dept id and a
      // cashier number can collide.
      state.selectedSectionKey = null;
      state.sectionFilter = "";
    },
    setSelectedCouponSection: (state, action: PayloadAction<string | null>) => {
      state.selectedSectionKey = action.payload;
    },
    setCouponTierFilter: (state, action: PayloadAction<CouponTierFilter>) => {
      state.tierFilter = action.payload;
    },
    setCouponStoreFilter: (state, action: PayloadAction<string>) => {
      state.storeFilter = action.payload;
    },
    setCouponSectionFilter: (state, action: PayloadAction<string>) => {
      state.sectionFilter = action.payload;
    },
    setCouponExportOpen: (state, action: PayloadAction<boolean>) => {
      state.exportOpen = action.payload;
    },
    /** New search — drop the data and every selection made against it, but
     *  keep the threshold the user dialled in. */
    reQueryCouponSales: (state) => {
      state.coupons = [];
      state.noCouponsFound = false;
      state.selectedStoreKey = null;
      state.selectedSectionKey = null;
      state.breakdown = "subdept";
      state.tierFilter = "all";
      state.storeFilter = "";
      state.sectionFilter = "";
      state.exportOpen = false;
    },
    resetCouponSalesState: () => initialState,
  },
});

export const {
  setCouponSalesData,
  setCouponSalesFetching,
  setCouponSalesHasSearched,
  setNoCouponSalesFound,
  setCouponThreshold,
  setSelectedCouponStore,
  setCouponBreakdown,
  setSelectedCouponSection,
  setCouponTierFilter,
  setCouponStoreFilter,
  setCouponSectionFilter,
  setCouponExportOpen,
  reQueryCouponSales,
  resetCouponSalesState,
} = couponSalesSlice.actions;

export default couponSalesSlice.reducer;
