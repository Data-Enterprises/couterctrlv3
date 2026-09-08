import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  SuggestedItem,
  SuggestedGroupRow,
  SuggestedParameters,
  SuggestedCoverage,
} from "../interfaces";

/** Which store x department the sheet is showing. `sub_department` is nullable
 *  because the payload's own department can be null — those rows are real and
 *  a buyer still has to order them. */
export interface SheetKey {
  storeid: number;
  storeLabel: string;
  sub_department: number | null;
  sub_department_description: string | null;
}

interface SuggestedState {
  /** The order parameters. These live here rather than in `search` because
   *  they are this page's model inputs, not a store/date search — and because
   *  changing one has to re-run the whole fetch, which the page owns. */
  leadDays: number;
  coverDays: number;
  lookbackWeeks: number;

  /** Group rollup: one row per store x sub department. Drives the left tree. */
  groupRows: SuggestedGroupRow[];
  /** Item sheet for whichever department is selected. */
  items: SuggestedItem[];

  parameters: SuggestedParameters | null;
  coverage: SuggestedCoverage | null;

  /** Storeids that were asked for. Kept separately from `groupRows` so the page
   *  can say "18 of 20 answered" — the response echoes what was requested but
   *  silently omits stores that returned nothing, and a buyer covering a group
   *  cannot otherwise tell "no scale items" from "that store failed". */
  requestedStoreIds: number[];

  sheetKey: SheetKey | null;
  expandedStores: number[];

  loadingGroup: boolean;
  loadingItems: boolean;
  exportOpen: boolean;

  /** Filters. Redux rather than local state so a buyer who opens another
   *  department and comes back finds the page as they left it. */
  /** Which cover-window day the sheet is reading, `yyyy-mm-dd`. "" is the
   *  whole window — the order the buyer places. A day selection re-points the
   *  demand column at that day's forecast, which is the production question. */
  selectedDay: string;

  storeSearch: string;
  /** Applied column filters on the sheet. Two, not one search box: the grid
   *  filters per column through ColFilter, the way Coupons and Item Actions do. */
  upcFilter: string;
  descFilter: string;
  onlyFlagged: boolean;
}

export const initialState: SuggestedState = {
  // Defaults match the endpoint's own: order Wednesday, lands Friday, has to
  // last until Monday. Twelve weeks of history behind the weekday rates.
  leadDays: 2,
  coverDays: 4,
  lookbackWeeks: 12,

  groupRows: [],
  items: [],
  parameters: null,
  coverage: null,
  requestedStoreIds: [],
  sheetKey: null,
  expandedStores: [],
  loadingGroup: false,
  loadingItems: false,
  exportOpen: false,
  selectedDay: "",
  storeSearch: "",
  upcFilter: "",
  descFilter: "",
  onlyFlagged: false,
};

export const suggestedSlice = createSlice({
  name: "suggested",
  initialState,
  reducers: {
    setLeadDays: (state, action: PayloadAction<number>) => {
      state.leadDays = action.payload;
    },
    setCoverDays: (state, action: PayloadAction<number>) => {
      state.coverDays = action.payload;
    },
    setLookbackWeeks: (state, action: PayloadAction<number>) => {
      state.lookbackWeeks = action.payload;
    },
    setGroupRows: (state, action: PayloadAction<SuggestedGroupRow[]>) => {
      state.groupRows = action.payload;
    },
    setItems: (state, action: PayloadAction<SuggestedItem[]>) => {
      state.items = action.payload;
    },
    setParameters: (state, action: PayloadAction<SuggestedParameters | null>) => {
      state.parameters = action.payload;
    },
    setCoverage: (state, action: PayloadAction<SuggestedCoverage | null>) => {
      state.coverage = action.payload;
    },
    setRequestedStoreIds: (state, action: PayloadAction<number[]>) => {
      state.requestedStoreIds = action.payload;
    },
    setSheetKey: (state, action: PayloadAction<SheetKey | null>) => {
      state.sheetKey = action.payload;
      // A day selected on one department should not silently carry into the
      // next — the sheet would open showing one day of a different case.
      state.selectedDay = "";
    },
    toggleExpandedStore: (state, action: PayloadAction<number>) => {
      const i = state.expandedStores.indexOf(action.payload);
      if (i === -1) state.expandedStores.push(action.payload);
      else state.expandedStores.splice(i, 1);
    },
    setExpandedStores: (state, action: PayloadAction<number[]>) => {
      state.expandedStores = action.payload;
    },
    setLoadingGroup: (state, action: PayloadAction<boolean>) => {
      state.loadingGroup = action.payload;
    },
    setLoadingItems: (state, action: PayloadAction<boolean>) => {
      state.loadingItems = action.payload;
    },
    setExportOpen: (state, action: PayloadAction<boolean>) => {
      state.exportOpen = action.payload;
    },
    setSelectedDay: (state, action: PayloadAction<string>) => {
      state.selectedDay = action.payload;
    },
    setStoreSearch: (state, action: PayloadAction<string>) => {
      state.storeSearch = action.payload;
    },
    setUpcFilter: (state, action: PayloadAction<string>) => {
      state.upcFilter = action.payload;
    },
    setDescFilter: (state, action: PayloadAction<string>) => {
      state.descFilter = action.payload;
    },
    setOnlyFlagged: (state, action: PayloadAction<boolean>) => {
      state.onlyFlagged = action.payload;
    },
    /** Clears the results but keeps the order parameters — a buyer re-running
     *  for a different store is still ordering on the same rhythm. */
    resetSuggestedResults: (state) => {
      state.groupRows = [];
      state.items = [];
      state.parameters = null;
      state.coverage = null;
      state.requestedStoreIds = [];
      state.sheetKey = null;
      state.expandedStores = [];
      state.selectedDay = "";
      state.storeSearch = "";
      state.upcFilter = "";
      state.descFilter = "";
      state.onlyFlagged = false;
    },
    resetSuggestedSlice: () => initialState,
  },
});

export const {
  setLeadDays,
  setCoverDays,
  setLookbackWeeks,
  setGroupRows,
  setItems,
  setParameters,
  setCoverage,
  setRequestedStoreIds,
  setSheetKey,
  toggleExpandedStore,
  setExpandedStores,
  setLoadingGroup,
  setLoadingItems,
  setExportOpen,
  setSelectedDay,
  setStoreSearch,
  setUpcFilter,
  setDescFilter,
  setOnlyFlagged,
  resetSuggestedResults,
  resetSuggestedSlice,
} = suggestedSlice.actions;

export default suggestedSlice.reducer;
