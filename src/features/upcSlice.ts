import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UpcData } from "../interfaces";

interface UpcState {
  index: number;
  isLoading: boolean;
  thisYear: UpcData[];
  lastYear: UpcData[];
}

const initialState: UpcState = {
  index: 0,
  isLoading: false,
  thisYear: [],
  lastYear: [],
};

export const upcSlice = createSlice({
  name: "upc",
  initialState,
  reducers: {
    setIndex: (state, action: PayloadAction<number>) => {
      state.index = action.payload;
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setThisYear: (state, action: PayloadAction<UpcData[]>) => {
      state.thisYear = action.payload;
    },
    setLastYear: (state, action: PayloadAction<UpcData[]>) => {
      state.lastYear = action.payload;
    },
    resetUpcState: () => initialState,
  },
});

export const {
  setIndex,
  setIsLoading,
  setThisYear,
  setLastYear,
  resetUpcState,
} = upcSlice.actions;
export default upcSlice.reducer;
