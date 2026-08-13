import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SubSale, HourlySale, CatSale } from "../interfaces";
import type { StoreSelection } from "../pages/sales/components/LedgerRow";
import type { ThresholdValue } from "../components/filters/ThresholdFilter";

export type GradingMetric = "sales" | "qty";

export type LedgerTab = "subdept" | "hourly" | "category";
export type SevFilter = "all" | "critical" | "watch" | "healthy";
export type OpenSheetType = "subdept" | "hourly" | null;

/** A sub department the user has drilled into. `key` identifies it on screen,
 *  `id` is what the margins endpoint takes — see utils/subDeptIdentity. */
export type SelectedSubDept = { key: string; id: number };

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
  // Present and false only on synthetic rows built for items that sold in
  // LW/LY but not at all this week — lets the item row show "—" for TY
  // instead of a misleading $0. Absent (undefined) means a normal,
  // TY-anchored row — every existing consumer already treats that as active.
  hasTY?: boolean;
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

  // Tracks which store the raw data below was fetched for, so remounting
  // StoreDetailPopup (e.g. after navigating away and back) with the same
  // selection doesn't re-fire the fetch — it just reuses what's already here.
  // Keyed on storeid + store_number, not storeid alone: co-located stores
  // share one id, and keying on the id would serve the first one's data to
  // the second.
  lastFetchedStoreKey: string | null;

  // Raw API data (shared desktop + mobile)
  rawSubs: SubSale[];
  rawLWSubs: SubSale[];
  rawLYSubs: SubSale[];
  rawHourly: HourlySale[];
  rawLWHourly: HourlySale[];
  rawLYHourly: HourlySale[];
  rawCats: CatSale[];
  rawLWCats: CatSale[];
  rawLYCats: CatSale[];

  // Top 10
  top10: Top10Item[];

  // Grading
  gradingMetric: GradingMetric;
  threshold: ThresholdValue | null;
  subDeptThreshold: number | null;
  hourlyThreshold: number | null;
  itemThreshold: number | null;
  categoryThreshold: number | null;

  // Sub dept items export
  exportSubDeptName: string;
  exportSubDeptItems: ExportSubDeptItem[];

  // Popup row selections — persist across tab switches, reset on new store
  /** The sub department the popup is drilled into. Both halves travel together:
   *  `key` is what buckets rows on screen, `id` is what the margins endpoint is
   *  queried with — and when the company doesn't number its departments those
   *  are different values (id is 0 for all of them). */
  selectedSubDept: SelectedSubDept | null;
  selectedSubDeptItems: Top10Item[];
  // Items that sold LW and/or LY but not at all this week, for the same
  // sub dept/day selection — surfaced via the item list's Active/Inactive
  // filter so slow/discontinued items don't stay invisible just because
  // they have no TY row to anchor a normal Top10Item on.
  inactiveSubDeptItems: Top10Item[];
  selectedHour: number | null;
  selectedCatId: number | null;

  // Tracks which store+sub dept+day combination selectedSubDeptItems was
  // fetched for, so remounting PopupSubDeptList with the same selection
  // doesn't re-fire the item-level fetch.
  lastFetchedItemsKey: string | null;

  // Mobile-specific
  screen: "list" | "report";
  listSevFilter: SevFilter;
  reportSevFilter: SevFilter;
  openSheetType: OpenSheetType;
  openSheetId: number | null;
  /** Sub department bucket key for the open sheet — the id as a string, or the
   *  description at companies that don't number their departments. openSheetId
   *  stays numeric because the hourly sheet keys on the hour and because the
   *  margins endpoint is still queried by id. See utils/subDeptIdentity. */
  openSheetKey: string | null;
}

