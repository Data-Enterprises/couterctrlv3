import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SubDeptMargin, SubDept } from "../interfaces";

interface SubMarginState {
  subDepts: SubDept[];
  margins: SubDeptMargin[];
  filteredMargins: SubDeptMargin[];
  selectedSubDeptId: number;
}

const initialState: SubMarginState = {
  subDepts: [],
  margins: [],
  filteredMargins: [],
  selectedSubDeptId: 0,
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
    resetSubMarginState: () => initialState,
  },
});

export const {
  setSubDepts,
  setMargins,
  setFilteredMargins,
  setSelectedSubDeptId,
  resetSubMarginState,
} = subMarginSlice.actions;
export default subMarginSlice.reducer;
