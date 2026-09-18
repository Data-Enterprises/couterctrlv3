/**
 * Dev copy of `features/groupsPageSlice.ts`, mounted at `state.dev.groupsPage` and read only
 * by `pages/groups/dev`. Edit this one while changing dev groups; when dev is
 * promoted, it replaces the prod slice. See src/store/devReducers.ts.
 */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  FilterOption,
  GroupFormType,
  StoreWithGroupStatus,
} from "../../interfaces";

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
  // Distinct from the prod slice's "groupsPage": Redux matches actions on this
  // string alone, so sharing it would move prod and dev together.
  name: "devGroupsPage",
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
