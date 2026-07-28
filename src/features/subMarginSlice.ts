import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SubDeptMargin, SubDept, SubDeptCost } from "../interfaces";
import type { ItemRow, ItemRowMobile } from "../pages/subDepts/display/widgets";
import type { ItemLookupHistory } from "./itemLookupSlice";

export type SubDeptGridView = "item" | "cost" | "nocost";
export type MarginWeek = 0 | 1 | 2 | 3 | 4 | 5;
export type ItemFilterType =
  | "upc"
  | "description"
  | "sales"
  | "qty"
  | "cogs"
  | "margin"
  | "unitCost"
  | "caseCost"
  | "";

export type ThreshOperator = ">" | "<" | "=" | "";

export type MarginTier = "critical" | "watch" | "healthy";
export type GradingMetric = "margin" | "sales";

/** Store-level totals from sales/weekly, day-matched — the same figure and
 * method the Sales page header uses, so the two headers agree. Summing sub
 * departments is a different quantity and won't reconcile. */
export type StoreSalesTotals = {
  tySales: number;
  lwSales: number;
  lySales: number;
  vsLWSalesPct: number;
  vsLYSalesPct: number;
};

export type SubDeptGrade = {
  tyMarginPct: number;
  lyMarginPct: number;
  ptsDelta: number;
  noCostCount: number;
  tySales: number;
  lySales: number;
  vsLYSalesPct: number;
  lwSales: number;
  lwMarginPct: number;
  lwPtsDelta: number;
  vsLWSalesPct: number;
  tyWeekOneMargins: SubDeptMargin[];
  lyWeekOneMargins: SubDeptMargin[];
  lwWeekOneMargins: SubDeptMargin[];
};

export type ThresholdFilter = {
  operator: ThreshOperator;
  value: number;
};

const defaultThreshFilter: ThresholdFilter = {
  operator: "",
  value: 0,
};

export type MobileMainView = "overview" | "items";
export type MobileSort = "asc" | "desc" | "";
export type SortOption = "total_sales" | "qty" | "margin" | "cogs" | "reset";
export type MSort = {
  total_sales: MobileSort;
  qty: MobileSort;
  cogs: MobileSort;
  margin: MobileSort;
  reset: MobileSort;
};

interface SubMarginState {
  subDepts: SubDept[];
  margins: SubDeptMargin[];
  weekOneMargins: SubDeptMargin[];
  weekTwoMargins: SubDeptMargin[];
  weekThreeMargins: SubDeptMargin[];
  weekFourMargins: SubDeptMargin[];
  weekOneMarginsLY: SubDeptMargin[];
  weekTwoMarginsLY: SubDeptMargin[];
  weekThreeMarginsLY: SubDeptMargin[];
  weekFourMarginsLY: SubDeptMargin[];
  weekFourMarginsLW: SubDeptMargin[];
  filteredMargins: SubDeptMargin[];
  // null = nothing selected. Must not be 0 — sub_department 0 is a real
  // department id in the data, and using it as the sentinel made it
  // unselectable.
  selectedSubDeptId: number | null;
  // Tracks which sub dept + date range + search the week 2-4 trend data
  // below was fetched for, so remounting SubDeptMarginsDev (e.g. after
  // navigating away and back) doesn't blank and re-fire those fetches.
  lastFetchedTrendKey: string | null;
  subDeptFitlerText: string;
  loadingSubDepts: boolean;
  loadingMargins: boolean;
  selectedWeek: MarginWeek;
  searchValue: number;
  selectedWeekDay: string;
  openExportModal: boolean;
  openCostExportModal: boolean;
  subDeptGridView: SubDeptGridView;

  itemGridData: ItemRow[]; // data for the item grid
  filteredItemGridData: ItemRow[];
  subDeptCost: SubDeptCost[]; // for the cost drilldown modal
  filteredCostGridData: SubDeptCost[];
  // filters for the item grid
  filterModalOpen: boolean;
  itemFilterType: ItemFilterType;
  filterTextInput: string;
  threshOperator: ThreshOperator;
  // upc and desc filter for all grids at the bottom right
  upcFilter: string;
  descFilter: string;
  qtyFilter: ThresholdFilter;
  cogsFilter: ThresholdFilter;

