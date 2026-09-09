import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  SuggestedItem,
  SuggestedGroupRow,
  SuggestedParameters,
  SuggestedCoverage,
  SuggestedNotSelling,
  SuggestedDailySeries,
  NotSellingStatus,
} from "../interfaces";

/** The not-selling chip row, which carries an "all" option the payload has no
 *  equivalent for — the statuses are worth reading together, and opening on one
 *  of them hides two thirds of the answer. */
export type NotSellingFilter = NotSellingStatus | "all";

/** The three readings of one department. `order` is the buyer's, `production`
 *  the manager's, `notSelling` the one that answers what is dying. */
export type SuggestedTab = "order" | "production" | "notSelling";

/** Which store x department the sheet is showing. `sub_department` is nullable
 *  because the payload's own department can be null — those rows are real and
 *  a buyer still has to order them. */
export interface SheetKey {
  storeid: number;
  storeLabel: string;
  sub_department: number | null;
  sub_department_description: string | null;
}

interface SuggestedState {
  /** The order parameters. These live here rather than in `search` because
   *  they are this page's model inputs, not a store/date search — and because
   *  changing one has to re-run the whole fetch, which the page owns. */
  /**
   * The day the order is placed, `yyyy-mm-dd`.
   *
   * This page's own rather than `searchSlice.singleDate`. That one starts a day
   * back because every reporting page wants a complete day; an order is placed
   * TODAY, and the endpoint treats an earlier date as a comparison and strips
   * the order figures. Writing today into the shared slice to fix this page
   * moved the week ending on every other one.
   *
   * Held as the wire format end to end. Every conversion between a Date and a
   * date string in this app is somewhere a day can be lost.
   *
   * No control writes it yet — an order is always placed today, and a past date
   * only becomes meaningful alongside the year-over-year comparison. `setAsOf`
   * is the seam that work plugs into.
   */
  asOf: string;
  leadDays: number;
  coverDays: number;
  lookbackWeeks: number;

  /** Group rollup: one row per store x sub department. Drives the left tree. */
  groupRows: SuggestedGroupRow[];
  /**
   * Item rows for the ACTIVE STORE — every department, not just the selected
   * one.
   *
   * The endpoint has always returned the whole store; the page used to fetch it
   * per department and throw ~70% away, refetching the identical payload on
   * every department click. Holding the store means one call per store instead
   * of one per department, and the store-wide views (Top to order, the exports)
   * come out of a response already in hand.
   */
  items: SuggestedItem[];
  /** Which store's items are loaded. Distinct from `sheetKey`, which says which
   *  department of it is being read — null there means the store overview. */
  activeStoreId: number | null;
  activeStoreLabel: string;

  /**
   * Day-by-day history, one entry per store x department, keyed by
   * `dailyKey()`. Held whole rather than per row: it is DEPARTMENT history, and
   * hanging it off an item row makes it read as that item's own.
   */
  dailyByDepartment: Record<string, SuggestedDailySeries> | null;

  /** Items that stopped or slowed, for the active store. Own key, never merged
   *  into `items` — a zero-demand row is not an order. */
  notSelling: SuggestedNotSelling | null;
  /** Which status the not-selling tab is showing. Opens on `declining`: dead and
   *  stopped are already obvious, an item at half its old rate is not. */
  notSellingStatus: NotSellingFilter;

  /** Which lens the right panel is showing. */
  activeTab: SuggestedTab;

  parameters: SuggestedParameters | null;
  coverage: SuggestedCoverage | null;

  /** Storeids that were asked for. Kept separately from `groupRows` so the page
   *  can say "18 of 20 answered" — the response echoes what was requested but
   *  silently omits stores that returned nothing, and a buyer covering a group
   *  cannot otherwise tell "no scale items" from "that store failed". */
  requestedStoreIds: number[];

  sheetKey: SheetKey | null;
  expandedStores: number[];

  loadingGroup: boolean;
  loadingItems: boolean;
  exportOpen: boolean;

