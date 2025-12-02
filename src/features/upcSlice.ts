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

interface UpcState {
  index: number;
  fileName: string;
  selectedMode: number;
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
  upcSearch: string;
  descSearch: string;
  upcTrends: UpcTrend[];
  topFiveTrends: UpcTrend[];
  bottomFiveTrends: UpcTrend[];
  trendMode: "Totals" | "Mean" | "Volatility";
}

const initialState: UpcState = {
  index: 0,
  fileName: "",
  selectedMode: 0,
  radioId: 0,
  selectedStores: [],
  storeids: "", // needed for backend API calls
  trendPeriods: "120",
  upcSearch: "",
  descSearch: "",
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
    setUpcSearch: (state, action: PayloadAction<string>) => {
      state.upcSearch = action.payload;
    },
    setDescSearch: (state, action: PayloadAction<string>) => {
      state.descSearch = action.payload;
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
          (u) => u !== action.payload
        );
      } else {
        state.selectedUpcs.push(action.payload);
      }
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
      action: PayloadAction<ForecastMetrics[]>
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
      action: PayloadAction<"singleRow" | "multiRow">
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
      action: PayloadAction<"Totals" | "Mean" | "Volatility">
    ) => {
      state.trendMode = action.payload;
    },
    resetSelectedUpcs: (state) => {
      state.selectedUpcs = [];
      state.selectedCompOne = null;
      state.selectedCompTwo = null;
    },
    clearUpcData: (state) => {
      state.selectedMode = 0;
      state.upcCount = 0;
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
  setUpcSearch,
  setDescSearch,
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
  clearUpcData,
  resetUpcState,
} = upcSlice.actions;
export default upcSlice.reducer;