  // filters specific to the items grid
  salesFilter: ThresholdFilter;
  marginFilter: ThresholdFilter;

  // filters specific to the cost grid
  unitCostFilter: ThresholdFilter;
  caseCostFilter: ThresholdFilter;

  subDeptGrades: Record<number, SubDeptGrade>;
  gradingThreshold: number | null;
  gradingMetric: GradingMetric;
  loadingGrades: boolean;
  storeSalesTotals: StoreSalesTotals | null;

  // Co-located stores: one storeid, two physical locations. The endpoints are
  // queried by storeid and return both combined, so the page discovers the
  // numbers from the response and lets the user scope to one.
  // See utils/storeIdentity.
  /** Every store_number the current search returned. Length < 2 = ordinary
   *  store, and the location switcher stays hidden. */
  availableStoreNumbers: string[];
  /** Which location is being shown. null = all of them combined. */
  selectedStoreNumber: string | null;

  scannedUpc: string;
  pause: boolean;
  scannedItemHistory: ItemLookupHistory[];
  itemHistoryModalOpen: boolean;
  fetchingItemHistory: boolean;
  processMobileItemData: boolean;
  itemDataMobile: ItemRowMobile[];
  filteredItemDataMobile: ItemRowMobile[];
  filteredItemDataMobileCopy: ItemRowMobile[];
  scannedItemMobile: ItemRowMobile | null;
  searchedItemMobile: ItemRowMobile | null;
  mobileMainView: MobileMainView;
  viewDaily: boolean;
  upcSearch: string;
  mSort: MSort;
  viewTabletCards: boolean;
}

const initialState: SubMarginState = {
  subDepts: [],
  margins: [],
  weekOneMargins: [],
  weekTwoMargins: [],
  weekThreeMargins: [],
  weekFourMargins: [],
  weekOneMarginsLY: [],
  weekTwoMarginsLY: [],
  weekThreeMarginsLY: [],
  weekFourMarginsLY: [],
  weekFourMarginsLW: [],
  filteredMargins: [],
  selectedSubDeptId: null,
  lastFetchedTrendKey: null,
  subDeptFitlerText: "",
  loadingSubDepts: false,
  loadingMargins: false,
  selectedWeek: 0,
  searchValue: 0,
  selectedWeekDay: "",
  filterTextInput: "",
  upcFilter: "",
  descFilter: "",
  salesFilter: defaultThreshFilter,
  qtyFilter: defaultThreshFilter,
  cogsFilter: defaultThreshFilter,
  marginFilter: defaultThreshFilter,
  filterModalOpen: false,
  itemFilterType: "",
  threshOperator: "",
  itemGridData: [],
  filteredItemGridData: [],
  openExportModal: false,
  openCostExportModal: false,
  subDeptCost: [],
  subDeptGridView: "item",
  filteredCostGridData: [],
  caseCostFilter: defaultThreshFilter,
  unitCostFilter: defaultThreshFilter,
  subDeptGrades: {},
  gradingThreshold: 9,
  gradingMetric: "margin",
  loadingGrades: false,
  storeSalesTotals: null,
  availableStoreNumbers: [],
  selectedStoreNumber: null,
  scannedUpc: "",
  pause: true,
  scannedItemHistory: [],
  itemHistoryModalOpen: false,
  fetchingItemHistory: false,
  processMobileItemData: false,
  itemDataMobile: [],
  filteredItemDataMobile: [],
  filteredItemDataMobileCopy: [],
  scannedItemMobile: null,
  searchedItemMobile: null,
  mobileMainView: "overview",
  viewDaily: false,
  upcSearch: "",
  // mobile sort options
  mSort: {
    total_sales: "",
    qty: "",
    cogs: "",
    margin: "",
    reset: "",
  },
  viewTabletCards: true,
};

