import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UpcData, Store } from "../interfaces";

interface UpcState {
  index: number;
  fileName: string;
  selectedMode: number;
  radioId: number;
  selectedStores: Store[];
  storeids: string;
  trendPeriods: string;
  dataLoaded: boolean;
  isLoading: boolean;
  thisYear: UpcData[];
  lastYear: UpcData[];
}

const initialState: UpcState = {
  index: 0,
  fileName: "",
  selectedMode: 0,
  radioId: 0,
  selectedStores: [],
  storeids: "", // needed for backend API calls
  trendPeriods: "120",
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
    setRadioId: (state, action: PayloadAction<number>) => {
      state.radioId = action.payload;
    },
    setSelectedStores: (state, action: PayloadAction<Store[]>) => {
      state.selectedStores = action.payload;
      state.storeids = action.payload.map((store) => store.storeid).join(",");
    },
    setTrendPeriods: (state, action: PayloadAction<string>) => {
      state.trendPeriods = action.payload;
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
  setRadioId,
  setSelectedStores,
  setTrendPeriods,
  setFileName,
  setSelectedMode,
  setDataLoaded,
  setIsLoading,
  setThisYear,
  setLastYear,
  resetUpcState,
} = upcSlice.actions;
export default upcSlice.reducer;
