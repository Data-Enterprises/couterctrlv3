import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CouponItem } from "../interfaces";

/** Coupon Sales grades on a dollar amount, not a percentage change, and there
 *  is no middle ground to express — a store's average coupon is either over
 *  the line or it isn't. So this is a two-tier scheme rather than the shared
 *  critical/watch/healthy Severity, which would leave a permanently empty
 *  "watch" bucket in the filter row. */
/** Trend tiers, mirroring LP. "ungraded" is a group with no baseline activity
 *  to compare against — a new store or cashier is unknown, not healthy. */
export type CouponTier = "critical" | "watch" | "ok" | "ungraded";

export type CouponTierFilter = "all" | CouponTier;

/** Which breakdown the right panel is showing beneath the selected store. */
/** Date is deliberately absent: the day-of-week strip above the tabs is
 *  where per-day analysis lives now, and a Date tab listing the same seven
 *  days underneath it was the same cut twice. buildDateRows survives for the
 *  export preset, which still offers a row per day. */
export type CouponBreakdown = "subdept" | "cashier" | "item";

/** Dollars. Deliberately not a percentage — see couponGrading.ts. */
/** Which question the page is grading on. Trend compares each group against
 *  its own prior two weeks; Avg $ compares the average coupon against a flat
 *  dollar threshold with no baseline in play. They answer different things —
 *  a store steady at $8 is flat to Trend and obvious to Avg $ — so the toggle
 *  picks one rather than blending them. */
export type CouponMetric = "trend" | "avg";

export const COUPON_THRESHOLD_DEFAULT = 3;

/** Percentage rise in the average coupon, versus the store's own prior two
 *  weeks, that tips a row into critical. */
export const COUPON_TREND_THRESHOLD_DEFAULT = 10;

interface CouponSalesState {
  /** Raw response for the current search. Every rollup on the page derives
   *  from this one array — coupons/ returns line-level rows carrying store,
   *  sub department, cashier, date and transaction, so no tab needs its own
   *  fetch. */
  coupons: CouponItem[];
  /** The two weeks before the searched week (end-20..end-7). Grading compares
   *  each group's average coupon against its own average here. */
  baselineCoupons: CouponItem[];
  isFetching: boolean;
  hasSearched: boolean;
  noCouponsFound: boolean;

  /** null while the numeric input is being cleared; the page keeps grading
   *  against the last valid amount so rows don't reshuffle mid-edit. */
  threshold: number | null;
  /** Percentage, same null-while-editing rule as threshold. */
  trendThreshold: number | null;
  metric: CouponMetric;

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
  baselineCoupons: [],
  isFetching: false,
  hasSearched: false,
  noCouponsFound: false,
  threshold: COUPON_THRESHOLD_DEFAULT,
  trendThreshold: COUPON_TREND_THRESHOLD_DEFAULT,
  metric: "trend",
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
    setCouponBaseline: (state, action: PayloadAction<CouponItem[]>) => {
      state.baselineCoupons = action.payload;
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
    setCouponTrendThreshold: (state, action: PayloadAction<number | null>) => {
      state.trendThreshold = action.payload;
    },
    setCouponMetric: (state, action: PayloadAction<CouponMetric>) => {
      state.metric = action.payload;
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
  setCouponBaseline,
  setCouponSalesFetching,
  setCouponSalesHasSearched,
  setNoCouponSalesFound,
  setCouponThreshold,
  setCouponTrendThreshold,
  setCouponMetric,
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
