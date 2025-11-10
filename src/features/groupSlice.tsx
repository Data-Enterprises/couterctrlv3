import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type Group = {
  id: number;
  userid: number;
  group_name: string;
};

export type FilterOption = "all" | "active" | "inactive";

export interface GroupState {
  groups: Group[];
  selectedGroup: Group | null;
  refreshGroups: boolean;
  createInput: string;
  filterOption: FilterOption;
}

export const initialState: GroupState = {
  groups: [],
  refreshGroups: false,
  createInput: "",
  filterOption: "all",
  selectedGroup: null,
};

const groupSlice = createSlice({
  name: "group",
  initialState,
  reducers: {
    setGroups(state, action: PayloadAction<Group[]>) {
      state.groups = action.payload;
    },
    setSelectedGroup(state, action: PayloadAction<Group | null>) {
      state.selectedGroup = action.payload;
    },
    setRefreshGroups(state, action: PayloadAction<boolean>) {
      state.refreshGroups = action.payload;
    },
    setCreateInput(state, action: PayloadAction<string>) {
      state.createInput = action.payload;
    },
    setFilterOption(state, action: PayloadAction<FilterOption>) {
      state.filterOption = action.payload;
    },
    resetGroupState: () => initialState,
  },
});

export const {
  setGroups,
  setSelectedGroup,
  setRefreshGroups,
  setCreateInput,
  setFilterOption,
  resetGroupState,
} = groupSlice.actions;
export default groupSlice.reducer;
