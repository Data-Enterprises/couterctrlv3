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

export type AssociationItem = {
  product_code: string;
  product_description: string;
  sub_department: number;
  sub_department_description: string;
  qty: number;
  basket_count: number;
  revenue: number;
  avg_price: number;
  attach_rate: number;
  is_seed: boolean;
};

export type AssociationResult = {
  totalBaskets: number;
  items: AssociationItem[];
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
  // Bumped every time clearDevUpcData runs (i.e. every new search). The
  // Price Opt/Trend/Association tabs key their initial-fetch effect on this
  // so a re-search reliably triggers a refetch even when it wouldn't
  // otherwise change any of that effect's own dependencies (e.g. same store,
  // same UPCs, just re-run).
  searchVersion: number;
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
  // Group search only — once a store is picked, the selected item's price
  // history is re-fetched scoped to just that store (getPriceOpt called
  // again with a single-store storeids param) so Best price/Elasticity/
  // Profit at risk reflect that store's own demand, not a blend across
  // every store in the group. Store search never needs this: its initial
  // optBestPrices fetch is already single-store scoped. Same key shape and
  // never-cleared-on-re-search convention as currentPriceCost.
  storeScopedPriceOpt: Record<string, UpcPriceOpt[]>;
  // Trend
  trendLoaded: boolean;
  trendLoading: boolean;
  upcTrends: UpcTrend[];
  topFiveTrends: UpcTrend[];
  bottomFiveTrends: UpcTrend[];
  // Association — one re-rootable panel over the seed UPC set (upcs/
  // selectedUpcs), keyed on the seed set itself so revisiting a re-rooted
  // item under an unchanged seed set never refetches. associationSeedKey is
  // a sorted/joined snapshot of whichever UPCs fed the last seed fetch.
  associationSeedKey: string;
  associationSeedLoaded: boolean;
  associationSeedLoading: boolean;
  associationSeedData: AssociationResult | null;
  associationRerootUpc: string | null;
  associationRerootCache: Record<string, AssociationResult>;
  associationRerootLoading: boolean;
  // Snapshot of associationSeedData taken right before a seed-set change
  // triggers a refetch, so the detail panel can diff old vs new and flag
  // what moved. Cleared once acknowledged/superseded by the next change.
  associationPrevSeedData: AssociationResult | null;
  associationSeedChangeNote: string | null;
}

const initialState: UpcDevState = {
  upcs: [],
  upcText: "",
  storeids: "",
  trendPeriods: 90,
  activeTab: "salesComp",
  dataLoaded: false,
  isLoading: false,
  searchVersion: 0,
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
  storeScopedPriceOpt: {},
  // Trend
  trendLoaded: false,
  trendLoading: false,
  upcTrends: [],
  topFiveTrends: [],
  bottomFiveTrends: [],
  // Association
  associationSeedKey: "",
  associationSeedLoaded: false,
  associationSeedLoading: false,
  associationSeedData: null,
  associationRerootUpc: null,
  associationRerootCache: {},
  associationRerootLoading: false,
  associationPrevSeedData: null,
  associationSeedChangeNote: null,
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
    setDevStoreScopedPriceOpt(state, action: PayloadAction<{ key: string; rows: UpcPriceOpt[] }>) {
      state.storeScopedPriceOpt[action.payload.key] = action.payload.rows;
    },
    // Trend
    setDevTrendLoaded(state, action: PayloadAction<boolean>) {
      state.trendLoaded = action.payload;
    },
    setDevTrendLoading(state, action: PayloadAction<boolean>) {
      state.trendLoading = action.payload;
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
    setDevAssociationSeedKey(state, action: PayloadAction<string>) {
      state.associationSeedKey = action.payload;
    },
    setDevAssociationSeedLoaded(state, action: PayloadAction<boolean>) {
      state.associationSeedLoaded = action.payload;
    },
    setDevAssociationSeedLoading(state, action: PayloadAction<boolean>) {
      state.associationSeedLoading = action.payload;
    },
    setDevAssociationSeedData(state, action: PayloadAction<AssociationResult | null>) {
      state.associationSeedData = action.payload;
    },
    setDevAssociationRerootUpc(state, action: PayloadAction<string | null>) {
      state.associationRerootUpc = action.payload;
    },
    setDevAssociationRerootLoading(state, action: PayloadAction<boolean>) {
      state.associationRerootLoading = action.payload;
    },
    setDevAssociationRerootCacheEntry(
      state,
      action: PayloadAction<{ upc: string; result: AssociationResult }>,
    ) {
      state.associationRerootCache[action.payload.upc] = action.payload.result;
    },
    clearDevAssociationRerootCache(state) {
      state.associationRerootCache = {};
    },
    setDevAssociationPrevSeedData(state, action: PayloadAction<AssociationResult | null>) {
      state.associationPrevSeedData = action.payload;
    },
    setDevAssociationSeedChangeNote(state, action: PayloadAction<string | null>) {
      state.associationSeedChangeNote = action.payload;
    },
    resetDevAssociations(state) {
      state.associationSeedKey = "";
      state.associationSeedLoaded = false;
      state.associationSeedLoading = false;
      state.associationSeedData = null;
      state.associationRerootUpc = null;
      state.associationRerootCache = {};
      state.associationRerootLoading = false;
      state.associationPrevSeedData = null;
      state.associationSeedChangeNote = null;
    },
    clearDevUpcData(state) {
      state.searchVersion += 1;
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
      state.associationSeedKey = "";
      state.associationSeedLoaded = false;
      state.associationSeedLoading = false;
      state.associationSeedData = null;
      state.associationRerootUpc = null;
      state.associationRerootCache = {};
      state.associationRerootLoading = false;
      state.associationPrevSeedData = null;
      state.associationSeedChangeNote = null;
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
  setDevStoreScopedPriceOpt,
  setDevTrendLoaded,
  setDevTrendLoading,
  setDevUpcTrends,
  setDevTopFiveTrends,
  setDevBottomFiveTrends,
  setDevAssociationSeedKey,
  setDevAssociationSeedLoaded,
  setDevAssociationSeedLoading,
  setDevAssociationSeedData,
  setDevAssociationRerootUpc,
  setDevAssociationRerootLoading,
  setDevAssociationRerootCacheEntry,
  clearDevAssociationRerootCache,
  setDevAssociationPrevSeedData,
  setDevAssociationSeedChangeNote,
  resetDevAssociations,
  clearDevUpcData,
  resetDevUpcState,
} = upcDevSlice.actions;

export default upcDevSlice.reducer;
