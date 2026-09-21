/**
 * Dev copy of `features/qsSlice.ts`, mounted at `state.dev.quicksight` and read only
 * by `pages/quicksight/dev`. Edit this one while changing dev quicksight; when dev is
 * promoted, it replaces the prod slice. See src/store/devReducers.ts.
 */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Store } from "../../interfaces";

export interface QuickSightState {
  embedUrl: string;
  qsUsers: string[];
  qsUserAssignedStores: Store[];
  qsUserUnassignedStores: Store[];
  selectedQsUserEmail: string;
  validUser: boolean;
}

interface QsUserStores {
  assigned_stores: Store[];
  unassigned_stores: Store[];
}

const initialState: QuickSightState = {
  embedUrl: "",
  qsUsers: [],
  qsUserAssignedStores: [],
  qsUserUnassignedStores: [],
  selectedQsUserEmail: "",
  validUser: false,
};

const quickSightSlice = createSlice({
  // Distinct from the prod slice's "app": Redux matches actions on this
  // string alone, so sharing it would move prod and dev together.
  name: "devApp",
  initialState,
  reducers: {
    setEmbedUrl: (state, action: PayloadAction<string>) => {
      state.embedUrl = action.payload;
    },
    setQsUsers: (state, action: PayloadAction<string[]>) => {
      state.qsUsers = action.payload;
    },
    setQsUserStores: (state, action: PayloadAction<QsUserStores>) => {
      state.qsUserAssignedStores = action.payload.assigned_stores;
      state.qsUserUnassignedStores = action.payload.unassigned_stores;
    },
    setSelectedQsUserEmail: (state, action: PayloadAction<string>) => {
      state.selectedQsUserEmail = action.payload;
    },
    setValidUser: (state, action: PayloadAction<boolean>) => {
      state.validUser = action.payload;
    },
    resetQsSlice: () => initialState,
  },
});

export const {
  setEmbedUrl,
  setQsUsers,
  setQsUserStores,
  setSelectedQsUserEmail,
  setValidUser,
  resetQsSlice,
} = quickSightSlice.actions;
export default quickSightSlice.reducer;
