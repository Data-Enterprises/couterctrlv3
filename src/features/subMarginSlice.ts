import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SubDeptMargin, SubDept, SubDeptCost } from "../interfaces";
import type { ItemRow, ItemRowMobile } from "../pages/subDepts/display/widgets";
import type { ItemLookupHistory } from "./itemLookupSlice";

export type SubDeptGridView = "item" | "cost";
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
  filteredMargins: SubDeptMargin[];
  selectedSubDeptId: number;
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
  filteredMargins: [],
  selectedSubDeptId: 0,
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
    setSelectedSubDeptId: (state, action: PayloadAction<number>) => {
      state.selectedSubDeptId = action.payload;
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
    setSubDeptFilterText: (state, action: PayloadAction<string>) => {
      state.subDeptFitlerText = action.payload;
    },
    setLoadingSubDepts: (state, action: PayloadAction<boolean>) => {
      state.loadingSubDepts = action.payload;
    },
    setLoadingMargins: (state, action: PayloadAction<boolean>) => {
      state.loadingMargins = action.payload;
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
      state.filteredMargins = [];
      state.selectedSubDeptId = 0;
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
  setFilteredMargins,
  setLoadingMargins,
  setLoadingSubDepts,
  setMargins,
  setSearchValue,
  setSelectedSubDeptId,
  setSelectedWeek,
  setSubDepts,
  setSubDeptFilterText,
  setWeekTrendMargins,
  setWeekTrendMarginsLY,
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
