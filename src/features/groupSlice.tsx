import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type Group = {
  id: number;
  userid: number;
  group_name: string;
};

export interface GroupState {
  groups: Group[];
  refreshGroups: boolean;
  createInput: string;
}

export const initialState: GroupState = {
  groups: [],
  refreshGroups: false,
  createInput: "",
};

const groupSlice = createSlice({
  name: "group",
  initialState,
  reducers: {
    setGroups(state, action: PayloadAction<Group[]>) {
      state.groups = action.payload;
    },
    setRefreshGroups(state, action: PayloadAction<boolean>) {
      state.refreshGroups = action.payload;
    },
    setCreateInput(state, action: PayloadAction<string>) {
      state.createInput = action.payload;
    },
    resetGroupState: () => initialState,
  },
});

export const { setGroups, setRefreshGroups, setCreateInput, resetGroupState } =
  groupSlice.actions;
export default groupSlice.reducer;
