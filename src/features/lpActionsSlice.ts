import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  ExceptionRow,
  WeekWindow,
  CashierRef,
  CaseSubject,
} from "../pages/lpActions/lpActionsMetrics";
import type { CashierTransaction, TransactionListItem } from "../interfaces";
import type { SortState } from "../utils/useTriStateSort";

/**
 * LP Actions page state.
 *
 * The walk is expensive — one paged request per week — so the result lives here
 * rather than in the component: navigating away and back should not re-run it.
 * View state (selection, filter, how many weeks were asked for) sits alongside
 * it for the same reason.
 */
export type LpSevFilter = "all" | "investigate" | "watch" | "steady";

/** Which half of the case file the right panel is showing. Named for the tabs
 *  a reader actually sees, so the state and the label can't drift apart. */
export type LpCaseStep = "overview" | "evidence";

/** Roster columns that can be sorted. */
export type LpRosterSortCol = "name" | "weeks" | "total" | "base";
/** Evidence grid columns that can be sorted. */
export type LpEvidenceSortCol =
  | "date"
  | "time"
  | "txn"
  | "lane"
  | "qty"
  | "amount";

/** How the deviation cards are ordered. */
export type LpCardSort = "deviation" | "volume" | "value";

/** One receipt, identified the way `cashiers/transaction` asks for it. */
export interface LpReceiptRef {
  saleId: string;
  storeid: number;
  /** yyyy-mm-dd. */
  date: string;
  /** The exception that led here, so its lines can be picked out. */
  saleType: string;
}

export interface LpActionsState {
  /** What the walk was run against, for the header — a store or a group. */
  scopeLabel: string;
  /** Stores whose cashier rows are open, keyed by storeid. Collapsed to
   *  start — a group can carry forty operators, and the store is the level
   *  people scan before they pick a person. */
  expandedStores: string[];
  /**
   * Column sorts, tri-state: unsorted to descending to ascending and back.
   *
   * In the slice rather than in `useTriStateSort`, which every other graded
   * page uses, because this page keeps its view state where it can survive a
   * route change. The transition and the header component are the shared
   * ones — only where the value lives differs.
   *
   * Null is not "no order": it is the list's OWN order, worst grade first,
   * which is the point of the page. Sorting by a column is a lens, so there
   * has to be a way back to it.
   */
  rosterSort: SortState<LpRosterSortCol>;
  evidenceSort: SortState<LpEvidenceSortCol>;
  /** Name or number the roster is filtered by. Alongside `sevFilter`, which
   *  narrows first — severity then text, AND not OR. */
  rosterQuery: string;
  /** Weeks of history in the current result. Grows when the user asks for
   *  more — the baseline widens with it, so a verdict can change. */
  weeks: number;
  rows: ExceptionRow[];
  /** Every exception transaction the walk read. Held because the cashier
   *  journey is derived from it — the walk already downloaded every type and
   *  every week, so drilling into one operator costs nothing further. */
  rawRows: CashierTransaction[];
  windows: WeekWindow[];
  selectedId: string | null;
  /** Cashier whose journey is open, or null. The connection plot stays a
   *  modal: exploratory, and it genuinely wants the width. */
  journeyCashier: CashierRef | null;
  /**
   * What the right panel is reporting on: a store, or one operator inside it.
   *
   * A group search opens on a store, because at that level the question is
   * which site moved; picking a cashier narrows the same panel to them. A
   * single-store search opens on its one store, where a store row would
   * otherwise be a heading over a list of one.
   */
  caseSubject: CaseSubject | null;
  caseType: string | null;
  sevFilter: LpSevFilter;
  /** Which half of the case file is showing. The evidence half is where the
   *  receipt reads happen, so this also gates the expensive work. */
  caseStep: LpCaseStep;
  cardSort: LpCardSort;
  /** The exception type whose card is selected, carried into the transactions
   *  view as its opening filter. Null means every type. */
  focusedType: string | null;
  /**
   * Index into `windows` when the charts are cut to one week, null for the
   * whole walk. Chart-only: the cards and the KPI strip are always the latest
   * week, because that is what the grading compares.
   */
  focusedWeek: number | null;
  /**
   * Facet groups expanded by hand. A group holding an active value counts as
   * open regardless — a filter you cannot see is one you cannot take off.
   *
   * Exception type starts open because it is the one everyone reaches for,
   * and five groups fully expanded is thirty rows before a question has been
   * asked of any of them.
   */
  expandedFacets: string[];
  /** Facet key -> selected values. Multi-select within a group (OR),
   *  intersected across groups (AND). */
  facets: Record<string, string[]>;
  /** The receipt open over the transactions list, or null. */
  openReceipt: LpReceiptRef | null;
  /**
   * Receipt lines already read, keyed by the scope that asked for them —
   * `saleType:id,id,…` over the capped, deduped, sorted sale ids.
   *
   * Keyed per SCOPE rather than per scope-set on purpose. The case report and
   * the journey drill build their scopes identically — filter `rawRows` by
   * cashier and type, then `[...new Set(ids)].sort()` — so a type read for the
   * case report is the same key the drill asks for, and the second read is
   * free. A whole-set key would miss that entirely.
   *
   * Only successful reads land here. `transaction_list` answers `[]` on an
   * error as readily as on an empty result, and caching that would pin the
   * empty answer permanently and never retry.
   */
  receiptLines: Record<string, TransactionListItem[]>;
  /** Whole baskets from `cashiers/transaction`, keyed `storeid:date:saleId` —
   *  all three, because a sale id is only unique within a store and a day. */
  baskets: Record<string, TransactionListItem[]>;
  /** Keys currently in flight. Drives the per-key spinner, so one drill's
   *  request cannot show a spinner over another's cached result. */
  pending: string[];
  searched: boolean;
  loading: boolean;
  /** What the walk is doing, for the entry card's progress line. */
  message: string;
  error: string | null;
}

