import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ThresholdValue } from "../components/filters/ThresholdFilter";
import type {
  CashierDetails,
  CashierTransaction,
  CashierTrend,
  SaleType,
  UniqueCashier,
  TransactionListItem,
  TransactionOverview,
} from "../interfaces";

type SelectedCashier = {
  cashier_number: number;
  store_number: string;
};

export interface LossPreventionState {
  // for raw data and the chunked versions for carousel view
  loadingCashierDetails: boolean;
  cashierDetails: CashierDetails[];
  selectedCashierDetails: CashierDetails | null;
  selectedCashierDetailsIdx: number;
  cashierDetailsTrendDirection: number;
  cashierTrends: CashierTrend[];
  baselineDetails: CashierDetails[];
  cashiers: UniqueCashier[];
  selectedCashier: SelectedCashier;
  cashierTransactions: CashierTransaction[];
  transOverviews: TransactionOverview[];
  baselineOverviews: TransactionOverview[];
  transList: TransactionListItem[];
  transactionDrillDown: TransactionListItem[][];
  saleTypes: SaleType[];
  selectedSaleType: string;
  selectedSaleIds: string[];
  cashierSaleIds: string[];
  salesThreshold: ThresholdValue | null;
  qtyThreshold: ThresholdValue | null;
  transModalOpen: boolean;
  filterModalOpen: boolean;
  filterType: string;
  saleDateFilter: string;
  upcFilter: string;
  descFilter: string;
  availablePriceTypes: string[];
  selectedPriceTypes: string[];
  fetchingCashierTransactions: boolean;
  selectedStoreId: number;
  noRowsReturned: boolean;
  noTransMsg: boolean;
  transIdFilter: string;
  gridPages: number;
  currentGridPage: number;
  pageText: string;
  searchString: string;
  transactionLoadingMessage: string;
  viewTransactionsMobile: boolean;
}

const initialState: LossPreventionState = {
  loadingCashierDetails: false,
  cashierDetails: [],
  selectedCashierDetails: null,
  cashierTrends: [],
  baselineDetails: [],
  cashierTransactions: [],
  saleTypes: [],
  selectedSaleType: "",
  transModalOpen: false,
  cashiers: [],
  transOverviews: [],
  baselineOverviews: [],
  selectedCashier: { cashier_number: 0, store_number: "" },
  selectedSaleIds: [],
  transList: [],
  cashierSaleIds: [],
  salesThreshold: null,
  qtyThreshold: null,
  filterModalOpen: false,
  filterType: "",
  saleDateFilter: "",
  upcFilter: "",
  descFilter: "",
  availablePriceTypes: [],
  selectedPriceTypes: [],
  fetchingCashierTransactions: false,
  transactionDrillDown: [],
  selectedStoreId: 0,
  noRowsReturned: false,
  noTransMsg: false,
  transIdFilter: "",
  gridPages: 0,
  currentGridPage: 0,
  pageText: "1",
  searchString: "",
  selectedCashierDetailsIdx: -1,
  cashierDetailsTrendDirection: 0,
  transactionLoadingMessage: "",
  viewTransactionsMobile: false,
};

