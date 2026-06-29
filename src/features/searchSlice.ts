import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Store } from "../interfaces";
import { formatDate, addDays } from "../utils";
import type { Group } from "./groupSlice";

export type SEARCH_TYPE = "Group" | "Store";

export interface SearchState {
  type: SEARCH_TYPE;
  startDate: string;
  endDate: string;
  singleDate: string;
  lastStore: number;
  lastGroup: number;
  selectedStore: Store;
  selectedGroup: Group;
}

export const initialState: SearchState = {
  type: "Store",
  startDate: formatDate(addDays(new Date(), -2).toString()),
  endDate: formatDate(addDays(new Date(), -1).toString()),
  singleDate: formatDate(addDays(new Date(), -1).toString()),
  lastStore: 0,
  lastGroup: 0,
  selectedStore: {
    storeid: 0,
    store_name: "",
    store_number: "",
    company: 0,
    company_name: "",
  },
  selectedGroup: { id: 0, group_name: "", userid: 0 },
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
    setSingleDate: (state, action: PayloadAction<string>) => {
      state.singleDate = action.payload;
    },
    setLastStore: (state, action: PayloadAction<number>) => {
      state.lastStore = action.payload;
    },
    setLastGroup: (state, action: PayloadAction<number>) => {
      state.lastGroup = action.payload;
    },
    setSelectedStore: (state, action: PayloadAction<Store>) => {
      state.selectedStore = action.payload;
    },
    setSelectedGroup: (state, action: PayloadAction<Group>) => {
      state.selectedGroup = action.payload;
    },
    resetSearchSlice: () => initialState,
  },
});

export const {
  setType,
  setLastGroup,
  setStartDate,
  setEndDate,
  setSingleDate,
  setLastStore,
  setSelectedStore,
  setSelectedGroup,
  resetSearchSlice,
} = searchSlice.actions;

export default searchSlice.reducer;
