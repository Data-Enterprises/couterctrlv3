import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  CashierCard,
  StoreCard,
  Cashier,
  CashierStore,
  ExceptionType,
  TransactionListItem,
  TransactionOverview,
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

// Which dimension the exception explorer groups its signal list by. Same
// fetched line-item set is re-sliced client-side for all four.
export type ExplorerLens = "store" | "cashier" | "item" | "terminal" | "hour";

interface CashiersState {
  storeCards: StoreCard[];
  filteredStoreCards: StoreCard[];
  cashierCards: CashierCard[];
  filteredCashierCards: CashierCard[];
  cashiers: Cashier[];
  stores: CashierStore[];
  transList: TransactionListItem[];
  transOverviews: TransactionOverview[];
  filteredTransOverviews: TransactionOverview[];
  filteredTransList: TransactionListItem[];
  transDrillDown: TransactionListItem[][];
  selectedSaleType: string;
  selectedStoreCard: number;
  dataView: "stores" | "cashiers" | "transactions" | "";
  loadingStores: boolean;
  loadingCashiers: boolean;
  noStoresFound: boolean;
  transactionLoadingMessage: string;
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
  transModalOpen: boolean;
  noTransactions: boolean;
  exportModalOpen: boolean;
  noRowsFound: boolean;
  fetchingTransactions: boolean;

  // transaction filters
  selectedTransFilter: string;
  transFilterModalOpen: boolean;
  applyTransFilters: boolean;
  transDateFilter: string;
  transCashNameFilter: string;
  transTotalSalesFilter: NumberFilter;
  transTotalQtyFilter: NumberFilter;
  transUpcFilter: string;
  transDescFilter: string;

  // exception explorer (dev desktop) — kept separate from the transList
  // fields above, which the mobile view and its own drill-down still own.
  explorerSaleTypes: string[];
  explorerException: string;
  // What the loaded rows were actually fetched for. Kept apart from
  // explorerException (the dropdown) so changing the dropdown in the re-search
  // overlay without running it can't silently filter the current results away.
  explorerFetchedException: string;
  explorerAllRows: TransactionListItem[];
  explorerLens: ExplorerLens;
  explorerSignalKey: string;
  explorerLoading: boolean;
  explorerMessage: string;
  explorerScopeLabel: string;
  explorerSearched: boolean;
}

