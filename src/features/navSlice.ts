import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface NavState {
  isNavOpen: boolean;
  lastRoute: string;
  isModalOpen: boolean;
}

export const initialState: NavState = {
  isNavOpen: false,
  lastRoute: "/",
  isModalOpen: false,
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
    setIsModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isModalOpen = action.payload;
    },
    resetNav: () => initialState,
  },
});

export const { setIsNavOpen, setLastRoute, setIsModalOpen, resetNav } =
  navSlice.actions;
export default navSlice.reducer;
