import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Company, CompanyBaseGroup } from "../interfaces";

const defaultBG: CompanyBaseGroup = {
  id: 0,
  name: "",
  company: 0,
};

interface BaseGroupState {
  baseGroups: CompanyBaseGroup[];
  selectedGroup: CompanyBaseGroup;
  isDeleting: boolean;
  groupName: string;
  company: Company | null;
}

const initialState: BaseGroupState = {
  baseGroups: [],
  selectedGroup: defaultBG,
  isDeleting: false,
  groupName: "",
  company: null,
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
    setIsDeleting: (state, action: PayloadAction<boolean>) => {
      state.isDeleting = action.payload;
    },
    setGroupName: (state, action: PayloadAction<string>) => {
      state.groupName = action.payload;
    },
    setCompany: (state, action: PayloadAction<Company | null>) => {
      state.company = action.payload;
    },
    resetBaseGroupSlice: () => initialState,
  },
});

export const {
  setBaseGroups,
  setSelectedGroup,
  setIsDeleting,
  setGroupName,
  setCompany,
  resetBaseGroupSlice,
} = baseGroupSlice.actions;
export default baseGroupSlice.reducer;
