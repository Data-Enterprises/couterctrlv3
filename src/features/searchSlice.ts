import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Store } from "../interfaces";
import { formatDate, addDays } from "../utils";
import type { Group } from "./groupSlice";

export type SEARCH_TYPE = "Stores" | "Group" | "Store";

export interface SearchState {
  type: SEARCH_TYPE;
  startDate: string;
  endDate: string;
  lastStore: number;
  lastGroup: number;
  ledgerDate: string;
  lastStoreName: string;
  defaultSalesStore: number;
  selectedStore: Store | null;
  selectedGroup: Group | null;
}

export const initialState: SearchState = {
  type: "Stores",
  startDate: formatDate(addDays(new Date(), -1).toString()),
  endDate: formatDate(new Date().toString()),
  lastStore: 0,
  lastGroup: 0,
  ledgerDate: "",
  lastStoreName: "",
  defaultSalesStore: 0,
  selectedStore: null,
  selectedGroup: null,
};

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setType: (state, action: PayloadAction<SEARCH_TYPE>) => {
      state.type = action.payload;
    },
    setStartDate: (state, action: PayloadAction<string>) => {
      state.startDate = action.payload;
    },
    setEndDate: (state, action: PayloadAction<string>) => {
      state.endDate = action.payload;
    },
    setLastStore: (state, action: PayloadAction<number>) => {
      state.lastStore = action.payload;
    },
    setLastGroup: (state, action: PayloadAction<number>) => {
      state.lastGroup = action.payload;
    },
    setLedgerDate: (state, action: PayloadAction<string>) => {
      state.ledgerDate = action.payload;
    },
    setLastStoreName: (state, action: PayloadAction<string>) => {
      state.lastStoreName = action.payload;
    },
    setSelectedStore: (state, action: PayloadAction<Store | null>) => {
      state.selectedStore = action.payload;
    },
    setSelectedGroup: (state, action: PayloadAction<Group | null>) => {
      state.selectedGroup = action.payload;
    },
    setDefaultSalesStore: (state, action: PayloadAction<number>) => {
      state.defaultSalesStore = action.payload;
    },
  },
});

export const {
  setType,
  setLastGroup,
  setStartDate,
  setEndDate,
  setLastStore,
  setLedgerDate,
  setLastStoreName,
  setSelectedStore,
  setSelectedGroup,
  setDefaultSalesStore,
} = searchSlice.actions;

export default searchSlice.reducer;
