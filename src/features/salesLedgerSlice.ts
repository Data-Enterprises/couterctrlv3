import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SubSale, HourlySale } from "../interfaces";
import type { StoreSelection } from "../pages/sales/components/LedgerRow";
import type { ThresholdValue } from "../components/filters/ThresholdFilter";

export type GradingMetric = "sales" | "qty";

export type LedgerTab = "subdept" | "hourly";
export type SevFilter = "all" | "critical" | "watch" | "healthy";
export type OpenSheetType = "subdept" | "hourly" | null;

export type Top10Item = {
  productCode: string;
  upc: string;
  desc: string;
  tyNet: number;
  tyQty: number;
  tyWeight: number;
  lwNet: number | null;
  lwQty: number | null;
  lwWeight: number | null;
  lyNet: number | null;
  lyQty: number | null;
  lyWeight: number | null;
};

export type ExportSubDeptItem = Top10Item & { sev: "critical" | "watch" | "healthy" };

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

  // Grading
  gradingMetric: GradingMetric;
  threshold: ThresholdValue | null;
  subDeptThreshold: number;
  hourlyThreshold: number;
  itemThreshold: number;

  // Sub dept items export
  exportSubDeptName: string;
  exportSubDeptItems: ExportSubDeptItem[];

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
  exportSubDeptName: "",
  exportSubDeptItems: [],
  gradingMetric: "sales" as GradingMetric,
  threshold: { op: "gt", amount: 9 } as ThresholdValue,
  subDeptThreshold: 9,
  hourlyThreshold: 9,
  itemThreshold: 9,
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
    setHasSearched: (state, action: PayloadAction<boolean>) => {
      state.hasSearched = action.payload;
    },
    setLedgerSelection: (
      state,
      action: PayloadAction<StoreSelection | null>,
    ) => {
      state.selection = action.payload;
    },
    setLedgerTab: (state, action: PayloadAction<LedgerTab>) => {
      state.tab = action.payload;
    },
    setLedgerSelectedDate: (state, action: PayloadAction<string | null>) => {
      state.selectedDate = action.payload;
    },
    setLedgerLoading: (state, action: PayloadAction<boolean>) => {
      state.ledgerLoading = action.payload;
    },
    setReportLoading: (state, action: PayloadAction<boolean>) => {
      state.reportLoading = action.payload;
    },
    setTop10Loading: (state, action: PayloadAction<boolean>) => {
      state.top10Loading = action.payload;
    },
    setRawSubs: (state, action: PayloadAction<SubSale[]>) => {
      state.rawSubs = action.payload;
    },
    setRawLWSubs: (state, action: PayloadAction<SubSale[]>) => {
      state.rawLWSubs = action.payload;
    },
    setRawLYSubs: (state, action: PayloadAction<SubSale[]>) => {
      state.rawLYSubs = action.payload;
    },
    setRawHourly: (state, action: PayloadAction<HourlySale[]>) => {
      state.rawHourly = action.payload;
    },
    setRawLWHourly: (state, action: PayloadAction<HourlySale[]>) => {
      state.rawLWHourly = action.payload;
    },
    setRawLYHourly: (state, action: PayloadAction<HourlySale[]>) => {
      state.rawLYHourly = action.payload;
    },
    setTop10: (state, action: PayloadAction<Top10Item[]>) => {
      state.top10 = action.payload;
    },
    setExportSubDeptName: (state, action: PayloadAction<string>) => {
      state.exportSubDeptName = action.payload;
    },
    setExportSubDeptItems: (state, action: PayloadAction<ExportSubDeptItem[]>) => {
      state.exportSubDeptItems = action.payload;
    },
    setScreen: (state, action: PayloadAction<"list" | "report">) => {
      state.screen = action.payload;
    },
    setGradingMetric: (state, action: PayloadAction<GradingMetric>) => {
      state.gradingMetric = action.payload;
    },
    setThreshold: (state, action: PayloadAction<ThresholdValue | null>) => {
      state.threshold = action.payload;
    },
    setSubDeptThreshold: (state, action: PayloadAction<number>) => {
      state.subDeptThreshold = action.payload;
    },
    setHourlyThreshold: (state, action: PayloadAction<number>) => {
      state.hourlyThreshold = action.payload;
    },
    setItemThreshold: (state, action: PayloadAction<number>) => {
      state.itemThreshold = action.payload;
    },
    setListSevFilter: (state, action: PayloadAction<SevFilter>) => {
      state.listSevFilter = action.payload;
    },
    setReportSevFilter: (state, action: PayloadAction<SevFilter>) => {
      state.reportSevFilter = action.payload;
    },
    openSheet: (
      state,
      action: PayloadAction<{ type: "subdept" | "hourly"; id: number }>,
    ) => {
      state.openSheetType = action.payload.type;
      state.openSheetId = action.payload.id;
      state.top10 = [];
    },
    closeSheet: (state) => {
      state.openSheetType = null;
      state.openSheetId = null;
      state.top10 = [];
    },
    resetLedger: (state) => {
      Object.assign(state, initialState);
    },
    reQueryLedger: (state) => {
      state.selection = null;
      state.selectedDate = null;
      state.rawSubs = [];
      state.rawLWSubs = [];
      state.rawLYSubs = [];
      state.rawHourly = [];
      state.rawLWHourly = [];
      state.rawLYHourly = [];
      state.top10 = [];
      state.exportSubDeptName = "";
      state.exportSubDeptItems = [];
      state.screen = "list";
      state.listSevFilter = "all";
      state.reportSevFilter = "all";
      state.openSheetType = null;
      state.openSheetId = null;
    },
    // Navigate to store report (mobile)
    navigateToReport: (state, action: PayloadAction<StoreSelection>) => {
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
  setGradingMetric,
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
  setExportSubDeptName,
  setExportSubDeptItems,
  setScreen,
  setThreshold,
  setSubDeptThreshold,
  setHourlyThreshold,
  setItemThreshold,
  setListSevFilter,
  setReportSevFilter,
  openSheet,
  closeSheet,
  resetLedger,
  reQueryLedger,
  navigateToReport,
  navigateToList,
} = salesLedgerSlice.actions;

export default salesLedgerSlice.reducer;
