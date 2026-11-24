
// Utils
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// Interfaces
import type { CouponItem, ThresholdValue, TransactionListItem } from "../interfaces";
import type { SEARCH_TYPE } from "./searchSlice";
import type { Group } from "./groupSlice";

/** The detail grid's applied column filters. */
export interface CouponGridFilters {
  upc: string;
  product: string;
  subDept: string;
  amount: ThresholdValue | null;
}

const noGridFilters: CouponGridFilters = { upc: "", product: "", subDept: "", amount: null };

/** The search the loaded coupons answer, kept with them so the labels name
 *  it rather than whatever the shared picker has moved to since. */
export interface CouponSearchedScope {
  type: SEARCH_TYPE;
  startDate: string;
  endDate: string;
  lastStore: number;
  lastGroup: number;
  selectedGroup: Group;
}

/** What the coupon lists sort by, desktop and phone alike. */
export type CouponSortMetric = "amount" | "qty";

/** Where the phone is: its screen, the store picked (null is every store in a
 *  group), the grouping tab and the section open. */
export interface CouponMobilePlace {
  screen: "entry" | "stores" | "overview" | "detail";
  storeId: number | null;
  /** Co-located stores share a storeid; the number picks the location. */
  storeNumber: string | null;
  tab: "subdept" | "date" | "cashier";
  section: { key: string; label: string } | null;
}

const mobileStart: CouponMobilePlace = {
  screen: "entry",
  storeId: null,
  storeNumber: null,
  tab: "subdept",
  section: null,
};

export type FilterType =
  | "Store"
  | "CpnAmount"
  | "UPC"
  | "Desc"
  | "CustomerID"
  | "Sub Department"
  | "";

export type UniqueCpnDate = {
  label: string;
  value: string;
};

interface CouponState {
  coupons: CouponItem[];
  gridCoupons: CouponItem[];
  storeNum: string;
  cpnAmount: number;
  productCode: string;
  productDescription: string;
  customerId: string;
  subDept: string;
  isFetching: boolean;
  filterModalOpen: boolean;
  filterType: FilterType;
  amtLessThan: boolean;
  amtGreaterThan: boolean;
  noCouponsFound: boolean;
  couponMobileStage: number;
  uniqueCpnDates: UniqueCpnDate[];
  uniqueSubDepts: string[];
  subDeptMobileFilter: string[];
  uniqueDateMobileFilter: string;
  showSubsMobileFilter: boolean;
  /** Lines of the receipt open in the detail panel (or the mobile sheet);
   *  empty when none is. Was parked in LP's slice (transactionDrillDown) —
   *  Coupons keeps its own, as Coupon Sales does. */
  receiptLines: TransactionListItem[];
  /** Kept when the page is left; a new search clears them. */
  gridFilters: CouponGridFilters;
  /** The desktop list's picked store, `storeid__store_number`; "" is all. */
  selectedKey: string;
  sortMetric: CouponSortMetric;
  mobile: CouponMobilePlace;
  /** Null until the first search. */
  searched: CouponSearchedScope | null;
}

const initialState: CouponState = {
  coupons: [],
  gridCoupons: [],
  storeNum: "",
  cpnAmount: 0,
  productCode: "",
  productDescription: "",
  customerId: "",
  subDept: "",
  isFetching: false,
  filterModalOpen: false,
  filterType: "",
  amtLessThan: false,
  amtGreaterThan: false,
  noCouponsFound: false,
  couponMobileStage: 0,
  uniqueCpnDates: [],
  uniqueDateMobileFilter: "",
  uniqueSubDepts: [],
  subDeptMobileFilter: [],
  showSubsMobileFilter: false,
  receiptLines: [],
  gridFilters: noGridFilters,
  selectedKey: "",
  sortMetric: "amount",
  mobile: mobileStart,
  searched: null,
};

