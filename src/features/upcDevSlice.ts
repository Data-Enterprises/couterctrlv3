import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  UpcItem,
  UpcSalesComp,
  UpcForecastData,
  UpcInfo,
  ForecastExport,
  ForecastMetrics,
  UpcPriceOpt,
  UpcTrend,
} from "../interfaces";

export type UpcDevTab = "salesComp" | "forecast" | "priceOpt" | "trend" | "association";

// Forecast excluded — still inert, not a selectable landing tab.
export const UPC_DEV_TABS: { id: UpcDevTab; label: string }[] = [
  { id: "salesComp", label: "Sales Comp" },
  { id: "priceOpt", label: "Price Opt" },
  { id: "trend", label: "Trend" },
  { id: "association", label: "Association" },
];

export type UpcDevDisplayMode = "code" | "desc";
export type UpcDevShowMode = "all" | "selected";
export type UpcDevTrendMode = "Totals" | "Mean" | "Volatility";

export type ItemAssociate = {
  product_code: string;
  product_description: string;
  qty: number;
};

// Price Opt — current price/cost derived from the most recent Item Lookup
// history row for a UPC at one specific store. Keyed by `${storeid}:${product_code}`.
export type UpcCurrentPriceCost = {
  product_code: string;
  currentPrice: number | null;
  currentCost: number | null;
};

interface UpcDevState {
  upcs: string[];
  upcText: string;
  storeids: string;
  trendPeriods: number;
  activeTab: UpcDevTab;
  dataLoaded: boolean;
  isLoading: boolean;
  upcCount: number;
  upcItems: UpcItem[];
  selectedUpcs: string[];
  filterText: string;
  displayMode: UpcDevDisplayMode;
  showMode: UpcDevShowMode;
  // Sales Comp
  salesCompLoaded: boolean;
  salesComp: UpcSalesComp[];
  salesCompLY: UpcSalesComp[];
  // Forecast
  forecastLoaded: boolean;
  forecastLoading: boolean;
  forecastQtyData: UpcForecastData[];
  upcList: UpcInfo[];
  forecastExport: ForecastExport[];
  forecastMetricExport: ForecastMetrics[];
  // Price Opt
  priceOptLoaded: boolean;
  priceOptLoading: boolean;
  optBestPrices: UpcPriceOpt[];
  optBestPricesByUpc: UpcPriceOpt[];
  // Group search only — store picked to unlock current price/cost. Store
  // search always has a single store already, no picker needed.
  priceOptStoreId: number | null;
  // Session-scoped cache, keyed `${storeid}:${product_code}` — never
  // cleared on re-search, only refetched when a key is missing.
  currentPriceCost: Record<string, UpcCurrentPriceCost>;
  // Trend
  trendLoaded: boolean;
  trendLoading: boolean;
  trendMode: UpcDevTrendMode;
  upcTrends: UpcTrend[];
  topFiveTrends: UpcTrend[];
  bottomFiveTrends: UpcTrend[];
  // Association
  associationLoaded: boolean;
  associationLoading: boolean;
  itemAssociations: ItemAssociate[][];
  selectedAssociationUpcParam: string[];
  reQueryAssociations: boolean;
  singleItemAssociations: ItemAssociate[];
}

const initialState: UpcDevState = {
  upcs: [],
  upcText: "",
  storeids: "",
  trendPeriods: 90,
  activeTab: "salesComp",
  dataLoaded: false,
  isLoading: false,
  upcCount: 0,
  upcItems: [],
  selectedUpcs: [],
  filterText: "",
  displayMode: "code",
  showMode: "all",
  // Sales Comp
  salesCompLoaded: false,
  salesComp: [],
  salesCompLY: [],
  // Forecast
  forecastLoaded: false,
  forecastLoading: false,
  forecastQtyData: [],
  upcList: [],
  forecastExport: [],
  forecastMetricExport: [],
  // Price Opt
  priceOptLoaded: false,
  priceOptLoading: false,
  optBestPrices: [],
  optBestPricesByUpc: [],
  priceOptStoreId: null,
  currentPriceCost: {},
  // Trend
  trendLoaded: false,
  trendLoading: false,
  trendMode: "Totals",
  upcTrends: [],
  topFiveTrends: [],
  bottomFiveTrends: [],
  // Association
  associationLoaded: false,
  associationLoading: false,
  itemAssociations: [],
  selectedAssociationUpcParam: [],
  reQueryAssociations: false,
  singleItemAssociations: [],
};

