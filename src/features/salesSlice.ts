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
  weeklySales: WeeklySale[];
  panelsLoading: boolean;
  windowVisible: WindowVisible;
  hourlySales: HourlySale[];
  subSales: SubSale[];
  subSalesWk1: SubSale[];
  subSalesWk2: SubSale[];
  subSalesWk3: SubSale[];
  subSalesWk4: SubSale[];
  queryChecker: QueryChecker;
  selectedItem: string;
  topSubDept: TopSub | null;
  selectedSubDept: TopSub | null;
  compareSubsModalOpen: boolean;
  leftSubCompare: WeeklySale | null;
  rightSubCompare: WeeklySale | null;
  compareSubsLeftCompare: SubSale[];
  compareSubsRightCompare: SubSale[];
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
  weeklySales: [],
  panelsLoading: false,
  windowVisible: defaultWindowVisible,
  hourlySales: [],
  subSales: [],
  subSalesWk1: [],
  subSalesWk2: [],
  subSalesWk3: [],
  subSalesWk4: [],
  queryChecker: {
    topTen: false,
    hourly: false,
    subs: false,
    weekly: false,
  },
  selectedItem: "",
  topSubDept: null,
  selectedSubDept: {} as SubSale,
  compareSubsModalOpen: false,
  leftSubCompare: null,
  rightSubCompare: null,
  compareSubsLeftCompare: [],
  compareSubsRightCompare: [],
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
    setCompareSubsModalOpen: (state, action: PayloadAction<boolean>) => {
      state.compareSubsModalOpen = action.payload;
    },
    setLeftSubCompare: (state, action: PayloadAction<WeeklySale | null>) => {
      state.leftSubCompare = action.payload;
    },
    setRightSubCompare: (state, action: PayloadAction<WeeklySale | null>) => {
      state.rightSubCompare = action.payload;
    },
    setCompareSubsLeftCompareData: (state, action: PayloadAction<SubSale[]>) => {
      state.compareSubsLeftCompare = action.payload;
    },
    setCompareSubsRightCompareData: (state, action: PayloadAction<SubSale[]>) => {
      state.compareSubsRightCompare = action.payload;
    },
    resetCompareSubs: (state) => {
      state.leftSubCompare = null;
      state.rightSubCompare = null;
      state.compareSubsLeftCompare = [];
      state.compareSubsRightCompare = [];
      state.compareSubsModalOpen = false;
    },
    resetSalesSlice: () => initialState,
  },
});

export const {
  setTopTenItems,
  setSalesPanels,
  setSelectedSalesPanel,
  setWeeklySales,
  setPanelsLoading,
  setHourlySales,
  setSubSales,
  finishQuery,
  setSelectedItem,
  setPeriodSubSales,
  setSelectedSubDept,
  setTopSubDept,
  reQuery,
  setCompareSubsLeftCompareData,
  setCompareSubsRightCompareData,
  setLeftSubCompare,
  setCompareSubsModalOpen,
  setRightSubCompare,
  resetCompareSubs,
  resetSalesSlice,
} = salesSlice.actions;
export default salesSlice.reducer;
