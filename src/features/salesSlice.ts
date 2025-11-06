import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { TopTenItem, DepartmentSale, SalesTwoDates } from "../interfaces";

interface SalesState {
  topTenItems: TopTenItem[];
  departmentSales: DepartmentSale[];
  salesPanels: SalesTwoDates[];
}

const initialState: SalesState = {
  topTenItems: [],
  departmentSales: [],
  salesPanels: [],
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
    setSalesPanels: (state, action: PayloadAction<SalesTwoDates[]>) => {
      state.salesPanels = action.payload;
    },
  },
});

export const { setTopTenItems, setDepartmentSales, setSalesPanels } =
  salesSlice.actions;
export default salesSlice.reducer;