  /** Filters. Redux rather than local state so a buyer who opens another
   *  department and comes back finds the page as they left it. */
  /** Which cover-window day the sheet is reading, `yyyy-mm-dd`. "" is the
   *  whole window — the order the buyer places. A day selection re-points the
   *  demand column at that day's forecast, which is the production question. */
  selectedDay: string;

  storeSearch: string;
  /** Column filters for the store overview and the not-selling list. Separate
   *  from the sheet's own so switching tabs does not silently carry a filter
   *  onto a different set of rows. */
  topDescFilter: string;
  topDeptFilter: string;
  nsDescFilter: string;
  nsUpcFilter: string;
  /** Applied column filters on the sheet. Two, not one search box: the grid
   *  filters per column through ColFilter, the way Coupons and Item Actions do. */
  upcFilter: string;
  descFilter: string;
  onlyFlagged: boolean;
}

/** Local calendar date as `yyyy-mm-dd`. Built from the local getters rather
 *  than `toISOString`, which is UTC and hands back yesterday for anyone west of
 *  Greenwich after their afternoon. */
const todayIso = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const initialState: SuggestedState = {
  // Defaults match the endpoint's own: today, order Wednesday, lands Friday,
  // has to last until Monday. Twelve weeks of history behind the weekday rates.
  asOf: todayIso(),
  leadDays: 2,
  coverDays: 4,
  lookbackWeeks: 12,

  groupRows: [],
  items: [],
  activeStoreId: null,
  activeStoreLabel: "",
  dailyByDepartment: null,
  notSelling: null,
  notSellingStatus: "all",
  activeTab: "order",
  parameters: null,
  coverage: null,
  requestedStoreIds: [],
  sheetKey: null,
  expandedStores: [],
  loadingGroup: false,
  loadingItems: false,
  exportOpen: false,
  selectedDay: "",
  storeSearch: "",
  topDescFilter: "",
  topDeptFilter: "",
  nsDescFilter: "",
  nsUpcFilter: "",
  upcFilter: "",
  descFilter: "",
  onlyFlagged: false,
};

