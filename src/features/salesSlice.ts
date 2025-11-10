import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  TopTenItem,
  DepartmentSale,
  SalesTwoDates,
  SelectedSalesPanel,
  WeeklySale,
} from "../interfaces";

interface SalesState {
  topTenItems: TopTenItem[];
  departmentSales: DepartmentSale[];
  salesPanels: SalesTwoDates[];
  selectedSalesPanel: SelectedSalesPanel;
  weeklySales?: WeeklySale[];
  panelsLoading: boolean;
  salesPanelSearchText: string;
}

const initialState: SalesState = {
  topTenItems: [],
  departmentSales: [],
  salesPanels: [],
  selectedSalesPanel: { sale_date: "", storeid: 0 },
  weeklySales: [],
  panelsLoading: false,
  salesPanelSearchText: "",
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
    setSelectedSalesPanel: (
      state,
      action: PayloadAction<SelectedSalesPanel>
    ) => {
      state.selectedSalesPanel = action.payload;
    },
    setWeeklySales: (state, action: PayloadAction<WeeklySale[]>) => {
      state.weeklySales = action.payload;
    },
    setPanelsLoading: (state, action: PayloadAction<boolean>) => {
      state.panelsLoading = action.payload;
    },
    setSalesPanelSearchText: (state, action: PayloadAction<string>) => {
      state.salesPanelSearchText = action.payload;
    },
    resetSalesSlice: () => initialState,
  },
});

export const {
  setTopTenItems,
  setDepartmentSales,
  setSalesPanels,
  setSelectedSalesPanel,
  setWeeklySales,
  setPanelsLoading,
  setSalesPanelSearchText,
  resetSalesSlice,
} = salesSlice.actions;
export default salesSlice.reducer;
