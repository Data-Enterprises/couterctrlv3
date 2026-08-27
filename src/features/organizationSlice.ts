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

// What a share/unshare actually did, summarised across every user in the
// batch. Worth surfacing rather than a bare success toast: a share reconciles
// each user's store group down to the base group's list, so it can *revoke*
// stores as well as grant them, and nothing else in the UI would say so.
export interface BaseGroupShareSummary {
  action: "share" | "unshare" | "sync";
  userCount: number;
  storesGranted: number;
  storesRevoked: number;
  storesKept: number;
  storeGroupsReused: number;
}

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
  // Base groups the logged-in user is assigned to — their own `active` list
  // from base_groups_assigned_to_user_split. The Base Groups form derives an
  // authorized flag from this rather than tagging each fetched group, because
  // companyGroups is fetched lazily per company and refetched after every
  // create; a single id set can't drift out of sync with those refetches the
  // way per-object flags would.
  authorizedBaseGroupIds: number[];
  // Base group -> users tab. Keyed by userid: true = holds the selected base
  // group, false = doesn't, absent = still resolving.
  baseGroupUserStatus: Record<number, boolean>;
  baseGroupShareSummary: BaseGroupShareSummary | null;
  // Mirrors AssignPanel's right-column selection so the tab can offer Sync over
  // just those users; empty means the Sync action falls back to everyone
  // currently assigned.
  baseGroupSelectedUserIds: number[];
  // Bumped to tell AssignPanel to drop its own right-column selection. The
  // panel owns that state internally, so emptying the mirror above is not
  // enough to clear the highlight after an action consumes the selection.
  baseGroupSelectionResetKey: number;
  // Users staged for a confirmed action, held while its modal is open.
  pendingBaseGroupAction: {
    kind: "unshare" | "sync";
    userids: number[];
  } | null;
}

const initialState: OrganizationState = {
  companies: [],
  refresh: true,
  usersExportOpen: false,
  baseGroupExportOpen: false,
  storesExportOpen: false,
  usersGridFilters: defaultUsersGridFilters,
  authorizedBaseGroupIds: [],
  baseGroupUserStatus: {},
  baseGroupShareSummary: null,
  baseGroupSelectedUserIds: [],
  baseGroupSelectionResetKey: 0,
  pendingBaseGroupAction: null,
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
    setAuthorizedBaseGroupIds: (state, action: PayloadAction<number[]>) => {
      state.authorizedBaseGroupIds = action.payload;
    },
    // A new base group is assigned to its creator immediately after create, so
    // its id is folded in here rather than refetching the whole authorized
    // list just to learn the one id we already have.
    addAuthorizedBaseGroup: (state, action: PayloadAction<number>) => {
      if (!state.authorizedBaseGroupIds.includes(action.payload)) {
        state.authorizedBaseGroupIds.push(action.payload);
      }
    },
    setBaseGroupUserStatus: (
      state,
      action: PayloadAction<Record<number, boolean>>,
    ) => {
      state.baseGroupUserStatus = action.payload;
    },
    mergeBaseGroupUserStatus: (
      state,
      action: PayloadAction<Record<number, boolean>>,
    ) => {
      state.baseGroupUserStatus = {
        ...state.baseGroupUserStatus,
        ...action.payload,
      };
    },
    setBaseGroupShareSummary: (
      state,
      action: PayloadAction<BaseGroupShareSummary | null>,
    ) => {
      state.baseGroupShareSummary = action.payload;
    },
    setBaseGroupSelectedUserIds: (
      state,
      action: PayloadAction<number[]>,
    ) => {
      state.baseGroupSelectedUserIds = action.payload;
    },
    clearBaseGroupSelection: (state) => {
      state.baseGroupSelectedUserIds = [];
      state.baseGroupSelectionResetKey += 1;
    },
    setPendingBaseGroupAction: (
      state,
      action: PayloadAction<OrganizationState["pendingBaseGroupAction"]>,
    ) => {
      state.pendingBaseGroupAction = action.payload;
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
  setAuthorizedBaseGroupIds,
  addAuthorizedBaseGroup,
  setBaseGroupUserStatus,
  mergeBaseGroupUserStatus,
  setBaseGroupShareSummary,
  setBaseGroupSelectedUserIds,
  clearBaseGroupSelection,
  setPendingBaseGroupAction,
  resetOrganizationState,
} = organizationSlice.actions;
export default organizationSlice.reducer;