const upcDevSlice = createSlice({
  name: "upcDev",
  initialState,
  reducers: {
    setDevUpcs(state, action: PayloadAction<string[]>) {
      state.upcs = [...new Set([...state.upcs, ...action.payload])];
    },
    setDevUpcText(state, action: PayloadAction<string>) {
      state.upcText = action.payload;
    },
    removeDevUpc(state, action: PayloadAction<string>) {
      state.upcs = state.upcs.filter((u) => u !== action.payload);
    },
    clearDevUpcs(state) {
      state.upcs = [];
      state.upcText = "";
    },
    setDevStoreids(state, action: PayloadAction<string>) {
      state.storeids = action.payload;
    },
    setDevTrendPeriods(state, action: PayloadAction<number>) {
      state.trendPeriods = action.payload;
    },
    setDevActiveTab(state, action: PayloadAction<UpcDevTab>) {
      state.activeTab = action.payload;
    },
    setDevDataLoaded(state, action: PayloadAction<boolean>) {
      state.dataLoaded = action.payload;
    },
    setDevIsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setDevUpcCount(state, action: PayloadAction<number>) {
      state.upcCount = action.payload;
    },
    setDevUpcItems(state, action: PayloadAction<UpcItem[]>) {
      const existing = new Map(state.upcItems.map((i) => [i.product_code, i]));
      for (const item of action.payload) {
        existing.set(item.product_code, item);
      }
      state.upcItems = Array.from(existing.values());
    },
    toggleDevSelectedUpc(state, action: PayloadAction<string>) {
      const pc = action.payload;
      if (state.selectedUpcs.includes(pc)) {
        state.selectedUpcs = state.selectedUpcs.filter((u) => u !== pc);
      } else {
        state.selectedUpcs = [...state.selectedUpcs, pc];
      }
    },
    setDevAllSelectedUpcs(state, action: PayloadAction<string[]>) {
      state.selectedUpcs = action.payload;
    },
    resetDevSelectedUpcs(state) {
      state.selectedUpcs = [];
    },
    setDevFilterText(state, action: PayloadAction<string>) {
      state.filterText = action.payload;
    },
    setDevDisplayMode(state, action: PayloadAction<UpcDevDisplayMode>) {
      state.displayMode = action.payload;
    },
    setDevShowMode(state, action: PayloadAction<UpcDevShowMode>) {
      state.showMode = action.payload;
    },
    // Sales Comp
    setDevSalesCompLoaded(state, action: PayloadAction<boolean>) {
      state.salesCompLoaded = action.payload;
    },
    setDevSalesComp(state, action: PayloadAction<UpcSalesComp[]>) {
      state.salesComp = action.payload;
    },
    setDevSalesCompLY(state, action: PayloadAction<UpcSalesComp[]>) {
      state.salesCompLY = action.payload;
    },
    // Forecast
    setDevForecastLoaded(state, action: PayloadAction<boolean>) {
      state.forecastLoaded = action.payload;
    },
    setDevForecastLoading(state, action: PayloadAction<boolean>) {
      state.forecastLoading = action.payload;
    },
    setDevForecastQtyData(state, action: PayloadAction<UpcForecastData[]>) {
      state.forecastQtyData = action.payload;
    },
    setDevUpcList(state, action: PayloadAction<UpcInfo[]>) {
      state.upcList = action.payload;
    },
    setDevForecastExport(state, action: PayloadAction<ForecastExport[]>) {
      state.forecastExport = action.payload;
    },
    setDevForecastMetricExport(state, action: PayloadAction<ForecastMetrics[]>) {
      state.forecastMetricExport = action.payload;
    },
    // Price Opt
    setDevPriceOptLoaded(state, action: PayloadAction<boolean>) {
      state.priceOptLoaded = action.payload;
    },
    setDevPriceOptLoading(state, action: PayloadAction<boolean>) {
      state.priceOptLoading = action.payload;
    },
    setDevOptBestPrices(state, action: PayloadAction<UpcPriceOpt[]>) {
      state.optBestPrices = action.payload;
    },
    setDevOptBestPricesByUpc(state, action: PayloadAction<UpcPriceOpt[]>) {
      state.optBestPricesByUpc = action.payload;
    },
    setDevPriceOptStoreId(state, action: PayloadAction<number | null>) {
      state.priceOptStoreId = action.payload;
    },
    setDevCurrentPriceCost(state, action: PayloadAction<{ key: string; data: UpcCurrentPriceCost }>) {
      state.currentPriceCost[action.payload.key] = action.payload.data;
    },
    // Trend
    setDevTrendLoaded(state, action: PayloadAction<boolean>) {
      state.trendLoaded = action.payload;
    },
    setDevTrendLoading(state, action: PayloadAction<boolean>) {
      state.trendLoading = action.payload;
    },
    setDevTrendMode(state, action: PayloadAction<UpcDevTrendMode>) {
      state.trendMode = action.payload;
    },
    setDevUpcTrends(state, action: PayloadAction<UpcTrend[]>) {
      state.upcTrends = action.payload;
    },
    setDevTopFiveTrends(state, action: PayloadAction<UpcTrend[]>) {
      state.topFiveTrends = action.payload;
    },
    setDevBottomFiveTrends(state, action: PayloadAction<UpcTrend[]>) {
      state.bottomFiveTrends = action.payload;
    },
    // Association
    setDevAssociationLoaded(state, action: PayloadAction<boolean>) {
      state.associationLoaded = action.payload;
    },
    setDevAssociationLoading(state, action: PayloadAction<boolean>) {
      state.associationLoading = action.payload;
    },
    setDevItemAssociations(state, action: PayloadAction<ItemAssociate[][]>) {
      state.itemAssociations = action.payload;
    },
    addDevAssociationLevel(state, action: PayloadAction<ItemAssociate[]>) {
      state.itemAssociations = [...state.itemAssociations, action.payload];
    },
    truncateDevAssociationLevels(state, action: PayloadAction<number>) {
      state.itemAssociations = state.itemAssociations.slice(0, action.payload);
    },
    addDevAssocUpcParam(state, action: PayloadAction<string>) {
      if (!state.selectedAssociationUpcParam.includes(action.payload)) {
        state.selectedAssociationUpcParam = [...state.selectedAssociationUpcParam, action.payload];
      }
    },
    removeDevAssocUpcParam(state, action: PayloadAction<string>) {
      state.selectedAssociationUpcParam = state.selectedAssociationUpcParam.filter(
        (u) => u !== action.payload,
      );
    },
    setDevReQueryAssociations(state, action: PayloadAction<boolean>) {
      state.reQueryAssociations = action.payload;
    },
    setDevSingleItemAssociations(state, action: PayloadAction<ItemAssociate[]>) {
      state.singleItemAssociations = action.payload;
    },
    resetDevAssociations(state) {
      state.itemAssociations = [];
      state.selectedAssociationUpcParam = [];
      state.singleItemAssociations = [];
      state.reQueryAssociations = false;
      state.associationLoaded = false;
    },
    clearDevUpcData(state) {
      state.dataLoaded = false;
      state.upcItems = [];
      state.selectedUpcs = [];
      state.filterText = "";
      state.upcCount = 0;
      state.salesCompLoaded = false;
      state.salesComp = [];
      state.salesCompLY = [];
      state.forecastLoaded = false;
      state.forecastLoading = false;
      state.forecastQtyData = [];
      state.upcList = [];
      state.forecastExport = [];
      state.forecastMetricExport = [];
      state.priceOptLoaded = false;
      state.priceOptLoading = false;
      state.optBestPrices = [];
      state.optBestPricesByUpc = [];
      state.priceOptStoreId = null;
      state.trendLoaded = false;
      state.trendLoading = false;
      state.upcTrends = [];
      state.topFiveTrends = [];
      state.bottomFiveTrends = [];
      state.associationLoaded = false;
      state.associationLoading = false;
      state.itemAssociations = [];
      state.selectedAssociationUpcParam = [];
      state.reQueryAssociations = false;
      state.singleItemAssociations = [];
    },
    resetDevUpcState: () => initialState,
  },
});

