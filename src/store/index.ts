import { configureStore } from "@reduxjs/toolkit";

import appReducer from "../features/appSlice";
import navReducer from "../features/navSlice";

export const store = configureStore({
  reducer: {
    app: appReducer,
    nav: navReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
