import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  CashierCard,
  StoreCard,
  Cashier,
  CashierStore,
} from "../interfaces";

interface CashiersState {
  storeCards: StoreCard[];
  cashierCards: CashierCard[];
  cashiers: Cashier[];
  stores: CashierStore[];
  storeFilterText: string;
  selectedStoreCard: number;
  dataView: "stores" | "cashiers" | "";
  loadingStores: boolean;
  loadingCashiers: boolean;
}

const initialState: CashiersState = {
  storeCards: [],
  cashierCards: [],
  cashiers: [],
  stores: [],
  storeFilterText: "",
  selectedStoreCard: 0,
  dataView: "",
  loadingStores: false,
  loadingCashiers: false,
};

const cashiersSlice = createSlice({
  name: "cashiers",
  initialState,
  reducers: {
    setStoreCards: (state, action: PayloadAction<StoreCard[]>) => {
      state.storeCards = action.payload;
      state.stores = [...action.payload]
        .map((sc) => ({
          storeid: sc.storeid,
          store_name: sc.store_name,
        }))
        .sort((a, b) => a.storeid - b.storeid);
    },
    setCashierCards: (state, action: PayloadAction<CashierCard[]>) => {
      state.cashierCards = action.payload;
      state.cashiers = [...action.payload].map((cc) => ({
        storeid: cc.storeid,
        store_name: cc.store_name,
        store_number: cc.store_number,
        cashier_number: cc.cashier_number,
        cashier_name: cc.cashier_name,
      }));
    },
    setStoreFilterText: (state, action: PayloadAction<string>) => {
      state.storeFilterText = action.payload;
    },
    setSelectedStoreCard: (state, action: PayloadAction<number>) => {
      state.selectedStoreCard = action.payload;
    },
    setDataView: (state, action: PayloadAction<"stores" | "cashiers" | "">) => {
      state.dataView = action.payload;
    },
    setLoadingStores: (state, action: PayloadAction<boolean>) => {
      state.loadingStores = action.payload;
    },
    setLoadingCashiers: (state, action: PayloadAction<boolean>) => {
      state.loadingCashiers = action.payload;
    },
    reQueryStepOne: (state) => {
      state.storeCards = [];
      state.cashierCards = [];
      state.cashiers = [];
      state.stores = [];
      state.selectedStoreCard = 0;
      state.dataView = "";
      state.loadingStores = true;
    },
    reQueryStepTwo: (state) => {
      state.cashierCards = [];
      state.cashiers = [];
      state.loadingCashiers = true;
    },
    resetCashierState: () => initialState,
  },
});

export const {
  setStoreCards,
  setCashierCards,
  setDataView,
  setSelectedStoreCard,
  setStoreFilterText,
  setLoadingStores,
  setLoadingCashiers,
  reQueryStepOne,
  reQueryStepTwo,
  resetCashierState,
} = cashiersSlice.actions;
export default cashiersSlice.reducer;
