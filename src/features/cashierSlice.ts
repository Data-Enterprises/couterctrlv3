import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  CashierDetails,
  CashierTransaction,
  CashierTrend,
  SaleType,
  TransDrillDown,
  UniqueCashier,
  TransactionListItem,
} from "../interfaces";

type SelectedCashier = {
  cashier_number: number;
  store_number: string;
};

export interface CashierState {
  cashierDetails: CashierDetails[];
  cashierTrends: CashierTrend[];
  cashierTransactions: CashierTransaction[];
  saleTypes: SaleType[];
  selectedSaleTypes: string[];
  selectedSaleType: string;
  cashierTransDrillDown: TransDrillDown[];
  transModalOpen: boolean;
  cashiers: UniqueCashier[];
  chunkedTrends: CashierTrend[][];
  chunkedSales: CashierDetails[][];
  selectedCashier: SelectedCashier;
  selectedSaleIds: string[];
  transList: TransactionListItem[];
}

const initialState: CashierState = {
  cashierDetails: [],
  cashierTrends: [],
  cashierTransactions: [],
  saleTypes: [],
  selectedSaleTypes: [],
  selectedSaleType: "",
  cashierTransDrillDown: [],
  transModalOpen: false,
  cashiers: [],
  chunkedTrends: [],
  chunkedSales: [],
  selectedCashier: { cashier_number: 0, store_number: "" },
  selectedSaleIds: [],
  transList: [],
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
    setTransModalOpen: (state, action: PayloadAction<boolean>) => {
      state.transModalOpen = action.payload;
    },
    setCashiers: (state, action: PayloadAction<UniqueCashier[]>) => {
      state.cashiers = action.payload;
    },
    setChunkedTrends: (state, action: PayloadAction<CashierTrend[][]>) => {
      state.chunkedTrends = action.payload;
    },
    setChunkedSales: (state, action: PayloadAction<CashierDetails[][]>) => {
      state.chunkedSales = action.payload;
    },
    setSelectedCashier: (state, action: PayloadAction<SelectedCashier>) => {
      state.selectedCashier = action.payload;
    },
    setSelectedSaleIds: (state, action: PayloadAction<string[]>) => {
      state.selectedSaleIds = action.payload;
    },
    setTransList: (state, action: PayloadAction<TransactionListItem[]>) => {
      state.transList = action.payload;
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
  setTransModalOpen,
  setCashiers,
  setChunkedTrends,
  setChunkedSales,
  setSelectedCashier,
  setSelectedSaleIds,
  setTransList,
  resetCashierState,
} = cashierSlice.actions;
export default cashierSlice.reducer;
