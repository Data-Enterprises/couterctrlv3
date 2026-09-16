import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ReceiptLine } from "../pages/shared/eventPerf/receiptTypes";

/**
 * One thing that happened at a register.
 *
 * Loss Prevention and Coupon Sales ask the same question of different events —
 * who did this, where, how often, and show me the receipt. Their endpoints
 * disagree about almost everything else, so each page normalises to this and
 * the screen never learns which one it is looking at.
 *
 * `count` exists because a row is not always one transaction: an aggregate row
 * can stand for two hundred, and a baseline row is halved to half of one.
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
  /** Time of day as zero-padded HHMMSS, so a string compare is a time compare.
   *  Empty when the source did not carry one. */
  time: string;
  amount: number;
  /** Transactions this row stands for. 1 for a real event, 0.5 for one in the
   *  fortnight baseline. */
  count: number;
}

/** Which list the middle tab shows. */
export type EventView = "stores" | "cashiers" | "receipts";

/** The two lists that sort. Transactions keep their time order. */
export type EventSortList = "stores" | "cashiers";

/**
 * How a store or cashier list is ordered.
 *
 * `name` is store number on the store list and cashier name on the cashier
 * list — each is how that list is referred to out loud.
 */
export type EventSort = "transactions" | "amount" | "change" | "name";

/**
 * `storeid` alone is not unique — 685 carries both store_number 369 and 370,
 * and grouping on it double-counts them into one row.
 */
export const storeKeyOf = (r: EventRow) => `${r.storeid}__${r.store_number}`;

/** Cashiers repeat across stores, so identity is the pair. */
export const cashierKeyOf = (r: EventRow) =>
  `${storeKeyOf(r)}__${r.cashier_number ?? ""}`;

/** The receipt in the sheet, and how far its lines have got. */
export interface EventReceiptState {
  saleId: string;
  status: "loading" | "ready" | "error";
  lines: ReceiptLine[];
}

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
  /**
   * Bumped by every load and every claim.
   *
   * Owner alone was not enough: a load still in flight when the other page
   * claimed the slice finished afterwards and wrote its rows in anyway. A
   * result now carries the generation it started under, and lands only if
   * that is still the current one — so switching pages, or searching again
   * before the first search returns, drops the older answer.
   */
  loadGen: number;

  hasSearched: boolean;
  loading: boolean;
  loadingMessage: string;

  /**
   * The week the rows in here actually cover.
   *
   * Not the search slice's date. That one moves the moment someone opens the
   * search card and touches the picker, and every date on the screen reading
   * it drew a week that had never been loaded — an empty chart and "Busiest —"
   * over the old totals.
   */
  loadedStart: string | null;

  /** The search card is open over results already loaded. */
  searchOpen: boolean;
  /** The "?" sheet. */
  infoOpen: boolean;

  /** The searched week. */
  rows: EventRow[];
  /**
   * The comparison period, already scaled to one week's worth.
   *
   * Both pages read the fourteen days before the week and halve each row in
   * their adapter. By the time rows land here the two mean the same thing,
   * which is the only reason one bar can render both.
   */
  baseline: EventRow[];

  /** Every lens value the search found, in the order the page wants them. */
  lenses: string[];
  /** The active lens. Null means every lens at once. */
  lens: string | null;

  view: EventView;

  /**
   * How each list is ordered. Null is the page's own default — count on LP,
   * dollars on Coupon Sales — which the slice cannot know, since it serves
   * both. Kept across searches: it is a preference, not part of the result.
   */
  sort: Record<EventSortList, EventSort | null>;

  /** ISO date, or null for the whole week. Tapping the same day clears it. */
  selectedDay: string | null;

  selectedStoreKey: string | null;
  selectedStoreLabel: string | null;
  selectedCashierKey: string | null;
  selectedCashierLabel: string | null;

  /** The receipt open in the sheet. */
  openSaleId: string | null;
  /** Its lines. Kept apart from openSaleId so a fetch that lands for a
   *  receipt already closed can be recognised and dropped. */
  receipt: EventReceiptState | null;

  query: string;
  listLimit: number;
}

/** Rows rendered before the rest move behind a button. A busy group runs to
 *  thousands of receipts, and rendering them all is what froze Daily. */
export const ROWS_PER_PAGE = 100;

const initialState: EventPerfState = {
  owner: null,
  loadGen: 0,
  hasSearched: false,
  loading: false,
  loadingMessage: "",
  loadedStart: null,
  searchOpen: false,
  infoOpen: false,
  rows: [],
  baseline: [],
  lenses: [],
  lens: null,
  view: "stores",
  sort: { stores: null, cashiers: null },
  selectedDay: null,
  selectedStoreKey: null,
  selectedStoreLabel: null,
  selectedCashierKey: null,
  selectedCashierLabel: null,
  openSaleId: null,
  receipt: null,
  query: "",
  listLimit: ROWS_PER_PAGE,
};

/** Identifies the load a result belongs to. */
interface LoadTag {
  owner: string;
  gen: number;
}

const isCurrent = (state: EventPerfState, tag: LoadTag) =>
  state.owner === tag.owner && state.loadGen === tag.gen;

