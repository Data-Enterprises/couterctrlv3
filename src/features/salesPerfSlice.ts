import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { HourlySale, SubSale, WeeklySale } from "../interfaces";

/** Which breakdown the list card is showing. All three render the same row —
 *  a name and a pair of bars — so this only picks the data source. */
export type PerfDimension = "stores" | "subs" | "hours";

/**
 * The sub-department and hourly rows for one scope, this year and last.
 *
 * Kept as a unit because the two always arrive and expire together: a scope
 * either has both cached or neither, and splitting them would let a store show
 * its Subs list against another store's Hours.
 */
export interface PerfBundle {
  subsTy: SubSale[];
  subsLy: SubSale[];
  hourlyTy: HourlySale[];
  hourlyLy: HourlySale[];
}

export const emptyBundle = (): PerfBundle => ({
  subsTy: [],
  subsLy: [],
  hourlyTy: [],
  hourlyLy: [],
});

/**
 * State for the ungraded mobile Performance screen.
 *
 * Deliberately separate from salesLedgerSlice. That slice is built around
 * grading — severity filters, thresholds, tier sorting — and this screen has
 * none of it. Sharing one slice would mean either carrying dead grading state
 * or gutting a slice the graded screen still depends on while both exist.
 *
 * Every period here is THIS YEAR against LAST YEAR. There is no last week:
 * the screen compares two points, and a third made every row a paragraph.
 */
interface SalesPerfState {
  hasSearched: boolean;
  loading: boolean;

  /**
   * Week totals by store and day, for the whole search.
   *
   * `sales/weekly` is the only endpoint here whose group response carries
   * store identity, so it alone can be filtered client-side. It powers the
   * store list, the day chart, and the sales and tax figures at any scope.
   */
  weekTy: WeeklySale[];
  weekLy: WeeklySale[];

  /** Sub-department and hourly rows for the whole search, aggregated across
   *  every store. Cannot be filtered by store — a group response does not say
   *  which store a row came from. */
  groupData: PerfBundle;

  /**
   * Per-store bundles, keyed by `storeid__store_number`, fetched on demand.
   *
   * This is the reason a store can be selected at all. Because the group
   * response has no store dimension, narrowing Subs or Hours to one store
   * means asking the API for that store specifically. Caching means each store
   * costs one round of calls per search no matter how often it is revisited,
   * and returning to all stores costs nothing.
   */
  storeData: Record<string, PerfBundle>;

  /** The store key currently being fetched, so the list can say so without a
   *  second boolean going stale. */
  storeLoading: string | null;

  dimension: PerfDimension;

  /** ISO date of the selected day, or null for the whole week. Scopes the
   *  totals card and every row in the list. Tapping the selected day again
   *  clears it — there is no "all week" control. */
  selectedDay: string | null;

  /** `storeid__store_number` of the selected store, or null for all of them.
   *  Composes with selectedDay: picking a store and a day narrows to that
   *  store on that day.
   *
   *  Keyed on both fields because storeid alone is not unique — some ids carry
   *  two store numbers, and keying on the id would silently merge two real
   *  stores into one row. */
  selectedStore: string | null;
}

const initialState: SalesPerfState = {
  hasSearched: false,
  loading: false,
  weekTy: [],
  weekLy: [],
  groupData: emptyBundle(),
  storeData: {},
  storeLoading: null,
  dimension: "stores",
  selectedDay: null,
  selectedStore: null,
};

const salesPerfSlice = createSlice({
  name: "salesPerf",
  initialState,
  reducers: {
    setPerfLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setPerfHasSearched: (state, action: PayloadAction<boolean>) => {
      state.hasSearched = action.payload;
    },
    setPerfWeek: (
      state,
      action: PayloadAction<{ ty: WeeklySale[]; ly: WeeklySale[] }>,
    ) => {
      state.weekTy = action.payload.ty;
      state.weekLy = action.payload.ly;
    },
    setPerfGroupData: (state, action: PayloadAction<PerfBundle>) => {
      state.groupData = action.payload;
    },
    /** A new search invalidates every per-store bundle — they belong to the
     *  old date range. Clearing here rather than at the call site means a
     *  future caller cannot forget. */
    clearPerfStoreCache: (state) => {
      state.storeData = {};
      state.storeLoading = null;
      state.selectedStore = null;
    },
    setPerfStoreLoading: (state, action: PayloadAction<string | null>) => {
      state.storeLoading = action.payload;
    },
    cachePerfStoreData: (
      state,
      action: PayloadAction<{ key: string; bundle: PerfBundle }>,
    ) => {
      state.storeData[action.payload.key] = action.payload.bundle;
      if (state.storeLoading === action.payload.key) state.storeLoading = null;
    },
    setPerfDimension: (state, action: PayloadAction<PerfDimension>) => {
      state.dimension = action.payload;
    },
    /** Tapping the day that is already selected clears the scope. The chart is
     *  the only control, so it has to be able to undo itself. */
    togglePerfDay: (state, action: PayloadAction<string>) => {
      state.selectedDay =
        state.selectedDay === action.payload ? null : action.payload;
    },
    /** Same toggle-to-clear contract as the day chart: the row is the only
     *  control, so it has to be able to undo itself. */
    togglePerfStore: (state, action: PayloadAction<string>) => {
      state.selectedStore =
        state.selectedStore === action.payload ? null : action.payload;
    },
    resetSalesPerf: () => initialState,
  },
});

export const {
  setPerfLoading,
  setPerfHasSearched,
  setPerfWeek,
  setPerfGroupData,
  clearPerfStoreCache,
  setPerfStoreLoading,
  cachePerfStoreData,
  setPerfDimension,
  togglePerfDay,
  togglePerfStore,
  resetSalesPerf,
} = salesPerfSlice.actions;

export default salesPerfSlice.reducer;
