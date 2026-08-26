import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Store } from "../interfaces";
import { formatDate, addDays } from "../utils";
import { emptyGroup, type Group } from "./groupSlice";

export type SEARCH_TYPE = "Group" | "Store" | "Shared";

// "Shared" is a group the user did not build — a base group a manager shared
// with them — but it is still an ordinary user_groups row, so every consumer
// resolves it exactly like "Group". Written as the negation of "Store" rather
// than a list of group-ish types on purpose: the backend takes singleStore XOR
// useGroups and rejects neither-set, so deriving one from the other means that
// invalid pair cannot be built no matter what is added to SEARCH_TYPE later.
// Accepts undefined because a few components take the type as an optional
// prop; an absent type is not a group search, matching what the `=== "Group"`
// tests these replaced already did.
export const isGroupSearch = (type?: SEARCH_TYPE) =>
  type !== undefined && type !== "Store";

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
  selectedGroup: emptyGroup,
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
