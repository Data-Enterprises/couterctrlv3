import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  TopTenItem,
  DepartmentSale,
  SalesTwoDates,
  SelectedSalesPanel,
  WeeklySale,
} from "../interfaces";

type TopTenItemsMetrics = {
  totalSales: number;
  avgSales: number;
  totalQty: number;
  avgQty: number;
};

export type WindowVisible = {
  subs: boolean;
  hourly: boolean;
  cats: boolean;
};
const defaultWindowVisible: WindowVisible = {
  subs: true,
  hourly: true,
  cats: true,
};

const defaultTopTenMetrics: TopTenItemsMetrics = {
  totalSales: 0,
  avgSales: 0,
  totalQty: 0,
  avgQty: 0,
};

interface SalesState {
  topTenItems: TopTenItem[];
  departmentSales: DepartmentSale[];
  salesPanels: SalesTwoDates[];
  selectedSalesPanel: SelectedSalesPanel;
  weeklySales?: WeeklySale[];
  panelsLoading: boolean;
  salesPanelSearchText: string;
  topTenItemsMetrics: TopTenItemsMetrics;
  windowVisible: WindowVisible;
}

const initialState: SalesState = {
  topTenItems: [],
  departmentSales: [],
  salesPanels: [],
  selectedSalesPanel: { sale_date: "", storeid: 0, store_name: "" },
  weeklySales: [],
  panelsLoading: false,
  salesPanelSearchText: "",
  topTenItemsMetrics: defaultTopTenMetrics,
  windowVisible: defaultWindowVisible,
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
    setTopTenItemsMetrics: (
      state,
      action: PayloadAction<TopTenItemsMetrics>
    ) => {
      state.topTenItemsMetrics = action.payload;
    },
    setWindowVisible: (
      state,
      action: PayloadAction<{ key: keyof WindowVisible; show: boolean }>
    ) => {
      state.windowVisible = {
        ...state.windowVisible,
        [action.payload.key]: action.payload.show,
      };
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
  setTopTenItemsMetrics,
  setWindowVisible,
  resetSalesSlice,
} = salesSlice.actions;
export default salesSlice.reducer;