const subMarginSlice = createSlice({
  name: "subMargin",
  initialState,
  reducers: {
    setSubDepts(state, action: PayloadAction<SubDept[]>) {
      state.subDepts = action.payload;
    },
    setMargins: (state, action: PayloadAction<SubDeptMargin[]>) => {
      state.margins = action.payload;
    },
    setFilteredMargins: (state, action: PayloadAction<SubDeptMargin[]>) => {
      state.filteredMargins = action.payload;
    },
    setSelectedSubDeptId: (state, action: PayloadAction<number | null>) => {
      state.selectedSubDeptId = action.payload;
    },
    setLastFetchedTrendKey: (state, action: PayloadAction<string | null>) => {
      state.lastFetchedTrendKey = action.payload;
    },
    setWeekTrendMargins: (
      state,
      action: PayloadAction<{ data: SubDeptMargin[]; week: number }>,
    ) => {
      // if selecting just one week, this works
      // when fetching the rest of the weeks,
      // the data will still be appended
      const { data, week } = action.payload;
      switch (week) {
        case 1:
          state.weekOneMargins = data;
          break;
        case 2:
          state.weekTwoMargins = data;
          break;
        case 3:
          state.weekThreeMargins = data;
          break;
        case 4:
          state.weekFourMargins = data;
          break;
      }
    },
    setWeekTrendMarginsLY: (
      state,
      action: PayloadAction<{ data: SubDeptMargin[]; week: number }>,
    ) => {
      const { data, week } = action.payload;
      switch (week) {
        case 1:
          state.weekOneMarginsLY = data;
          break;
        case 2:
          state.weekTwoMarginsLY = data;
          break;
        case 3:
          state.weekThreeMarginsLY = data;
          break;
        case 4:
          state.weekFourMarginsLY = data;
          break;
      }
    },
    setWeekTrendMarginsLW: (
      state,
      action: PayloadAction<{ data: SubDeptMargin[]; week: number }>,
    ) => {
      if (action.payload.week === 4) state.weekFourMarginsLW = action.payload.data;
    },
    setSubDeptFilterText: (state, action: PayloadAction<string>) => {
      state.subDeptFitlerText = action.payload;
    },
    setLoadingSubDepts: (state, action: PayloadAction<boolean>) => {
      state.loadingSubDepts = action.payload;
    },
    setLoadingMargins: (state, action: PayloadAction<boolean>) => {
      state.loadingMargins = action.payload;
    },
    setSubDeptGrade(state, action: PayloadAction<{ id: number; grade: SubDeptGrade }>) {
      state.subDeptGrades[action.payload.id] = action.payload.grade;
    },
    // Switching co-located locations re-grades from cached raw data. The
    // grades map is keyed by sub dept id, so it has to be emptied first —
    // otherwise depts that only exist at the other location linger in the list.
    resetSubDeptGrades(state) {
      state.subDeptGrades = {};
    },
    setGradingThreshold(state, action: PayloadAction<number | null>) {
      state.gradingThreshold = action.payload;
    },
    setGradingMetric(state, action: PayloadAction<GradingMetric>) {
      state.gradingMetric = action.payload;
    },
    setLoadingGrades(state, action: PayloadAction<boolean>) {
      state.loadingGrades = action.payload;
    },
    setStoreSalesTotals(state, action: PayloadAction<StoreSalesTotals | null>) {
      state.storeSalesTotals = action.payload;
    },
    setAvailableStoreNumbers(state, action: PayloadAction<string[]>) {
      state.availableStoreNumbers = action.payload;
    },
    setSelectedStoreNumber(state, action: PayloadAction<string | null>) {
      state.selectedStoreNumber = action.payload;
    },
    requerySubDeptMargins: (state) => {
      state.subDepts = [];
      state.margins = [];
      state.weekOneMargins = [];
      state.weekTwoMargins = [];
      state.weekThreeMargins = [];
      state.weekFourMargins = [];
      state.weekOneMarginsLY = [];
      state.weekTwoMarginsLY = [];
      state.weekThreeMarginsLY = [];
      state.weekFourMarginsLY = [];
      state.weekFourMarginsLW = [];
      state.filteredMargins = [];
      state.selectedSubDeptId = null;
      state.lastFetchedTrendKey = null;
      state.subDeptFitlerText = "";
      state.selectedWeek = 0;
      state.selectedWeekDay = "";
      state.upcFilter = "";
      state.descFilter = "";
      state.salesFilter = defaultThreshFilter;
      state.qtyFilter = defaultThreshFilter;
      state.cogsFilter = defaultThreshFilter;
      state.marginFilter = defaultThreshFilter;
      state.itemFilterType = "";
      state.itemGridData = [];
      state.scannedUpc = "";
      state.pause = false;
      state.upcSearch = "";
      state.viewDaily = false;
      state.subDeptGrades = {};
      state.loadingGrades = false;
      // Rediscovered from each new search's response, not carried over — a
      // different store won't have the same locations, or any.
      state.availableStoreNumbers = [];
      state.selectedStoreNumber = null;
    },
    setSelectedWeek: (state, action: PayloadAction<MarginWeek>) => {
      state.selectedWeek = action.payload;
    },
    setSelectedWeekDay: (state, action: PayloadAction<string>) => {
      state.selectedWeekDay = action.payload;
    },
    setSearchValue: (state, action: PayloadAction<number>) => {
      state.searchValue = action.payload;
    },
    setItemFilterType: (state, action: PayloadAction<ItemFilterType>) => {
      state.itemFilterType = action.payload;
    },
    setUpcFilter: (state, action: PayloadAction<string>) => {
      state.upcFilter = action.payload;
    },
    setDescFilter: (state, action: PayloadAction<string>) => {
      state.descFilter = action.payload;
    },
    setThresholdFilter: (
      state,
      action: PayloadAction<{
        filter: keyof SubMarginState;
        value: ThresholdFilter;
      }>,
    ) => {
      const { filter, value } = action.payload;
      switch (filter) {
        case "salesFilter":
          state.salesFilter = value;
          break;
        case "qtyFilter":
          state.qtyFilter = value;
          break;
        case "cogsFilter":
          state.cogsFilter = value;
          break;
        case "marginFilter":
          state.marginFilter = value;
          break;
        case "unitCostFilter":
          state.unitCostFilter = value;
          break;
        case "caseCostFilter":
          state.caseCostFilter = value;
          break;
      }
    },
    resetFilters: (state) => {
      state.upcFilter = "";
      state.descFilter = "";
      state.salesFilter = defaultThreshFilter;
      state.qtyFilter = defaultThreshFilter;
      state.cogsFilter = defaultThreshFilter;
      state.marginFilter = defaultThreshFilter;
      state.caseCostFilter = defaultThreshFilter;
      state.unitCostFilter = defaultThreshFilter;
      state.itemFilterType = "";
      state.threshOperator = "";
      state.filterTextInput = "";
    },
    setFilterTextInput: (state, action: PayloadAction<string>) => {
      state.filterTextInput = action.payload;
    },
    setThreshOperator: (state, action: PayloadAction<ThreshOperator>) => {
      state.threshOperator = action.payload;
    },
    setFilterModalOpen: (state, action: PayloadAction<boolean>) => {
      state.filterModalOpen = action.payload;
    },
    setItemGridData: (state, action: PayloadAction<ItemRow[]>) => {
      state.itemGridData = action.payload;
    },
    setFilteredItemGridData: (state, action: PayloadAction<ItemRow[]>) => {
      state.filteredItemGridData = action.payload;
    },
    setOpenExportModal: (state, action: PayloadAction<boolean>) => {
      state.openExportModal = action.payload;
    },
    setOpenCostExportModal: (state, action: PayloadAction<boolean>) => {
      state.openCostExportModal = action.payload;
    },
    setSubDeptCost: (state, action: PayloadAction<SubDeptCost[]>) => {
      state.subDeptCost = action.payload;
    },
    setSubDeptGridView: (state, action: PayloadAction<SubDeptGridView>) => {
      state.subDeptGridView = action.payload;
    },
    setFilteredCostGridData: (state, action: PayloadAction<SubDeptCost[]>) => {
      state.filteredCostGridData = action.payload;
    },
    handleWeekReset: (state) => {
      state.itemGridData = [];
      state.filteredItemGridData = [];
      state.subDeptCost = [];
      state.filteredCostGridData = [];
      state.selectedWeekDay = "";
      state.subDeptGridView = "item";
    },
    setScannedUpc: (state, action: PayloadAction<string>) => {
      state.scannedUpc = action.payload;
    },
    setPause: (state, action: PayloadAction<boolean>) => {
      state.pause = action.payload;
    },
    setScannedItemHistory: (
      state,
      action: PayloadAction<ItemLookupHistory[]>,
    ) => {
      state.scannedItemHistory = action.payload;
    },
    setItemHistoryModalOpen: (state, action: PayloadAction<boolean>) => {
      state.itemHistoryModalOpen = action.payload;
    },
    setFetchingItemHistory: (state, action: PayloadAction<boolean>) => {
      state.fetchingItemHistory = action.payload;
    },
    setItemDataMobile: (state, action: PayloadAction<ItemRowMobile[]>) => {
      state.itemDataMobile = action.payload;
    },
    setItemDataFilteredMobile: (
      state,
      action: PayloadAction<ItemRowMobile[]>,
    ) => {
      state.filteredItemDataMobile = action.payload;
    },
    setProcessMobileItemData: (state, action: PayloadAction<boolean>) => {
      state.processMobileItemData = action.payload;
    },
    setScannedItemMobile: (
      state,
      action: PayloadAction<ItemRowMobile | null>,
    ) => {
      state.scannedItemMobile = action.payload;
    },
    setSearchedItemMobile: (
      state,
      action: PayloadAction<ItemRowMobile | null>,
    ) => {
      state.searchedItemMobile = action.payload;
    },
    setMobileMainView: (state, action: PayloadAction<MobileMainView>) => {
      state.mobileMainView = action.payload;
    },
    setViewDaily: (state, action: PayloadAction<boolean>) => {
      state.viewDaily = action.payload;
    },
    setUpcSearch: (state, action: PayloadAction<string>) => {
      state.upcSearch = action.payload;
    },
    setMobileSort: (
      state: SubMarginState,
      action: PayloadAction<{ option: SortOption }>,
    ) => {
      const { option } = action.payload; // the key of the mSort obj to be updated
      const currentSort = state.mSort[option]; // the key's current sort value (asc | desc | "")

      // The value to be set to the selected sorting option
      let newSort: MobileSort;
      if (currentSort === "asc") {
        newSort = "desc";
      } else if (currentSort === "desc") {
        newSort = "";
      } else {
        newSort = "asc";
      }

      // Set the sort option's new value
      state.mSort[option] = newSort;

      // reset other sort options
      (Object.keys(state.mSort) as SortOption[]).forEach((key) => {
        if (key !== option && state.mSort[key] !== "") {
          state.mSort[key] = "";
        }
      });
    },
    resetMobileSort: (state) => {
      state.mSort = {
        total_sales: "",
        qty: "",
        cogs: "",
        margin: "",
        reset: "",
      };
    },
    setViewTabletCards: (state, action: PayloadAction<boolean>) => {
      state.viewTabletCards = action.payload;
    },
    resetSubMarginState: () => initialState,
  },
});

