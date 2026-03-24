import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  CashierCard,
  StoreCard,
  Cashier,
  CashierStore,
  ExceptionType,
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
  operator: ">" | "<" | "=" | "";
  value: number;
};

export const defaultNumberFilter: NumberFilter = {
  operator: "",
  value: 0,
};

export type RiskLevel = "Low" | "Medium" | "High" | "Very High" | "";

interface CashiersState {
  storeCards: StoreCard[];
  filteredStoreCards: StoreCard[];
  cashierCards: CashierCard[];
  filteredCashierCards: CashierCard[];
  cashiers: Cashier[];
  stores: CashierStore[];
  selectedStoreCard: number;
  dataView: "stores" | "cashiers" | "";
  loadingStores: boolean;
  loadingCashiers: boolean;
  // card filters
  exceptionSalesTypes: ExceptionType[];
  exceptionQtyTypes: ExceptionType[];
  cashierFilterModalOpen: boolean;
  cashierNameFilter: string;
  storeNameFilter: string;
  totalSalesFilter: NumberFilter;
  totalQtyFilter: NumberFilter;
  riskLevelFilter: RiskLevel;
  exceptionTierFilter: RiskLevel;
  cashierFilterType: CashierFilterType;
  applyFilters: boolean;
  // applied filters
  cashNameFilterApplied: string;
  storeNameFilterApplied: string;
  totalSalesFilterApplied: NumberFilter;
  totalQtyFilterApplied: NumberFilter;
  riskLevelFilterApplied: RiskLevel;
  exceptionTierFilterApplied: RiskLevel;
}

const initialState: CashiersState = {
  storeCards: [],
  filteredStoreCards: [],
  cashierCards: [],
  filteredCashierCards: [],
  cashiers: [],
  stores: [],
  selectedStoreCard: 0,
  dataView: "",
  loadingStores: false,
  loadingCashiers: false,
  cashierFilterModalOpen: false,
  cashierNameFilter: "",
  storeNameFilter: "",
  totalSalesFilter: defaultNumberFilter,
  totalQtyFilter: defaultNumberFilter,
  riskLevelFilter: "",
  exceptionTierFilter: "",
  cashierFilterType: "",
  applyFilters: false,
  cashNameFilterApplied: "",
  storeNameFilterApplied: "",
  totalSalesFilterApplied: defaultNumberFilter,
  totalQtyFilterApplied: defaultNumberFilter,
  riskLevelFilterApplied: "",
  exceptionTierFilterApplied: "",
  exceptionQtyTypes: [],
  exceptionSalesTypes: [],
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
        state.filteredStoreCards = action.payload;
    },
    setFilteredStoreCards: (state, action: PayloadAction<StoreCard[]>) => {
      state.filteredStoreCards = action.payload;
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
      state.filteredCashierCards = action.payload;
    },
    setFilteredCashierCards: (state, action: PayloadAction<CashierCard[]>) => {
      state.filteredCashierCards = action.payload;
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
    setTotalSalesFilter: (state, action: PayloadAction<NumberFilter>) => {
      state.totalSalesFilter = action.payload;
    },
    setTotalQtyFilter: (state, action: PayloadAction<NumberFilter>) => {
      state.totalQtyFilter = action.payload;
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
    setApplyFilters: (state, action: PayloadAction<boolean>) => {
      state.applyFilters = action.payload;
      state.cashNameFilterApplied = state.cashierNameFilter;
      state.storeNameFilterApplied = state.storeNameFilter;
      state.totalSalesFilterApplied = state.totalSalesFilter;
      state.totalQtyFilterApplied = state.totalQtyFilter;
      state.riskLevelFilterApplied = state.riskLevelFilter;
      state.exceptionTierFilterApplied = state.exceptionTierFilter;
    },
    setExceptionSalesTypes: (state, action: PayloadAction<ExceptionType[]>) => {
      state.exceptionSalesTypes = action.payload;
    },
    setExceptionQtyTypes: (state, action: PayloadAction<ExceptionType[]>) => {
      state.exceptionQtyTypes = action.payload;
    },
    reQueryStepOne: (state) => {
      state.storeCards = [];
      state.cashierCards = [];
      state.filteredCashierCards = [];
      state.filteredStoreCards = [];
      state.cashiers = [];
      state.stores = [];
      state.selectedStoreCard = 0;
      state.dataView = "";
      state.loadingStores = true;
    },
    reQueryStepTwo: (state) => {
      state.cashierCards = [];
      state.filteredCashierCards = [];
      state.cashiers = [];
      state.loadingCashiers = true;
    },
    resetCashierFilters: (state) => {
      state.cashierNameFilter = "";
      state.storeNameFilter = "";
      state.totalSalesFilter = defaultNumberFilter;
      state.totalQtyFilter = defaultNumberFilter;
      state.riskLevelFilter = "";
      state.exceptionTierFilter = "";
      state.cashierFilterType = "";
      state.applyFilters = false;
      state.cashNameFilterApplied = "";
      state.storeNameFilterApplied = "";
      state.totalSalesFilterApplied = defaultNumberFilter;
      state.totalQtyFilterApplied = defaultNumberFilter;
      state.riskLevelFilterApplied = "";
      state.exceptionTierFilterApplied = "";
      state.exceptionQtyTypes = [];
      state.exceptionSalesTypes = [];
      state.filteredStoreCards = state.storeCards;
      state.filteredCashierCards = state.cashierCards;
    },
    resetCashierState: () => initialState,
  },
});

export const {
  setStoreCards,
  setFilteredStoreCards,
  setCashierCards,
  setFilteredCashierCards,
  setDataView,
  setSelectedStoreCard,
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
  setCashierFilterModalOpen,
  setApplyFilters,
  setCashierFilterType,
  setExceptionQtyTypes,
  setExceptionSalesTypes,
} = cashiersSlice.actions;
export default cashiersSlice.reducer;
