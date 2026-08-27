import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SubSale } from "../interfaces";

/**
 * Sales Tracker page state.
 *
 * Deliberately small. The page tracks sub-department sales against last year
 * and drills week then day — there is no grading, no threshold and no metric
 * toggle, so none of that is held here.
 *
 * Reducers replace arrays rather than pushing into them: RTK freezes what it
 * stores, and a `push` onto an array that has already been through a reducer
 * throws — silently, in the middle of a paged walk.
 */

interface SalesTrackerState {
  hasSearched: boolean;
  loading: boolean;
  /** Window length in weeks. Lives here because changing it re-runs the fetch. */
  weeks: number;
  /** Store or group name, for the panel header. */
  scopeLabel: string;
  ty: SubSale[];
  ly: SubSale[];
  /** Sub-department id, or null while nothing is picked. */
  selectedSubDept: number | null;
  subFilter: string;
  /** Week indexes whose day tiles are open. Weeks start closed — a department
   *  with twelve weeks open at once is eighty-four tiles and nothing to read. */
  expandedWeeks: number[];
}

const DEFAULT_WEEKS = 4;
export const MAX_WEEKS = 26;
export const MIN_WEEKS = 1;

const initialState: SalesTrackerState = {
  hasSearched: false,
  loading: false,
  weeks: DEFAULT_WEEKS,
  scopeLabel: "",
  ty: [],
  ly: [],
  selectedSubDept: null,
  subFilter: "",
  expandedWeeks: [],
};

const salesTrackerSlice = createSlice({
  name: "salesTracker",
  initialState,
  reducers: {
    setHasSearched: (state, action: PayloadAction<boolean>) => {
      state.hasSearched = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setWeeks: (state, action: PayloadAction<number>) => {
      state.weeks = Math.min(MAX_WEEKS, Math.max(MIN_WEEKS, action.payload));
    },
    setScopeLabel: (state, action: PayloadAction<string>) => {
      state.scopeLabel = action.payload;
    },
    setRows: (state, action: PayloadAction<{ ty: SubSale[]; ly: SubSale[] }>) => {
      state.ty = action.payload.ty;
      state.ly = action.payload.ly;
    },
    setSelectedSubDept: (state, action: PayloadAction<number | null>) => {
      state.selectedSubDept = action.payload;
      // A different department starts closed, the same way it started closed
      // the first time.
      state.expandedWeeks = [];
    },
    setSubFilter: (state, action: PayloadAction<string>) => {
      state.subFilter = action.payload;
    },
    toggleWeek: (state, action: PayloadAction<number>) => {
      state.expandedWeeks = state.expandedWeeks.includes(action.payload)
        ? state.expandedWeeks.filter((w) => w !== action.payload)
        : [...state.expandedWeeks, action.payload];
    },
    setAllWeeksOpen: (state, action: PayloadAction<number[]>) => {
      state.expandedWeeks = action.payload;
    },
    /** Clears results for a re-search. The window length survives — it is a
     *  preference, not a result. */
    reQueryTracker: (state) => {
      state.ty = [];
      state.ly = [];
      state.selectedSubDept = null;
      state.subFilter = "";
      state.expandedWeeks = [];
    },
  },
});

export const {
  setHasSearched,
  setLoading,
  setWeeks,
  setScopeLabel,
  setRows,
  setSelectedSubDept,
  setSubFilter,
  toggleWeek,
  setAllWeeksOpen,
  reQueryTracker,
} = salesTrackerSlice.actions;

export default salesTrackerSlice.reducer;
