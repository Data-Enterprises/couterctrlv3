import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Company } from "../interfaces";

interface OrganizationState {
  companies: Company[];
  refresh: boolean;
  usersExportOpen: boolean;
  baseGroupExportOpen: boolean;
  storesExportOpen: boolean;
}

const initialState: OrganizationState = {
  companies: [],
  refresh: true,
  usersExportOpen: false,
  baseGroupExportOpen: false,
  storesExportOpen: false,
};

const organizationSlice = createSlice({
  name: "organization",
  initialState,
  reducers: {
    setCompanies: (state, action: PayloadAction<Company[]>) => {
      state.companies = action.payload;
    },
    setRefresh: (state, action: PayloadAction<boolean>) => {
      state.refresh = action.payload;
    },
    setUsersExportOpen: (state, action: PayloadAction<boolean>) => {
      state.usersExportOpen = action.payload;
    },
    setBaseGroupExportOpen: (state, action: PayloadAction<boolean>) => {
      state.baseGroupExportOpen = action.payload;
    },
    setStoresExportOpen: (state, action: PayloadAction<boolean>) => {
      state.storesExportOpen = action.payload;
    },
    resetOrganizationState: () => initialState,
  },
});

export const {
  setCompanies,
  setRefresh,
  setUsersExportOpen,
  setBaseGroupExportOpen,
  setStoresExportOpen,
  resetOrganizationState,
} = organizationSlice.actions;
export default organizationSlice.reducer;
