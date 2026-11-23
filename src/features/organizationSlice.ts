
// Utils
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// The Users grid's filter/search bar — kept in Redux (not local useState) so
// switching to Create/Detail and back, or navigating away from Organization
// entirely, doesn't wipe out selections the admin already made.
export interface UsersGridFilters {
  companyFilter: string;
  statusFilter: string;
  levelFilter: string;
  roleFilter: string;
  /** "" for everyone, else `all` (By group) or `selected` (By store) — the
   *  values `access_mode` carries, so the filter compares without mapping. */
  accessFilter: string;
  searchText: string;
  usernameFilter: string;
  emailFilter: string;
}

const defaultUsersGridFilters: UsersGridFilters = {
  companyFilter: "",
  statusFilter: "",
  levelFilter: "",
  roleFilter: "",
  accessFilter: "",
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
  /**
   * Who an open Add or Edit has unsaved changes for ("Bob Smith", "the new
   * user"), or null. The tab bar reads it to ask before a tab switch throws
   * the form away.
   */
  unsavedWizard: string | null;
}

const initialState: OrganizationState = {
  usersExportOpen: false,
  usersGridFilters: defaultUsersGridFilters,
  unsavedWizard: null,
};

const organizationSlice = createSlice({
  name: "organization",
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
    setUnsavedWizard: (state, action: PayloadAction<string | null>) => {
      state.unsavedWizard = action.payload;
    },
    resetOrganizationState: () => initialState,
  },
});

export const {
  setUsersExportOpen,
  setUsersGridFilter,
  setUnsavedWizard,
  resetOrganizationState,
} = organizationSlice.actions;
export default organizationSlice.reducer;
