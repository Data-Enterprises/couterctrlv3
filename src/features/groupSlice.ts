import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type Group = {
  id: number;
  userid: number;
  group_name: string;
  is_shared: boolean;
};

// The blank Group used to clear a selection. Exported so the reset sites
// across the Groups pages share one definition — is_shared was added to Group
// after those literals were written, and each was its own compile error.
export const emptyGroup: Group = {
  id: 0,
  userid: 0,
  group_name: "",
  is_shared: false,
};

/**
 * Session state: the user's groups and the selected one, read by the store
 * picker on every page. The Groups page's own form state is in
 * groupsPageSlice.
 */
export interface GroupState {
  groups: Group[];
  selectedGroup: Group;
}


export const initialState: GroupState = {
  groups: [],
  selectedGroup: emptyGroup,
};

const groupSlice = createSlice({
  name: "group",
  initialState,
  reducers: {
    setGroups(state, action: PayloadAction<Group[]>) {
      state.groups = action.payload;
    },
    setSelectedGroup(state, action: PayloadAction<Group>) {
      state.selectedGroup = action.payload;
    },
    resetGroupState: () => initialState,
  },
});

export const {
  setGroups,
  setSelectedGroup,
  resetGroupState,
} = groupSlice.actions;
export default groupSlice.reducer;
