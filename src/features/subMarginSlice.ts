import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SubDeptMargin, SubDept } from "../interfaces";
import type { ItemRow } from "../pages/subDepts/display/widgets";

export type MarginWeek = 0 | 1 | 2 | 3 | 4 | 5;
export type ItemFilterType =
  | "upc"
  | "description"
  | "sales"
  | "qty"
  | "cogs"
  | "margin"
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

interface SubMarginState {
  subDepts: SubDept[];
  margins: SubDeptMargin[];
  weekOneMargins: SubDeptMargin[];
  weekTwoMargins: SubDeptMargin[];
  weekThreeMargins: SubDeptMargin[];
  weekFourMargins: SubDeptMargin[];
  filteredMargins: SubDeptMargin[];
  selectedSubDeptId: number;
  subDeptFitlerText: string;
  loadingSubDepts: boolean;
  loadingMargins: boolean;
  selectedWeek: MarginWeek;
  searchValue: number;
  selectedWeekDay: string;
  openExportModal: boolean;

  itemGridData: ItemRow[]; // data for the item grid
  filteredItemGridData: ItemRow[];
  // filters for the item grid
  filterModalOpen: boolean;
  itemFilterType: ItemFilterType;
  filterTextInput: string;
  threshOperator: ThreshOperator;
  upcFilter: string;
  descFilter: string;
  salesFilter: ThresholdFilter;
  qtyFilter: ThresholdFilter;
  cogsFilter: ThresholdFilter;
  marginFilter: ThresholdFilter;
}

const initialState: SubMarginState = {
  subDepts: [],
  margins: [],
  weekOneMargins: [],
  weekTwoMargins: [],
  weekThreeMargins: [],
  weekFourMargins: [],
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
      }
    },
    resetFilters: (state) => {
      state.upcFilter = "";
      state.descFilter = "";
      state.salesFilter = defaultThreshFilter;
      state.qtyFilter = defaultThreshFilter;
      state.cogsFilter = defaultThreshFilter;
      state.marginFilter = defaultThreshFilter;
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
  requerySubDeptMargins,
} = subMarginSlice.actions;
export default subMarginSlice.reducer;