export const {
  setDevUpcs,
  setDevUpcText,
  removeDevUpc,
  clearDevUpcs,
  setDevStoreids,
  setDevTrendPeriods,
  setDevActiveTab,
  setDevDataLoaded,
  setDevIsLoading,
  setDevUpcCount,
  setDevUpcItems,
  toggleDevSelectedUpc,
  setDevAllSelectedUpcs,
  resetDevSelectedUpcs,
  setDevFilterText,
  setDevDisplayMode,
  setDevShowMode,
  setDevSalesCompLoaded,
  setDevSalesComp,
  setDevSalesCompLY,
  setDevForecastLoaded,
  setDevForecastLoading,
  setDevForecastQtyData,
  setDevUpcList,
  setDevForecastExport,
  setDevForecastMetricExport,
  setDevPriceOptLoaded,
  setDevPriceOptLoading,
  setDevOptBestPrices,
  setDevOptBestPricesByUpc,
  setDevPriceOptStoreId,
  setDevCurrentPriceCost,
  setDevTrendLoaded,
  setDevTrendLoading,
  setDevTrendMode,
  setDevUpcTrends,
  setDevTopFiveTrends,
  setDevBottomFiveTrends,
  setDevAssociationLoaded,
  setDevAssociationLoading,
  setDevItemAssociations,
  addDevAssociationLevel,
  truncateDevAssociationLevels,
  addDevAssocUpcParam,
  removeDevAssocUpcParam,
  setDevReQueryAssociations,
  setDevSingleItemAssociations,
  resetDevAssociations,
  clearDevUpcData,
  resetDevUpcState,
} = upcDevSlice.actions;

export default upcDevSlice.reducer;
