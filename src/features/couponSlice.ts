import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CouponItem } from "../interfaces";

interface CouponState {
  coupons: CouponItem[];
}

const initialState: CouponState = {
  coupons: [],
};

const couponSlice = createSlice({
  name: "coupon",
  initialState,
  reducers: {
    setCoupons: (state, action: PayloadAction<CouponItem[]>) => {
      state.coupons = action.payload;
    },
    resetCoupons: (state) => {
      state.coupons = [];
    },
  },
});

export const { setCoupons, resetCoupons } = couponSlice.actions;
export default couponSlice.reducer;
