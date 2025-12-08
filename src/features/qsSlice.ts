import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Store } from "../interfaces";

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
  name: "app",
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
  },
});

export const {
  setEmbedUrl,
  setQsUsers,
  setQsUserStores,
  setSelectedQsUserEmail,
  setValidUser,
} = quickSightSlice.actions;
export default quickSightSlice.reducer;
