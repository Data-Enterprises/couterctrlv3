import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  TopTenItem,
  SelectedSalesPanel,
  WeeklySale,
  HourlySale,
  SubSale,
} from "../interfaces";
import type { TopSub } from "../pages/sales/components";

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

type QueryChecker = {
  topTen: boolean;
  hourly: boolean;
  subs: boolean;
  weekly: boolean;
};

interface SalesState {
  topTenItems: TopTenItem[];
  salesPanels: WeeklySale[];
  selectedSalesPanel: SelectedSalesPanel;
  compareSalesPanel: SelectedSalesPanel;
  weeklySales: WeeklySale[];
  panelsLoading: boolean;
  windowVisible: WindowVisible;
  hourlySales: HourlySale[];
  subSales: SubSale[];
  subSalesWk1: SubSale[];
  subSalesWk2: SubSale[];
  subSalesWk3: SubSale[];
  subSalesWk4: SubSale[];
  compareSubs: SubSale[];
  queryChecker: QueryChecker;
  selectedItem: string;
  topSubDept: TopSub | null;
  selectedSubDept: TopSub | null;
}

export const defaultSelectedPanel: SelectedSalesPanel = {
  sale_date: "",
  storeid: 0,
  store_name: "",
};

const initialState: SalesState = {
  topTenItems: [],
  salesPanels: [],
  selectedSalesPanel: defaultSelectedPanel,
  compareSalesPanel: defaultSelectedPanel,
  weeklySales: [],
  panelsLoading: false,
  windowVisible: defaultWindowVisible,
  hourlySales: [],
  subSales: [],
  subSalesWk1: [],
  subSalesWk2: [],
  subSalesWk3: [],
  subSalesWk4: [],
  compareSubs: [],
  queryChecker: {
    topTen: false,
    hourly: false,
    subs: false,
    weekly: false,
  },
  selectedItem: "",
  topSubDept: null,
  selectedSubDept: {} as SubSale,
};

export const salesSlice = createSlice({
  name: "sales",
  initialState,
  reducers: {
    setTopTenItems: (state, action: PayloadAction<TopTenItem[]>) => {
      state.topTenItems = action.payload;
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
    setHourlySales: (state, action: PayloadAction<HourlySale[]>) => {
      state.hourlySales = action.payload;
    },
    setSubSales: (state, action: PayloadAction<SubSale[]>) => {
      state.subSales = action.payload;
    },
    setCompareSubs: (state, action: PayloadAction<SubSale[]>) => {
      state.compareSubs = action.payload;
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
    setSelectedItem: (state, action: PayloadAction<string>) => {
      state.selectedItem = action.payload;
    },
    setPeriodSubSales: (
      state,
      action: PayloadAction<{ subs: SubSale[]; period: number }>,
    ) => {
      const { subs, period } = action.payload;
      if (period === 1) {
        state.subSalesWk1 = subs;
      }
      if (period === 2) {
        state.subSalesWk2 = subs;
      } else if (period === 3) {
        state.subSalesWk3 = subs;
      } else if (period === 4) {
        state.subSalesWk4 = subs;
      }
    },
    setSelectedSubDept: (state, action: PayloadAction<TopSub | null>) => {
      state.selectedSubDept = action.payload;
    },
    setTopSubDept: (state, action: PayloadAction<TopSub>) => {
      state.topSubDept = action.payload;
    },
    reQuery: (state) => {
      state.selectedSubDept = null;
      state.topSubDept = null;
      state.selectedItem = "";
      state.weeklySales = [];
      state.hourlySales = [];
      state.subSales = [];
      state.compareSubs = [];
      state.subSalesWk2 = [];
      state.subSalesWk3 = [];
      state.subSalesWk4 = [];
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
  setSalesPanels,
  setSelectedSalesPanel,
  setCompareSalesPanel,
  setWeeklySales,
  setPanelsLoading,
  setHourlySales,
  setSubSales,
  setCompareSubs,
  finishQuery,
  setSelectedItem,
  setPeriodSubSales,
  setSelectedSubDept,
  setTopSubDept,
  reQuery,
  resetSalesSlice,
} = salesSlice.actions;
export default salesSlice.reducer;