export const lossPreventionSlice = createSlice({
  name: "lossPreventionLegacy",
  initialState,
  reducers: {
    setLoadingCashierDetails: (state, action: PayloadAction<boolean>) => {
      state.loadingCashierDetails = action.payload;
    },
    setCashierDetails: (state, action: PayloadAction<CashierDetails[]>) => {
      state.cashierDetails = action.payload;
    },
    setCashierTrends: (state, action: PayloadAction<CashierTrend[]>) => {
      state.cashierTrends = action.payload;
    },
    setBaselineDetails: (state, action: PayloadAction<CashierDetails[]>) => {
      state.baselineDetails = action.payload;
    },
    setCashierTransactions: (
      state,
      action: PayloadAction<CashierTransaction[]>,
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
    setTransIdFilter: (state, action: PayloadAction<string>) => {
      state.transIdFilter = action.payload;
    },
    setSalesThreshold: (state, action: PayloadAction<ThresholdValue | null>) => {
      state.salesThreshold = action.payload;
    },
    setQtyThreshold: (state, action: PayloadAction<ThresholdValue | null>) => {
      state.qtyThreshold = action.payload;
    },
    setFilterModalOpen: (state, action: PayloadAction<boolean>) => {
      state.filterModalOpen = action.payload;
    },
    setFilterType: (state, action: PayloadAction<string>) => {
      state.filterType = action.payload;
    },
    setTransactionLoadingMessage: (state, action: PayloadAction<string>) => {
      state.transactionLoadingMessage = action.payload;
    },
    // setAvailablePriceTypes: (state, action: PayloadAction<string[]>) => {
    //   state.availablePriceTypes = action.payload;
    // },
    setSelectedPriceTypes: (state, action: PayloadAction<string[]>) => {
      state.selectedPriceTypes = action.payload;
    },
    setFetchingCashierTransactions: (state, action: PayloadAction<boolean>) => {
      state.fetchingCashierTransactions = action.payload;
    },
    setTransactionDrillDown: (
      state,
      action: PayloadAction<TransactionListItem[][]>,
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
    setGridPages: (state, action: PayloadAction<number>) => {
      state.gridPages = action.payload;
    },
    setCurrentGridPage: (state, action: PayloadAction<number>) => {
      state.currentGridPage = action.payload;
    },
    setPageText: (state, action: PayloadAction<string>) => {
      state.pageText = action.payload;
    },
    // resetGridPages: (state) => {
    //   state.gridPages = 0;
    //   state.currentGridPage = 0;
    //   state.pageText = "1";
    // },
    setSearchString: (state, action: PayloadAction<string>) => {
      state.searchString = action.payload;
    },
    setSelectedCashierDetails: (
      state,
      action: PayloadAction<CashierDetails | null>,
    ) => {
      const data = action.payload;
      state.selectedCashierDetails = data;
      if (data === null) {
        state.selectedCashierDetailsIdx = -1;
      } else {
        const idx = state.cashierDetails.findIndex(
          (c) => c.storeid === data.storeid,
        );
        state.selectedCashierDetailsIdx = idx;
      }
    },
    reQuery: (state) => {
      state.cashierTransactions = [];
      state.selectedSaleIds = [];
      state.cashierSaleIds = [];
      state.transList = [];
      state.transactionDrillDown = [];
      state.noRowsReturned = false;
      state.noTransMsg = false;
      state.availablePriceTypes = [];
      state.cashiers = [];
      state.selectedCashierDetails = null;
      state.selectedCashierDetailsIdx = -1;
      state.selectedCashier = { cashier_number: 0, store_number: "" };
      state.cashierDetailsTrendDirection = 0;
      state.transOverviews = [];
      state.baselineOverviews = [];
      state.transactionLoadingMessage = "";
      if (state.viewTransactionsMobile) {
        state.viewTransactionsMobile = false;
      }
    },
    setTransOverviews: (
      state,
      action: PayloadAction<TransactionOverview[]>,
    ) => {
      state.transOverviews = action.payload;
    },
    setBaselineOverviews: (
      state,
      action: PayloadAction<TransactionOverview[]>,
    ) => {
      state.baselineOverviews = action.payload;
    },
    setViewTransactionsMobile: (state, action: PayloadAction<boolean>) => {
      state.viewTransactionsMobile = action.payload;
    },
    setCashierDetailsTrendDirection: (state, action: PayloadAction<number>) => {
      state.cashierDetailsTrendDirection = action.payload;
    },
    resetCashierSlice: () => initialState,
  },
});

export const {
  setLoadingCashierDetails,
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
  setSalesThreshold,
  setQtyThreshold,
  setFilterModalOpen,
  setFilterType,
  // setAvailablePriceTypes,
  setSelectedPriceTypes,
  setFetchingCashierTransactions,
  setTransactionDrillDown,
  setSelectedStoreId,
  toggleNoTransMsg,
  resetCashierSlice,
  setTransIdFilter,
  setGridPages,
  // resetGridPages,
  setCurrentGridPage,
  setPageText,
  setSearchString,
  reQuery,
  setTransOverviews,
  setBaselineOverviews,
  setBaselineDetails,
  setSelectedCashierDetails,
  setCashierDetailsTrendDirection,
  setTransactionLoadingMessage,
  setViewTransactionsMobile,
} = lossPreventionSlice.actions;
export default lossPreventionSlice.reducer;
