import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Store, UserCompany } from "../interfaces";

export interface NewQuestion {
  id: number;
  answer: string;
}

const userRole = {
  SINGLE_STORE: 1,
  MULTI_STORE: 2,
  SECURITY: 3,
  ACCOUNTING: 4,
  ADMIN_ROLE: 9,
  ALL: "*",
};

export interface UserState {
  userid: number;
  username: string;
  password: string;
  userLevel: number;
  email: string;
  firstName: string;
  lastName: string;
  resetPassword: number;
  company: number;
  companies: UserCompany[];
  // security: number;
  role: number | string;
  securityQuestionId: number;
  assignedStores: Store[];
  unassignedStores: Store[];
  selectedGroupStores: Store[];
  refreshStores: boolean;
}

export const initialState: UserState = {
  userid: 0,
  username: "",
  password: "",
  userLevel: 0,
  firstName: "",
  lastName: "",
  resetPassword: 0,
  email: "",
  company: 0,
  companies: [],
  // security: 0,
  role: userRole.ALL,
  securityQuestionId: 0,
  assignedStores: [],
  unassignedStores: [],
  selectedGroupStores: [],
  refreshStores: false,
};

export const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setUsername: (state, action: PayloadAction<string>) => {
      state.username = action.payload;
    },
    setPassword: (state, action: PayloadAction<string>) => {
      state.password = action.payload;
    },
    setCompany: (state, action: PayloadAction<number>) => {
      state.company = action.payload;
    },
    setResetPassword: (state, action: PayloadAction<number>) => {
      state.resetPassword = action.payload;
    },
    setUserLevel: (state, action: PayloadAction<number>) => {
      state.userLevel = action.payload;
    },
    setUserId: (state, action: PayloadAction<number>) => {
      state.userid = action.payload;
    },
    setFirstName: (state, action: PayloadAction<string>) => {
      state.firstName = action.payload;
    },
    setLastName: (state, action: PayloadAction<string>) => {
      state.lastName = action.payload;
    },
    // setSecurity: (state, action: PayloadAction<number>) => {
    //   state.security = action.payload;
    // },
    setRole: (state, action: PayloadAction<number>) => {
      state.role = action.payload;
    },
    setEmail: (state, action: PayloadAction<string>) => {
      state.email = action.payload;
    },
    setSecurityQuestionId: (state, action: PayloadAction<number>) => {
      state.securityQuestionId = action.payload;
    },
    setAssignedStores: (state, action: PayloadAction<Store[]>) => {
      state.assignedStores = action.payload;
    },
    setUnassignedStores: (state, action: PayloadAction<Store[]>) => {
      state.unassignedStores = action.payload;
    },
    setSelectedGroupStores: (state, action: PayloadAction<Store[]>) => {
      state.selectedGroupStores = action.payload;
    },
    setCompanies: (state, action: PayloadAction<UserCompany[]>) => {
      state.companies = action.payload;
    },
    setRefreshStores: (state, action: PayloadAction<boolean>) => {
      state.refreshStores = action.payload;
    },
    resetUserSlice: () => initialState,
  },
});

export const {
  setUsername,
  setPassword,
  setCompany,
  setResetPassword,
  setUserLevel,
  setUserId,
  setFirstName,
  setLastName,
  // setSecurity,
  setRole,
  setEmail,
  setSecurityQuestionId,
  setAssignedStores,
  setRefreshStores,
  setUnassignedStores,
  setCompanies,
  setSelectedGroupStores,
  resetUserSlice,
} = userSlice.actions;

export default userSlice.reducer;
