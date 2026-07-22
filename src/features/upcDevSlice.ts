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
  // Association — bounded Main -> Level 1 -> Level 2 -> Level 3 cascade,
  // plus a standalone single-UPC search. Each level keeps its own items/
  // loading/selection so a change at one level can clear everything
  // downstream without touching the level being refetched itself.
  associationLoaded: boolean;
  level1Items: ItemAssociate[];
  level1Loading: boolean;
  level1Selected: string[];
  level2Items: ItemAssociate[];
  level2Loading: boolean;
  level2Selected: string[];
  level3Items: ItemAssociate[];
  level3Loading: boolean;
  singleSearchUpc: string;
  singleSearchItems: ItemAssociate[];
  singleSearchLoading: boolean;
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
  associationLoaded: false,
  level1Items: [],
  level1Loading: false,
  level1Selected: [],
  level2Items: [],
  level2Loading: false,
  level2Selected: [],
  level3Items: [],
  level3Loading: false,
  singleSearchUpc: "",
  singleSearchItems: [],
  singleSearchLoading: false,
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
    setDevAssociationLoaded(state, action: PayloadAction<boolean>) {
      state.associationLoaded = action.payload;
    },
    setDevLevel1Items(state, action: PayloadAction<ItemAssociate[]>) {
      state.level1Items = action.payload;
    },
    setDevLevel1Loading(state, action: PayloadAction<boolean>) {
      state.level1Loading = action.payload;
    },
    toggleDevLevel1Selected(state, action: PayloadAction<string>) {
      const pc = action.payload;
      state.level1Selected = state.level1Selected.includes(pc)
        ? state.level1Selected.filter((u) => u !== pc)
        : [...state.level1Selected, pc];
    },
    setDevLevel2Items(state, action: PayloadAction<ItemAssociate[]>) {
      state.level2Items = action.payload;
    },
    setDevLevel2Loading(state, action: PayloadAction<boolean>) {
      state.level2Loading = action.payload;
    },
    toggleDevLevel2Selected(state, action: PayloadAction<string>) {
      const pc = action.payload;
      state.level2Selected = state.level2Selected.includes(pc)
        ? state.level2Selected.filter((u) => u !== pc)
        : [...state.level2Selected, pc];
    },
    setDevLevel3Items(state, action: PayloadAction<ItemAssociate[]>) {
      state.level3Items = action.payload;
    },
    setDevLevel3Loading(state, action: PayloadAction<boolean>) {
      state.level3Loading = action.payload;
    },
    // Main changed — level 1 refetches itself (not cleared here), but
    // everything that depended on a level-1 selection is now invalid.
    resetDevAssociationLevels1To3(state) {
      state.level1Selected = [];
      state.level2Items = [];
      state.level2Selected = [];
      state.level3Items = [];
    },
    // Level 1 selection changed — level 2 refetches itself, level 3 (which
    // depended on a level-2 selection) is invalid.
    resetDevAssociationLevels2To3(state) {
      state.level2Selected = [];
      state.level3Items = [];
    },
    setDevSingleSearchUpc(state, action: PayloadAction<string>) {
      state.singleSearchUpc = action.payload;
    },
    setDevSingleSearchItems(state, action: PayloadAction<ItemAssociate[]>) {
      state.singleSearchItems = action.payload;
    },
    setDevSingleSearchLoading(state, action: PayloadAction<boolean>) {
      state.singleSearchLoading = action.payload;
    },
    resetDevAssociations(state) {
      state.associationLoaded = false;
      state.level1Items = [];
      state.level1Loading = false;
      state.level1Selected = [];
      state.level2Items = [];
      state.level2Loading = false;
      state.level2Selected = [];
      state.level3Items = [];
      state.level3Loading = false;
      state.singleSearchUpc = "";
      state.singleSearchItems = [];
      state.singleSearchLoading = false;
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
      state.associationLoaded = false;
      state.level1Items = [];
      state.level1Loading = false;
      state.level1Selected = [];
      state.level2Items = [];
      state.level2Loading = false;
      state.level2Selected = [];
      state.level3Items = [];
      state.level3Loading = false;
      state.singleSearchUpc = "";
      state.singleSearchItems = [];
      state.singleSearchLoading = false;
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
  setDevAssociationLoaded,
  setDevLevel1Items,
  setDevLevel1Loading,
  toggleDevLevel1Selected,
  setDevLevel2Items,
  setDevLevel2Loading,
  toggleDevLevel2Selected,
  setDevLevel3Items,
  setDevLevel3Loading,
  resetDevAssociationLevels1To3,
  resetDevAssociationLevels2To3,
  setDevSingleSearchUpc,
  setDevSingleSearchItems,
  setDevSingleSearchLoading,
  resetDevAssociations,
  clearDevUpcData,
  resetDevUpcState,
} = upcDevSlice.actions;

export default upcDevSlice.reducer;
