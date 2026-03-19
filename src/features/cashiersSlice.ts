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
}

const initialState: CashiersState = {
  storeCards: [],
  cashierCards: [],
  cashiers: [],
  stores: [],
};

const cashiersSlice = createSlice({
  name: "cashiers",
  initialState,
  reducers: {
    setStoreCards: (state, action: PayloadAction<StoreCard[]>) => {
      state.storeCards = action.payload;
      state.stores = [...action.payload].map((sc) => ({
        storeid: sc.storeid,
        store_name: sc.store_name,
      }));
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
    reQueryStepOne: (state) => {
      state.storeCards = [];
      state.cashierCards = [];
      state.cashiers = [];
      state.stores = [];
    },
    resetCashierState: () => initialState,
  },
});

export const {
  setStoreCards,
  setCashierCards,
  reQueryStepOne,
  resetCashierState,
} = cashiersSlice.actions;
export default cashiersSlice.reducer;
