import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  Store,
  ForecastQtyData,
  ForecastSalesData,
  ForecastItem,
  ForecastPriceHistory,
} from "../interfaces";

export interface SelectedHistory {
  upc: string;
  desc: string;
  type: string;
  activePrice: number;
  retailPrice: number;
  qty: number;
  lift: number;
}

export interface HistoryData {
  outliers: number;
  upc: string;
  desc: string;
  forecastQty: number;
  daysActive: number;
  forecast: number;
  futureForecast: number;
  forecastPrice: number;
  futureForecastTotal: number;
}

interface ForecastState {
  isLoading: boolean;
  selectedStores: Store[];
  storeids: string;
  radioId: number;
  sales: ForecastSalesData<any>[];
  qty: ForecastQtyData<any>[];
  items: ForecastItem[];
  selectedUpcs: string[];
  files: string[];
  priceHistory: ForecastPriceHistory[];
  selectedHistory: SelectedHistory;
  fcstTotal: number;
  adFcst: number;
  historyData: HistoryData[];
  lastUpdatedHistory: HistoryData[];
  exportModalOpen: boolean;
  currentUpcToUpdate: string;
}

const initialState: ForecastState = {
  isLoading: false,
  selectedStores: [],
  storeids: "", // needed for backend API calls
  radioId: 0,
  sales: [],
  qty: [],
  items: [],
  selectedUpcs: [],
  files: [],
  priceHistory: [],
  selectedHistory: {} as SelectedHistory,
  fcstTotal: 0,
  adFcst: 0,
  historyData: [],
  lastUpdatedHistory: [],
  exportModalOpen: false,
  currentUpcToUpdate: "",
};
export const forecastSlice = createSlice({
  name: "forecast",
  initialState,
  reducers: {
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setSelectedStores: (state, action: PayloadAction<Store[]>) => {
      state.selectedStores = action.payload;
      state.storeids = action.payload.map((store) => store.storeid).join(",");
    },
    setRadioId: (state, action: PayloadAction<number>) => {
      state.radioId = action.payload;
    },
    setSales: (
      state,
      action: PayloadAction<ForecastSalesData<ForecastSalesData<any>>[]>
    ) => {
      state.sales = action.payload;
    },
    setQty: (
      state,
      action: PayloadAction<ForecastQtyData<ForecastQtyData<any>>[]>
    ) => {
      state.qty = action.payload;
    },
    setItems: (state, action: PayloadAction<ForecastItem[]>) => {
      state.items = action.payload;
    },
    setAllUpcs: (state, action: PayloadAction<string[]>) => {
      state.selectedUpcs = action.payload;
    },
    setSelectedUpcs: (state, action: PayloadAction<string>) => {
      const upc = action.payload;
      if (state.selectedUpcs.includes(upc)) {
        state.selectedUpcs = state.selectedUpcs.filter((item) => item !== upc);
      } else {
        state.selectedUpcs.push(upc);
      }
    },
    setPriceHistory: (state, action: PayloadAction<ForecastPriceHistory[]>) => {
      state.priceHistory = action.payload;
    },
    resetSelectedUpcs: (state) => {
      state.adFcst = 0;
      state.fcstTotal = 0;
      state.selectedUpcs = [];
      state.priceHistory = [];
    },
    setFiles: (state, action: PayloadAction<string[]>) => {
      state.files = action.payload;
    },
    setSelectedHistory: (state, action: PayloadAction<SelectedHistory>) => {
      state.selectedHistory = action.payload;
    },
    setFcstTotal: (state, action: PayloadAction<number>) => {
      state.fcstTotal = action.payload;
    },
    setAdFcst: (state, action: PayloadAction<number>) => {
      state.adFcst = action.payload;
    },
    setHistoryData: (state, action: PayloadAction<HistoryData[]>) => {
      state.historyData = action.payload;
    },
    setLastUpdatedHistory: (state, action: PayloadAction<HistoryData>) => {
      const updated = action.payload;
      const exists = state.lastUpdatedHistory.find(
        (item) => item.upc === updated.upc && item.desc === updated.desc
      );
      if (exists) {
        state.lastUpdatedHistory = state.lastUpdatedHistory.map((item) =>
          item.upc === updated.upc && item.desc === updated.desc ? updated : item
        );
      } else {
        state.lastUpdatedHistory.push(updated);
      }
    },
    reQuery: (state) => {
      state.currentUpcToUpdate = "";
      state.lastUpdatedHistory = [];
      state.historyData = [];
      state.adFcst = 0;
      state.fcstTotal = 0;
      state.selectedHistory = {} as SelectedHistory;
      state.items = [];
      state.qty = [];
      state.sales = [];
      state.priceHistory = [];
      state.selectedUpcs = [];
      state.priceHistory = [];
    },
    reset: (state) => {
      state.currentUpcToUpdate = "";
      state.lastUpdatedHistory = [];
      state.historyData = [];
      state.adFcst = 0;
      state.fcstTotal = 0;
      state.items = [];
      state.qty = [];
      state.sales = [];
      state.selectedStores = [];
      state.storeids = "";
      state.radioId = 0;
      state.selectedHistory = {} as SelectedHistory;
      state.selectedUpcs = [];
      state.priceHistory = [];
    },
    setExportModalOpen: (state, action: PayloadAction<boolean>) => {
      state.exportModalOpen = action.payload;
    },
    setCurrentUpcToUpdate: (state, action: PayloadAction<string>) => {
      state.currentUpcToUpdate = action.payload;
    },
    // resetForecast: () => initialState,
  },
});

export const {
  setIsLoading,
  setSelectedStores,
  setRadioId,
  setSales,
  setQty,
  setItems,
  setAllUpcs,
  setSelectedUpcs,
  resetSelectedUpcs,
  setPriceHistory,
  setFiles,
  reQuery,
  setSelectedHistory,
  setFcstTotal,
  setAdFcst,
  setHistoryData,
  setLastUpdatedHistory,
  reset,
  setExportModalOpen,
  setCurrentUpcToUpdate,
  // resetForecast,
} = forecastSlice.actions;
export default forecastSlice.reducer;
