import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  Company,
  CompanyBaseGroup,
  MissingStore,
  Store,
  User,
  UserCompany,
} from "../interfaces";

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

export const allCompFilter: UserCompany = {
  company: 0,
  id: 0,
  name: "All",
  userid: 0,
  username: "",
};

export type AdminFormType = "store_name" | "store_missing_sales" | "";
export type AdminForm = "" | "create" | "update" | "delete" | "store_activity";

interface AdminState {
  companies: Company[];
  dropdownCompanies: Company[];
  users: User[];
  filteredUsers: User[];
  baseGroups: CompanyBaseGroup[];
  userNameFilter: string;
  companyFilter: Company;
  refresh: boolean;
  adminOption: number;
  selectedUser: number;
  companyForm: Company;
  deleteCompanyModalOpen: boolean;
  selectedAdminForm: AdminFormType;
  storesMissingSales: MissingStore[];
  filteredMissingStores: MissingStore[];
  storeNameFilter: string;
  newStoreNameText: string;
  selectedStoreInfo: Store | null;
  selectedCompanyIdFilter: number;
  exportMissingStoresModalOpen: boolean;
  adminForm: AdminForm;
}

const initialState: AdminState = {
  companies: [],
  dropdownCompanies: [],
  users: [],
  filteredUsers: [],
  baseGroups: [],
  userNameFilter: "",
  companyFilter: defaultComp,
  refresh: true,
  adminOption: 1,
  selectedUser: 0,
  companyForm: defaultComp,
  deleteCompanyModalOpen: false,
  selectedAdminForm: "",
  storesMissingSales: [],
  newStoreNameText: "",
  selectedStoreInfo: null,
  selectedCompanyIdFilter: 0,
  exportMissingStoresModalOpen: false,
  filteredMissingStores: [],
  storeNameFilter: "",
  adminForm: "",
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setCompanies: (state, action: PayloadAction<Company[]>) => {
      const temp = { ...defaultComp, name: "All" };
      const result = [temp, ...action.payload];
      state.companies = action.payload;
      state.dropdownCompanies = result;
    },
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = action.payload;
      state.filteredUsers = action.payload;
    },
    setBaseGroups: (state, action: PayloadAction<CompanyBaseGroup[]>) => {
      state.baseGroups = action.payload;
    },
    setUserNameFilter: (state, action: PayloadAction<string>) => {
      const str = action.payload;
      const id = state.companyFilter.id;
      const filtered = [...state.users].filter((user) => {
        const nameCheck = str.length
          ? user.username.toLowerCase().includes(str)
          : true;
        const compCheck = id > 0 ? user.company === id : true;

        return nameCheck && compCheck;
      });

      state.userNameFilter = str;
      state.filteredUsers = filtered;
    },
    setCompanyFilter: (state, action: PayloadAction<Company>) => {
      const id = action.payload.id;
      const str = state.userNameFilter;

      const filtered = [...state.users].filter((user) => {
        const nameCheck = str.length
          ? user.username.toLowerCase().includes(str)
          : true;
        const compCheck = id > 0 ? user.company === id : true;

        return nameCheck && compCheck;
      });

      state.companyFilter = action.payload;
      state.filteredUsers = filtered;
    },
    setRefresh: (state, action: PayloadAction<boolean>) => {
      state.refresh = action.payload;
    },
    setAdminOption: (state, action: PayloadAction<number>) => {
      state.adminOption = action.payload;
    },
    setSelectedUser: (state, action: PayloadAction<number>) => {
      state.selectedUser = action.payload;
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
    setDeleteCompanyModalOpen: (state, action: PayloadAction<boolean>) => {
      state.deleteCompanyModalOpen = action.payload;
    },
    setSelectedAdminForm: (state, action: PayloadAction<AdminFormType>) => {
      state.selectedAdminForm = action.payload;
    },
    setMissingStores: (state, action: PayloadAction<MissingStore[]>) => {
      state.storesMissingSales = action.payload;
      state.filteredMissingStores = action.payload;
    },
    setNewStoreNameText: (state, action: PayloadAction<string>) => {
      state.newStoreNameText = action.payload;
    },
    setSelectedStoreInfo: (state, action: PayloadAction<Store | null>) => {
      state.selectedStoreInfo = action.payload;
    },
    setExportMissingStoresModalOpen: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.exportMissingStoresModalOpen = action.payload;
    },
    setStoreNameFilter: (state, action: PayloadAction<string>) => {
      state.storeNameFilter = action.payload;
      state.filteredMissingStores = state.storesMissingSales.filter((s) =>
        s.store_name.toLowerCase().includes(action.payload.toLowerCase()),
      );
    },
    setAdminForm: (state, action: PayloadAction<AdminForm>) => {
      state.adminForm = action.payload;
    },
    resetAdminState: () => initialState,
  },
});

export const {
  setCompanies,
  setUsers,
  setBaseGroups,
  setUserNameFilter,
  setCompanyFilter,
  setRefresh,
  setAdminOption,
  setSelectedUser,
  setSelectedCompanyForm,
  setDeleteCompanyModalOpen,
  setCompanyForm,
  setSelectedAdminForm,
  setMissingStores,
  setNewStoreNameText,
  setSelectedStoreInfo,
  setExportMissingStoresModalOpen,
  setStoreNameFilter,
  resetCompanyForm,
  resetAdminState,
  setAdminForm,
} = adminSlice.actions;
export default adminSlice.reducer;
