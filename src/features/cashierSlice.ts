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
import { chunkData } from "../pages/cashiers";

type SelectedCashier = {
  cashier_number: number;
  store_number: string;
};

export interface CashierState {
  // for raw data and the chunked versions for carousel view
  cashierDetails: CashierDetails[];
  chunkedTrends: CashierTrend[][];
  cashierTrends: CashierTrend[];
  chunkedSales: CashierDetails[][];
  cashiers: UniqueCashier[];
  selectedCashier: SelectedCashier;
  cashierTransactions: CashierTransaction[];
  transList: TransactionListItem[];
  cashierTransDrillDown: TransDrillDown[];
  saleTypes: SaleType[];
  selectedSaleType: string;
  selectedSaleIds: string[];
  transModalOpen: boolean;
}

const initialState: CashierState = {
  cashierDetails: [],
  cashierTrends: [],
  cashierTransactions: [],
  saleTypes: [],
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
      state.chunkedSales = chunkData(action.payload);
    },
    setCashierTrends: (state, action: PayloadAction<CashierTrend[]>) => {
      state.cashierTrends = action.payload;
      state.chunkedTrends = chunkData(action.payload);
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
  setSelectedSaleType,
  setCashierTransDrillDown,
  setTransModalOpen,
  setCashiers,
  setSelectedCashier,
  setSelectedSaleIds,
  setTransList,
  resetCashierState,
} = cashierSlice.actions;
export default cashierSlice.reducer;
