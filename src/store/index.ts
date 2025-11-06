import { configureStore } from "@reduxjs/toolkit";

/**
 * TODO: DO NOT FORGET TO ADD NEW REDUCERS TO THE MOCK STORE IN THE TESTS WHEN ADDING NEW REDUCERS HERE
 */

import appReducer from "../features/appSlice";
import navReducer from "../features/navSlice";
import userReducer from "../features/userSlice";
import searchReducer from "../features/searchSlice";
import salesReducer from "../features/salesSlice";

export const store = configureStore({
  reducer: {
    app: appReducer,
    nav: navReducer,
    user: userReducer,
    search: searchReducer,
    sales: salesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
