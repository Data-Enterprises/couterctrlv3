import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CouponItem } from "../interfaces";

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
  priorCoupons: CouponItem[];
  lyCoupons: CouponItem[];
  isComparisonFetching: boolean;
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
}

const initialState: CouponState = {
  coupons: [],
  priorCoupons: [],
  lyCoupons: [],
  isComparisonFetching: false,
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
};

const couponSlice = createSlice({
  name: "coupon",
  initialState,
  reducers: {
    setCoupons: (state, action: PayloadAction<CouponItem[]>) => {
      state.coupons = action.payload;
      state.gridCoupons = action.payload;
    },
    setPriorCoupons: (state, action: PayloadAction<CouponItem[]>) => {
      state.priorCoupons = action.payload;
    },
    setLyCoupons: (state, action: PayloadAction<CouponItem[]>) => {
      state.lyCoupons = action.payload;
    },
    setIsComparisonFetching: (state, action: PayloadAction<boolean>) => {
      state.isComparisonFetching = action.payload;
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
      }
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
      state.priorCoupons = [];
      state.lyCoupons = [];
      state.isComparisonFetching = false;
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
    resetCouponsSlice: () => initialState,
  },
});

export const {
  setCoupons,
  setPriorCoupons,
  setLyCoupons,
  setIsComparisonFetching,
  resetCoupons,
  setFilter,
  applyFilters,
  resetFilters,
  setIsFetching,
  setFilterModalOpen,
  setFilterType,
  setThresh,
  setNoCouponsFound,
  resetCouponsSlice,
  setCouponMobileStage,
  setUniqueCpnDates,
  setUniqueSubDepts,
  setSubDeptMobileFilter,
  setUniqueDateMobileFilter,
  setShowSubsMobileFilter,
  setGridCoupons,
} = couponSlice.actions;
export default couponSlice.reducer;
