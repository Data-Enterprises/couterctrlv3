import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UpcSalesComp, UpcItem, Store, UpcInfo, Forecast } from "../interfaces";

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
  upcList: UpcInfo[];
  forecastOption: "sales" | "quantity";
  upcSelectorDisplay: "desc" | "upc";
  selectedLegendForecast: UpcInfo;
}

const initialState: UpcState = {
  index: 0,
  fileName: "",
  selectedMode: 0,
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
  upcList: [],
  forecastOption: "quantity",
  upcSelectorDisplay: "upc",
  selectedLegendForecast: {} as UpcInfo,
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
  setSelectedUpcs,
  resetSelectedUpcs,
  clearUpcData,
  resetUpcState,
} = upcSlice.actions;
export default upcSlice.reducer;
