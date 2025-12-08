import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  Store,
  ForecastQtyData,
  ForecastSalesData,
  ForecastItem,
  ForecastPriceHistory,
} from "../interfaces";

interface ForecastState {
  selectedStores: Store[];
  storeids: string;
  radioId: number;
  sales: ForecastSalesData<any>[];
  qty: ForecastQtyData<any>[];
  items: ForecastItem[];
  selectedUpcs: string[];
  files: string[];
  priceHistory: ForecastPriceHistory[];
}

const initialState: ForecastState = {
  selectedStores: [],
  storeids: "", // needed for backend API calls
  radioId: 0,
  sales: [],
  qty: [],
  items: [],
  selectedUpcs: [],
  files: [],
  priceHistory: [],
};
export const forecastSlice = createSlice({
  name: "forecast",
  initialState,
  reducers: {
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
      state.selectedUpcs = [];
      state.priceHistory = [];
    },
    setFiles: (state, action: PayloadAction<string[]>) => {
      state.files = action.payload;
    },
    reQuery: (state) => {
      state.items = [];
      state.qty = [];
      state.sales = [];
      state.priceHistory = [];
      state.selectedUpcs = [];
      state.priceHistory = [];
    },
    reset: (state) => {
      state.items = [];
      state.qty = [];
      state.sales = [];
      state.selectedStores = [];
      state.storeids = "";
      state.radioId = 0;
      state.selectedUpcs = [];
      state.priceHistory = [];
    },
    resetForecast: () => initialState,
  },
});

export const {
  setSelectedStores,
  setRadioId,
  setSales,
  setQty,
  setItems,
  setSelectedUpcs,
  resetSelectedUpcs,
  setPriceHistory,
  setFiles,
  reQuery,
  reset,
  resetForecast,
} = forecastSlice.actions;
export default forecastSlice.reducer;
