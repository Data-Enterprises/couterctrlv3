import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  CashierDetails,
  CashierTransaction,
  CashierTrend,
  SaleType,
  TransDrillDown,
} from "../interfaces";

export interface CashierState {
  cashierDetails: CashierDetails[];
  cashierTrends: CashierTrend[];
  cashierTransactions: CashierTransaction[];
  saleTypes: SaleType[];
  selectedSaleTypes: string[];
  selectedSaleType: string;
  cashierTransDrillDown: TransDrillDown[];
}

const initialState: CashierState = {
  cashierDetails: [],
  cashierTrends: [],
  cashierTransactions: [],
  saleTypes: [],
  selectedSaleTypes: [],
  selectedSaleType: "",
  cashierTransDrillDown: [],
};

export const cashierSlice = createSlice({
  name: "cashiers",
  initialState,
  reducers: {
    setCashierDetails: (state, action: PayloadAction<CashierDetails[]>) => {
      state.cashierDetails = action.payload;
    },
    setCashierTrends: (state, action: PayloadAction<CashierTrend[]>) => {
      state.cashierTrends = action.payload;
    },
    setCashierTransactions: (
      state,
      action: PayloadAction<CashierTransaction[]>
    ) => {
      state.cashierTransactions = action.payload;
    },
    setSaleTypes: (state, action: PayloadAction<SaleType[]>) => {
      state.saleTypes = action.payload;
    },
    setSelectedSaleTypes: (state, action: PayloadAction<string>) => {
      const found = state.selectedSaleTypes.find((s) => s === action.payload);
      if (found) {
        state.selectedSaleTypes = state.selectedSaleTypes.filter(
          (s) => s !== action.payload
        );
      } else {
        state.selectedSaleTypes.push(action.payload);
      }
    },
    setSelectedSaleType: (state, action: PayloadAction<string>) => {
      state.selectedSaleType = action.payload;
    },
    setCashierTransDrillDown: (
      state,
      action: PayloadAction<TransDrillDown[]>
    ) => {
      state.cashierTransDrillDown = action.payload;
    },
    resetCashierState: () => initialState,
  },
});

export const {
  setCashierDetails,
  setCashierTrends,
  setCashierTransactions,
  setSaleTypes,
  setSelectedSaleTypes,
  setSelectedSaleType,
  setCashierTransDrillDown,
  resetCashierState,
} = cashierSlice.actions;
export default cashierSlice.reducer;
