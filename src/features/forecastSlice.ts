import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  Store,
  ForecastQtyData,
  ForecastSalesData,
  ForecastItem,
  ForecastPriceHistory,
  PriceHistoryResult,
} from "../interfaces";
import { calcFcstQty } from "../pages/forecast/utils";
import { forecastUnits } from "../pages/priceSimulator/calc";

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

export type ForecastOutlierRow = {
  upc: string;
  description: string;
  qtySold: number;
  daysActive: number;
  adFcst: number;
  fcstPrice: number;
  fcstTotal: number;
  forecastWindow: number;
  daysAtPrice: number;
  adDays: number;
};

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
  selectedUpc: string;
  forecastResults: PriceHistoryResult[];
  rowData: ForecastOutlierRow[];
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
  selectedUpc: "",
  forecastResults: [],
  rowData: [],
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
    setRowData: (state, action: PayloadAction<ForecastOutlierRow[]>) => {
      state.rowData = action.payload;
    },
    setForecastResults: (state, action: PayloadAction<PriceHistoryResult[]>) => {
      state.forecastResults = action.payload; // using this for value change references
    },
    setNewRowAdDaysValue: (state, action: PayloadAction<{ upc: string; newAdDays: number }>) => {
      const { upc, newAdDays } = action.payload;
      const row = state.rowData.find((r) => r.upc === upc);

      
      const prices = state.forecastResults.find((item) => item.upc === upc);
      const upcPrices = prices!.price_history.map((ph) => [
        parseFloat(ph.price),
        ph.qty,
      ]);

      if (row) {
        // Finding the qty over last 90 days at the current fcstPrice
        // or just predicting if data point doesn't exist
        const fcstQty = calcFcstQty(upcPrices, row.fcstPrice); //90 days
        const overallUnits = upcPrices.reduce((acc, curr) => acc + curr[1], 0);

        const units = forecastUnits(
          row.fcstPrice,
          overallUnits,
          fcstQty,
          row.daysActive, // total selling days
          90, // total days
          row.daysAtPrice, // days at price
          row.forecastWindow, // forecast window => 7 now but can be configurable
          upcPrices, // all prices with qty recorded for the item
          newAdDays, // from user input => the sale date range
        );

        // The directly updated cell
        row.adDays = newAdDays;

        // The two updated cells by calculation
        row.adFcst = units;
        row.fcstTotal = row.fcstPrice * units;
      }

    },
    setNewRowPriceValue: (
      state,
      action: PayloadAction<{ upc: string; newPrice: number }>
    ) => {
      // newPrice is the newly changed fcstPrice
      const { upc, newPrice } = action.payload;
      const row = state.rowData.find((r) => r.upc === upc);

      const prices = state.forecastResults.find((item) => item.upc === upc);
      const upcPrices = prices!.price_history.map((ph) => [parseFloat(ph.price), ph.qty]);

      // only change => fcstPrice, fcstQty, fcstDollars, markdownDollars, lift
      if (row) {
        // Finding the qty over last 90 days at the current fcstPrice
        // or just predicting if data point doesn't exist
        const fcstQty = calcFcstQty(upcPrices, newPrice);
        const overallUnits = upcPrices.reduce((acc, curr) => acc + curr[1], 0);

        const units = forecastUnits(
          newPrice,
          overallUnits,
          fcstQty,
          row.daysActive, // total selling days
          90, // total days (90)
          row.daysAtPrice, // days at price
          row.forecastWindow, // forecast window => 7 now but can be configurable
          upcPrices, // all prices with qty recorded for the item
          row.adDays // from user input => the sale date range
        );

        // The directly updated cell
        row.fcstPrice = newPrice;

        // The two updated cells by calculation
        row.adFcst = units; // units over ad days
        row.fcstTotal = newPrice * units; // forecasted dollars
      }
    },
    setNewRowQtyValue: (
      state,
      action: PayloadAction<{ upc: string; newQty: number }>
    ) => {
      const { upc, newQty } = action.payload;
      const row = state.rowData.find((r) => r.upc === upc);

      //only change adFcast, fcstTotal, lift
      if (row) {
        row.adFcst = newQty;
        row.fcstTotal = row.fcstPrice * newQty;
      }
    },
    setLastUpdatedHistory: (state, action: PayloadAction<HistoryData>) => {
      const updated = action.payload;
      const exists = state.lastUpdatedHistory.find(
        (item) => item.upc === updated.upc && item.desc === updated.desc
      );
      if (exists) {
        state.lastUpdatedHistory = state.lastUpdatedHistory.map((item) =>
          item.upc === updated.upc && item.desc === updated.desc
            ? updated
            : item
        );
      } else {
        state.lastUpdatedHistory.push(updated);
      }
    },
    setSelectedUpc: (state, action: PayloadAction<string>) => {
      state.selectedUpc = action.payload;
    },
    reQuery: (state) => {
      state.selectedUpc = "";
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
      state.selectedUpc = "";
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
  setSelectedUpc,
  reset,
  setExportModalOpen,
  setForecastResults,
  setRowData,
  setNewRowPriceValue,
  setNewRowQtyValue,
  setNewRowAdDaysValue,
  // resetForecast,
} = forecastSlice.actions;
export default forecastSlice.reducer;
