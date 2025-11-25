import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  TopTenItem,
  DepartmentSale,
  CatSale,
  SelectedSalesPanel,
  WeeklySale,
  HourlySale,
  SubSale,
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
  subs: false,
  hourly: false,
  cats: false,
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
  salesPanels: WeeklySale[];
  selectedSalesPanel: SelectedSalesPanel;
  weeklySales: WeeklySale[];
  panelsLoading: boolean;
  salesPanelSearchText: string;
  salesPanelDateText: string;
  topTenItemsMetrics: TopTenItemsMetrics;
  windowVisible: WindowVisible;
  hourlySales: HourlySale[];
  subSales: SubSale[];
  catSales: CatSale[];
}

const initialState: SalesState = {
  topTenItems: [],
  departmentSales: [],
  salesPanels: [],
  selectedSalesPanel: { sale_date: "", storeid: 0, store_name: "" },
  weeklySales: [],
  panelsLoading: false,
  salesPanelSearchText: "",
  salesPanelDateText: "",
  topTenItemsMetrics: defaultTopTenMetrics,
  windowVisible: defaultWindowVisible,
  hourlySales: [],
  subSales: [],
  catSales: [],
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
    setSalesPanels: (state, action: PayloadAction<WeeklySale[]>) => {
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
    setSalesPanelDateText: (state, action: PayloadAction<string>) => {
      state.salesPanelDateText = action.payload;
    },
    setHourlySales: (state, action: PayloadAction<HourlySale[]>) => {
      state.hourlySales = action.payload;
    },
    setSubSales: (state, action: PayloadAction<SubSale[]>) => {
      state.subSales = action.payload;
    },
    setCatSales: (state, action: PayloadAction<CatSale[]>) => {
      state.catSales = action.payload;
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
  setSalesPanelDateText,
  setHourlySales,
  setSubSales,
  setCatSales,
  resetSalesSlice,
} = salesSlice.actions;
export default salesSlice.reducer;
