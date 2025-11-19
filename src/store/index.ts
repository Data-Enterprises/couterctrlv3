import { configureStore } from "@reduxjs/toolkit";

import appReducer from "../features/appSlice";
import navReducer from "../features/navSlice";
import userReducer from "../features/userSlice";
import searchReducer from "../features/searchSlice";
import salesReducer from "../features/salesSlice";
import groupReducer from "../features/groupSlice";
import storeReducer from "../features/storeSlice";
import usersReducer from "../features/usersSlice";
import forgotPasswordReducer from "../features/forgotPasswordSlice";
import cashierReducer from "../features/cashierSlice";

export const setupStore = () =>
  configureStore({
    reducer: {
      app: appReducer,
      nav: navReducer,
      user: userReducer,
      search: searchReducer,
      sales: salesReducer,
      group: groupReducer,
      stores: storeReducer,
      users: usersReducer,
      forgotPassword: forgotPasswordReducer,
      cashier: cashierReducer,
    },
  });

export type RootState = ReturnType<ReturnType<typeof setupStore>["getState"]>;
export type AppDispatch = ReturnType<typeof setupStore>["dispatch"];

export const store = setupStore(); // singleton for app usage
