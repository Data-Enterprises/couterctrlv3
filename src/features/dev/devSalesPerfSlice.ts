/**
 * Dev copy of `features/salesPerfSlice.ts`, mounted at `state.dev.salesPerf` and read only
 * by `pages/sales/dev`. Edit this one while changing dev Sales; when dev is
 * promoted, it replaces the prod slice. See src/store/devReducers.ts.
 */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  HourlySale,
  SubDeptMargin,
  SubSale,
  WeeklySale,
} from "../../interfaces";
import { cycleSort, type PairSort, type SortState } from "../../utils/perfPairs";

/** Which list a sort preference belongs to. The store list is the screen;
 *  subs and hours are drills inside an expanded card. All three render the
 *  same row — a name and a pair of bars — so this only names the data source. */
export type PerfDimension = "stores" | "subs" | "hours";

/**
 * Which breakdown an expanded store card is pointed at, or null for none.
 *
 * Separate from PerfDimension because "stores" is not a drill — it is the list
 * the card lives in. Folding the two together would make `drill: "stores"` a
 * representable state that means nothing.
 *
 * There is no "items" here. Items are reached by opening a sub department, so
 * an Items tab rendered the sub-department list a second time under a name
 * that promised something else.
 */
export type PerfDrill = "subs" | "hours" | null;

/**
 * The expanded-card key that means the whole group rather than one store.
 *
 * A sentinel rather than a second boolean: the group is a card in the same
 * accordion as the stores, so "which card is open" stays one question with one
 * answer. Real keys are `storeid__store_number`, so this can never collide.
 */
export const GROUP_KEY = "__group";

/** This screen's sort state — see `SortState` and `cycleSort`. */
export type PairSortState = SortState<PairSort>;

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

/** One sub department's item rows for one store, both periods. */
export interface PerfItems {
  ty: SubDeptMargin[];
  ly: SubDeptMargin[];
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
  /** Bumped by every new search. A store fetch started under an older search
   *  carries the old number and is dropped when it lands — its rows belong to
   *  the previous date range. */
  storeCacheGen: number;

  /** Which breakdown the expanded card is pointed at. Cleared whenever the
   *  card closes or a different store opens — a drill belongs to one store. */
  drill: PerfDrill;

  /**
   * Whether the detail view is on screen, showing `drill` for the expanded
   * store.
   *
   * Separate from `drill` so the selection survives coming back: returning
   * from Hours leaves Hours chosen, and "View details" reopens what you were
   * last looking at rather than making you choose again.
   */
  detailOpen: boolean;

  /** How each drill list is ordered, or null for the order it was built in.
   *  Kept across searches — it's a preference, not part of the result. */
  sort: Record<"subs" | "hours", PairSortState | null>;

  /**
   * How the store list is ordered, or null for the order the search returned.
   *
   * Null by default, and that is the point. Sorting by sales re-ranks the list
   * on every figure that moves — and scoping to a day moves all of them — so
   * the cards reshuffled under the reader while one was open. An unsorted list
   * holds still, and the sort is there when someone asks for it.
   */
  storeSort: PairSortState | null;

  /** The sub department whose items the drill is showing, or null for the
   *  sub department list. Closed by changing tab, store or search. */
  openSubDept: { id: number; label: string } | null;

  /**
   * Item rows keyed `${storeScope}|${subDeptId}`, fetched when a department is
   * opened and kept for the search, like storeData.
   *
   * One department per request rather than a whole-store sweep. Every route to
   * items now names the department — you tap it — so a sweep would be fetching
   * twenty departments to show one, and holding all of them to save a fetch
   * most readers never make.
   */
  itemData: Record<string, PerfItems>;
  /** The item key being fetched. */
  itemLoading: string | null;
  itemSort: PairSortState | null;
  /** Filters the open item list by description or UPC. Cleared when a
   *  different sub department opens. */
  itemQuery: string;

  /** The "?" sheet. */
  infoOpen: boolean;

  /**
   * The day an open STORE card is scoped to, or null for its whole week.
   *
   * Local to that card and deliberately short-lived: it is cleared whenever a
   * different card opens, because a day picked while reading one store is not
   * a statement about the next one. Falls back to `groupDay` when unset.
   */
  selectedDay: string | null;

  /**
   * The day the GROUP card is scoped to, or null for the whole week.
   *
   * This one is the screen's scope, not a card's: it re-scopes every store row
   * in the list below, and a store card opens on it. That is the difference
   * between the two — the group card asks "what happened on Friday", and the
   * stores under it answer for Friday until it is cleared.
   */
  groupDay: string | null;

