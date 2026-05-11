import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  BaseGroup,
  Company,
  CompanyBaseGroup,
  Store,
  UserCompany,
} from "../interfaces";

export type StoreWithBGID = Store & { base_group: number };

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
  assignedStoresInBG: Store[];
  unassignedStoresInBG: Store[];
  selectedBG: number;
  storesWithBGID: StoreWithBGID[];
  selectedNewUserStores: StoreWithBGID[];
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
  assignedStoresInBG: [],
  unassignedStoresInBG: [],
  selectedBG: 0,
  storesWithBGID: [],
  selectedNewUserStores: [],
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

      // filtering out if toggling off
      if (found) {
        const filtered = state.selectedBaseGroups.filter((bg) => bg.id !== id);
        state.selectedBaseGroups = filtered;
        state.storesWithBGID = state.storesWithBGID.filter(
          (s) => s.base_group !== id,
        );
        state.selectedNewUserStores = state.selectedNewUserStores.filter(
          (s) => s.base_group !== id,
        );
      } else {
        // toggling on, adding to selected
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
    setActiveBaseGroups: (state, action: PayloadAction<BaseGroup[]>) => {
      state.activeBaseGroups = action.payload;
    },
    setInactiveBaseGroups: (state, action: PayloadAction<BaseGroup[]>) => {
      state.inactiveBaseGroups = action.payload;
    },
    setSelectedNewUserStores: (
      state,
      action: PayloadAction<StoreWithBGID[]>,
    ) => {
      state.selectedNewUserStores = action.payload;
    },
    setBGStores: (
      state,
      action: PayloadAction<{
        assigned: Store[];
        unassigned: Store[];
      }>,
    ) => {
      const { assigned, unassigned } = action.payload;
      state.assignedStoresInBG = assigned;
      state.unassignedStoresInBG = unassigned;
    },
    setSelectedBG: (state, action: PayloadAction<number>) => {
      state.selectedBG = action.payload;
    },
    setStoresWithBGID: (state, action: PayloadAction<StoreWithBGID[]>) => {
      state.storesWithBGID = action.payload;
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
  // setBgsToAssign,
  // setBgsToUnassign,
  setUserBaseGroups,
  setBgIdsToAssign,
  setBgIdsToUnassign,
  resetBgIds,
  resetBaseGroupSlice,
  setActiveBaseGroups,
  setInactiveBaseGroups,
  setBGStores,
  setSelectedBG,
  setStoresWithBGID,
  setSelectedNewUserStores,
} = baseGroupSlice.actions;
export default baseGroupSlice.reducer;
