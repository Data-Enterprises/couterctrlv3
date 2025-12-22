import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  Store,
  ForecastQtyData,
  ForecastSalesData,
  ForecastItem,
  ForecastPriceHistory,
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
  outliers: number;
  upc: string;
  description: string;
  qtySold: number;
  daysActive: number;
  forecast: number;
  adFcst: number;
  fcstPrice: number;
  fcstTotal: number;
  lift: number;
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
    setNewRowPriceValue: (
      state,
      action: PayloadAction<{ upc: string; newPrice: number }>
    ) => {
      // newPrice is the newly changed fcstPrice
      const { upc, newPrice } = action.payload;
      const row = state.rowData.find((r) => r.upc === upc);
      const prices = state.qty.find((item) => item.upc === upc)?.metrics.prices;

      const upcPrices = Object.entries(prices).map(([p, q]) => [
        parseFloat(p),
        q as number,
      ]) as number[][];

      // only change => fcstPrice, fcstQty, fcstDollars, markdownDollars, lift
      if (row) {
        // const prices = row.prices;
        const fcstQty = calcFcstQty(upcPrices, newPrice); //90 days
        const units = forecastUnits(
          newPrice,
          fcstQty,
          row.daysActive,
          90,
          7,
          upcPrices
        );

        row.adFcst = units; // next 7 days
        row.fcstPrice = newPrice;
        row.fcstTotal = newPrice * units;
        row.lift =
          row.forecast > 0 ? (units - row.forecast) / row.forecast : 0;
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
        row.lift =
          row.forecast > 0 ? (newQty - row.forecast) / row.forecast : 0;
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
  setRowData,
  setNewRowPriceValue,
  setNewRowQtyValue,
  // resetForecast,
} = forecastSlice.actions;
export default forecastSlice.reducer;
