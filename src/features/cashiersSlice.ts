import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CashierCard, StoreCard } from "../interfaces";

interface CashiersState {
  storeCards: StoreCard[];
  cashierCards: CashierCard[];
}

const initialState: CashiersState = {
  storeCards: [],
  cashierCards: [],
};

const cashiersSlice = createSlice({
  name: "cashiers",
  initialState,
  reducers: {
    setStoreCards: (state, action: PayloadAction<StoreCard[]>) => {
      state.storeCards = action.payload;
    },
    setCashierCards: (state, action: PayloadAction<CashierCard[]>) => {
      state.cashierCards = action.payload;
    },
    resetCashierState: () => initialState,
  },
});

export const { setStoreCards, setCashierCards, resetCashierState } =
  cashiersSlice.actions;
export default cashiersSlice.reducer;
