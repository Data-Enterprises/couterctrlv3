import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Company, CompanyBaseGroup } from "../interfaces";

interface BaseGroupState {
  baseGroups: CompanyBaseGroup[];
  selectedBaseGroups: CompanyBaseGroup[];
  isDeleting: boolean;
  groupName: string;
  company: Company | null;
  bgsToAssign: number[];
  bgsToUnassign: number[];
}

const initialState: BaseGroupState = {
  baseGroups: [],
  selectedBaseGroups: [],
  isDeleting: false,
  groupName: "",
  company: null,
  bgsToAssign: [],
  bgsToUnassign: [],
};

export const baseGroupSlice = createSlice({
  name: "baseGroup",
  initialState,
  reducers: {
    setBaseGroups: (state, action: PayloadAction<CompanyBaseGroup[]>) => {
      state.baseGroups = action.payload;
    },
    setAllSelectedBaseGroups: (
      state,
      action: PayloadAction<CompanyBaseGroup[]>,
    ) => {
      state.selectedBaseGroups = action.payload;
    },
    setSelectedBaseGroups: (state, action: PayloadAction<CompanyBaseGroup>) => {
      const id = action.payload.id;
      const found = state.selectedBaseGroups.find((bg) => bg.id === id);

      if (found) {
        const filtered = state.selectedBaseGroups.filter((bg) => bg.id !== id);
        state.selectedBaseGroups = filtered;
      } else {
        state.selectedBaseGroups.push(action.payload);
      }
    },
    setIsDeleting: (state, action: PayloadAction<boolean>) => {
      state.isDeleting = action.payload;
    },
    setGroupName: (state, action: PayloadAction<string>) => {
      state.groupName = action.payload;
    },
    setCompany: (state, action: PayloadAction<Company | null>) => {
      state.company = action.payload;
    },
    resetSelectedBaseGroups: (state) => {
      state.baseGroups = [];
      state.selectedBaseGroups = [];
    },
    setBgsToAssign: (state, action: PayloadAction<number[]>) => {
      state.bgsToAssign = action.payload;
    },
    setBgsToUnassign: (state, action: PayloadAction<number[]>) => {
      state.bgsToUnassign = action.payload;
    },
    resetBaseGroupSlice: () => initialState,
  },
});

export const {
  resetSelectedBaseGroups,
  setBaseGroups,
  setIsDeleting,
  setGroupName,
  setSelectedBaseGroups,
  setCompany,
  setAllSelectedBaseGroups,
  setBgsToAssign,
  setBgsToUnassign,
  resetBaseGroupSlice,
} = baseGroupSlice.actions;
export default baseGroupSlice.reducer;
