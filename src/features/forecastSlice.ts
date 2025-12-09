import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  Store,
  ForecastQtyData,
  ForecastSalesData,
  ForecastItem,
  ForecastPriceHistory,
} from "../interfaces";

interface SelectedHistory {
  upc: string;
  desc: string;
  type: string;
  activePrice: number;
  retailPrice: number;
  qty: number;
  lift: number;
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
    setCurrentLift: (state, action: PayloadAction<SelectedHistory>) => {
      state.selectedHistory = action.payload;
    },
    reQuery: (state) => {
      state.selectedHistory = {} as SelectedHistory;
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
      state.selectedHistory = {} as SelectedHistory;
      state.selectedUpcs = [];
      state.priceHistory = [];
    },
    resetForecast: () => initialState,
  },
});

export const {
  setIsLoading,
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
  setCurrentLift,
  reset,
  resetForecast,
} = forecastSlice.actions;
export default forecastSlice.reducer;
