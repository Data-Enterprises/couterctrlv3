import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface ItemLookup {
  casecost: number;
  category_description: string;
  extended_cost: number;
  price: number;
  product_code: string;
  product_description: string;
  qty: number;
  store_name: string;
  store_number: string;
  total_sales: number;
}

// missing sale_date after product_description, and total_sales at the end
export interface ItemLookupHistory {
  casecost: number;
  category_description: string;
  extended_cost: number;
  price: number;
  product_code: string;
  product_description: string;
  qty: number;
  sale_date: string; // split at T [0]
  store_name: string;
  store_number: string;
  storeid: number;
  total_sales: number;
}

// export interface StoreList {
//   storeid: number;
//   store_number: string;
//   store_name: string;
// }

interface ItemLookupState {
  upcCode: string;
  mode: "Sales" | "Qty" | "Price";
  topStoreSales: ItemLookup | null;
  lowestStoreSales: ItemLookup | null;
  topStoreQty: ItemLookup | null;
  lowestStoreQty: ItemLookup | null;
  highestPriceStore: ItemLookup | null;
  lowestPriceStore: ItemLookup | null;
  totalStores: number;
  productCode: string;
  description: string;
  totalSales: number;
  totalQty: number;
  avgPrice: number;
  itemsLoaded: boolean;
  // storeList: StoreList[];
  selectedStore: number;
  itemLookupHistory: ItemLookupHistory[];
  daysSold: number;
  pause: boolean;
}

const initialState: ItemLookupState = {
  upcCode: "",
  mode: "Sales",
  topStoreSales: null,
  lowestStoreSales: null,
  topStoreQty: null,
  lowestStoreQty: null,
  highestPriceStore: null,
  lowestPriceStore: null,
  totalStores: 0,
  productCode: "",
  description: "",
  totalSales: 0,
  totalQty: 0,
  avgPrice: 0,
  itemsLoaded: false,
  // storeList: [],
  selectedStore: 0,
  itemLookupHistory: [],
  daysSold: 0,
  pause: true,
};

interface ItemsPayload {
  top_store_sales: ItemLookup;
  lowest_store_sales: ItemLookup;
  top_store_qty: ItemLookup;
  lowest_store_qty: ItemLookup;
  highest_price_store: ItemLookup;
  lowest_price_store: ItemLookup;
}

interface HistoryMetrics {
  totalSales: number;
  totalQty: number;
  avgPrice: number;
  daysSold: number;
}

const itemLookupSlice = createSlice({
  name: "itemLookup",
  initialState,
  reducers: {
    setUpcCode: (state, action: PayloadAction<string>) => {
      state.upcCode = action.payload;
    },
    setItems: (state, action: PayloadAction<ItemsPayload>) => {
      state.topStoreSales = action.payload.top_store_sales;
      state.lowestStoreSales = action.payload.lowest_store_sales;
      state.topStoreQty = action.payload.top_store_qty;
      state.lowestStoreQty = action.payload.lowest_store_qty;
      state.highestPriceStore = action.payload.highest_price_store;
      state.lowestPriceStore = action.payload.lowest_price_store;
    },
    setMode: (state, action: PayloadAction<"Sales" | "Qty" | "Price">) => {
      state.mode = action.payload;
    },
    setItemsLoaded: (state, action: PayloadAction<boolean>) => {
      state.itemsLoaded = action.payload;
    },
    setProductCode: (state, action: PayloadAction<string>) => {
      state.productCode = action.payload;
    },
    setDescription: (state, action: PayloadAction<string>) => {
      state.description = action.payload;
    },
    setMetrics: (
      state,
      action: PayloadAction<{
        totalStores: number;
        totalSales: number;
        totalQty: number;
        avgPrice: number;
      }>
    ) => {
      state.totalStores = action.payload.totalStores;
      state.totalSales = action.payload.totalSales;
      state.totalQty = action.payload.totalQty;
      state.avgPrice = action.payload.avgPrice;
    },
    // setStoreList: (state, action: PayloadAction<StoreList[]>) => {
    //   state.storeList = action.payload;
    // },
    setSelectedStore: (state, action: PayloadAction<number>) => {
      if (state.selectedStore === action.payload) {
        state.selectedStore = 0;
      } else {
        state.selectedStore = action.payload;
      }
    },
    setItemLookupHistory: (
      state,
      action: PayloadAction<ItemLookupHistory[]>
    ) => {
      state.itemLookupHistory = action.payload;
    },
    setHistoryMetrics: (state, action: PayloadAction<HistoryMetrics>) => {
      state.totalSales = action.payload.totalSales;
      state.totalQty = action.payload.totalQty;
      state.avgPrice = action.payload.avgPrice;
      state.daysSold = action.payload.daysSold;
    },
    setPause: (state, action: PayloadAction<boolean>) => {
      state.pause = action.payload;
    },
    resetLookupSlice: (state) => {
      state.upcCode = "";
      state.mode = "Sales";
      state.topStoreSales = null;
      state.lowestStoreSales = null;
      state.topStoreQty = null;
      state.lowestStoreQty = null;
      state.highestPriceStore = null;
      state.lowestPriceStore = null;
      state.totalStores = 0;
      state.productCode = "";
      state.description = "";
      state.totalSales = 0;
      state.totalQty = 0;
      state.avgPrice = 0;
      state.itemsLoaded = false;
      state.itemLookupHistory = [];
      state.daysSold = 0;
      state.selectedStore = 0;
      state.pause = true;
    },
  },
});

export const {
  setUpcCode,
  setItems,
  setMode,
  resetLookupSlice,
  setItemsLoaded,
  setProductCode,
  setDescription,
  setMetrics,
  // setStoreList,
  setSelectedStore,
  setItemLookupHistory,
  setHistoryMetrics,
  setPause,
} = itemLookupSlice.actions;

export default itemLookupSlice.reducer;
