import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  UpcSalesComp,
  UpcItem,
  Store,
  UpcInfo,
  Forecast,
  UpcPriceOpt,
  UpcTrend,
  ForecastExport,
  ForecastMetrics,
} from "../interfaces";

export interface ItemAssociate {
  product_code: string;
  product_description: string;
  qty: number;
}

interface UpcState {
  index: number;
  fileName: string;
  selectedMode: number;
  selectedView: number;
  radioId: number;
  selectedStores: Store[];
  storeids: string;
  trendPeriods: string;
  dataLoaded: boolean;
  isLoading: boolean;
  upcCount: number;
  upcItems: UpcItem[];
  selectedUpcs: string[];
  salesComp: UpcSalesComp[];
  selectedCompOne: UpcSalesComp | null;
  selectedCompTwo: UpcSalesComp | null;
  forecast: Forecast[];
  forecastHistory: Forecast[];
  forecastExport: ForecastExport[];
  forecastMetricExport: ForecastMetrics[];
  upcList: UpcInfo[];
  forecastOption: "sales" | "quantity";
  upcSelectorDisplay: "desc" | "upc";
  selectedLegendForecast: UpcInfo;
  optBestPrices: UpcPriceOpt[];
  optBestPricesByUpc: UpcPriceOpt[];
  optDisplayMode: "singleRow" | "multiRow";
  selectedOptItem: UpcPriceOpt;
  upcTrends: UpcTrend[];
  topFiveTrends: UpcTrend[];
  bottomFiveTrends: UpcTrend[];
  trendMode: "Totals" | "Mean" | "Volatility";
  uploadedUpcs: string[]; // Store uploaded UPCs for validation in forecast page
  selectedAssociationUpcParam: string[]; // Store UPCs queried for deeper level associations
  itemAssociations: ItemAssociate[][];
  singleItemAssociations: ItemAssociate[];
  reQueryAssociations: boolean;
}

const initialState: UpcState = {
  index: 0,
  fileName: "",
  selectedMode: 0,
  selectedView: 0,
  radioId: 0,
  selectedStores: [],
  storeids: "", // needed for backend API calls
  trendPeriods: "120",
  dataLoaded: false,
  isLoading: false,
  upcCount: 0,
  upcItems: [],
  salesComp: [],
  selectedUpcs: [],
  selectedCompOne: null,
  selectedCompTwo: null,
  forecast: [],
  forecastHistory: [],
  forecastExport: [],
  forecastMetricExport: [],
  upcList: [],
  forecastOption: "quantity",
  upcSelectorDisplay: "upc",
  selectedLegendForecast: {} as UpcInfo,
  optBestPrices: [],
  optBestPricesByUpc: [],
  optDisplayMode: "multiRow",
  selectedOptItem: {} as UpcPriceOpt,
  upcTrends: [],
  topFiveTrends: [],
  bottomFiveTrends: [],
  trendMode: "Totals",
  uploadedUpcs: [],
  itemAssociations: [],
  selectedAssociationUpcParam: [],
  reQueryAssociations: false,
  singleItemAssociations: [],
};

