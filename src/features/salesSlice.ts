import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { TopTenItem, DepartmentSale, SalesTwoDates } from "../interfaces";

interface SalesState {
  topTenItems: TopTenItem[];
  departmentSales: DepartmentSale[];
  salesTwoDates: SalesTwoDates[];
}

const initialState: SalesState = {
  topTenItems: [],
  departmentSales: [],
  salesTwoDates: [],
};

export const salesSlice = createSlice({
  name: "sales",
  initialState,
  reducers: {
    setTopTenItems: (state, action: PayloadAction<TopTenItem[]>) => {
      state.topTenItems = action.payload;
    },
    setDepartmentSales: (state, action: PayloadAction<DepartmentSale[]>) => {
      state.departmentSales = action.payload;
    },
    setSalesTwoDates: (state, action: PayloadAction<SalesTwoDates[]>) => {
      state.salesTwoDates = action.payload;
    },
  },
});

export const { setTopTenItems, setDepartmentSales, setSalesTwoDates } =
  salesSlice.actions;
export default salesSlice.reducer;
