import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  ExceptionRow,
  WeekWindow,
  CashierRef,
} from "../pages/lpActions/lpActionsMetrics";
import type {
  CashierBenchmark,
  CashierProfile,
  CashierRollupRow,
  CashierTransaction,
} from "../interfaces";

/**
 * LP Actions page state.
 *
 * The walk is expensive — one paged request per week — so the result lives here
 * rather than in the component: navigating away and back should not re-run it.
 * View state (selection, filter, how many weeks were asked for) sits alongside
 * it for the same reason.
 */
export type LpSevFilter = "all" | "investigate" | "watch" | "steady";

/** The case's two reads: what the numbers say, then the rows behind them. */
export type LpCaseView = "case" | "evidence";

export interface LpActionsState {
  /** What the walk was run against, for the header — a store or a group. */
  scopeLabel: string;
  /** Sale types whose store rows are open. Collapsed to start: a group can
   *  produce forty-odd rows, and the type is the level people scan. */
  expandedTypes: string[];
  /** Weeks of history in the current result. Grows when the user asks for
   *  more — the baseline widens with it, so a verdict can change. */
  weeks: number;
  rows: ExceptionRow[];
  /** Every exception transaction the walk read. Held because the cashier
   *  journey is derived from it — the walk already downloaded every type and
   *  every week, so drilling into one operator costs nothing further. */
  rawRows: CashierTransaction[];
  /**
   * The overview came from `cashier_table`'s per-cashier rollup rather than
   * from the rows themselves.
   *
   * The grades are the same either way — both paths share one grading function
   * — but `rawRows` is empty, so the case file has nothing to open. The flag
   * exists so the UI can say the drill is unavailable instead of rendering an
   * empty case, which reads as "this cashier did nothing".
   */
  rollup: boolean;
  /**
   * The open case's rows, when they had to be fetched.
   *
   * Empty on the prod walk, where `rawRows` already holds everything. In rollup
   * mode the case fetches one cashier's baskets and rebuilds `cashier_table`
   * rows from their lines — and the connection plot, which is opened from an
   * open case for that same cashier, reads them rather than fetching the
   * identical thing a second time.
   */
  caseRows: CashierTransaction[];
  /**
   * The graded cashiers for the whole search, from the stats call.
   *
   * Fetched once alongside the exception list and filtered in the browser —
   * "every flagged cashier for this exception" and "the ones at this store" are
   * the same array with and without a storeid clause, so neither view costs a
   * request.
   */
  /**
   * Call 1's rollup, one row per store/type/week/cashier, for everyone.
   *
   * Kept rather than reduced away. It is the whole population at cashier-week
   * grain, so it carries every average the list compares against — the store's
   * and the group's — and every week including the quiet ones. The graded rows
   * beside it are a summary of these; this is the source.
   */
  rollupRows: CashierRollupRow[];
  /** Call 2's pivot: only the cashiers past the enrichment threshold. */
  profiles: CashierProfile[];
  benchmarks: Record<string, CashierBenchmark>;
  /**
   * Which profiles the right panel is showing: an exception across every store,
   * or one store within it. Null saleType means nothing is selected.
   *
   * Held apart from `selectedId` because the exception row and the store row
   * under it are now both destinations, and `selectedId` cannot express the
   * first one — it is keyed `storeid__saleType`.
   */
  profileType: string | null;
  profileStore: number | null;
  windows: WeekWindow[];
  selectedId: string | null;
  /** Cashier whose journey is open, or null. The connection plot stays a
   *  modal: exploratory, and it genuinely wants the width. */
  journeyCashier: CashierRef | null;
  /** The case open in the right panel — cashier plus the exception type it is
   *  written about. Null cashier means the panel is showing the exception
   *  detail instead. */
  caseCashier: CashierRef | null;
  caseType: string | null;
  /**
   * Which week of the case is being read, as an index into `windows`.
   *
   * The case opens on the person's worst week rather than the whole span. Four
   * weeks of receipts is more evidence than anyone reads, and the week that
   * flagged is the one the finding is about — everything else is the baseline
   * it was measured against.
   */
  caseWeek: number | null;
  /**
   * Which half of the case is on screen.
   *
   * The case reads in two passes and they want different room: what the
   * numbers say, then the rows they were counted from. Splitting them lets the
   * roster column stay in place across both, so moving between cashiers never
   * costs a trip back to the store panel.
   */
  caseView: LpCaseView;
  /** Whether the roster's "not flagged" section is open. Here rather than in
   *  the list so it survives moving between cashiers and panels. */
  quietOpen: boolean;
  sevFilter: LpSevFilter;
  searched: boolean;
  loading: boolean;
  /** What the walk is doing, for the entry card's progress line. */
  message: string;
  error: string | null;
}

