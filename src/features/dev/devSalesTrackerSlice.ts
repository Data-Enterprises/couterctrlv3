/**
 * Dev copy of `features/salesTrackerSlice.ts`, mounted at `state.dev.salesTracker` and read only
 * by `pages/salesTracker/dev`. Edit this one while changing dev salesTracker; when dev is
 * promoted, it replaces the prod slice. See src/store/devReducers.ts.
 */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SubSale } from "../../interfaces";
import type { TrackerBasis } from "../../pages/salesTracker/dev/trackerWeeks";

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
  /**
   * The earliest TY date whose rows are held, or null before a search.
   *
   * Adding a week extends the window backwards, and dropping one narrows it
   * without discarding anything — so this is what says whether a week is
   * already in hand. Re-adding a week you just dropped costs nothing, and
   * adding a genuinely new one fetches only the gap rather than the window.
   */
  loadedFrom: string | null;
  /** A week is being fetched onto the front of the window. Distinct from
   *  `loading`, which blanks the page for a whole new search. */
  addingWeek: boolean;
  /** Store or group name, for the panel header. */
  scopeLabel: string;
  ty: SubSale[];
  ly: SubSale[];
  /**
   * What `ly` actually holds.
   *
   * Last year unless the store has none, in which case the window is read
   * against last week instead and every column that names the comparison
   * renames itself. Held here rather than worked out from the rows, because
   * "no rows came back" and "we asked for a different period" are different
   * facts and only one of them is a fallback.
   */
  basis: TrackerBasis;
  /** Sub-department id, or null while nothing is picked. */
  selectedSubDept: number | null;
  subFilter: string;
  /** Week indexes whose day tiles are open. Weeks start closed — a department
   *  with twelve weeks open at once is eighty-four tiles and nothing to read. */
  expandedWeeks: number[];
}

export const MAX_WEEKS = 26;
export const MIN_WEEKS = 1;

const initialState: SalesTrackerState = {
  hasSearched: false,
  loading: false,
  loadedFrom: null,
  addingWeek: false,
  scopeLabel: "",
  ty: [],
  ly: [],
  basis: "LY",
  selectedSubDept: null,
  subFilter: "",
  expandedWeeks: [],
};

const salesTrackerSlice = createSlice({
  // Distinct from the prod slice's "salesTracker": Redux matches actions on this
  // string alone, so sharing it would move prod and dev together.
  name: "devSalesTracker",
  initialState,
  reducers: {
    setHasSearched: (state, action: PayloadAction<boolean>) => {
      state.hasSearched = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setAddingWeek: (state, action: PayloadAction<boolean>) => {
      state.addingWeek = action.payload;
    },
    setScopeLabel: (state, action: PayloadAction<string>) => {
      state.scopeLabel = action.payload;
    },
    setRows: (
      state,
      action: PayloadAction<{
        ty: SubSale[];
        ly: SubSale[];
        from: string;
        basis: TrackerBasis;
      }>,
    ) => {
      state.ty = action.payload.ty;
      state.ly = action.payload.ly;
      state.basis = action.payload.basis;
      state.loadedFrom = action.payload.from;
    },
    /** One week's rows onto the front of what is already held. The window
     *  itself is the search range — this only supplies the data for it. */
    appendRows: (
      state,
      action: PayloadAction<{ ty: SubSale[]; ly: SubSale[]; from: string }>,
    ) => {
      state.ty = [...state.ty, ...action.payload.ty];
      state.ly = [...state.ly, ...action.payload.ly];
      state.loadedFrom = action.payload.from;
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
     *  preference, not a result, and so does nothing about the basis: the
     *  next load decides that from what comes back. */
    reQueryTracker: (state) => {
      state.ty = [];
      state.ly = [];
      state.basis = "LY";
      state.selectedSubDept = null;
      state.subFilter = "";
      state.expandedWeeks = [];
    },
  },
});

export const {
  setHasSearched,
  setLoading,
  setAddingWeek,
  appendRows,
  setScopeLabel,
  setRows,
  setSelectedSubDept,
  setSubFilter,
  toggleWeek,
  setAllWeeksOpen,
  reQueryTracker,
} = salesTrackerSlice.actions;

export default salesTrackerSlice.reducer;
