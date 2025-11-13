import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User, BaseGroup } from "../interfaces";

export type UserData = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  user_level: number;
  company: number;
  confirm_password: string;
  role: number;
};

type FormUpdate = {
  key: keyof UserData;
  value: string | number;
};

const defaultInfo: UserData = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  user_level: 0,
  company: 0,
  confirm_password: "",
  role: 9,
};

// State for users slice /////////////
interface UsersState {
  users: User[];
  userInfo: UserData;
  baseGroups: BaseGroup[];
  refresh: boolean;
  selectedUserId: number;
}

const initialState: UsersState = {
  users: [],
  userInfo: defaultInfo,
  baseGroups: [],
  refresh: true,
  selectedUserId: 0,
};

export const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = action.payload;
    },
    setUserInfo: (state, action: PayloadAction<FormUpdate>) => {
      const { key, value } = action.payload;
      if (key === "role" || key === "user_level" || key === "company") {
        state.userInfo = { ...state.userInfo, [key]: value as number };
      } else {
        state.userInfo = { ...state.userInfo, [key]: value as string };
      }
    },
    setSelectedUserInfo: (state, action: PayloadAction<User>) => {
      const {
        username,
        email,
        first_name,
        last_name,
        user_level,
        company,
        role,
        password,
      } = action.payload;
      state.userInfo = {
        ...state.userInfo,
        username,
        email,
        first_name,
        last_name,
        user_level,
        company,
        role: role === null ? 0 : role,
        password: password,
        confirm_password: password,
      };
    },
    setBaseGroups: (state, action: PayloadAction<BaseGroup[]>) => {
      state.baseGroups = action.payload;
    },
    resetUserInfo: (state) => {
      state.userInfo = defaultInfo;
      state.selectedUserId = 0; 
    },
    setRefresh: (state, action: PayloadAction<boolean>) => {
      state.refresh = action.payload;
    },
    setSelectedUserId: (state, action: PayloadAction<number>) => {
      state.selectedUserId = action.payload;
    },
    resetUsersSlice: () => initialState,
  },
});

export const {
  setUsers,
  setUserInfo,
  setSelectedUserInfo,
  resetUserInfo,
  setBaseGroups,
  setRefresh,
  setSelectedUserId,
  resetUsersSlice,
} = usersSlice.actions;
export default usersSlice.reducer;
