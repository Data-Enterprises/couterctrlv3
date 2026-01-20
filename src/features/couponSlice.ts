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
};

const couponSlice = createSlice({
  name: "coupon",
  initialState,
  reducers: {
    setCoupons: (state, action: PayloadAction<CouponItem[]>) => {
      state.coupons = action.payload;
      state.gridCoupons = action.payload;
    },
    setFilter: (
      state,
      action: PayloadAction<{ type: FilterType; value: string | number }>
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
    },
  },
});

export const {
  setCoupons,
  resetCoupons,
  setFilter,
  applyFilters,
  resetFilters,
  setIsFetching,
  setFilterModalOpen,
  setFilterType,
  setThresh,
  setNoCouponsFound,
} = couponSlice.actions;
export default couponSlice.reducer;
