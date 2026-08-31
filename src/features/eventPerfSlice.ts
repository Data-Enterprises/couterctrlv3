import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * One thing that happened at a register.
 *
 * Loss Prevention and Coupon Sales ask the same question of different events —
 * who did this, where, how often, and show me the receipt. Their endpoints
 * disagree about almost everything else, so each page normalises to this and
 * the screen never learns which one it is looking at.
 *
 * `count` exists because a row is not always one transaction: LP's baseline
 * arrives pre-aggregated per store, so a single row can stand for two hundred.
 */
export interface EventRow {
  /** The lens value this row belongs to — an exception type, or a coupon type. */
  lens: string;
  storeid: number;
  store_number: string;
  store_name: string;
  /** Null on aggregate rows, which know a store but not a person. */
  cashier_number: number | null;
  cashier_name: string;
  /** The register. Empty when the source did not carry one. */
  terminal: string;
  /** Empty on aggregate rows. */
  sale_id: string;
  /** ISO yyyy-mm-dd. Empty on aggregate rows. */
  day: string;
  amount: number;
  /** Transactions this row stands for. 1 for a real event. */
  count: number;
}

/** Which list the middle tab shows. */
export type EventView = "stores" | "cashiers" | "receipts";

/**
 * `storeid` alone is not unique — 685 carries both store_number 369 and 370,
 * and grouping on it double-counts them into one row.
 */
export const storeKeyOf = (r: EventRow) => `${r.storeid}__${r.store_number}`;

/** Cashiers repeat across stores, so identity is the pair. */
export const cashierKeyOf = (r: EventRow) =>
  `${storeKeyOf(r)}__${r.cashier_number ?? ""}`;

interface EventPerfState {
  /**
   * Which page loaded what is in here.
   *
   * One slice serves Loss Prevention and Coupon Sales, so without this,
   * loading LP and then opening Coupon Sales showed LP's exception rows under
   * Coupon Sales' heading — the data survived the navigation and nothing
   * checked whose it was.
   */
  owner: string | null;

  hasSearched: boolean;
  loading: boolean;
  loadingMessage: string;

  /** The searched week. */
  rows: EventRow[];
  /**
   * The comparison period, already scaled to one week's worth.
   *
   * LP's `trend` rows arrive weekly-equivalent and are compared 1:1 against
   * the week by the desktop page. Coupon Sales reads a fourteen-day window and
   * halves it in its adapter. By the time rows land here the two mean the same
   * thing, which is the only reason one bar can render both.
   */
  baseline: EventRow[];

  /** Every lens value the search found, in the order the page wants them. */
  lenses: string[];
  /** The active lens. Null means every lens at once. */
  lens: string | null;

  view: EventView;

  /** ISO date, or null for the whole week. Tapping the same day clears it. */
  selectedDay: string | null;

  selectedStoreKey: string | null;
  selectedStoreLabel: string | null;
  selectedCashierKey: string | null;
  selectedCashierLabel: string | null;

  /** The receipt open in the sheet. */
  openSaleId: string | null;

  query: string;
  listLimit: number;
}

/** Rows rendered before the rest move behind a button. A busy group runs to
 *  thousands of receipts, and rendering them all is what froze Daily. */
export const ROWS_PER_PAGE = 100;

const initialState: EventPerfState = {
  owner: null,
  hasSearched: false,
  loading: false,
  loadingMessage: "",
  rows: [],
  baseline: [],
  lenses: [],
  lens: null,
  view: "stores",
  selectedDay: null,
  selectedStoreKey: null,
  selectedStoreLabel: null,
  selectedCashierKey: null,
  selectedCashierLabel: null,
  openSaleId: null,
  query: "",
  listLimit: ROWS_PER_PAGE,
};

/** Everything below a store selection. Used whenever the scope above it moves. */
const clearCashier = (state: EventPerfState) => {
  state.selectedCashierKey = null;
  state.selectedCashierLabel = null;
  state.openSaleId = null;
};

