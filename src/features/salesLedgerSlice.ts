import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SubSale, HourlySale } from "../interfaces";
import type { StoreSelection } from "../pages/sales/components/LedgerRow";

export type LedgerTab = "subdept" | "hourly";
export type SevFilter = "all" | "critical" | "watch" | "healthy";
export type OpenSheetType = "subdept" | "hourly" | null;

export type Top10Item = {
  productCode: string;
  desc: string;
  tyNet: number;
  tyQty: number;
  lwNet: number | null;
  lwQty: number | null;
  lyNet: number | null;
  lyQty: number | null;
};

interface SalesLedgerState {
  // Navigation (shared desktop + mobile)
  hasSearched: boolean;
  selection: StoreSelection | null;
  tab: LedgerTab;
  selectedDate: string | null;

  // Loading
  ledgerLoading: boolean;
  reportLoading: boolean;
  top10Loading: boolean;

  // Raw API data (shared desktop + mobile)
  rawSubs: SubSale[];
  rawLWSubs: SubSale[];
  rawLYSubs: SubSale[];
  rawHourly: HourlySale[];
  rawLWHourly: HourlySale[];
  rawLYHourly: HourlySale[];

  // Top 10
  top10: Top10Item[];

  // Mobile-specific
  screen: "list" | "report";
  listSevFilter: SevFilter;
  reportSevFilter: SevFilter;
  openSheetType: OpenSheetType;
  openSheetId: number | null;
}

const initialState: SalesLedgerState = {
  hasSearched: false,
  selection: null,
  tab: "subdept",
  selectedDate: null,
  ledgerLoading: false,
  reportLoading: false,
  top10Loading: false,
  rawSubs: [],
  rawLWSubs: [],
  rawLYSubs: [],
  rawHourly: [],
  rawLWHourly: [],
  rawLYHourly: [],
  top10: [],
  screen: "list",
  listSevFilter: "all",
  reportSevFilter: "all",
  openSheetType: null,
  openSheetId: null,
};

const salesLedgerSlice = createSlice({
  name: "salesLedger",
  initialState,
  reducers: {
    setHasSearched(state, action: PayloadAction<boolean>) {
      state.hasSearched = action.payload;
    },
    setLedgerSelection(state, action: PayloadAction<StoreSelection | null>) {
      state.selection = action.payload;
    },
    setLedgerTab(state, action: PayloadAction<LedgerTab>) {
      state.tab = action.payload;
    },
    setLedgerSelectedDate(state, action: PayloadAction<string | null>) {
      state.selectedDate = action.payload;
    },
    setLedgerLoading(state, action: PayloadAction<boolean>) {
      state.ledgerLoading = action.payload;
    },
    setReportLoading(state, action: PayloadAction<boolean>) {
      state.reportLoading = action.payload;
    },
    setTop10Loading(state, action: PayloadAction<boolean>) {
      state.top10Loading = action.payload;
    },
    setRawSubs(state, action: PayloadAction<SubSale[]>) {
      state.rawSubs = action.payload;
    },
    setRawLWSubs(state, action: PayloadAction<SubSale[]>) {
      state.rawLWSubs = action.payload;
    },
    setRawLYSubs(state, action: PayloadAction<SubSale[]>) {
      state.rawLYSubs = action.payload;
    },
    setRawHourly(state, action: PayloadAction<HourlySale[]>) {
      state.rawHourly = action.payload;
    },
    setRawLWHourly(state, action: PayloadAction<HourlySale[]>) {
      state.rawLWHourly = action.payload;
    },
    setRawLYHourly(state, action: PayloadAction<HourlySale[]>) {
      state.rawLYHourly = action.payload;
    },
    setTop10(state, action: PayloadAction<Top10Item[]>) {
      state.top10 = action.payload;
    },
    setScreen(state, action: PayloadAction<"list" | "report">) {
      state.screen = action.payload;
    },
    setListSevFilter(state, action: PayloadAction<SevFilter>) {
      state.listSevFilter = action.payload;
    },
    setReportSevFilter(state, action: PayloadAction<SevFilter>) {
      state.reportSevFilter = action.payload;
    },
    openSheet(state, action: PayloadAction<{ type: "subdept" | "hourly"; id: number }>) {
      state.openSheetType = action.payload.type;
      state.openSheetId = action.payload.id;
      state.top10 = [];
    },
    closeSheet(state) {
      state.openSheetType = null;
      state.openSheetId = null;
      state.top10 = [];
    },
    resetLedger(state) {
      Object.assign(state, initialState);
    },
    // Navigate to store report (mobile)
    navigateToReport(state, action: PayloadAction<StoreSelection>) {
      state.selection = action.payload;
      state.screen = "report";
      state.selectedDate = null;
      state.tab = "subdept";
      state.reportSevFilter = "all";
      state.openSheetType = null;
      state.openSheetId = null;
      state.top10 = [];
    },
    // Go back to list (mobile)
    navigateToList(state) {
      state.screen = "list";
      state.selection = null;
      state.openSheetType = null;
      state.openSheetId = null;
      state.top10 = [];
    },
  },
});

export const {
  setHasSearched,
  setLedgerSelection,
  setLedgerTab,
  setLedgerSelectedDate,
  setLedgerLoading,
  setReportLoading,
  setTop10Loading,
  setRawSubs,
  setRawLWSubs,
  setRawLYSubs,
  setRawHourly,
  setRawLWHourly,
  setRawLYHourly,
  setTop10,
  setScreen,
  setListSevFilter,
  setReportSevFilter,
  openSheet,
  closeSheet,
  resetLedger,
  navigateToReport,
  navigateToList,
} = salesLedgerSlice.actions;

export default salesLedgerSlice.reducer;