const closeSheet = (state: EventPerfState) => {
  state.openSaleId = null;
  state.receipt = null;
};

/** Everything below a store selection. Used whenever the scope above it moves. */
const clearCashier = (state: EventPerfState) => {
  state.selectedCashierKey = null;
  state.selectedCashierLabel = null;
  closeSheet(state);
};

/** The slice as a fresh page finds it. The generation carries on rather than
 *  resetting, so a load started before the claim can never match again. */
const claimed = (state: EventPerfState, owner: string): EventPerfState => ({
  ...initialState,
  owner,
  loadGen: state.loadGen + 1,
});

const eventPerfSlice = createSlice({
  name: "eventPerf",
  initialState,
  reducers: {
    /**
     * Start a load. Claims the slice first if another page holds it, then
     * opens a new generation — read it back off the store to tag the result.
     * A claim is already a new generation, so that path does not bump twice.
     */
    beginEventLoad: (
      state,
      action: PayloadAction<{ owner: string; message: string }>,
    ) => {
      if (state.owner !== action.payload.owner)
        return {
          ...claimed(state, action.payload.owner),
          loading: true,
          loadingMessage: action.payload.message,
        };
      state.loadGen += 1;
      state.loading = true;
      state.loadingMessage = action.payload.message;
    },
    setEventLoadProgress: (
      state,
      action: PayloadAction<LoadTag & { message: string }>,
    ) => {
      if (!isCurrent(state, action.payload)) return;
      state.loadingMessage = action.payload.message;
    },
    setEventData: (
      state,
      action: PayloadAction<
        LoadTag & {
          rows: EventRow[];
          baseline: EventRow[];
          lenses: string[];
          /** The first day of the week that was loaded, ISO. The other six
           *  follow from it. */
          start: string;
        }
      >,
    ) => {
      // Another page, or a newer search, has taken over since this started.
      if (!isCurrent(state, action.payload)) return;
      state.rows = action.payload.rows;
      state.baseline = action.payload.baseline;
      state.lenses = action.payload.lenses;
      state.loadedStart = action.payload.start;
      state.hasSearched = true;
      state.loading = false;
      state.loadingMessage = "";
      state.searchOpen = false;
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
    /** The load failed. Only the current load may clear the spinner — an old
     *  one failing late must not stop a newer one mid-flight. */
    failEventLoad: (state, action: PayloadAction<LoadTag>) => {
      if (!isCurrent(state, action.payload)) return;
      state.loading = false;
      state.loadingMessage = "";
      state.hasSearched = true;
    },
    setEventSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.searchOpen = action.payload;
    },
    setEventInfoOpen: (state, action: PayloadAction<boolean>) => {
      state.infoOpen = action.payload;
    },
    setEventSort: (
      state,
      action: PayloadAction<{ list: EventSortList; sort: EventSort }>,
    ) => {
      state.sort[action.payload.list] = action.payload.sort;
      state.listLimit = ROWS_PER_PAGE;
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
      closeSheet(state);
    },
    setEventView: (state, action: PayloadAction<EventView>) => {
      state.view = action.payload;
      state.listLimit = ROWS_PER_PAGE;
      closeSheet(state);
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
      closeSheet(state);
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
      state.receipt = { saleId: action.payload, status: "loading", lines: [] };
    },
    /** A receipt's lines arrived. Dropped unless that receipt is still the
     *  open one, under the same load — ids are only unique within a page. */
    setReceiptLines: (
      state,
      action: PayloadAction<LoadTag & { saleId: string; lines: ReceiptLine[] }>,
    ) => {
      if (!isCurrent(state, action.payload)) return;
      if (state.receipt?.saleId !== action.payload.saleId) return;
      state.receipt.status = "ready";
      state.receipt.lines = action.payload.lines;
    },
    failReceipt: (state, action: PayloadAction<LoadTag & { saleId: string }>) => {
      if (!isCurrent(state, action.payload)) return;
      if (state.receipt?.saleId !== action.payload.saleId) return;
      state.receipt.status = "error";
      state.receipt.lines = [];
    },
    closeReceipt: (state) => {
      closeSheet(state);
    },
    showMoreEvents: (state) => {
      state.listLimit += ROWS_PER_PAGE;
    },
    /** Hand the slice to a page, discarding whatever the last one left. */
    claimEventPerf: (state, action: PayloadAction<string>) =>
      claimed(state, action.payload),
    resetEventPerf: (state) => ({ ...initialState, loadGen: state.loadGen + 1 }),
  },
});

export const {
  beginEventLoad,
  setEventLoadProgress,
  setEventData,
  failEventLoad,
  setEventSearchOpen,
  setEventInfoOpen,
  setEventSort,
  setEventLens,
  setEventView,
  toggleEventDay,
  selectEventStore,
  selectEventCashier,
  clearEventCashier,
  clearEventStore,
  setEventQuery,
  openReceipt,
  setReceiptLines,
  failReceipt,
  closeReceipt,
  showMoreEvents,
  claimEventPerf,
  resetEventPerf,
} = eventPerfSlice.actions;

export default eventPerfSlice.reducer;