export const upcSlice = createSlice({
  name: "upc",
  initialState,
  reducers: {
    setIndex: (state, action: PayloadAction<number>) => {
      state.index = action.payload;
    },
    setRadioId: (state, action: PayloadAction<number>) => {
      state.radioId = action.payload;
    },
    setSelectedStores: (state, action: PayloadAction<Store[]>) => {
      state.selectedStores = action.payload;
      state.storeids = action.payload.map((store) => store.storeid).join(",");
    },
    setTrendPeriods: (state, action: PayloadAction<string>) => {
      state.trendPeriods = action.payload;
    },
    setFileName: (state, action: PayloadAction<string>) => {
      state.fileName = action.payload;
    },
    setDataLoaded: (state, action: PayloadAction<boolean>) => {
      state.dataLoaded = action.payload;
    },
    setSelectedMode: (state, action: PayloadAction<number>) => {
      state.selectedMode = action.payload;
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setSalesComp: (state, action: PayloadAction<UpcSalesComp[]>) => {
      state.salesComp = action.payload;
    },
    setUpcCount: (state, action: PayloadAction<number>) => {
      state.upcCount = action.payload;
    },
    setUpcItems: (state, action: PayloadAction<UpcItem[]>) => {
      state.upcItems = action.payload;
    },
    setSelectedUpcs: (state, action: PayloadAction<string>) => {
      const upc = state.selectedUpcs.find((u) => u === action.payload);
      if (upc) {
        state.selectedUpcs = state.selectedUpcs.filter(
          (u) => u !== action.payload,
        );
      } else {
        state.selectedUpcs.push(action.payload);
      }
    },
    setAllSelectedUpcs: (state, action: PayloadAction<string[]>) => {
      state.selectedUpcs = action.payload;
    },
    setSelectedSalesComps: (state, action: PayloadAction<UpcSalesComp>) => {
      if (!state.selectedCompOne) {
        state.selectedCompOne = action.payload;
      } else if (!state.selectedCompTwo) {
        state.selectedCompTwo = action.payload;
      } else {
        state.selectedCompOne = action.payload;
        state.selectedCompTwo = null;
      }
    },
    clearSelectedComps: (state) => {
      state.selectedCompOne = null;
      state.selectedCompTwo = null;
    },
    setUpcList: (state, action: PayloadAction<UpcInfo[]>) => {
      state.upcList = action.payload;
    },
    setForecastOption: (state, action: PayloadAction<"sales" | "quantity">) => {
      state.forecastOption = action.payload;
    },
    setSelectedLegendForecast: (state, action: PayloadAction<UpcInfo>) => {
      state.selectedLegendForecast = action.payload;
    },
    setForecastData: (state, action: PayloadAction<Forecast[]>) => {
      state.forecast = action.payload;
    },
    setForecastHistory: (state, action: PayloadAction<Forecast[]>) => {
      state.forecastHistory = action.payload;
    },
    setForecastExport: (state, action: PayloadAction<ForecastExport[]>) => {
      state.forecastExport = action.payload;
    },
    setForecastMetricExport: (
      state,
      action: PayloadAction<ForecastMetrics[]>,
    ) => {
      state.forecastMetricExport = action.payload;
    },
    setOptBestPrices: (state, action: PayloadAction<UpcPriceOpt[]>) => {
      state.optBestPrices = action.payload;
    },
    setOptBestPricesByUpc: (state, action: PayloadAction<UpcPriceOpt[]>) => {
      state.optBestPricesByUpc = action.payload;
    },
    setSelectedOptItem: (state, action: PayloadAction<UpcPriceOpt>) => {
      state.selectedOptItem = action.payload;
    },
    setOptDisplayMode: (
      state,
      action: PayloadAction<"singleRow" | "multiRow">,
    ) => {
      state.optDisplayMode = action.payload;
    },
    setUpcTrends: (state, action: PayloadAction<UpcTrend[]>) => {
      state.upcTrends = action.payload;
    },
    setTopFiveTrends: (state, action: PayloadAction<UpcTrend[]>) => {
      state.topFiveTrends = action.payload;
    },
    setBottomFiveTrends: (state, action: PayloadAction<UpcTrend[]>) => {
      state.bottomFiveTrends = action.payload;
    },
    setTrendMode: (
      state,
      action: PayloadAction<"Totals" | "Mean" | "Volatility">,
    ) => {
      state.trendMode = action.payload;
    },
    setUploadedUpcs: (state, action: PayloadAction<string[]>) => {
      state.uploadedUpcs = action.payload;
    },
    resetDeeperLvlQueryUpcs: (state) => {
      state.itemAssociations = [];
      state.selectedAssociationUpcParam = [];
    },
    handleAssociationDeselect: (state, action: PayloadAction<number>) => {
      state.itemAssociations = state.itemAssociations.slice(
        0,
        action.payload + 1,
      );
    },
    setAssociations: (state, action: PayloadAction<ItemAssociate[]>) => {
      state.itemAssociations.push(action.payload);
    },
    setSingleAssocitions: (state, action: PayloadAction<ItemAssociate[]>) => {
      state.singleItemAssociations = action.payload;
    },
    resetAssociations: (state) => {
      state.itemAssociations = [];
    },
    removeSelectedUpcParam: (state, action: PayloadAction<string>) => {
      state.selectedAssociationUpcParam =
        state.selectedAssociationUpcParam.filter((d) => d !== action.payload);
    },
    setAllSelectedUpcParam: (state, action: PayloadAction<string[]>) => {
      state.selectedAssociationUpcParam = action.payload;
    },
    addSelectedUpcParam: (state, action: PayloadAction<string>) => {
      state.selectedAssociationUpcParam.push(action.payload);
    },
    setReQueryAssociations: (state, action: PayloadAction<boolean>) => {
      state.reQueryAssociations = action.payload;
    },
    resetSelectedUpcs: (state) => {
      state.selectedUpcs = [];
      state.selectedCompOne = null;
      state.selectedCompTwo = null;
    },
    clearUpcData: (state) => {
      state.reQueryAssociations = false;
      state.itemAssociations = [];
      state.singleItemAssociations = [];
      state.selectedAssociationUpcParam = [];
      state.selectedMode = 0;
      state.selectedView = 0;
      state.upcCount = 0;
      state.radioId = 0;
      state.upcItems = [];
      state.selectedUpcs = [];
      state.salesComp = [];
      state.storeids = "";
      state.selectedStores = [];
      state.dataLoaded = false;
      state.selectedCompOne = null;
      state.selectedCompTwo = null;
      state.forecast = [];
      state.forecastHistory = [];
      state.upcList = [];
      state.optBestPrices = [];
      state.optBestPricesByUpc = [];
      state.selectedOptItem = {} as UpcPriceOpt;
      state.optDisplayMode = "multiRow";
      state.upcTrends = [];
      state.topFiveTrends = [];
      state.bottomFiveTrends = [];
      state.trendMode = "Totals";
      state.forecastExport = [];
      state.forecastMetricExport = [];
      state.uploadedUpcs = [];
      state.fileName = "";
    },
    resetUpcState: () => initialState,
  },
});

export const {
  setIndex,
  setRadioId,
  setSelectedStores,
  setTrendPeriods,
  setFileName,
  setSelectedMode,
  setDataLoaded,
  setIsLoading,
  setSalesComp,
  setSelectedSalesComps,
  clearSelectedComps,
  setUpcCount,
  setUpcItems,
  setUpcList,
  setForecastOption,
  setSelectedLegendForecast,
  setForecastData,
  setForecastHistory,
  setForecastExport,
  setForecastMetricExport,
  setSelectedUpcs,
  setOptBestPrices,
  setOptBestPricesByUpc,
  setSelectedOptItem,
  setOptDisplayMode,
  setUpcTrends,
  setTopFiveTrends,
  setBottomFiveTrends,
  setTrendMode,
  resetSelectedUpcs,
  setAllSelectedUpcs,
  setUploadedUpcs,
  clearUpcData,
  addSelectedUpcParam,
  removeSelectedUpcParam,
  setAssociations,
  handleAssociationDeselect,
  resetDeeperLvlQueryUpcs,
  setReQueryAssociations,
  resetAssociations,
  setAllSelectedUpcParam,
  setSingleAssocitions,
  resetUpcState,
} = upcSlice.actions;
export default upcSlice.reducer;
