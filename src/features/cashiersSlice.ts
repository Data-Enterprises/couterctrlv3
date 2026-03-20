import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  CashierCard,
  StoreCard,
  Cashier,
  CashierStore,
} from "../interfaces";

export type CashierFilterType =
  | "cashier_name"
  | "store_name"
  | "total_sales"
  | "total_qty"
  | "total_transactions"
  | "risk_level"
  | "exception_tier"
  | "";
export type NumberFilter = {
  operator: ">" | "<" | "=";
  value: number;
};

export type RiskLevel = "Low" | "Medium" | "High" | "Very High" | "";

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
  // card filters
  cashierFilterModalOpen: boolean;
  cashierNameFilter: string;
  storeNameFilter: string;
  totalSalesFilter: NumberFilter | null;
  totalQtyFilter: NumberFilter | null;
  totalTransactionsFilter: NumberFilter | null;
  riskLevelFilter: RiskLevel;
  exceptionTierFilter: RiskLevel;
  cashierFilterType: CashierFilterType;
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
  cashierFilterModalOpen: false,
  cashierNameFilter: "",
  storeNameFilter: "",
  totalSalesFilter: null,
  totalQtyFilter: null,
  totalTransactionsFilter: null,
  riskLevelFilter: "",
  exceptionTierFilter: "",
  cashierFilterType: "",
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
    setCashierNameFilter: (state, action: PayloadAction<string>) => {
      state.cashierNameFilter = action.payload;
    },
    setStoreNameFilter: (state, action: PayloadAction<string>) => {
      state.storeNameFilter = action.payload;
    },
    setTotalSalesFilter: (
      state,
      action: PayloadAction<NumberFilter | null>,
    ) => {
      state.totalSalesFilter = action.payload;
    },
    setTotalQtyFilter: (state, action: PayloadAction<NumberFilter | null>) => {
      state.totalQtyFilter = action.payload;
    },
    setTotalTransactionsFilter: (
      state,
      action: PayloadAction<NumberFilter | null>,
    ) => {
      state.totalTransactionsFilter = action.payload;
    },
    setRiskLevelFilter: (state, action: PayloadAction<RiskLevel>) => {
      state.riskLevelFilter = action.payload;
    },
    setExceptionTierFilter: (state, action: PayloadAction<RiskLevel>) => {
      state.exceptionTierFilter = action.payload;
    },
    setCashierFilterModalOpen: (state, action: PayloadAction<boolean>) => {
      state.cashierFilterModalOpen = action.payload;
    },
    setCashierFilterType: (state, action: PayloadAction<CashierFilterType>) => {
      state.cashierFilterType = action.payload;
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
    resetCashierFilters: (state) => {
      state.cashierNameFilter = "";
      state.storeNameFilter = "";
      state.totalSalesFilter = null;
      state.totalQtyFilter = null;
      state.totalTransactionsFilter = null;
      state.riskLevelFilter = "";
      state.exceptionTierFilter = "";
      state.cashierFilterType = "";
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
  resetCashierFilters,
  resetCashierState,
  setCashierNameFilter,
  setStoreNameFilter,
  setExceptionTierFilter,
  setRiskLevelFilter,
  setTotalQtyFilter,
  setTotalSalesFilter,
  setTotalTransactionsFilter,
  setCashierFilterModalOpen,
  setCashierFilterType,
} = cashiersSlice.actions;
export default cashiersSlice.reducer;
