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

type QueryChecker = {
  topTen: boolean;
  hourly: boolean;
  subs: boolean;
  weekly: boolean;
}

interface SalesState {
  topTenItems: TopTenItem[];
  departmentSales: DepartmentSale[];
  salesPanels: WeeklySale[];
  selectedSalesPanel: SelectedSalesPanel;
  compareSalesPanel: SelectedSalesPanel;
  weeklySales: WeeklySale[];
  panelsLoading: boolean;
  salesPanelSearchText: string;
  topTenItemsMetrics: TopTenItemsMetrics;
  windowVisible: WindowVisible;
  hourlySales: HourlySale[];
  subSales: SubSale[];
  compareSubs: SubSale[];
  catSales: CatSale[];
  queryChecker: QueryChecker;
}

export const defaultSelectedPanel: SelectedSalesPanel = {
  sale_date: "",
  storeid: 0,
  store_name: "",
};

const initialState: SalesState = {
  topTenItems: [],
  departmentSales: [],
  salesPanels: [],
  selectedSalesPanel: defaultSelectedPanel,
  compareSalesPanel: defaultSelectedPanel,
  weeklySales: [],
  panelsLoading: false,
  salesPanelSearchText: "",
  topTenItemsMetrics: defaultTopTenMetrics,
  windowVisible: defaultWindowVisible,
  hourlySales: [],
  subSales: [],
  compareSubs: [],
  catSales: [],
  queryChecker: {
    topTen: false,
    hourly: false,
    subs: false,
    weekly: false,
  },
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
      action: PayloadAction<SelectedSalesPanel>,
    ) => {
      state.selectedSalesPanel = action.payload;
    },
    setCompareSalesPanel: (
      state,
      action: PayloadAction<SelectedSalesPanel>,
    ) => {
      state.compareSalesPanel = action.payload;
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
      action: PayloadAction<TopTenItemsMetrics>,
    ) => {
      state.topTenItemsMetrics = action.payload;
    },
    setWindowVisible: (
      state,
      action: PayloadAction<{ key: keyof WindowVisible; show: boolean }>,
    ) => {
      state.windowVisible = {
        ...state.windowVisible,
        [action.payload.key]: action.payload.show,
      };
    },
    setHourlySales: (state, action: PayloadAction<HourlySale[]>) => {
      state.hourlySales = action.payload;
    },
    setSubSales: (state, action: PayloadAction<SubSale[]>) => {
      state.subSales = action.payload;
    },
    setCompareSubs: (state, action: PayloadAction<SubSale[]>) => {
      state.compareSubs = action.payload;
    },
    setCatSales: (state, action: PayloadAction<CatSale[]>) => {
      state.catSales = action.payload;
    },
    finishQuery: (state, action: PayloadAction<string>) => {
      if (action.payload === "top ten") {
        state.queryChecker.topTen = true;
      } else if (action.payload === "hourly") {
        state.queryChecker.hourly = true;
      } else if (action.payload === "subs") {
        state.queryChecker.subs = true;
      } else if (action.payload === "weekly") {
        state.queryChecker.weekly = true;
      }
    },
    reQuery: (state) => {
      state.weeklySales = [];
      state.hourlySales = [];
      state.subSales = [];
      state.compareSubs = [];
      state.catSales = [];
      state.topTenItems = [];
      state.queryChecker = {
        topTen: false,
        hourly: false,
        subs: false,
        weekly: false,
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
  setCompareSalesPanel,
  setWeeklySales,
  setPanelsLoading,
  setSalesPanelSearchText,
  setTopTenItemsMetrics,
  setWindowVisible,
  setHourlySales,
  setSubSales,
  setCompareSubs,
  setCatSales,
  finishQuery,
  reQuery,
  resetSalesSlice,
} = salesSlice.actions;
export default salesSlice.reducer;