const couponSlice = createSlice({
  name: "coupon",
  initialState,
  reducers: {
    setCouponReceiptLines: (state, action: PayloadAction<TransactionListItem[]>) => {
      state.receiptLines = action.payload;
    },
    setCoupons: (state, action: PayloadAction<CouponItem[]>) => {
      state.coupons = action.payload;
      state.gridCoupons = action.payload;
    },
    setFilter: (
      state,
      action: PayloadAction<{ type: FilterType; value: string | number }>,
    ) => {
      const { type, value } = action.payload;
      switch (type) {
        case "Store":
          state.storeNum = value as string;
          break;
        case "CpnAmount":
          state.cpnAmount = value as number;
          break;
        case "UPC":
          state.productCode = value as string;
          break;
        case "Desc":
          state.productDescription = value as string;
          break;
        case "CustomerID":
          state.customerId = value as string;
          break;
        case "Sub Department":
          state.subDept = value as string;
          break;
      }
    },
    applyFilters: (state) => {
      const {
        storeNum,
        cpnAmount,
        productCode,
        productDescription,
        customerId,
        subDept,
      } = state;

      const passesThreshold = (amount: number) => {
        if (state.amtLessThan) {
          // checking for less than
          return amount < cpnAmount;
        } else if (state.amtGreaterThan) {
          // checking for greater than
          return amount > cpnAmount;
        } else {
          // checking for equal to
          return amount === cpnAmount;
        }
      };

      state.gridCoupons = state.coupons.filter((coupon) => {
        const matchesStore = storeNum ? coupon.store_number == storeNum : true;

        const matchesCpnAmount = cpnAmount
          ? passesThreshold(coupon.coupon_amount)
          : true;

        const matchesProductCode =
          coupon.product_code && productCode
            ? coupon.product_code.includes(productCode)
            : true;
        const matchesProductDescription = productDescription
          ? coupon.product_description
              .toLowerCase()
              .includes(productDescription.toLowerCase())
          : true;
        const matchesCustomerId = customerId
          ? coupon.customer_id.includes(customerId)
          : true;

        const matchesSubDept = subDept
          ? coupon.sub_department_description
              .toLowerCase()
              .includes(subDept.toLowerCase())
          : true;
        return (
          matchesStore &&
          matchesCpnAmount &&
          matchesProductCode &&
          matchesProductDescription &&
          matchesCustomerId &&
          matchesSubDept
        );
      });
    },
    resetFilters: (state) => {
      state.storeNum = "";
      state.cpnAmount = 0;
      state.productCode = "";
      state.productDescription = "";
      state.customerId = "";
      state.subDept = "";

      state.gridCoupons = state.coupons;
    },
    setCouponMobileStage: (state, action: PayloadAction<number>) => {
      state.couponMobileStage = action.payload;
    },
    setGridCoupons: (state, action: PayloadAction<CouponItem[]>) => {
      state.gridCoupons = action.payload;
    },
    setFilterModalOpen: (state, action: PayloadAction<boolean>) => {
      state.filterModalOpen = action.payload;
    },
    setFilterType: (state, action: PayloadAction<FilterType>) => {
      state.filterType = action.payload;
    },
    setIsFetching: (state, action: PayloadAction<boolean>) => {
      state.isFetching = action.payload;

      if (action.payload === true) {
        state.noCouponsFound = false;
        state.gridFilters = noGridFilters;
      }
    },
    setCouponGridFilter: (
      state,
      action: PayloadAction<Partial<CouponGridFilters>>,
    ) => {
      state.gridFilters = { ...state.gridFilters, ...action.payload };
    },
    setThresh: (state, action: PayloadAction<"less" | "greater" | "equal">) => {
      state.amtLessThan = action.payload === "less";
      state.amtGreaterThan = action.payload === "greater";
    },
    setNoCouponsFound: (state, action: PayloadAction<boolean>) => {
      state.noCouponsFound = action.payload;
    },
    resetCoupons: (state) => {
      state.coupons = [];
      state.gridCoupons = [];
      state.storeNum = "";
      state.cpnAmount = 0;
      state.productCode = "";
      state.productDescription = "";
      state.customerId = "";
      state.isFetching = false;
      state.filterType = "";
      state.amtLessThan = false;
      state.amtGreaterThan = false;
      state.noCouponsFound = false;
      state.couponMobileStage = 0;
      state.uniqueCpnDates = [];
      state.uniqueSubDepts = [];
    },
    setUniqueCpnDates: (state, action: PayloadAction<UniqueCpnDate[]>) => {
      const dates = [{label: "All Dates", value: ""}, ...action.payload]
      state.uniqueCpnDates = dates;
    },
    setUniqueSubDepts: (state, action: PayloadAction<string[]>) => {
      state.uniqueSubDepts = action.payload;
    },
    setSubDeptMobileFilter: (state, action: PayloadAction<string>) => {
      if (action.payload === "") {
        state.subDeptMobileFilter = [];
        return;
      }

      // Otherwise, we're passing in a sub department to toggle on/off
      const found = state.subDeptMobileFilter.find((s) => s === action.payload);

      if (found) {
        state.subDeptMobileFilter = state.subDeptMobileFilter.filter(
          (s) => s !== action.payload,
        );
      } else {
        state.subDeptMobileFilter.push(action.payload);
      }
    },
    setUniqueDateMobileFilter: (state, action: PayloadAction<string>) => {
      state.uniqueDateMobileFilter = action.payload;
    },
    setShowSubsMobileFilter: (state, action: PayloadAction<boolean>) => {
      state.showSubsMobileFilter = action.payload;
    },
    setCouponSelectedKey: (state, action: PayloadAction<string>) => {
      state.selectedKey = action.payload;
    },
    setCouponSortMetric: (state, action: PayloadAction<CouponSortMetric>) => {
      state.sortMetric = action.payload;
    },
    setCouponMobilePlace: (
      state,
      action: PayloadAction<Partial<CouponMobilePlace>>,
    ) => {
      state.mobile = { ...state.mobile, ...action.payload };
    },
    resetCouponMobilePlace: (state) => {
      state.mobile = mobileStart;
    },
    setCouponSearched: (state, action: PayloadAction<CouponSearchedScope>) => {
      state.searched = action.payload;
    },
    resetCouponsSlice: () => initialState,
  },
});

export const {
  setCouponReceiptLines,
  setCoupons,
  resetCoupons,
  setFilter,
  applyFilters,
  resetFilters,
  setIsFetching,
  setCouponGridFilter,
  setFilterModalOpen,
  setFilterType,
  setThresh,
  setNoCouponsFound,
  resetCouponsSlice,
  setCouponSelectedKey,
  setCouponSortMetric,
  setCouponMobilePlace,
  resetCouponMobilePlace,
  setCouponSearched,
  setCouponMobileStage,
  setUniqueCpnDates,
  setUniqueSubDepts,
  setSubDeptMobileFilter,
  setUniqueDateMobileFilter,
  setShowSubsMobileFilter,
  setGridCoupons,
} = couponSlice.actions;
export default couponSlice.reducer;
