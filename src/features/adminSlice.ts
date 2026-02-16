import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Company, CompanyBaseGroup, User } from "../interfaces";

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
  resetCompanyForm,
  resetAdminState,
} = adminSlice.actions;
export default adminSlice.reducer;
