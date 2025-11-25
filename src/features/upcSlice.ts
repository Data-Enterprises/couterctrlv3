import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UpcData } from "../interfaces";

interface UpcState {
  index: number;
  fileName: string;
  selectedMode: number;
  dataLoaded: boolean;
  isLoading: boolean;
  thisYear: UpcData[];
  lastYear: UpcData[];
}

const initialState: UpcState = {
  index: 0,
  fileName: "",
  selectedMode: 0,
  dataLoaded: false,
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
    setFileName: (state, action: PayloadAction<string>) => {
      state.fileName = action.payload;
    },
    setDataLoaded: (state, action: PayloadAction<boolean>) => {
      state.dataLoaded = action.payload;
    },
    setSelectedMode: (state, action: PayloadAction<number>) => {
      state.selectedMode = action.payload;
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
  setFileName,
  setSelectedMode,
  setDataLoaded,
  setIsLoading,
  setThisYear,
  setLastYear,
  resetUpcState,
} = upcSlice.actions;
export default upcSlice.reducer;
