import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../interfaces";

export type FormData = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  user_level: number;
  company: number;
  confirmPassword: string;
  role: number;
};

interface UsersState {
  users: User[];
  userInfo: FormData;
}

type FormUpdate = {
  key: keyof FormData;
  value: string | number;
};

const defaultInfo: FormData = {
  username: "",
  email: "",
  firstName: "",
  lastName: "",
  password: "",
  user_level: 0,
  company: 0,
  confirmPassword: "",
  role: 9,
};

const initialState: UsersState = {
  users: [],
  userInfo: defaultInfo,
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
    resetUserInfo: (state) => {
      state.userInfo = defaultInfo;
    },
  },
});

export const { setUsers, setUserInfo, resetUserInfo } = usersSlice.actions;
export default usersSlice.reducer;