const initialState: LpActionsState = {
  scopeLabel: "",
  expandedStores: [],
  rosterQuery: "",
  rosterSort: null,
  evidenceSort: null,
  weeks: 4,
  rows: [],
  rawRows: [],
  windows: [],
  selectedId: null,
  journeyCashier: null,
  caseSubject: null,
  caseType: null,
  sevFilter: "all",
  caseStep: "overview",
  cardSort: "deviation",
  focusedType: null,
  focusedWeek: null,
  expandedFacets: ["type"],
  facets: {},
  openReceipt: null,
  receiptLines: {},
  baskets: {},
  pending: [],
  searched: false,
  loading: false,
  message: "",
  error: null,
};

/** The shared tri-state transition, lifted out of `useTriStateSort` so the
 *  two behave identically. */
const cycle = <C extends string>(
  prev: SortState<C>,
  col: C,
): SortState<C> => {
  if (prev?.col !== col) return { col, dir: "desc" };
  if (prev.dir === "desc") return { col, dir: "asc" };
  return null;
};

const lpActionsSlice = createSlice({
  name: "lpActions",
  initialState,
  reducers: {
    setLpScopeLabel: (state, action: PayloadAction<string>) => {
      state.scopeLabel = action.payload;
    },
    toggleLpStore: (state, action: PayloadAction<string>) => {
      state.expandedStores = state.expandedStores.includes(action.payload)
        ? state.expandedStores.filter((t) => t !== action.payload)
        : [...state.expandedStores, action.payload];
    },
    setLpRosterQuery: (state, action: PayloadAction<string>) => {
      state.rosterQuery = action.payload;
    },
    setLpRosterSort: (state, action: PayloadAction<LpRosterSortCol>) => {
      state.rosterSort = cycle(state.rosterSort, action.payload);
    },
    setLpEvidenceSort: (state, action: PayloadAction<LpEvidenceSortCol>) => {
      state.evidenceSort = cycle(state.evidenceSort, action.payload);
    },
    setLpCaseStep: (state, action: PayloadAction<LpCaseStep>) => {
      state.caseStep = action.payload;
      // Arriving from a selected card opens the evidence already narrowed to
      // that type — the card WAS the question, and making someone re-pick it
      // on the next screen is a click that says nothing.
      // Checks the TYPE facet specifically, not whether any facet is set — a
      // day picked on the weekday chart is also a facet, and it should not
      // stop the selected card from narrowing the evidence too.
      if (
        action.payload === "evidence" &&
        state.focusedType &&
        !state.facets.type
      ) {
        state.facets.type = [state.focusedType];
      }
      // Leaving the evidence half closes the receipt that was open over it —
      // coming back to a stale one reads as a bug.
      if (action.payload === "overview") state.openReceipt = null;
    },
    setLpCardSort: (state, action: PayloadAction<LpCardSort>) => {
      state.cardSort = action.payload;
    },
    setLpFocusedType: (state, action: PayloadAction<string | null>) => {
      state.focusedType = action.payload;
    },
    setLpFocusedWeek: (state, action: PayloadAction<number | null>) => {
      state.focusedWeek = action.payload;
    },
    toggleLpFacetGroup: (state, action: PayloadAction<string>) => {
      state.expandedFacets = state.expandedFacets.includes(action.payload)
        ? state.expandedFacets.filter((k) => k !== action.payload)
        : [...state.expandedFacets, action.payload];
    },
    toggleLpFacet: (
      state,
      action: PayloadAction<{ key: string; value: string }>,
    ) => {
      const { key, value } = action.payload;
      const current = state.facets[key] ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      if (next.length === 0) delete state.facets[key];
      else state.facets[key] = next;
    },
    clearLpFacets: (state) => {
      state.facets = {};
    },
    setLpOpenReceipt: (state, action: PayloadAction<LpReceiptRef | null>) => {
      state.openReceipt = action.payload;
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
        windows: WeekWindow[];
        weeks: number;
      }>,
    ) => {
      state.rows = action.payload.rows;
      state.rawRows = action.payload.rawRows;
      state.windows = action.payload.windows;
      // Sale ids belong to a store and a window, so a fresh walk invalidates
      // every cached read. Dropped rather than reconciled — the keys would not
      // collide, but keeping them would hold a whole previous search in memory
      // for nothing.
      state.receiptLines = {};
      state.baskets = {};
      state.pending = [];
      state.journeyCashier = null;
      state.caseSubject = null;
      state.caseType = null;
      // A fresh walk is a fresh roster: the stores, the person being read and
      // everything downstream of them all belong to the previous result.
      state.expandedStores = [];
      state.caseStep = "overview";
      state.focusedType = null;
      state.focusedWeek = null;
      state.expandedFacets = ["type"];
      state.facets = {};
      state.openReceipt = null;
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
      state.caseSubject = null;
      state.caseType = null;
    },
    setLpJourneyCashier: (state, action: PayloadAction<CashierRef | null>) => {
      state.journeyCashier = action.payload;
    },
    setLpCase: (
      state,
      action: PayloadAction<{ ref: CaseSubject; type: string } | null>,
    ) => {
      state.caseSubject = action.payload?.ref ?? null;
      state.caseType = action.payload?.type ?? null;
      // Every case opens on its own first page. Carrying the previous
      // operator's tab, card and facets into a new one would answer a
      // question nobody asked about this person.
      state.caseStep = "overview";
      state.focusedType = null;
      state.focusedWeek = null;
      state.expandedFacets = ["type"];
      state.facets = {};
      state.openReceipt = null;
    },
    setLpSevFilter: (state, action: PayloadAction<LpSevFilter>) => {
      state.sevFilter = action.payload;
    },
    lpFetchStarted: (state, action: PayloadAction<string[]>) => {
      for (const key of action.payload) {
        if (!state.pending.includes(key)) state.pending.push(key);
      }
    },
    lpFetchSettled: (state, action: PayloadAction<string[]>) => {
      state.pending = state.pending.filter((k) => !action.payload.includes(k));
    },
    cacheLpReceiptLines: (
      state,
      action: PayloadAction<{ key: string; lines: TransactionListItem[] }[]>,
    ) => {
      for (const entry of action.payload) {
        state.receiptLines[entry.key] = entry.lines;
      }
    },
    cacheLpBasket: (
      state,
      action: PayloadAction<{ key: string; lines: TransactionListItem[] }>,
    ) => {
      state.baskets[action.payload.key] = action.payload.lines;
    },
    clearLpActions: () => initialState,
  },
});

export const {
  setLpScopeLabel,
  setLpJourneyCashier,
  setLpCase,
  toggleLpStore,
  setLpRosterQuery,
  setLpRosterSort,
  setLpEvidenceSort,
  setLpCaseStep,
  setLpCardSort,
  setLpFocusedType,
  setLpFocusedWeek,
  toggleLpFacet,
  toggleLpFacetGroup,
  clearLpFacets,
  setLpOpenReceipt,
  setLpLoading,
  setLpMessage,
  setLpError,
  setLpResult,
  setLpSelected,
  setLpSevFilter,
  lpFetchStarted,
  lpFetchSettled,
  cacheLpReceiptLines,
  cacheLpBasket,
  clearLpActions,
} = lpActionsSlice.actions;

export default lpActionsSlice.reducer;
