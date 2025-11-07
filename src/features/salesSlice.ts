import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { TopTenItem, DepartmentSale, SalesTwoDates } from "../interfaces";

interface SalesState {
  topTenItems: TopTenItem[];
  departmentSales: DepartmentSale[];
  salesPanels: SalesTwoDates[];
  refreshData: boolean;
}

const initialState: SalesState = {
  topTenItems: [],
  departmentSales: [],
  salesPanels: [],
  refreshData: false,
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
    setRefreshData: (state, action: PayloadAction<boolean>) => {
      state.refreshData = action.payload;
    },
  },
});

export const { setTopTenItems, setDepartmentSales, setSalesPanels, setRefreshData } =
  salesSlice.actions;
export default salesSlice.reducer;
