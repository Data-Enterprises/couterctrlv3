import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Company } from "../interfaces";

// The Users grid's filter/search bar — kept in Redux (not local useState) so
// switching to Create/Detail and back, or navigating away from Organization
// entirely, doesn't wipe out selections the admin already made.
export interface UsersGridFilters {
  companyFilter: string;
  statusFilter: string;
  levelFilter: string;
  roleFilter: string;
  searchText: string;
  usernameFilter: string;
  emailFilter: string;
}

const defaultUsersGridFilters: UsersGridFilters = {
  companyFilter: "",
  statusFilter: "",
  levelFilter: "",
  roleFilter: "",
  searchText: "",
  usernameFilter: "",
  emailFilter: "",
};

interface OrganizationState {
  // Full company directory — only ever fetched/populated for DCR support
  // staff (see BaseGroups.tsx), who need visibility across every client
  // company. Regular users never trigger this fetch; their own companies
  // come from ctx.companies (the login endpoint), not this list.
  companies: Company[];
  refresh: boolean;
  usersExportOpen: boolean;
  baseGroupExportOpen: boolean;
  storesExportOpen: boolean;
  usersGridFilters: UsersGridFilters;
}

const initialState: OrganizationState = {
  companies: [],
  refresh: true,
  usersExportOpen: false,
  baseGroupExportOpen: false,
  storesExportOpen: false,
  usersGridFilters: defaultUsersGridFilters,
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
    setUsersGridFilter: (
      state,
      action: PayloadAction<Partial<UsersGridFilters>>,
    ) => {
      state.usersGridFilters = { ...state.usersGridFilters, ...action.payload };
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
  setUsersGridFilter,
  resetOrganizationState,
} = organizationSlice.actions;
export default organizationSlice.reducer;