export const {
  setSubDeptGrade,
  setGradingThreshold,
  setGradingMetric,
  setLoadingGrades,
  setStoreSalesTotals,
  setAvailableStoreNumbers,
  setSelectedStoreNumber,
  resetSubDeptGrades,
  setFilteredMargins,
  setLoadingMargins,
  setLoadingSubDepts,
  setMargins,
  setSearchValue,
  setSelectedSubDeptId,
  setLastFetchedTrendKey,
  setSelectedWeek,
  setSubDepts,
  setSubDeptFilterText,
  setWeekTrendMargins,
  setWeekTrendMarginsLY,
  setWeekTrendMarginsLW,
  setSelectedWeekDay,
  resetSubMarginState,
  setUpcFilter,
  setDescFilter,
  setThresholdFilter,
  setFilterModalOpen,
  setItemFilterType,
  setFilterTextInput,
  setThreshOperator,
  setItemGridData,
  setOpenExportModal,
  setFilteredItemGridData,
  resetFilters,
  setSubDeptCost,
  setFilteredCostGridData,
  setSubDeptGridView,
  setOpenCostExportModal,
  handleWeekReset,
  requerySubDeptMargins,
  setScannedUpc,
  setPause,
  setScannedItemHistory,
  setItemHistoryModalOpen,
  setFetchingItemHistory,
  setItemDataMobile,
  setItemDataFilteredMobile,
  setProcessMobileItemData,
  setScannedItemMobile,
  setMobileMainView,
  setViewDaily,
  setSearchedItemMobile,
  setUpcSearch,
  setMobileSort,
  resetMobileSort,
  setViewTabletCards,
} = subMarginSlice.actions;
export default subMarginSlice.reducer;