export const suggestedSlice = createSlice({
  name: "suggested",
  initialState,
  reducers: {
    setAsOf: (state, action: PayloadAction<string>) => {
      state.asOf = action.payload;
    },
    setLeadDays: (state, action: PayloadAction<number>) => {
      state.leadDays = action.payload;
    },
    setCoverDays: (state, action: PayloadAction<number>) => {
      state.coverDays = action.payload;
    },
    setLookbackWeeks: (state, action: PayloadAction<number>) => {
      state.lookbackWeeks = action.payload;
    },
    setGroupRows: (state, action: PayloadAction<SuggestedGroupRow[]>) => {
      state.groupRows = action.payload;
    },
    setItems: (state, action: PayloadAction<SuggestedItem[]>) => {
      state.items = action.payload;
    },
    setParameters: (state, action: PayloadAction<SuggestedParameters | null>) => {
      state.parameters = action.payload;
    },
    setCoverage: (state, action: PayloadAction<SuggestedCoverage | null>) => {
      state.coverage = action.payload;
    },
    setRequestedStoreIds: (state, action: PayloadAction<number[]>) => {
      state.requestedStoreIds = action.payload;
    },
    setSheetKey: (state, action: PayloadAction<SheetKey | null>) => {
      state.sheetKey = action.payload;
      // A day selected on one department should not silently carry into the
      // next — the sheet would open showing one day of a different case.
      state.selectedDay = "";
    },
    setActiveStore: (
      state,
      action: PayloadAction<{ storeid: number; label: string } | null>,
    ) => {
      state.activeStoreId = action.payload?.storeid ?? null;
      state.activeStoreLabel = action.payload?.label ?? "";
      // Switching store invalidates everything scoped to the old one. Leaving
      // the sheet key behind would render one store's header over another's
      // rows, which reads as real data.
      state.sheetKey = null;
      state.items = [];
      state.notSelling = null;
      state.selectedDay = "";
      state.activeTab = "order";
    },
    setDailyByDepartment: (
      state,
      action: PayloadAction<Record<string, SuggestedDailySeries> | null>,
    ) => {
      state.dailyByDepartment = action.payload;
    },
    setNotSelling: (state, action: PayloadAction<SuggestedNotSelling | null>) => {
      state.notSelling = action.payload;
    },
    setNotSellingStatus: (state, action: PayloadAction<NotSellingFilter>) => {
      state.notSellingStatus = action.payload;
    },
    setActiveTab: (state, action: PayloadAction<SuggestedTab>) => {
      state.activeTab = action.payload;
    },
    toggleExpandedStore: (state, action: PayloadAction<number>) => {
      const i = state.expandedStores.indexOf(action.payload);
      if (i === -1) state.expandedStores.push(action.payload);
      else state.expandedStores.splice(i, 1);
    },
    setExpandedStores: (state, action: PayloadAction<number[]>) => {
      state.expandedStores = action.payload;
    },
    setLoadingGroup: (state, action: PayloadAction<boolean>) => {
      state.loadingGroup = action.payload;
    },
    setLoadingItems: (state, action: PayloadAction<boolean>) => {
      state.loadingItems = action.payload;
    },
    setExportOpen: (state, action: PayloadAction<boolean>) => {
      state.exportOpen = action.payload;
    },
    setSelectedDay: (state, action: PayloadAction<string>) => {
      state.selectedDay = action.payload;
    },
    setStoreSearch: (state, action: PayloadAction<string>) => {
      state.storeSearch = action.payload;
    },
    setTopDescFilter: (state, action: PayloadAction<string>) => {
      state.topDescFilter = action.payload;
    },
    setTopDeptFilter: (state, action: PayloadAction<string>) => {
      state.topDeptFilter = action.payload;
    },
    setNsDescFilter: (state, action: PayloadAction<string>) => {
      state.nsDescFilter = action.payload;
    },
    setNsUpcFilter: (state, action: PayloadAction<string>) => {
      state.nsUpcFilter = action.payload;
    },
    setUpcFilter: (state, action: PayloadAction<string>) => {
      state.upcFilter = action.payload;
    },
    setDescFilter: (state, action: PayloadAction<string>) => {
      state.descFilter = action.payload;
    },
    setOnlyFlagged: (state, action: PayloadAction<boolean>) => {
      state.onlyFlagged = action.payload;
    },
    /** Clears the results but keeps the order parameters — a buyer re-running
     *  for a different store is still ordering on the same rhythm. */
    resetSuggestedResults: (state) => {
      state.groupRows = [];
      state.items = [];
      state.parameters = null;
      state.coverage = null;
      state.requestedStoreIds = [];
      state.sheetKey = null;
      state.activeStoreId = null;
      state.activeStoreLabel = "";
      state.notSelling = null;
      state.dailyByDepartment = null;
      state.notSellingStatus = "all";
      state.activeTab = "order";
      state.expandedStores = [];
      state.selectedDay = "";
      state.storeSearch = "";
      state.topDescFilter = "";
      state.topDeptFilter = "";
      state.nsDescFilter = "";
      state.nsUpcFilter = "";
      state.upcFilter = "";
      state.descFilter = "";
      state.onlyFlagged = false;
    },
    resetSuggestedSlice: () => initialState,
  },
});

export const {
  setAsOf,
  setTopDescFilter,
  setTopDeptFilter,
  setNsDescFilter,
  setNsUpcFilter,
  setActiveStore,
  setDailyByDepartment,
  setNotSelling,
  setNotSellingStatus,
  setActiveTab,
  setLeadDays,
  setCoverDays,
  setLookbackWeeks,
  setGroupRows,
  setItems,
  setParameters,
  setCoverage,
  setRequestedStoreIds,
  setSheetKey,
  toggleExpandedStore,
  setExpandedStores,
  setLoadingGroup,
  setLoadingItems,
  setExportOpen,
  setSelectedDay,
  setStoreSearch,
  setUpcFilter,
  setDescFilter,
  setOnlyFlagged,
  resetSuggestedResults,
  resetSuggestedSlice,
} = suggestedSlice.actions;

export default suggestedSlice.reducer;
