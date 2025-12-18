import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  Store,
  UpcCodeDesc,
  PriceSimQtyData,
  PriceSimSalesData,
  SimGridRow,
} from "../interfaces";
import { calcFcstQty } from "../pages/priceSimulator/calc";

interface PriceSimState {
  isLoading: boolean;
  qty: PriceSimQtyData<any>[];
  sales: PriceSimSalesData<any>[];
  selectedStores: Store[];
  storeids: string; // set inside setSelectedStores
  radioId: number;
  items: UpcCodeDesc[];
  selectedUpcs: string[];
  files: string[];
  priceHistory: any[];
  exportModalOpen: boolean;
  rowData: SimGridRow[];
}

const initialState: PriceSimState = {
  isLoading: false,
  qty: [],
  sales: [],
  selectedStores: [],
  storeids: "", // needed for backend API calls
  radioId: 0,
  items: [],
  selectedUpcs: [],
  files: [],
  priceHistory: [],
  exportModalOpen: false,
  rowData: [],
};

export const priceSimSlice = createSlice({
  name: "priceSim",
  initialState,
  reducers: {
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setQty: (state, action: PayloadAction<PriceSimQtyData<any>[]>) => {
      state.qty = action.payload;
    },
    setSales: (state, action: PayloadAction<PriceSimSalesData<any>[]>) => {
      state.sales = action.payload;
    },
    setSelectedStores: (state, action: PayloadAction<Store[]>) => {
      state.selectedStores = action.payload;
      state.storeids = action.payload.map((store) => store.storeid).join(",");
    },
    setRadioId: (state, action: PayloadAction<number>) => {
      state.radioId = action.payload;
    },
    setItems: (state, action: PayloadAction<UpcCodeDesc[]>) => {
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
    setFiles: (state, action: PayloadAction<string[]>) => {
      state.files = action.payload;
    },
    setPriceHistory: (state, action: PayloadAction<any[]>) => {
      state.priceHistory = action.payload;
    },
    setExportModalOpen: (state, action: PayloadAction<boolean>) => {
      state.exportModalOpen = action.payload;
    },
    setAllUpcs: (state, action: PayloadAction<string[]>) => {
      state.selectedUpcs = action.payload;
    },
    setRowData: (state, action: PayloadAction<SimGridRow[]>) => {
      state.rowData = action.payload;
    },
    resetSelectedUpcs: (state) => {
      state.selectedUpcs = [];
      state.priceHistory = [];
      state.rowData = [];
    },
    setNewRowPriceValue: (
      state,
      action: PayloadAction<{ upc: string; newPrice: number }>
    ) => {
      // newPrice is the newly changed fcstPrice
      const { upc, newPrice } = action.payload;
      const row = state.rowData.find((r) => r.upc === upc);

      // only change => fcstPrice, fcstQty, fcstDollars, markdownDollars, lift
      if (row) {
        row.fcstPrice = newPrice; // fcstPrice
        
        const prices = row.prices;
        const fcstQty = calcFcstQty(prices, newPrice);
        row.fcstQty = fcstQty;
        row.fcstDollars = newPrice * fcstQty;

        const newMarkdown = (row.regRetail - newPrice) * fcstQty;
        row.markdownDollars = newMarkdown;
        row.lift = row.regQty > 0 ? (fcstQty - row.regQty) / row.regQty : 0;
      }
    },
    reQuery: (state) => {
      state.isLoading = false;
      state.qty = [];
      state.sales = [];
      state.items = [];
      state.selectedUpcs = [];
      state.priceHistory = [];
      state.exportModalOpen = false;
    },
    reset: (state) => {
      state.isLoading = false;
      state.qty = [];
      state.sales = [];
      state.selectedStores = [];
      state.storeids = "";
      state.radioId = 0;
      state.items = [];
      state.selectedUpcs = [];
      state.priceHistory = [];
      state.exportModalOpen = false;
    },
  },
});

export const {
  setIsLoading,
  setQty,
  setSales,
  setSelectedStores,
  setRadioId,
  setItems,
  setSelectedUpcs,
  setFiles,
  setPriceHistory,
  setExportModalOpen,
  setAllUpcs,
  resetSelectedUpcs,
  setRowData,
  setNewRowPriceValue,
  reset,
  reQuery,
} = priceSimSlice.actions;
export default priceSimSlice.reducer;
