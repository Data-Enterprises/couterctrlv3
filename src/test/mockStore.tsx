// need to recreate a mock store for testing purposes
import { configureStore } from "@reduxjs/toolkit";

import appReducer from "../features/appSlice";
import navReducer from "../features/navSlice";
import userReducer from "../features/userSlice";

export const mockStore = configureStore({
  reducer: {
    app: appReducer,
    nav: navReducer,
    user: userReducer,
  },
});

