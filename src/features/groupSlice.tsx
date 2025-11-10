import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { type Group } from "../interfaces";

export interface GroupState {
  groups: Group[];
}

export const initialState: GroupState = {
  groups: [],
};

const groupSlice = createSlice({
  name: "group",
  initialState,
  reducers: {
    setGroups(state, action: PayloadAction<Group[]>) {
      state.groups = action.payload;
    },
    resetGroupState: () => initialState,
  },
});

export const { setGroups, resetGroupState } = groupSlice.actions;
export default groupSlice.reducer;
