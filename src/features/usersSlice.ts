import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../interfaces";

export type FormData = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  user_level: string;
  company: string;
  confirmPassword: string;
  role: string;
};

interface UsersState {
  users: User[];
  userInfo: FormData;
}

type FormUpdate = {
  key: keyof FormData;
  value: string;
};

const defaultInfo: FormData = {
  username: "",
  email: "",
  firstName: "",
  lastName: "",
  password: "",
  user_level: "",
  company: "",
  confirmPassword: "",
  role: "9",
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
      state.userInfo[key] = value;
    },
    resetUserInfo: (state) => {
      state.userInfo = defaultInfo;
    },
  },
});

export const { setUsers, setUserInfo, resetUserInfo } = usersSlice.actions;
export default usersSlice.reducer;
