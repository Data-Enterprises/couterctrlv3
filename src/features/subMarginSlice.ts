import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SubDeptMargin, SubDept } from "../interfaces";

export type MarginWeek = 0 | 1 | 2 | 3 | 4 | 5;

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
  requerySubDeptMargins,
} = subMarginSlice.actions;
export default subMarginSlice.reducer;
