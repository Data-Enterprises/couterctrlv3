import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface NavState {
  isNavOpen: boolean;
  lastRoute: string;
}

export const initialState: NavState = {
  isNavOpen: false,
  lastRoute: "/",
};

export const navSlice = createSlice({
  name: "nav",
  initialState,
  reducers: {
    setIsNavOpen: (state, action: PayloadAction<boolean>) => {
      state.isNavOpen = action.payload;
    },
    setLastRoute: (state, action: PayloadAction<string>) => {
      state.lastRoute = action.payload;
    },
    resetNav: () => initialState,
  },
});

export const { setIsNavOpen, setLastRoute, resetNav } =
  navSlice.actions;
export default navSlice.reducer;
