/**
 * Dev copy of `features/organizationSlice.ts`, mounted at `state.dev.organization` and read only
 * by `pages/organization/dev`. Edit this one while changing dev organization; when dev is
 * promoted, it replaces the prod slice. See src/store/devReducers.ts.
 */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

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

// What a share/unshare actually did, summarised across every user in the
// batch. Worth surfacing rather than a bare success toast: a share reconciles
// each user's store group down to the base group's list, so it can *revoke*
// stores as well as grant them, and nothing else in the UI would say so.
interface OrganizationState {
  usersExportOpen: boolean;
  usersGridFilters: UsersGridFilters;
}

const initialState: OrganizationState = {
  usersExportOpen: false,
  usersGridFilters: defaultUsersGridFilters,
};

const organizationSlice = createSlice({
  // Distinct from the prod slice's "organization": Redux matches actions on this
  // string alone, so sharing it would move prod and dev together.
  name: "devOrganization",
  initialState,
  reducers: {
    setUsersExportOpen: (state, action: PayloadAction<boolean>) => {
      state.usersExportOpen = action.payload;
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
  setUsersExportOpen,
  setUsersGridFilter,
  resetOrganizationState,
} = organizationSlice.actions;
export default organizationSlice.reducer;
