/**
 * Dev copy of `features/adminPageSlice.ts`, mounted at `state.dev.adminPage` and read only
 * by `pages/admin/dev`. Edit this one while changing dev admin; when dev is
 * promoted, it replaces the prod slice. See src/store/devReducers.ts.
 */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Company, Store, StoreWithActivity } from "../../interfaces";

import type { StatusFilter } from "@/pages/admin/dev/interfaces";

export const defaultComp: Company = {
  id: 0,
  address: "",
  city: "",
  contact_email: "",
  name: "",
  phone: "",
  state: "",
  zip: 0,
};

export type AdminForm =
  | "companies"
  | "store_activity"
  | "store_records"
  | "sub_exclusions";

interface AdminPageState {
  companies: Company[];
  companyForm: Company;
  refresh: boolean;
  companyStoresActivity: StoreWithActivity[];
  filteredStoresActivity: StoreWithActivity[];
  isLoadingStoreActivity: boolean;
  storeNameFilter: string;
  adminForm: AdminForm;
  exportOpen: boolean;
  stores: Store[] | null;
  search: string;
  companyFilter: string;
  statusFilter: StatusFilter;
  creating: boolean;
  editing: Store | null;
  deactivating: Store | null;
  saving: boolean;
}

const initialState: AdminPageState = {
  companies: [],
  companyForm: defaultComp,
  refresh: true,
  companyStoresActivity: [],
  filteredStoresActivity: [],
  isLoadingStoreActivity: false,
  storeNameFilter: "",
  adminForm: "companies",
  exportOpen: false,
  stores: null,
  search: "",
  companyFilter: "",
  statusFilter: "all", // "all" is the default
  creating: false,
  editing: null,
  deactivating: null,
  saving: false,
};

const adminPageSlice = createSlice({
  // Distinct from the prod slice's "adminPage": Redux matches actions on this
  // string alone, so sharing it would move prod and dev together.
  name: "devAdminPage",
  initialState,
  reducers: {
    setCompanies: (state, action: PayloadAction<Company[]>) => {
      state.companies = action.payload;
    },
    setSelectedCompanyForm: (state, action: PayloadAction<Company>) => {
      state.companyForm = action.payload;
    },
    setCompanyForm: (
      state,
      action: PayloadAction<{ key: keyof Company; val: string | number }>,
    ) => {
      const { key, val } = action.payload;
      state.companyForm = {
        ...state.companyForm,
        [key]: val,
      };
    },
    resetCompanyForm: (state) => {
      state.companyForm = defaultComp;
    },
    setRefresh: (state, action: PayloadAction<boolean>) => {
      state.refresh = action.payload;
    },
    setAdminForm: (state, action: PayloadAction<AdminForm>) => {
      state.adminForm = action.payload;
    },
    setCompanyStoresActivity: (
      state,
      action: PayloadAction<StoreWithActivity[]>,
    ) => {
      state.companyStoresActivity = action.payload;
      state.filteredStoresActivity = action.payload;
    },
    setFilteredCompanyStoresActivity: (
      state,
      action: PayloadAction<StoreWithActivity[]>,
    ) => {
      state.filteredStoresActivity = action.payload;
    },
    setIsLoadingStoreActivity: (state, action: PayloadAction<boolean>) => {
      state.isLoadingStoreActivity = action.payload;
    },
    setStoreNameFilter: (state, action: PayloadAction<string>) => {
      state.storeNameFilter = action.payload;
    },
    setExportOpen: (state, action: PayloadAction<boolean>) => {
      state.exportOpen = action.payload;
    },
    setStores: (state, action: PayloadAction<Store[] | null>) => {
      state.stores = action.payload;
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    setCompanyFilter: (state, action: PayloadAction<string>) => {
      state.companyFilter = action.payload;
    },
    setStatusFilter: (state, action: PayloadAction<StatusFilter>) => {
      state.statusFilter = action.payload;
    },
    setCreating: (state, action: PayloadAction<boolean>) => {
      state.creating = action.payload;
    },
    setEditing: (state, action: PayloadAction<Store | null>) => {
      state.editing = action.payload;
    },
    setDeactivating: (state, action: PayloadAction<Store | null>) => {
      state.deactivating = action.payload;
    },
    setSaving: (state, action: PayloadAction<boolean>) => {
      state.saving = action.payload;
    },
    resetAdminPageState: () => initialState,
  },
});

export const {
  setCompanies,
  setSelectedCompanyForm,
  setCompanyForm,
  resetCompanyForm,
  setRefresh,
  setAdminForm,
  setCompanyStoresActivity,
  setFilteredCompanyStoresActivity,
  setIsLoadingStoreActivity,
  setStoreNameFilter,
  setExportOpen,
  setStores,
  setSearch,
  setCompanyFilter,
  setStatusFilter,
  setCreating,
  setEditing,
  setDeactivating,
  setSaving,
  resetAdminPageState,
} = adminPageSlice.actions;
export default adminPageSlice.reducer;