const initialState: LpActionsState = {
  scopeLabel: "",
  expandedTypes: [],
  weeks: 4,
  rows: [],
  rawRows: [],
  rollup: false,
  caseRows: [],
  rollupRows: [],
  profiles: [],
  benchmarks: {},
  profileType: null,
  profileStore: null,
  windows: [],
  selectedId: null,
  journeyCashier: null,
  caseCashier: null,
  caseType: null,
  caseWeek: null,
  caseView: "case",
  quietOpen: false,
  sevFilter: "all",
  searched: false,
  loading: false,
  message: "",
  error: null,
};

const lpActionsSlice = createSlice({
  name: "lpActions",
  initialState,
  reducers: {
    setLpScopeLabel: (state, action: PayloadAction<string>) => {
      state.scopeLabel = action.payload;
    },
    toggleLpType: (state, action: PayloadAction<string>) => {
      state.expandedTypes = state.expandedTypes.includes(action.payload)
        ? state.expandedTypes.filter((t) => t !== action.payload)
        : [...state.expandedTypes, action.payload];
    },
    /**
     * Drop the previous search's result, at the moment the next one starts.
     *
     * `setLpResult` overwrites every one of these fields when it lands, which
     * is not the same thing: between the click and the answer the slice still
     * held the old store's rows, and every panel reading it rendered them.
     * Behind a modal that is merely untidy; anything else reading the slice —
     * an export, a deep link, a second panel — was reading the wrong store.
     *
     * `searched` deliberately stays true. Flipping it back would swap the whole
     * page for the entry card mid-search and then swap it away again.
     */
    clearLpResult: (state) => {
      state.rows = [];
      state.rawRows = [];
      state.rollup = false;
      state.windows = [];
      state.selectedId = null;
      state.journeyCashier = null;
      state.caseCashier = null;
      state.caseType = null;
      state.sevFilter = "all";
      state.expandedTypes = [];
      state.caseRows = [];
      state.rollupRows = [];
      state.profiles = [];
      state.benchmarks = {};
      state.profileType = null;
      state.profileStore = null;
    },
    setLpLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (action.payload) state.error = null;
    },
    setLpMessage: (state, action: PayloadAction<string>) => {
      state.message = action.payload;
    },
    setLpError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
      state.message = "";
    },
    setLpResult: (
      state,
      action: PayloadAction<{
        rows: ExceptionRow[];
        rawRows: CashierTransaction[];
        rollup: boolean;
        windows: WeekWindow[];
        weeks: number;
        /**
         * A new scope, rather than the same one re-walked for another week.
         *
         * "Add week" must keep the reader's place — the filter chip, the
         * expanded groups, the selected row — because it is the same search
         * answering a wider question. A different store is a different
         * question, and carrying a severity filter into it is how a search
         * comes back looking empty when it is only filtered.
         */
        fresh: boolean;
      }>,
    ) => {
      if (action.payload.fresh) {
        state.sevFilter = "all";
        state.expandedTypes = [];
        state.selectedId = null;
      }
      state.rows = action.payload.rows;
      state.rawRows = action.payload.rawRows;
      state.rollup = action.payload.rollup;
      state.windows = action.payload.windows;
      state.journeyCashier = null;
      state.caseCashier = null;
      state.caseType = null;
      state.weeks = action.payload.weeks;
      // Keep the selection when it survived the re-walk — asking for another
      // week shouldn't throw away the row being read.
      const stillThere = action.payload.rows.some(
        (r) => r.id === state.selectedId,
      );
      if (!stillThere) state.selectedId = action.payload.rows[0]?.id ?? null;
      state.searched = true;
      state.loading = false;
      state.message = "";
      state.error = null;
    },
    setLpSelected: (state, action: PayloadAction<string | null>) => {
      state.selectedId = action.payload;
      // Picking a different exception leaves the case behind — it was written
      // about the one you were reading.
      state.caseCashier = null;
      state.caseType = null;
    },
    setLpJourneyCashier: (state, action: PayloadAction<CashierRef | null>) => {
      state.journeyCashier = action.payload;
    },
    setLpRollupRows: (state, action: PayloadAction<CashierRollupRow[]>) => {
      state.rollupRows = action.payload;
    },
    setLpProfiles: (
      state,
      action: PayloadAction<{
        profiles: CashierProfile[];
        benchmarks: Record<string, CashierBenchmark>;
      }>,
    ) => {
      state.profiles = action.payload.profiles;
      state.benchmarks = action.payload.benchmarks;
    },
    /** Show an exception across every store, or one store within it. */
    setLpProfileScope: (
      state,
      action: PayloadAction<{
        saleType: string | null;
        storeid: number | null;
      }>,
    ) => {
      state.profileType = action.payload.saleType;
      state.profileStore = action.payload.storeid;
      // A new scope is a new question; the case written about the old one goes.
      state.caseCashier = null;
      state.caseType = null;
      state.caseWeek = null;
      state.caseRows = [];
    },
    setLpCaseRows: (state, action: PayloadAction<CashierTransaction[]>) => {
      state.caseRows = action.payload;
    },
    setLpCaseWeek: (state, action: PayloadAction<number | null>) => {
      state.caseWeek = action.payload;
    },
    setLpCase: (
      state,
      action: PayloadAction<{
        ref: CashierRef;
        type: string;
        /** The week to open on — their worst, decided by the caller who has
         *  the standings in hand. */
        week?: number | null;
      } | null>,
    ) => {
      const next = action.payload;
      /**
       * Compared by value, not by reference.
       *
       * Every caller builds a fresh `{ storeid, cashierNumber }`, so an
       * identity check is true even when the tab strip re-selects the person
       * already open — which cleared their receipts and made a type switch
       * refetch the same baskets.
       */
      const sameCashier =
        !!next &&
        !!state.caseCashier &&
        next.ref.storeid === state.caseCashier.storeid &&
        next.ref.cashierNumber === state.caseCashier.cashierNumber;

      // Switching cashier must not leave the previous one's receipts on screen
      // under the new name, even for the frame before the fetch returns.
      if (!sameCashier) {
        state.caseRows = [];
        state.caseView = "case";
      }

      state.caseCashier = next?.ref ?? null;
      state.caseType = next?.type ?? null;
      // The week is scope, not part of the tab. An omitted `week` on the
      // person already open keeps the week they are reading; `null` still
      // clears it, so a caller that means the whole window can say so.
      state.caseWeek = !next
        ? null
        : next.week === undefined
          ? sameCashier
            ? state.caseWeek
            : null
          : next.week;
    },
    setLpCaseView: (state, action: PayloadAction<LpCaseView>) => {
      state.caseView = action.payload;
    },
    toggleLpQuiet: (state) => {
      state.quietOpen = !state.quietOpen;
    },
    setLpSevFilter: (state, action: PayloadAction<LpSevFilter>) => {
      state.sevFilter = action.payload;
    },
    clearLpActions: () => initialState,
  },
});

export const {
  setLpScopeLabel,
  setLpJourneyCashier,
  setLpCase,
  toggleLpType,
  setLpLoading,
  setLpMessage,
  setLpError,
  setLpResult,
  clearLpResult,
  setLpCaseRows,
  setLpCaseWeek,
  setLpCaseView,
  toggleLpQuiet,
  setLpRollupRows,
  setLpProfiles,
  setLpProfileScope,
  setLpSelected,
  setLpSevFilter,
  clearLpActions,
} = lpActionsSlice.actions;

export default lpActionsSlice.reducer;