const eventPerfSlice = createSlice({
  name: "eventPerf",
  initialState,
  reducers: {
    setEventLoading: (
      state,
      action: PayloadAction<{ loading: boolean; message?: string }>,
    ) => {
      state.loading = action.payload.loading;
      state.loadingMessage = action.payload.message ?? "";
    },
    setEventData: (
      state,
      action: PayloadAction<{
        rows: EventRow[];
        baseline: EventRow[];
        lenses: string[];
      }>,
    ) => {
      state.rows = action.payload.rows;
      state.baseline = action.payload.baseline;
      state.lenses = action.payload.lenses;
      state.hasSearched = true;
      // A new week invalidates every drill into the old one.
      state.lens = null;
      state.view = "stores";
      state.selectedDay = null;
      state.selectedStoreKey = null;
      state.selectedStoreLabel = null;
      state.query = "";
      state.listLimit = ROWS_PER_PAGE;
      clearCashier(state);
    },
    setEventHasSearched: (state, action: PayloadAction<boolean>) => {
      state.hasSearched = action.payload;
    },
    /**
     * Pick a lens. Null is the first card in the carousel — every type at once.
     *
     * Deliberately keeps the store and cashier drill: swiping is a filter on
     * what you are already looking at, not a step you re-enter through. Losing
     * your place every time you compared voids to refunds is the thing the old
     * four-screen stack got wrong.
     */
    setEventLens: (state, action: PayloadAction<string | null>) => {
      state.lens = action.payload;
      state.listLimit = ROWS_PER_PAGE;
      state.openSaleId = null;
    },
    setEventView: (state, action: PayloadAction<EventView>) => {
      state.view = action.payload;
      state.listLimit = ROWS_PER_PAGE;
      state.openSaleId = null;
      // Leaving by tab drops the drill that tab was showing, so coming back
      // offers the list rather than whatever was last open inside it.
      if (action.payload === "stores") {
        state.selectedStoreKey = null;
        state.selectedStoreLabel = null;
        clearCashier(state);
      }
      if (action.payload === "cashiers") clearCashier(state);
    },
    toggleEventDay: (state, action: PayloadAction<string>) => {
      state.selectedDay =
        state.selectedDay === action.payload ? null : action.payload;
      state.listLimit = ROWS_PER_PAGE;
    },
    /** Tapping a store moves to Cashiers scoped to it — the question after
     *  "which store" is always "who in it". */
    selectEventStore: (
      state,
      action: PayloadAction<{ key: string; label: string }>,
    ) => {
      state.selectedStoreKey = action.payload.key;
      state.selectedStoreLabel = action.payload.label;
      state.view = "cashiers";
      state.listLimit = ROWS_PER_PAGE;
      clearCashier(state);
    },
    /** And after "who" comes "show me". */
    selectEventCashier: (
      state,
      action: PayloadAction<{ key: string; label: string }>,
    ) => {
      state.selectedCashierKey = action.payload.key;
      state.selectedCashierLabel = action.payload.label;
      state.view = "receipts";
      state.listLimit = ROWS_PER_PAGE;
      state.openSaleId = null;
    },
    /** Back out one level, to whichever list opened this one. */
    clearEventCashier: (state) => {
      state.view = "cashiers";
      state.listLimit = ROWS_PER_PAGE;
      clearCashier(state);
    },
    clearEventStore: (state) => {
      state.view = "stores";
      state.listLimit = ROWS_PER_PAGE;
      state.selectedStoreKey = null;
      state.selectedStoreLabel = null;
      clearCashier(state);
    },
    setEventQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
      state.listLimit = ROWS_PER_PAGE;
    },
    openReceipt: (state, action: PayloadAction<string>) => {
      state.openSaleId = action.payload;
    },
    closeReceipt: (state) => {
      state.openSaleId = null;
    },
    showMoreEvents: (state) => {
      state.listLimit += ROWS_PER_PAGE;
    },
    /** Hand the slice to a page, discarding whatever the last one left. */
    claimEventPerf: (_state, action: PayloadAction<string>) => ({
      ...initialState,
      owner: action.payload,
    }),
    resetEventPerf: () => initialState,
  },
});

export const {
  setEventLoading,
  setEventData,
  setEventHasSearched,
  setEventLens,
  setEventView,
  toggleEventDay,
  selectEventStore,
  selectEventCashier,
  clearEventCashier,
  clearEventStore,
  setEventQuery,
  openReceipt,
  closeReceipt,
  showMoreEvents,
  claimEventPerf,
  resetEventPerf,
} = eventPerfSlice.actions;

export default eventPerfSlice.reducer;
