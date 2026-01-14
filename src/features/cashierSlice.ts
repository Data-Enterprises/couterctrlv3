import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  CashierDetails,
  CashierTransaction,
  CashierTrend,
  SaleType,
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
  transactionDrillDown: TransactionListItem[][];
  saleTypes: SaleType[];
  selectedSaleType: string;
  selectedSaleIds: string[];
  cashierSaleIds: string[];
  cashierTableThreshComp: { gt: boolean; lt: boolean };
  transModalOpen: boolean;
  filterModalOpen: boolean;
  filterType: string;
  saleDateFilter: string;
  upcFilter: string;
  descFilter: string;
  totalSalesFilter: number;
  availablePriceTypes: string[];
  selectedPriceTypes: string[];
  fetchingCashierTransactions: boolean;
  selectedStoreId: number;
  noRowsReturned: boolean;
  noTransMsg: boolean;
}

const initialState: CashierState = {
  cashierDetails: [],
  cashierTrends: [],
  cashierTransactions: [],
  saleTypes: [],
  selectedSaleType: "",
  transModalOpen: false,
  cashiers: [],
  chunkedTrends: [],
  chunkedSales: [],
  selectedCashier: { cashier_number: 0, store_number: "" },
  selectedSaleIds: [],
  transList: [],
  cashierSaleIds: [],
  cashierTableThreshComp: { gt: false, lt: false },
  filterModalOpen: false,
  filterType: "",
  saleDateFilter: "",
  upcFilter: "",
  descFilter: "",
  totalSalesFilter: 0,
  availablePriceTypes: [],
  selectedPriceTypes: [],
  fetchingCashierTransactions: false,
  transactionDrillDown: [],
  selectedStoreId: 0,
  noRowsReturned: false,
  noTransMsg: false,
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
    setTransModalOpen: (state, action: PayloadAction<boolean>) => {
      state.transModalOpen = action.payload;
      state.transactionDrillDown = [];
      state.noRowsReturned = false;
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
    setCashierSaleIds: (state, action: PayloadAction<string[]>) => {
      state.cashierSaleIds = action.payload;
    },
    setSaleDateFilter: (state, action: PayloadAction<string>) => {
      state.saleDateFilter = action.payload;
    },
    setUpcFilter: (state, action: PayloadAction<string>) => {
      state.upcFilter = action.payload;
    },
    setDescFilter: (state, action: PayloadAction<string>) => {
      state.descFilter = action.payload;
    },
    setTotalSalesFilter: (state, action: PayloadAction<number>) => {
      state.totalSalesFilter = action.payload;
    },
    setCashierTableThreshComp: (
      state,
      action: PayloadAction<{ gt: boolean; lt: boolean }>
    ) => {
      state.cashierTableThreshComp = action.payload;
    },
    setFilterModalOpen: (state, action: PayloadAction<boolean>) => {
      state.filterModalOpen = action.payload;
    },
    setFilterType: (state, action: PayloadAction<string>) => {
      state.filterType = action.payload;
    },
    setAvailablePriceTypes: (state, action: PayloadAction<string[]>) => {
      state.availablePriceTypes = action.payload;
    },
    setSelectedPriceTypes: (state, action: PayloadAction<string[]>) => {
      state.selectedPriceTypes = action.payload;
    },
    setFetchingCashierTransactions: (state, action: PayloadAction<boolean>) => {
      state.fetchingCashierTransactions = action.payload;
    },
    setTransactionDrillDown: (
      state,
      action: PayloadAction<TransactionListItem[][]>
    ) => {
      state.transactionDrillDown = action.payload;
      if (action.payload.length === 0) {
        state.noRowsReturned = true;
      } else {
        state.noRowsReturned = false;
      }
    },
    setSelectedStoreId: (state, action: PayloadAction<number>) => {
      state.selectedStoreId = action.payload;
    },
    toggleNoTransMsg: (state, action: PayloadAction<boolean>) => {
      state.noTransMsg = action.payload;
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
  setTransModalOpen,
  setCashiers,
  setSelectedCashier,
  setSelectedSaleIds,
  setTransList,
  setCashierSaleIds,
  setSaleDateFilter,
  setUpcFilter,
  setDescFilter,
  setCashierTableThreshComp,
  setFilterModalOpen,
  setFilterType,
  setTotalSalesFilter,
  setAvailablePriceTypes,
  setSelectedPriceTypes,
  setFetchingCashierTransactions,
  setTransactionDrillDown,
  setSelectedStoreId,
  toggleNoTransMsg,
  resetCashierState,
} = cashierSlice.actions;
export default cashierSlice.reducer;
