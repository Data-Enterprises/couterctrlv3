import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Company, CompanyBaseGroup } from "../interfaces";

const defaultBG: CompanyBaseGroup = {
  id: 0,
  name: "",
  company: 0,
};

interface BaseGroupState {
  baseGroups: CompanyBaseGroup[];
  selectedBaseGroups: CompanyBaseGroup[];
  selectedGroup: CompanyBaseGroup;
  isDeleting: boolean;
  groupName: string;
  company: Company | null;
  bgsToAssign: number[];
  bgsToUnassign: number[];
}

const initialState: BaseGroupState = {
  baseGroups: [],
  selectedBaseGroups: [],
  selectedGroup: defaultBG,
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
    setSelectedGroup: (state, action: PayloadAction<CompanyBaseGroup>) => {
      state.selectedGroup = action.payload;
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
    setFilteredOutSelectedBaseGroups: (
      state,
      action: PayloadAction<number>,
    ) => {
      const companyId = action.payload;
      const filteredOut = state.selectedBaseGroups.filter(
        (bg) => bg.company !== companyId,
      );
      state.selectedBaseGroups = filteredOut;
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
  setSelectedGroup,
  setIsDeleting,
  setGroupName,
  setSelectedBaseGroups,
  setCompany,
  setFilteredOutSelectedBaseGroups,
  setAllSelectedBaseGroups,
  setBgsToAssign,
  setBgsToUnassign,
  resetBaseGroupSlice,
} = baseGroupSlice.actions;
export default baseGroupSlice.reducer;
