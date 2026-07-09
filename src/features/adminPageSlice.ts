import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Company, StoreWithActivity } from "../interfaces";

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

export type AdminForm = "create" | "update" | "delete" | "store_activity";

interface AdminPageState {
  companies: Company[];
  companyForm: Company;
  refresh: boolean;
  deleteCompanyModalOpen: boolean;
  companyStoresActivity: StoreWithActivity[];
  filteredStoresActivity: StoreWithActivity[];
  isLoadingStoreActivity: boolean;
  storeNameFilter: string;
  adminForm: AdminForm;
}

const initialState: AdminPageState = {
  companies: [],
  companyForm: defaultComp,
  refresh: true,
  deleteCompanyModalOpen: false,
  companyStoresActivity: [],
  filteredStoresActivity: [],
  isLoadingStoreActivity: false,
  storeNameFilter: "",
  adminForm: "create",
};

const adminPageSlice = createSlice({
  name: "adminPage",
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
    setDeleteCompanyModalOpen: (state, action: PayloadAction<boolean>) => {
      state.deleteCompanyModalOpen = action.payload;
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
    resetAdminPageState: () => initialState,
  },
});

export const {
  setCompanies,
  setSelectedCompanyForm,
  setCompanyForm,
  resetCompanyForm,
  setRefresh,
  setDeleteCompanyModalOpen,
  setAdminForm,
  setCompanyStoresActivity,
  setFilteredCompanyStoresActivity,
  setIsLoadingStoreActivity,
  setStoreNameFilter,
  resetAdminPageState,
} = adminPageSlice.actions;
export default adminPageSlice.reducer;
