import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  ExceptionRow,
  WeekWindow,
  CashierRef,
} from "../pages/lpActions/lpActionsMetrics";
import type { CashierTransaction } from "../interfaces";

/**
 * LP Actions page state.
 *
 * The walk is expensive — one paged request per week — so the result lives here
 * rather than in the component: navigating away and back should not re-run it.
 * View state (selection, filter, how many weeks were asked for) sits alongside
 * it for the same reason.
 */
export type LpSevFilter = "all" | "investigate" | "watch" | "steady";

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
  windows: [],
  selectedId: null,
  journeyCashier: null,
  caseCashier: null,
  caseType: null,
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
    setLpCaseRows: (state, action: PayloadAction<CashierTransaction[]>) => {
      state.caseRows = action.payload;
    },
    setLpCase: (
      state,
      action: PayloadAction<{ ref: CashierRef; type: string } | null>,
    ) => {
      state.caseCashier = action.payload?.ref ?? null;
      state.caseType = action.payload?.type ?? null;
      // Switching cashier must not leave the previous one's receipts on screen
      // under the new name, even for the frame before the fetch returns.
      if (action.payload?.ref !== state.caseCashier) state.caseRows = [];
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
  setLpSelected,
  setLpSevFilter,
  clearLpActions,
} = lpActionsSlice.actions;

export default lpActionsSlice.reducer;
