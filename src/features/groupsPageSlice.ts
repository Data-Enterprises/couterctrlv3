import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  FilterOption,
  GroupFormType,
  StoreWithGroupStatus,
} from "../interfaces";

/**
 * The Store Groups page's own state: which form is open, what is being typed,
 * the store list being edited.
 *
 * Lived in the session `group` slice, which stays shared because the store
 * picker on every page reads its `groups` and `selectedGroup`. These fields
 * only ever mattered to the Groups page, so they are a page slice — forked for
 * the dev tree like every other page's (features/dev/devGroupsPageSlice).
 */
export interface GroupsPageState {
  refreshGroups: boolean;
  createInput: string;
  filterOption: FilterOption;
  storesWithGroupStatus: StoreWithGroupStatus[];
  selectedForm: GroupFormType;
}

const initialState: GroupsPageState = {
  refreshGroups: false,
  createInput: "",
  filterOption: "all",
  storesWithGroupStatus: [],
  selectedForm: "",
};

const groupsPageSlice = createSlice({
  name: "groupsPage",
  initialState,
  reducers: {
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
    setSelectedForm(state, action: PayloadAction<GroupFormType>) {
      state.selectedForm = action.payload;
    },
    resetGroupsPageState: () => initialState,
  },
});

export const {
  setRefreshGroups,
  setCreateInput,
  setFilterOption,
  setStoresWithGroupStatus,
  updateStoresWithStatus,
  setSelectedForm,
  resetGroupsPageState,
} = groupsPageSlice.actions;
export default groupsPageSlice.reducer;