  /** `storeid__store_number` of the EXPANDED store card, or null when every
   *  card is collapsed. One at a time — this screen is an accordion, and a
   *  single key is what keeps it one.
   *
   *  Composes with selectedDay: expanding a store and picking a day narrows
   *  that card to that store on that day.
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
  storeCacheGen: 0,
  drill: null,
  detailOpen: false,
  sort: { subs: null, hours: null },
  storeSort: null,
  openSubDept: null,
  itemData: {},
  itemLoading: null,
  itemSort: null,
  itemQuery: "",
  infoOpen: false,
  selectedDay: null,
  groupDay: null,
  selectedStore: null,
};

const salesPerfSlice = createSlice({
  // Distinct from the prod slice's "salesPerf": Redux matches actions on this
  // string alone, so sharing it would move prod and dev together.
  name: "devSalesPerf",
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
      state.itemData = {};
      state.itemLoading = null;
      state.openSubDept = null;
      state.drill = null;
      state.detailOpen = false;
      state.storeCacheGen += 1;
      state.selectedStore = null;
      state.selectedDay = null;
      state.groupDay = null;
    },
    setPerfStoreLoading: (state, action: PayloadAction<string | null>) => {
      state.storeLoading = action.payload;
    },
    cachePerfStoreData: (
      state,
      action: PayloadAction<{ key: string; bundle: PerfBundle; gen: number }>,
    ) => {
      if (action.payload.gen !== state.storeCacheGen) return;
      state.storeData[action.payload.key] = action.payload.bundle;
      if (state.storeLoading === action.payload.key) state.storeLoading = null;
    },
    /** A store fetch failed. Clears the loading flag only if it is still this
     *  store's, so the next tap on it can try again. */
    failPerfStoreData: (state, action: PayloadAction<string>) => {
      if (state.storeLoading === action.payload) state.storeLoading = null;
    },
    setPerfItemLoading: (state, action: PayloadAction<string | null>) => {
      state.itemLoading = action.payload;
    },
    /** Same contract as cachePerfStoreData: always cached under its own key,
     *  dropped if it belongs to an older search. */
    cachePerfItems: (
      state,
      action: PayloadAction<{ key: string; items: PerfItems; gen: number }>,
    ) => {
      if (action.payload.gen !== state.storeCacheGen) return;
      state.itemData[action.payload.key] = action.payload.items;
      if (state.itemLoading === action.payload.key) state.itemLoading = null;
    },
    failPerfItems: (state, action: PayloadAction<string>) => {
      if (state.itemLoading === action.payload) state.itemLoading = null;
    },
    openPerfSubDept: (
      state,
      action: PayloadAction<{ id: number; label: string } | null>,
    ) => {
      if (state.openSubDept?.id !== action.payload?.id) state.itemQuery = "";
      state.openSubDept = action.payload;
    },
    setPerfItemQuery: (state, action: PayloadAction<string>) => {
      state.itemQuery = action.payload;
    },
    setPerfItemSort: (state, action: PayloadAction<PairSort>) => {
      state.itemSort = cycleSort(state.itemSort, action.payload);
    },
    setPerfInfoOpen: (state, action: PayloadAction<boolean>) => {
      state.infoOpen = action.payload;
    },
    /** Point the expanded card at a breakdown, or clear it with null. This
     *  only selects — `openPerfDetail` is what puts it on screen. Moving to
     *  Hours drops the open sub department, whose items belong to a list
     *  Hours will not show. */
    setPerfDrill: (state, action: PayloadAction<PerfDrill>) => {
      state.drill = action.payload;
      // Leaving Sub Depts, or tapping it again, drops the open department: it
      // is the way back up as well as the way across.
      state.openSubDept = null;
    },
    /** Show or leave the detail view. Leaving keeps `drill` and the open sub
     *  department, so coming back lands where you left rather than at the top
     *  of a list you have to re-navigate. */
    openPerfDetail: (state, action: PayloadAction<boolean>) => {
      state.detailOpen = action.payload;
      // The detail view always shows one of the three, and the card that
      // opens it no longer chooses. Landing on sub departments rather than
      // an empty frame: it is the broadest of them, and the one items are
      // reached through.
      if (action.payload && state.drill === null) state.drill = "subs";
    },
    /** Tapping the day that is already selected clears the scope. The chart is
     *  the only control, so it has to be able to undo itself. */
    /** Every sort on this screen advances the same three-state cycle. */
    setPerfSort: (
      state,
      action: PayloadAction<{ dimension: "subs" | "hours"; sort: PairSort }>,
    ) => {
      const d = action.payload.dimension;
      state.sort[d] = cycleSort(state.sort[d], action.payload.sort);
    },
    setPerfStoreSort: (state, action: PayloadAction<PairSort>) => {
      state.storeSort = cycleSort(state.storeSort, action.payload);
    },
    togglePerfDay: (state, action: PayloadAction<string>) => {
      state.selectedDay =
        state.selectedDay === action.payload ? null : action.payload;
    },
    /** The group card's chart. Scopes the store list below it as well as its
     *  own figures, so it survives cards opening and closing. */
    togglePerfGroupDay: (state, action: PayloadAction<string>) => {
      state.groupDay =
        state.groupDay === action.payload ? null : action.payload;
    },
    /** Same toggle-to-clear contract as the day chart: the row is the only
     *  control, so it has to be able to undo itself. */
    togglePerfStore: (state, action: PayloadAction<string>) => {
      state.selectedStore =
        state.selectedStore === action.payload ? null : action.payload;
      // The drill and its items belonged to the card that just closed.
      state.drill = null;
      state.detailOpen = false;
      state.openSubDept = null;
      // A day picked inside one store is not a question about the next one.
      // The group's day is a different thing and is left alone.
      state.selectedDay = null;
    },
    // The generation survives a reset and moves on, so a store or item fetch
    // still in flight from before it is dropped when it lands.
    resetSalesPerf: (state) => ({
      ...initialState,
      storeCacheGen: state.storeCacheGen + 1,
    }),
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
  failPerfStoreData,
  setPerfDrill,
  openPerfDetail,
  setPerfSort,
  setPerfStoreSort,
  setPerfItemLoading,
  cachePerfItems,
  failPerfItems,
  openPerfSubDept,
  setPerfItemSort,
  setPerfItemQuery,
  setPerfInfoOpen,
  togglePerfDay,
  togglePerfGroupDay,
  togglePerfStore,
  resetSalesPerf,
} = salesPerfSlice.actions;

export default salesPerfSlice.reducer;
