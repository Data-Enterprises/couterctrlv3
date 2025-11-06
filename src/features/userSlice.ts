import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { type SecurityQuestion } from "../interfaces";

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
  lastGroup: string;
  lastSearch: string;
  lastSearchType: string;
  lastStoreid: number;
  resetPassword: boolean;
  company: number;
  security: number;
  role: number | string;
  securityQuestionId: number;
  securityQuestion: string;
  questions: SecurityQuestion[];
  newQuestion: NewQuestion;
}

export const initialState: UserState = {
  userid: 0,
  username: "",
  password: "",
  userLevel: 0,
  firstName: "",
  lastName: "",
  lastGroup: "",
  lastSearch: "",
  lastSearchType: "",
  lastStoreid: 0,
  resetPassword: false,
  email: "",
  company: 0,
  security: 0,
  role: userRole.ALL,
  securityQuestionId: 0,
  securityQuestion: "",
  questions: [],
  newQuestion: { id: 0, answer: "" },
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
    setResetPassword: (state, action: PayloadAction<boolean>) => {
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
    setSecurity: (state, action: PayloadAction<number>) => {
      state.security = action.payload;
    },
    setLastGroup: (state, action: PayloadAction<string>) => {
      state.lastGroup = action.payload;
    },
    setLastSearch: (state, action: PayloadAction<string>) => {
      state.lastSearch = action.payload;
    },
    setLastSearchType: (state, action: PayloadAction<string>) => {
      state.lastSearchType = action.payload;
    },
    setRole: (state, action: PayloadAction<number>) => {
      state.role = action.payload;
    },
    setEmail: (state, action: PayloadAction<string>) => {
      state.email = action.payload;
    },
    setSecurityQuestionId: (state, action: PayloadAction<number>) => {
      state.securityQuestionId = action.payload;
    },
    setSecurityQuestion: (state, action: PayloadAction<string>) => {
      state.securityQuestion = action.payload;
    },
    setQuestions: (state, action: PayloadAction<SecurityQuestion[]>) => {
      state.questions = action.payload;
    },
    setNewQuestion: (state, action: PayloadAction<NewQuestion>) => {
      state.newQuestion = action.payload;
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
  setSecurity,
  setLastGroup,
  setLastSearch,
  setLastSearchType,
  setRole,
  setEmail,
  setSecurityQuestionId,
  setSecurityQuestion,
  setQuestions,
  setNewQuestion,
  resetUserSlice,
} = userSlice.actions;

export default userSlice.reducer;