const initialState: SalesLedgerState = {
  hasSearched: false,
  selection: null,
  tab: "subdept",
  selectedDate: null,
  ledgerLoading: false,
  reportLoading: false,
  top10Loading: false,
  lastFetchedStoreKey: null,
  rawSubs: [],
  rawLWSubs: [],
  rawLYSubs: [],
  rawHourly: [],
  rawLWHourly: [],
  rawLYHourly: [],
  rawCats: [],
  rawLWCats: [],
  rawLYCats: [],
  top10: [],
  exportSubDeptName: "",
  exportSubDeptItems: [],
  selectedSubDept: null,
  selectedSubDeptItems: [],
  inactiveSubDeptItems: [],
  selectedHour: null,
  selectedCatId: null,
  lastFetchedItemsKey: null,
  gradingMetric: "sales" as GradingMetric,
  threshold: { op: "gt", amount: 9 } as ThresholdValue,
  subDeptThreshold: 9,
  hourlyThreshold: 9,
  itemThreshold: 9,
  categoryThreshold: 9,
  screen: "list",
  listSevFilter: "all",
  reportSevFilter: "all",
  openSheetType: null,
  openSheetId: null,
  openSheetKey: null,
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
    setLastFetchedStoreKey: (state, action: PayloadAction<string | null>) => {
      state.lastFetchedStoreKey = action.payload;
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
    setRawCats: (state, action: PayloadAction<CatSale[]>) => {
      state.rawCats = action.payload;
    },
    setRawLWCats: (state, action: PayloadAction<CatSale[]>) => {
      state.rawLWCats = action.payload;
    },
    setRawLYCats: (state, action: PayloadAction<CatSale[]>) => {
      state.rawLYCats = action.payload;
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
    setSelectedSubDept: (
      state,
      action: PayloadAction<SelectedSubDept | null>,
    ) => {
      state.selectedSubDept = action.payload;
    },
    setSelectedSubDeptItems: (state, action: PayloadAction<Top10Item[]>) => {
      state.selectedSubDeptItems = action.payload;
    },
    setInactiveSubDeptItems: (state, action: PayloadAction<Top10Item[]>) => {
      state.inactiveSubDeptItems = action.payload;
    },
    setSelectedHour: (state, action: PayloadAction<number | null>) => {
      state.selectedHour = action.payload;
    },
    setSelectedCatId: (state, action: PayloadAction<number | null>) => {
      state.selectedCatId = action.payload;
    },
    setLastFetchedItemsKey: (state, action: PayloadAction<string | null>) => {
      state.lastFetchedItemsKey = action.payload;
    },
    clearPopupSelections: (state) => {
      state.selectedSubDept = null;
      state.selectedSubDeptItems = [];
      state.inactiveSubDeptItems = [];
      state.selectedHour = null;
      state.selectedCatId = null;
      state.lastFetchedItemsKey = null;
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
    setSubDeptThreshold: (state, action: PayloadAction<number | null>) => {
      state.subDeptThreshold = action.payload;
    },
    setHourlyThreshold: (state, action: PayloadAction<number | null>) => {
      state.hourlyThreshold = action.payload;
    },
    setItemThreshold: (state, action: PayloadAction<number | null>) => {
      state.itemThreshold = action.payload;
    },
    setCategoryThreshold: (state, action: PayloadAction<number | null>) => {
      state.categoryThreshold = action.payload;
    },
    setListSevFilter: (state, action: PayloadAction<SevFilter>) => {
      state.listSevFilter = action.payload;
    },
    setReportSevFilter: (state, action: PayloadAction<SevFilter>) => {
      state.reportSevFilter = action.payload;
    },
    openSheet: (
      state,
      action: PayloadAction<{
        type: "subdept" | "hourly";
        id: number;
        /** Omitted by the hourly sheet, where the hour is the whole identity. */
        key?: string;
      }>,
    ) => {
      state.openSheetType = action.payload.type;
      state.openSheetId = action.payload.id;
      state.openSheetKey = action.payload.key ?? String(action.payload.id);
      state.top10 = [];
    },
    closeSheet: (state) => {
      state.openSheetType = null;
      state.openSheetId = null;
      state.openSheetKey = null;
      state.top10 = [];
    },
    resetLedger: (state) => {
      Object.assign(state, initialState);
    },
    reQueryLedger: (state) => {
      state.selection = null;
      state.selectedDate = null;
      state.lastFetchedStoreKey = null;
      state.rawSubs = [];
      state.rawLWSubs = [];
      state.rawLYSubs = [];
      state.rawHourly = [];
      state.rawLWHourly = [];
      state.rawLYHourly = [];
      state.rawCats = [];
      state.rawLWCats = [];
      state.rawLYCats = [];
      state.top10 = [];
      state.exportSubDeptName = "";
      state.exportSubDeptItems = [];
      state.selectedSubDept = null;
      state.selectedSubDeptItems = [];
      state.inactiveSubDeptItems = [];
      state.selectedHour = null;
      state.selectedCatId = null;
      state.lastFetchedItemsKey = null;
      state.screen = "list";
      state.listSevFilter = "all";
      state.reportSevFilter = "all";
      state.openSheetType = null;
      state.openSheetId = null;
      state.openSheetKey = null;
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
      state.openSheetKey = null;
      state.top10 = [];
    },
    // Go back to list (mobile)
    navigateToList(state) {
      state.screen = "list";
      state.selection = null;
      state.openSheetType = null;
      state.openSheetId = null;
      state.openSheetKey = null;
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
  setLastFetchedStoreKey,
  setRawSubs,
  setRawLWSubs,
  setRawLYSubs,
  setRawHourly,
  setRawLWHourly,
  setRawLYHourly,
  setRawCats,
  setRawLWCats,
  setRawLYCats,
  setTop10,
  setExportSubDeptName,
  setExportSubDeptItems,
  setSelectedSubDept,
  setSelectedSubDeptItems,
  setInactiveSubDeptItems,
  setSelectedHour,
  setSelectedCatId,
  setLastFetchedItemsKey,
  clearPopupSelections,
  setScreen,
  setThreshold,
  setSubDeptThreshold,
  setHourlyThreshold,
  setItemThreshold,
  setCategoryThreshold,
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