const initialState: CashiersState = {
  storeCards: [],
  filteredStoreCards: [],
  cashierCards: [],
  filteredCashierCards: [],
  transList: [],
  filteredTransList: [],
  transDrillDown: [],
  selectedSaleType: "",
  cashiers: [],
  stores: [],
  selectedStoreCard: 0,
  dataView: "",
  loadingStores: false,
  loadingCashiers: false,
  cashierFilterModalOpen: false,
  noStoresFound: false,
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
  transModalOpen: false,
  noTransactions: false,
  exportModalOpen: false,
  noRowsFound: false,
  fetchingTransactions: false,
  transDateFilter: "",
  transCashNameFilter: "",
  transTotalSalesFilter: defaultNumberFilter,
  transTotalQtyFilter: defaultNumberFilter,
  transUpcFilter: "",
  transDescFilter: "",
  transFilterModalOpen: false,
  applyTransFilters: false,
  selectedTransFilter: "",
  transOverviews: [],
  filteredTransOverviews: [],
  transactionLoadingMessage: "",
  explorerSaleTypes: [],
  explorerException: "",
  explorerFetchedException: "",
  explorerAllRows: [],
  explorerLens: "store",
  explorerSignalKey: "",
  explorerLoading: false,
  explorerMessage: "",
  explorerScopeLabel: "",
  explorerSearched: false,
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
    setDataView: (
      state,
      action: PayloadAction<"stores" | "cashiers" | "transactions" | "">,
    ) => {
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
    setSelectedSaleType: (state, action: PayloadAction<string>) => {
      state.selectedSaleType = action.payload;
    },
    setTransList: (state, action: PayloadAction<TransactionListItem[]>) => {
      state.transList = action.payload;
      state.filteredTransList = action.payload;
    },
    setFilteredTransList: (
      state,
      action: PayloadAction<TransactionListItem[]>,
    ) => {
      state.filteredTransList = action.payload;
    },
    setTransactionLoadingMessage: (state, action: PayloadAction<string>) => {
      state.transactionLoadingMessage = action.payload;
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
    setFetchingTransactions: (state, action: PayloadAction<boolean>) => {
      state.fetchingTransactions = action.payload;
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
      state.transList = [];
      state.transDrillDown = [];
      state.selectedSaleType = "";
      state.filteredTransList = [];
      state.transOverviews = [];
      state.transactionLoadingMessage = "";
    },
    reQueryStepTwo: (state) => {
      state.cashierCards = [];
      state.filteredCashierCards = [];
      state.cashiers = [];
      state.loadingCashiers = true;
      state.transList = [];
      state.transDrillDown = [];
      state.transactionLoadingMessage = "";
      state.selectedSaleType = "";
      state.transOverviews = [];
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
      state.transactionLoadingMessage = "";
    },
    setTransModalOpen: (state, action: PayloadAction<boolean>) => {
      state.transModalOpen = action.payload;
    },
    setTransDateFilter: (state, action: PayloadAction<string>) => {
      state.transDateFilter = action.payload;
    },
    setTransCashNameFilter: (state, action: PayloadAction<string>) => {
      state.transCashNameFilter = action.payload;
    },
    setTransUpcFilter: (state, action: PayloadAction<string>) => {
      state.transUpcFilter = action.payload;
    },
    setTransDescFilter: (state, action: PayloadAction<string>) => {
      state.transDescFilter = action.payload;
    },
    setTransTotalSalesFilter: (state, action: PayloadAction<NumberFilter>) => {
      state.transTotalSalesFilter = action.payload;
    },
    setTransTotalQtyFilter: (state, action: PayloadAction<NumberFilter>) => {
      state.transTotalQtyFilter = action.payload;
    },
    setNoTransactions: (state, action: PayloadAction<boolean>) => {
      state.noTransactions = action.payload;
    },
    setTransDrillDown: (
      state,
      action: PayloadAction<TransactionListItem[][]>,
    ) => {
      state.transDrillDown = action.payload;
    },
    setExportModalOpen: (state, action: PayloadAction<boolean>) => {
      state.exportModalOpen = action.payload;
    },
    setNoRowsFound: (state, action: PayloadAction<boolean>) => {
      state.noRowsFound = action.payload;
    },
    setApplyTransFilters: (state, action: PayloadAction<boolean>) => {
      state.applyTransFilters = action.payload;
    },
    setTransFilterModalOpen: (state, action: PayloadAction<boolean>) => {
      state.transFilterModalOpen = action.payload;
    },
    setSelectedTransFilter: (state, action: PayloadAction<string>) => {
      state.selectedTransFilter = action.payload;
    },
    setNoStoresFound: (state, action: PayloadAction<boolean>) => {
      state.noStoresFound = action.payload;
    },
    setTransOverviews: (
      state,
      action: PayloadAction<TransactionOverview[]>,
    ) => {
      state.transOverviews = action.payload;
      state.filteredTransOverviews = action.payload;
    },
    setFilteredTransOverviews: (
      state,
      action: PayloadAction<TransactionOverview[]>,
    ) => {
      state.filteredTransOverviews = action.payload;
    },
    resetAllTransFilters: (state) => {
      state.transDateFilter = "";
      state.transCashNameFilter = "";
      state.transTotalSalesFilter = defaultNumberFilter;
      state.transTotalQtyFilter = defaultNumberFilter;
      state.applyTransFilters = false;
    },
    setExplorerSaleTypes: (state, action: PayloadAction<string[]>) => {
      state.explorerSaleTypes = action.payload;
    },
    setExplorerException: (state, action: PayloadAction<string>) => {
      state.explorerException = action.payload;
    },
    setExplorerLens: (state, action: PayloadAction<ExplorerLens>) => {
      state.explorerLens = action.payload;
      // Signal keys aren't comparable across lenses (a cashier number means
      // nothing to the item lens), so the selection has to clear on switch.
      state.explorerSignalKey = "";
    },
    setExplorerSignalKey: (state, action: PayloadAction<string>) => {
      state.explorerSignalKey = action.payload;
    },
    setExplorerLoading: (state, action: PayloadAction<boolean>) => {
      state.explorerLoading = action.payload;
    },
    setExplorerMessage: (state, action: PayloadAction<string>) => {
      state.explorerMessage = action.payload;
    },
    setExplorerScopeLabel: (state, action: PayloadAction<string>) => {
      state.explorerScopeLabel = action.payload;
    },
    setExplorerRows: (
      state,
      action: PayloadAction<{ rows: TransactionListItem[]; exception: string }>,
    ) => {
      state.explorerAllRows = action.payload.rows;
      state.explorerFetchedException = action.payload.exception;
      state.explorerSignalKey = "";
      state.explorerSearched = true;
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
  setTransList,
  setSelectedSaleType,
  setTransModalOpen,
  setTransDrillDown,
  setNoTransactions,
  setExportModalOpen,
  setNoRowsFound,
  setFetchingTransactions,
  setTransDateFilter,
  setTransCashNameFilter,
  setTransUpcFilter,
  setTransDescFilter,
  setTransTotalSalesFilter,
  setApplyTransFilters,
  setTransFilterModalOpen,
  setSelectedTransFilter,
  resetAllTransFilters,
  setFilteredTransList,
  setNoStoresFound,
  setTransOverviews,
  setTransTotalQtyFilter,
  setFilteredTransOverviews,
  setTransactionLoadingMessage,
  setExplorerSaleTypes,
  setExplorerException,
  setExplorerLens,
  setExplorerSignalKey,
  setExplorerLoading,
  setExplorerMessage,
  setExplorerScopeLabel,
  setExplorerRows,
} = cashiersSlice.actions;
export default cashiersSlice.reducer;
