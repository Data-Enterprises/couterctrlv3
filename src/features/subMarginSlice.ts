import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SubDeptMargin, SubDept } from "../interfaces";

export type MarginWeek = 1 | 2 | 3 | 4;

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
  loadedMargins: {
    weekOne: boolean;
    weekTwo: boolean;
    weekThree: boolean;
    weekFour: boolean;
  };
  selectedWeek: MarginWeek;
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
  loadedMargins: {
    weekOne: false,
    weekTwo: false,
    weekThree: false,
    weekFour: false,
  },
  selectedWeek: 1,
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
      // This reducer will always have a number between 1 and 4 for the week
      // This will be used to display weekly sub dept margin trends
      const { data, week } = action.payload;
      state.margins = data;

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
    setLoadedMargins: (
      state,
      action: PayloadAction<{ week: number; loaded: boolean }>,
    ) => {
      const { week, loaded } = action.payload;
      switch (week) {
        case 1:
          state.loadedMargins.weekOne = loaded;
          break;
        case 2:
          state.loadedMargins.weekTwo = loaded;
          break;
        case 3:
          state.loadedMargins.weekThree = loaded;
          break;
        case 4:
          state.loadedMargins.weekFour = loaded;
          break;
      }
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
      state.loadedMargins = {
        weekOne: false,
        weekTwo: false,
        weekThree: false,
        weekFour: false,
      };
      state.selectedWeek = 1;
    },
    resetAllMargins: (state) => {
      state.margins = [];
      state.weekOneMargins = [];
      state.weekTwoMargins = [];
      state.weekThreeMargins = [];
      state.weekFourMargins = [];
      state.filteredMargins = [];
      state.loadingMargins = true;
      state.loadedMargins = {
        weekOne: false,
        weekTwo: false,
        weekThree: false,
        weekFour: false,
      };
      state.selectedWeek = 1;
    },
    setSelectedWeek: (state, action: PayloadAction<MarginWeek>) => {
      state.selectedWeek = action.payload;
    },
    resetSubMarginState: () => initialState,
  },
});

export const {
  setLoadedMargins,
  setFilteredMargins,
  setLoadingMargins,
  setLoadingSubDepts,
  setMargins,
  setSelectedSubDeptId,
  setSelectedWeek,
  setSubDepts,
  setSubDeptFilterText,
  setWeekTrendMargins,
  resetAllMargins,
  resetSubMarginState,
  requerySubDeptMargins,
} = subMarginSlice.actions;
export default subMarginSlice.reducer;
