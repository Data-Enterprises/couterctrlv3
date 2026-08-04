import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CategoryMetric, CategoryRow, CategoryTier } from "../pages/categories/categoriesUtils";
import type { CatSalesHourly } from "../interfaces";

/** Categories (Performance).
 *
 *  Single store, three periods, graded on decline against a threshold the user
 *  sets — the same contract as Sub Dept Margins.
 *
 *  Raw API rows are deliberately absent. The page stores `CategoryRow[]`, the
 *  aggregated shape, because nothing downstream needs the daily rows once
 *  they've been folded. Keeping ~12,000 raw rows in Redux for three periods
 *  would cost memory for no reader.
 */

/** Default decline that counts as critical. 15% is the midpoint between the
 *  noise band of a normal week and a fall nobody would argue about; the user
 *  moves it from the panel header. */
export const CATEGORY_THRESHOLD_DEFAULT = 15;

interface CategoriesState {
  rows: CategoryRow[];
  loading: boolean;
  /** Named rather than a bare spinner — a ten-page store takes long enough
   *  that "Loading categories…" beats an unexplained wait. */
  loadingMessage: string;
  storeid: number;
  storeName: string;
  /** This week's range, kept so the day strip and the hourly drill-down can
   *  rebuild the same periods without recomputing from search state. */
  twStart: string;
  twEnd: string;

  metric: CategoryMetric;
  /** Null while the input is mid-edit, same rule as the other threshold
   *  inputs — an empty box must not read as a threshold of 0. */
  threshold: number | null;
  tierFilter: CategoryTier | "all";
  textFilter: string;
  /** Null means the whole week. */
  selectedDay: string | null;
  selectedCategory: number | null;

  /** Hourly is graded like everything else, so it needs all three periods —
   *  an hour is only interesting against the same hour last week and last
   *  year. Fetched on demand; see loadHourly in Categories.tsx. */
  hourly: { tw: CatSalesHourly[]; lw: CatSalesHourly[]; ly: CatSalesHourly[] };
  loadingHourly: boolean;
}

const initialState: CategoriesState = {
  rows: [],
  loading: false,
  loadingMessage: "",
  storeid: 0,
  storeName: "",
  twStart: "",
  twEnd: "",
  metric: "sales",
  threshold: CATEGORY_THRESHOLD_DEFAULT,
  tierFilter: "all",
  textFilter: "",
  selectedDay: null,
  selectedCategory: null,
  hourly: { tw: [], lw: [], ly: [] },
  loadingHourly: false,
};

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    setRows: (state, action: PayloadAction<CategoryRow[]>) => {
      state.rows = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setLoadingMessage: (state, action: PayloadAction<string>) => {
      state.loadingMessage = action.payload;
    },
    setStore: (state, action: PayloadAction<{ storeid: number; storeName: string }>) => {
      state.storeid = action.payload.storeid;
      state.storeName = action.payload.storeName;
    },
    setRange: (state, action: PayloadAction<{ start: string; end: string }>) => {
      state.twStart = action.payload.start;
      state.twEnd = action.payload.end;
    },
    setMetric: (state, action: PayloadAction<CategoryMetric>) => {
      state.metric = action.payload;
    },
    setThreshold: (state, action: PayloadAction<number | null>) => {
      state.threshold = action.payload;
    },
    setTierFilter: (state, action: PayloadAction<CategoryTier | "all">) => {
      state.tierFilter = action.payload;
    },
    setTextFilter: (state, action: PayloadAction<string>) => {
      state.textFilter = action.payload;
    },
    setSelectedDay: (state, action: PayloadAction<string | null>) => {
      state.selectedDay = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<number | null>) => {
      state.selectedCategory = action.payload;
      // Hourly belongs to whichever category is open; leaving the old rows
      // would show the previous category's hours under the new heading.
      state.hourly = { tw: [], lw: [], ly: [] };
    },
    setHourly: (
      state,
      action: PayloadAction<{ tw: CatSalesHourly[]; lw: CatSalesHourly[]; ly: CatSalesHourly[] }>,
    ) => {
      state.hourly = action.payload;
    },
    setLoadingHourly: (state, action: PayloadAction<boolean>) => {
      state.loadingHourly = action.payload;
    },
    /** New search — clear results and selection but keep the user's display
     *  preferences. Re-picking a metric and threshold after every search would
     *  be an irritation, and neither depends on which store is loaded. */
    reQuery: (state) => {
      state.rows = [];
      state.selectedCategory = null;
      state.selectedDay = null;
      state.hourly = { tw: [], lw: [], ly: [] };
      state.textFilter = "";
      state.tierFilter = "all";
    },
  },
});

export const {
  setRows,
  setLoading,
  setLoadingMessage,
  setStore,
  setRange,
  setMetric,
  setThreshold,
  setTierFilter,
  setTextFilter,
  setSelectedDay,
  setSelectedCategory,
  setHourly,
  setLoadingHourly,
  reQuery,
} = categoriesSlice.actions;

export default categoriesSlice.reducer;
