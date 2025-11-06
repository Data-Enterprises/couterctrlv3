import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
// import { AssignedStore, Group } from "../interfaces";
import { formatDate, addDays } from "../utils";

export type SEARCH_TYPE =
  | "Stores"
  | "Group"
  | "Single Store"
  | "1"
  | "2"
  | "3"
  | "Store"
  | 1
  | 2
  | 3;

export interface SearchState {
  type: SEARCH_TYPE;
  subCompSearchType: SEARCH_TYPE;
  // groups: Group[];
  // selectedGroup?: Group;
  startDate: string;
  endDate: string;
  sendPrefs: boolean;
  lastStore: number;
  lastGroup: number;
  // assignedStores: AssignedStore[];
  ledgerDate: string;
  lastStoreName: string;
  defaultSalesStore: number;
}

export const initialState: SearchState = {
  type: "Stores",
  subCompSearchType: "2",
  // groups: [],
  // selectedGroup: undefined,
  startDate: formatDate(addDays(new Date(), -1).toString()),
  endDate: formatDate(new Date().toString()),
  // startDate: formatGoliathDate(addDays(new Date(), -1).toString()),
  // endDate: formatGoliathDate(new Date().toString()),
  sendPrefs: false,
  lastStore: 111,
  lastGroup: 0,
  // assignedStores: [],
  ledgerDate: "",
  lastStoreName: "",
  defaultSalesStore: 0,
};

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setType: (state, action: PayloadAction<SEARCH_TYPE>) => {
      state.type = action.payload;
      state.sendPrefs = true;
    },
    setSubCompSearchType: (state, action: PayloadAction<SEARCH_TYPE>) => {
      state.subCompSearchType = action.payload;
      state.sendPrefs = true;
    },
    // setGroups: (state, action: PayloadAction<Group[]>) => {
    //   state.groups = action.payload;
    //   state.sendPrefs = true;
    // },
    // setSelectedGroup: (state, action: PayloadAction<Group>) => {
    //   state.selectedGroup = action.payload;
    //   state.sendPrefs = true;
    // },
    setStartDate: (state, action: PayloadAction<string>) => {
      state.startDate = action.payload;
      state.sendPrefs = true;
    },
    setEndDate: (state, action: PayloadAction<string>) => {
      state.endDate = action.payload;
      state.sendPrefs = true;
    },
    setSendPrefs: (state, action: PayloadAction<boolean>) => {
      state.sendPrefs = action.payload;
    },
    setLastStore: (state, action: PayloadAction<number>) => {
      state.lastStore = action.payload;
      state.sendPrefs = true;
    },
    setLastGroup: (state, action: PayloadAction<number>) => {
      state.lastGroup = action.payload;
      state.sendPrefs = true;
    },
    // setAssignedStores: (state, action: PayloadAction<AssignedStore[]>) => {
    //   state.assignedStores = action.payload;
    // },
    setLedgerDate: (state, action: PayloadAction<string>) => {
      state.ledgerDate = action.payload;
    },
    setLastStoreName: (state, action: PayloadAction<string>) => {
      state.lastStoreName = action.payload;
    },
    setDefaultSalesStore: (state, action: PayloadAction<number>) => {
      state.defaultSalesStore = action.payload;
    },
  },
});

export const {
  setType,
  setLastGroup,
  // setGroups,
  // setSelectedGroup,
  setStartDate,
  setEndDate,
  setSendPrefs,
  setLastStore,
  // setAssignedStores,
  setLedgerDate,
  setSubCompSearchType,
  setLastStoreName,
  setDefaultSalesStore,
} = searchSlice.actions;

export default searchSlice.reducer;
