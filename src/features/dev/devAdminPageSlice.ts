/**
 * Dev copy of `features/adminPageSlice.ts`, mounted at `state.dev.adminPage` and read only
 * by `pages/admin/dev`. Edit this one while changing dev admin; when dev is
 * promoted, it replaces the prod slice. See src/store/devReducers.ts.
 */

// Utils
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// Interfaces
import type { Company, Store, StoreWithActivity } from "../../interfaces";
import type { SubDeptCatalogRow, SubDeptExclusionRow } from "../../api/subDeptExclusions";

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

/** The Stores tab's status choice. */
export type StatusFilter = "all" | "open" | "closed";

/** The Sub dept exclusions tab's "every store" choice; matches `ALL_STORES` in its utils. */
export const SUB_EXCL_ALL_STORES = "__all__";

interface AdminPageState {
  companies: Company[];
  companyForm: Company;
  refresh: boolean;
  companyStoresActivity: StoreWithActivity[];
  filteredStoresActivity: StoreWithActivity[];
  isLoadingStoreActivity: boolean;
  storeNameFilter: string;
  adminForm: AdminForm;
  // The Stores tab: its list (null until loaded) and its three filters.
  storeRecords: Store[] | null;
  storeSearch: string;
  storeCompanyFilter: string;
  storeStatusFilter: StatusFilter;
  // The Sub dept exclusions tab: its store list (null until loaded), its
  // filters, and the catalogue and exclusions read for `subExclLoadedFor`.
  subExclStores: Store[] | null;
  subExclCompanyId: string;
  subExclStoreKey: string;
  subExclDays: string;
  subExclSearch: string;
  subExclHashOnly: boolean;
  subExclCatalog: SubDeptCatalogRow[] | null;
  subExclExclusions: SubDeptExclusionRow[];
  /** The scope and window the catalogue was read for (`storeids|days`), so a
   *  return to the tab reuses it instead of reading every store again. */
  subExclLoadedFor: string | null;
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
  storeRecords: null,
  storeSearch: "",
  storeCompanyFilter: "",
  storeStatusFilter: "all",
  subExclStores: null,
  subExclCompanyId: "",
  subExclStoreKey: SUB_EXCL_ALL_STORES,
  subExclDays: "120",
  subExclSearch: "",
  subExclHashOnly: false,
  subExclCatalog: null,
  subExclExclusions: [],
  subExclLoadedFor: null,
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
    setStoreRecords: (state, action: PayloadAction<Store[] | null>) => {
      state.storeRecords = action.payload;
    },
    setStoreSearch: (state, action: PayloadAction<string>) => {
      state.storeSearch = action.payload;
    },
    setStoreCompanyFilter: (state, action: PayloadAction<string>) => {
      state.storeCompanyFilter = action.payload;
    },
    setStoreStatusFilter: (state, action: PayloadAction<StatusFilter>) => {
      state.storeStatusFilter = action.payload;
    },
    setSubExclStores: (state, action: PayloadAction<Store[] | null>) => {
      state.subExclStores = action.payload;
    },
    /** A new company also goes back to every store: a store from the last
     *  company is not a store in this one. */
    setSubExclCompanyId: (state, action: PayloadAction<string>) => {
      state.subExclCompanyId = action.payload;
      state.subExclStoreKey = SUB_EXCL_ALL_STORES;
    },
    setSubExclStoreKey: (state, action: PayloadAction<string>) => {
      state.subExclStoreKey = action.payload;
    },
    setSubExclDays: (state, action: PayloadAction<string>) => {
      state.subExclDays = action.payload;
    },
    setSubExclSearch: (state, action: PayloadAction<string>) => {
      state.subExclSearch = action.payload;
    },
    setSubExclHashOnly: (state, action: PayloadAction<boolean>) => {
      state.subExclHashOnly = action.payload;
    },
    setSubExclCatalog: (
      state,
      action: PayloadAction<{ rows: SubDeptCatalogRow[] | null; loadedFor: string | null }>,
    ) => {
      state.subExclCatalog = action.payload.rows;
      state.subExclLoadedFor = action.payload.loadedFor;
    },
    setSubExclExclusions: (state, action: PayloadAction<SubDeptExclusionRow[]>) => {
      state.subExclExclusions = action.payload;
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
  setStoreRecords,
  setStoreSearch,
  setStoreCompanyFilter,
  setStoreStatusFilter,
  setSubExclStores,
  setSubExclCompanyId,
  setSubExclStoreKey,
  setSubExclDays,
  setSubExclSearch,
  setSubExclHashOnly,
  setSubExclCatalog,
  setSubExclExclusions,
  resetAdminPageState,
} = adminPageSlice.actions;
export default adminPageSlice.reducer;
