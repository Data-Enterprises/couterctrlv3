import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  BaseGroup,
  Company,
  CompanyBaseGroup,
  UserCompany,
} from "../interfaces";

interface BaseGroupState {
  baseGroups: CompanyBaseGroup[];
  selectedBaseGroups: CompanyBaseGroup[];
  activeBaseGroups: BaseGroup[];
  inactiveBaseGroups: BaseGroup[];
  isDeleting: boolean;
  groupName: string;
  company: Company | null;
  bgsToAssign: number[];
  bgsToUnassign: number[];
  userCompany: UserCompany | null;
  bgIdsToAssign: number[];
  bgIdsToUnassign: number[];
}

const initialState: BaseGroupState = {
  baseGroups: [],
  selectedBaseGroups: [],
  activeBaseGroups: [],
  inactiveBaseGroups: [],
  isDeleting: false,
  groupName: "",
  company: null,
  bgsToAssign: [],
  bgsToUnassign: [],
  userCompany: null,
  bgIdsToAssign: [],
  bgIdsToUnassign: [],
};

export const baseGroupSlice = createSlice({
  name: "baseGroup",
  initialState,
  reducers: {
    setBaseGroups: (state, action: PayloadAction<CompanyBaseGroup[]>) => {
      state.baseGroups = action.payload;
    },
    setUserBaseGroups: (
      state,
      action: PayloadAction<{
        active: BaseGroup[];
        inactive: BaseGroup[];
      }>,
    ) => {
      const { active, inactive } = action.payload;
      state.baseGroups = [...active, ...inactive];
      state.activeBaseGroups = active;
      state.inactiveBaseGroups = inactive;
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
    setUserCompany: (state, action: PayloadAction<UserCompany | null>) => {
      state.userCompany = action.payload;
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
    setBgIdsToAssign: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      if (state.bgIdsToAssign.includes(id)) {
        state.bgIdsToAssign = state.bgIdsToAssign.filter((bg) => bg !== id);
      } else {
        state.bgIdsToAssign.push(id);
      }
    },
    setBgIdsToUnassign: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      if (state.bgIdsToUnassign.includes(id)) {
        state.bgIdsToUnassign = state.bgIdsToUnassign.filter((bg) => bg !== id);
      } else {
        state.bgIdsToUnassign.push(id);
      }
    },
    resetBgIds: (state) => {
      state.bgIdsToAssign = [];
      state.bgIdsToUnassign = [];
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
  setUserCompany,
  setAllSelectedBaseGroups,
  setBgsToAssign,
  setBgsToUnassign,
  setUserBaseGroups,
  setBgIdsToAssign,
  setBgIdsToUnassign,
  resetBgIds,
  resetBaseGroupSlice,
} = baseGroupSlice.actions;
export default baseGroupSlice.reducer;
