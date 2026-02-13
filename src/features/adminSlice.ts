import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Company, CompanyBaseGroup, User } from "../interfaces";

export const defaultCompFilter: Company = {
  id: 0,
  address: "",
  city: "",
  contact_email: "",
  name: "All",
  phone: "",
  state: "",
  zip: 0,
};

interface AdminState {
  companies: Company[];
  users: User[];
  filteredUsers: User[];
  baseGroups: CompanyBaseGroup[];
  userNameFilter: string;
  companyFilter: Company;
  refresh: boolean;
  adminOption: number;
  selectedUser: number;
}

const initialState: AdminState = {
  companies: [],
  users: [],
  filteredUsers: [],
  baseGroups: [],
  userNameFilter: "",
  companyFilter: defaultCompFilter,
  refresh: true,
  adminOption: 1,
  selectedUser: 0,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setCompanies: (state, action: PayloadAction<Company[]>) => {
      const result = [defaultCompFilter, ...action.payload];
      state.companies = result;
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
  resetAdminState,
} = adminSlice.actions;
export default adminSlice.reducer;
