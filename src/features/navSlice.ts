import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface NavState {
  isNavOpen: boolean;
  activeMenuItem: string;
  lastRoute: string;
}

export const initialState: NavState = {
  isNavOpen: false,
  activeMenuItem: "",
  lastRoute: "",
};

export const navSlice = createSlice({
  name: "nav",
  initialState,
  reducers: {
    setIsNavOpen: (state, action: PayloadAction<boolean>) => {
      state.isNavOpen = action.payload;
    },
    setActiveMenuItem: (state, action: PayloadAction<string>) => {
      state.activeMenuItem = action.payload;
    },
    setLastRoute: (state, action: PayloadAction<string>) => {
      state.lastRoute = action.payload;
    },
  },
});

export const { setIsNavOpen, setActiveMenuItem, setLastRoute } =
  navSlice.actions;
export default navSlice.reducer;
