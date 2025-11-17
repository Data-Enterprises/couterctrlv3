import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type Group = {
  id: number;
  userid: number;
  group_name: string;
};

export type StoreWithGroupStatus = {
  store_number: string;
  store_name: string;
  storeid: number;
  active: 1 | 0;
};

export type FilterOption = "all" | "active" | "inactive";

export interface GroupState {
  groups: Group[];
  selectedGroup: Group | null;
  refreshGroups: boolean;
  createInput: string;
  filterOption: FilterOption;
  storesWithGroupStatus: StoreWithGroupStatus[];
}

export const initialState: GroupState = {
  groups: [],
  refreshGroups: false,
  createInput: "",
  filterOption: "all",
  selectedGroup: null,
  storesWithGroupStatus: [],
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
    setStoresWithGroupStatus(
      state,
      action: PayloadAction<StoreWithGroupStatus[]>
    ) {
      state.storesWithGroupStatus = action.payload;
    },
    updateStoresWithStatus: (state, action: PayloadAction<number>) => {
      const storeId = action.payload;
      state.storesWithGroupStatus = state.storesWithGroupStatus
        .map((store) =>
          store.storeid === storeId
            ? { ...store, active: store.active === 1 ? 0 : 1 }
            : store
        )
        .sort((a, b) => b.active - a.active) as StoreWithGroupStatus[];
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
  setStoresWithGroupStatus,
  updateStoresWithStatus,
  resetGroupState,
} = groupSlice.actions;
export default groupSlice.reducer;
