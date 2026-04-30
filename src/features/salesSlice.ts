import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  TopTenItem,
  SelectedSalesPanel,
  WeeklySale,
  HourlySale,
  SubSale,
} from "../interfaces";
import type { TopSub } from "../pages/sales/components";

export type SubTracker = {
  id: number;
  desc: string;
}
export type TrackerKpis = {
  tyTotalSales: number;
  lyTotalSales: number;
  percentChange: number;
  dollarChange: number;
  dateRange: string;
}

export type WeekTotal = {
  sale_date: string;
  storeid: number;
  storeName: string;
  subDept: number;
  subDesc: string;
  salesTY: number;
  salesLY: number;
  totalSalesDollarChange: number;
  totalSalesPercentChange: number;
  atsTotalSales: number;
  transaction_count: number;
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

type QueryChecker = {
  topTen: boolean;
  hourly: boolean;
  subs: boolean;
  weekly: boolean;
};

export type DashboardOption = "daily" | "weekly" | "tracker";

interface SalesState {
  topTenItems: TopTenItem[];
  salesPanels: WeeklySale[];
  selectedSalesPanel: SelectedSalesPanel;
  weeklySales: WeeklySale[];
  weeklySalesLastYear: WeeklySale[];
  panelsLoading: boolean;
  windowVisible: WindowVisible;
  hourlySales: HourlySale[];
  hourlySalesLastYear: HourlySale[];
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
  mainView: "overview" | "tracker";
  weeksBack: string;
  
  loadingTYTrackerData: boolean;
  loadingLYTrackerData: boolean;
  thisYrSubTracker: SubSale[];
  lastYrSubTracker: SubSale[];
  tyWeekCards: SubSale[];
  lyWeekCards: SubSale[];
  tyCollapsedSubSales: SubSale[][];
  lyCollapsedSubSales: SubSale[][];
  tyReducedTotals: WeekTotal[][][];
  uniqueSubs: SubTracker[];
  trackerKpis: TrackerKpis;
  refreshOverviewData: boolean;
  dashboardOption: DashboardOption;
  salesTrackerSelectedSubDept: number;
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
  weeklySalesLastYear: [],
  panelsLoading: false,
  windowVisible: defaultWindowVisible,
  hourlySales: [],
  hourlySalesLastYear: [],
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
  mainView: "overview",
  weeksBack: "1",
  loadingTYTrackerData: false,
  loadingLYTrackerData: false,
  thisYrSubTracker: [],
  lastYrSubTracker: [],
  tyWeekCards: [],
  lyWeekCards: [],
  tyCollapsedSubSales: [],
  lyCollapsedSubSales: [],
  tyReducedTotals: [],
  uniqueSubs: [],
  trackerKpis: {
    tyTotalSales: 0,
    lyTotalSales: 0,
    percentChange: 0,
    dollarChange: 0,
    dateRange: "",
  },
  refreshOverviewData: false,
  dashboardOption: "daily",
  salesTrackerSelectedSubDept: 0,
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
    setWeeklySalesLastYear: (state, action: PayloadAction<WeeklySale[]>) => {
      state.weeklySalesLastYear = action.payload;
    },
    setPanelsLoading: (state, action: PayloadAction<boolean>) => {
      state.panelsLoading = action.payload;
    },
    setHourlySales: (state, action: PayloadAction<HourlySale[]>) => {
      state.hourlySales = action.payload;
    },
    setHourlySalesLastYear: (state, action: PayloadAction<HourlySale[]>) => {
      state.hourlySalesLastYear = action.payload;
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
      state.weeklySalesLastYear = [];
      state.hourlySales = [];
      state.hourlySalesLastYear = [];
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
    setCompareSubsLeftCompareData: (
      state,
      action: PayloadAction<SubSale[]>,
    ) => {
      state.compareSubsLeftCompare = action.payload;
    },
    setCompareSubsRightCompareData: (
      state,
      action: PayloadAction<SubSale[]>,
    ) => {
      state.compareSubsRightCompare = action.payload;
    },
    setMainView: (state, action: PayloadAction<"overview" | "tracker">) => {
      state.mainView = action.payload;
    },
    setWeeksBack: (state, action: PayloadAction<string>) => {
      state.weeksBack = action.payload;
    },
    concatTYSubTracker: (state, action: PayloadAction<SubSale[]>) => {
      state.thisYrSubTracker = state.thisYrSubTracker.concat(action.payload);
    },
    concatLYSubTracker: (state, action: PayloadAction<SubSale[]>) => {
      state.lastYrSubTracker = state.lastYrSubTracker.concat(action.payload);
    },
    clearTYSubTracker: (state) => {
      state.thisYrSubTracker = [];
      state.tyWeekCards = [];
      state.tyCollapsedSubSales = [];
      state.tyReducedTotals = [];
      state.uniqueSubs = [];
      state.trackerKpis = {
        tyTotalSales: 0,
        lyTotalSales: 0,
        percentChange: 0,
        dollarChange: 0,
        dateRange: "",
      };
      state.salesTrackerSelectedSubDept = 0;
    },
    clearLYSubTracker: (state) => {
      state.lastYrSubTracker = [];
      state.lyWeekCards = [];
      state.lyCollapsedSubSales = [];
    },
    setLoadingTYTrackerData: (state, action: PayloadAction<boolean>) => {
      state.loadingTYTrackerData = action.payload;
    },
    setLoadingLYTrackerData: (state, action: PayloadAction<boolean>) => {
      state.loadingLYTrackerData = action.payload;
    },
    resetCompareSubs: (state) => {
      state.leftSubCompare = null;
      state.rightSubCompare = null;
      state.compareSubsLeftCompare = [];
      state.compareSubsRightCompare = [];
      state.compareSubsModalOpen = false;
    },
    setTyWeekCards: (state, action: PayloadAction<SubSale[]>) => {
      state.tyWeekCards = action.payload;
    },
    setLyWeekCards: (state, action: PayloadAction<SubSale[]>) => {
      state.lyWeekCards = action.payload;
    },
    setTyCollapsedSubSales: (state, action: PayloadAction<SubSale[][]>) => {
      state.tyCollapsedSubSales = action.payload;
    },
    setTyReducedTotals: (state, action: PayloadAction<WeekTotal[][][]>) => {
      state.tyReducedTotals = action.payload;
    },
    setLyCollapsedSubSales: (state, action: PayloadAction<SubSale[][]>) => {
      state.lyCollapsedSubSales = action.payload;
    },
    setUniqueSubs: (state, action: PayloadAction<SubTracker[]>) => {
      state.uniqueSubs = action.payload;
    },
    setTrackerKpis: (state, action: PayloadAction<TrackerKpis>) => {
      state.trackerKpis = action.payload;
    },
    setRefreshOverviewData: (state, action: PayloadAction<boolean>) => {
      state.refreshOverviewData = action.payload;
    },
    setDashboardOption: (state, action: PayloadAction<DashboardOption>) => {
      state.dashboardOption = action.payload;
    },
    setSalesTrackerSelectedSubDept: (state, action: PayloadAction<number>) => {
      state.salesTrackerSelectedSubDept = action.payload;
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
  setWeeklySalesLastYear,
  setHourlySalesLastYear,
  setMainView,
  setWeeksBack,
  concatTYSubTracker,
  concatLYSubTracker,
  setLoadingTYTrackerData,
  setLoadingLYTrackerData,
  clearLYSubTracker,
  clearTYSubTracker,
  setLyCollapsedSubSales,
  setLyWeekCards,
  setTyCollapsedSubSales,
  setTyWeekCards,
  setTyReducedTotals,
  setUniqueSubs,
  setTrackerKpis,
  setRefreshOverviewData,
  setDashboardOption,
  setSalesTrackerSelectedSubDept,
} = salesSlice.actions;
export default salesSlice.reducer;
