import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Company, CompanyBaseGroup, User } from "../interfaces";

interface AdminState {
  companies: Company[];
  users: User[];
  baseGroups: CompanyBaseGroup[];
}

const initialState: AdminState = {
  companies: [],
  users: [],
  baseGroups: [],
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setCompanies: (state, action: PayloadAction<Company[]>) => {
      state.companies = action.payload;
    },
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = action.payload;
    },
    setBaseGroups: (state, action: PayloadAction<CompanyBaseGroup[]>) => {
      state.baseGroups = action.payload;
    },
  },
});

export const { setCompanies, setUsers, setBaseGroups } = adminSlice.actions;
export default adminSlice.reducer;
