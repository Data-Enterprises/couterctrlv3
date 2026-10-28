/**
 * Dev copy of `features/salesLedgerSlice.ts`, mounted at `state.dev.salesLedger` and read only
 * by `pages/sales/dev`. Edit this one while changing dev Sales; when dev is
 * promoted, it replaces the prod slice. See src/store/devReducers.ts.
 */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { FinancialsRow } from "../../api/financials";
import type {
  TopItemRow,
  TopItemPricePoint,
} from "../../api/topItems";
import {
  lruPut,
  lruTouch,
} from "../../pages/sales/dev/shared/storeCache";
import type {
  CatSale,
  HourlySale,
  StoreSelection,
  SubSale,
  ThresholdValue,
} from "../../interfaces";

export type GradingMetric = "sales" | "qty";

export type LedgerTab =
  | "subdept"
  | "hourly"
  | "comparison"
  | "category"
  | "topitems";

/**
 * The store the open one is being measured against.
 *
 * Page state rather than a tab's own, because it is the same question on
 * every tab: pick 018 in Stores and Sub Depts and Hourly are both comparing
 * against 018 until it changes. A counterpart held per tab would let two tabs
 * disagree about who "they" are, which is the kind of thing nobody notices
 * until the numbers do not add up.
 *
 * Null is the resting state and is NOT an error: a tab with no counterpart is
 * the single-store view it has always been. Only a group search can set one,
 * so a single-store entry behaves exactly as it does today.
 */
export interface Counterpart {
  storeid: number;
  /** Co-located stores share a storeid, so the number is part of the identity. */
  storeNumber: string;
  storeName: string;
}
export type SevFilter = "all" | "critical" | "watch" | "healthy";
export type OpenSheetType = "subdept" | "hourly" | null;

export type Top10Item = {
  productCode: string;
  upc: string;
  desc: string;
  tyNet: number;
  tyQty: number;
  tyWeight: number;
  lwNet: number | null;
  lwQty: number | null;
  lwWeight: number | null;
  lyNet: number | null;
  lyQty: number | null;
  lyWeight: number | null;
  /** This year over only the days that matched each comparison — see
   *  itemGrading's Top10Item. Absent on rows with no TY. */
  tyNetForLW?: number;
  tyQtyForLW?: number;
  tyNetForLY?: number;
  tyQtyForLY?: number;
  // Present and false only on synthetic rows built for items that sold in
  // LW/LY but not at all this week — lets the item row show "—" for TY
  // instead of a misleading $0. Absent (undefined) means a normal,
  // TY-anchored row — every existing consumer already treats that as active.
  hasTY?: boolean;
};

/** `sev` is null when the item isn't graded — neither comparison covers the week. */
export type ExportSubDeptItem = Top10Item & { sev: "critical" | "watch" | "healthy" | null };

/**
 * The sub-department investigation the page is holding open.
 *
 * It takes over the whole page rather than a panel, so it lives beside
 * `selection` rather than inside it: closing the investigation has to put the
 * reader back on the store and department they came from, and that is only
 * possible if the two survive each other. Desktop only.
 */
export interface InvestigationTarget {
  storeid: number;
  storeNumber: string;
  storeName: string;
  compareStoreid: number;
  compareStoreNumber: string;
  compareStoreName: string;
  /** The department's number at the OPEN store. */
  subDept: number;
  /**
   * And at the counterpart, which is a different number.
   *
   * Brooks Chapel Hill's 10 is Tobacco; Tupelo's 10 is Deli/Bakery. Carrying
   * one number for both asked each store about a different department.
   */
  compareSubDept: number;
  subDeptName: string;
  /**
   * Which pile the department-level shape points at, carried through from
   * the report so the investigation can mark it.
   *
   * A suggestion, never a filter: a department can be entirely volume and
   * have no item flagged never-ordered, and that disagreement is a finding
   * rather than an empty grid.
   */
  focus?: "ringing" | "orders" | "price" | "mix" | "unknown";
}

/**
 * One store-week's top items, all three windows.
 *
 * The baselines are held WITH the rows rather than beside them: a hit that
 * restored this week but not last week would send all three calls out again,
 * which is the whole cost the cache exists to avoid.
 */
export interface TopItemsEntry {
  rows: TopItemRow[];
  points: TopItemPricePoint[];
  lw: TopItemRow[];
  ly: TopItemRow[];
}

/** One store's popup rows, as the six calls return them. */
export interface PopupStoreData {
  rawSubs: SubSale[];
  rawLWSubs: SubSale[];
  rawLYSubs: SubSale[];
  rawHourly: HourlySale[];
  rawLWHourly: HourlySale[];
  rawLYHourly: HourlySale[];
}

interface SalesLedgerState {
  // Navigation (shared desktop + mobile)
  hasSearched: boolean;
  selection: StoreSelection | null;
  tab: LedgerTab;
  selectedDate: string | null;
  investigation: InvestigationTarget | null;
  counterpart: Counterpart | null;
  /**
   * Which group view the right panel rests on.
   *
   * Both answer a question about the GROUP, which is why they are two tabs
   * rather than one screen hidden behind the other: "stores" ranks the
   * stores, "departments" breaks every store into its departments. The
   * investigation below them is about selected stores instead, which is a
   * different scope and so a different screen.
   */
  groupView: "stores" | "departments";
  /** The departments view, taken full width. Nine stores by twenty
   *  departments is readable in half a page and comfortable in all of it. */
  matrixOpen: boolean;

  // Loading
  ledgerLoading: boolean;
  reportLoading: boolean;
  top10Loading: boolean;

  // Tracks which store the raw data below was fetched for, so remounting
  // StoreDetailPopup (e.g. after navigating away and back) with the same
  // selection doesn't re-fire the fetch — it just reuses what's already here.
  // Keyed on storeid + store_number, not storeid alone: co-located stores
  // share one id, and keying on the id would serve the first one's data to
  // the second.
  lastFetchedStoreKey: string | null;

  /**
   * The last few stores' raw rows, so hopping between them is free.
   *
   * `lastFetchedStoreKey` alone remembered ONE store: 018, 020, back to 018
   * refetched 018 from scratch, which is nine calls a bounce once Top items
   * joined the six the popup already fires. Comparing two stores is most of
   * what the counterpart feature is for, so that bounce is the normal case
   * rather than an edge one.
   *
   * Bounded, because the thing held is six arrays of raw rows per store and a
   * group search can hold a hundred stores. `storeCacheOrder` is most recent
   * first; see `lruPut`.
   */
  storeCache: Record<string, PopupStoreData>;
  storeCacheOrder: string[];

  /**
   * Financials — the daily per-bin POS records, for the export.
   *
   * Fetched with the search like everything else on this page, rather than
   * when the export modal opens. The other four exports read data the search
   * already brought back, and an export that goes to the network while
   * somebody is waiting on a download is the odd one out.
   *
   * Empty until the search lands, and empty again on a re-query. The window
   * it was fetched for travels with it, so the export can tell whether the
   * dates it is being asked for are the ones in hand.
   */
  financials: FinancialsRow[];
  financialsWindow: { start: string; end: string } | null;
  financialsTruncated: boolean;
  financialsLoading: boolean;

  /**
   * The Top items tab's rows, and the prices behind them.
   *
   * Held on the page rather than inside the tab because the tab unmounts when
   * you switch away from it, and a store's biggest sellers do not change while
   * you look at Hourly. `topItemsKey` is the store and window they were
   * fetched for, so coming back to the tab reuses them and changing the search
   * does not.
   */
  topItems: TopItemRow[];
  topItemPoints: TopItemPricePoint[];
  topItemsLW: TopItemRow[];
  topItemsLY: TopItemRow[];
  topItemsKey: string | null;
  topItemsLoading: boolean;
  /** Held per store and week, on the same bound and for the same reason as
   *  `storeCache`: three more calls per bounce otherwise. */
  topItemsCache: Record<string, TopItemsEntry>;
  topItemsCacheOrder: string[];
  /**
   * This week only, for the Top 200 comparison.
   *
   * Its own store rather than a lean entry in `topItemsCache`, and that is
   * the point: `restoreTopItems` serves a cache entry whole, so an entry
   * written with no `lw`/`ly` would leave the single-store tab showing no
   * comparisons at all for a store-week the comparison happened to visit
   * first. Nothing partial goes in the shared cache.
   *
   * The comparison still READS `topItemsCache` first — a full entry from a
   * single-store visit answers it perfectly — and only writes here.
   */
  topItemsTyCache: Record<string, { rows: TopItemRow[]; points: TopItemPricePoint[] }>;
  topItemsTyOrder: string[];

  // Raw API data (shared desktop + mobile)
  rawSubs: SubSale[];
  rawLWSubs: SubSale[];
  rawLYSubs: SubSale[];
  rawHourly: HourlySale[];
  rawLWHourly: HourlySale[];
  rawLYHourly: HourlySale[];
  rawCats: CatSale[];
  rawLWCats: CatSale[];
  rawLYCats: CatSale[];

  // Top 10
  top10: Top10Item[];

  // Grading
  gradingMetric: GradingMetric;
  threshold: ThresholdValue | null;
  subDeptThreshold: number | null;
  hourlyThreshold: number | null;
  itemThreshold: number | null;
  categoryThreshold: number | null;

  // Sub dept items export
  exportSubDeptName: string;
  exportSubDeptItems: ExportSubDeptItem[];

  // Popup row selections — persist across tab switches, reset on new store
  selectedSubDeptId: number | null;
  selectedSubDeptItems: Top10Item[];
  // Items that sold LW and/or LY but not at all this week, for the same
  // sub dept/day selection — surfaced via the item list's Active/Inactive
  // filter so slow/discontinued items don't stay invisible just because
  // they have no TY row to anchor a normal Top10Item on.
  inactiveSubDeptItems: Top10Item[];
  selectedHour: number | null;
  selectedCatId: number | null;

  // Tracks which store+sub dept+day combination selectedSubDeptItems was
  // fetched for, so remounting PopupSubDeptList with the same selection
  // doesn't re-fire the item-level fetch.
  lastFetchedItemsKey: string | null;

  // Mobile-specific
  screen: "list" | "report";
  listSevFilter: SevFilter;
  reportSevFilter: SevFilter;
  openSheetType: OpenSheetType;
  openSheetId: number | null;
}

const initialState: SalesLedgerState = {
  hasSearched: false,
  selection: null,
  tab: "subdept",
  selectedDate: null,
  investigation: null,
  counterpart: null,
  groupView: "stores",
  matrixOpen: false,
  ledgerLoading: false,
  reportLoading: false,
  top10Loading: false,
  lastFetchedStoreKey: null,
  storeCache: {},
  storeCacheOrder: [],
  topItems: [],
  topItemPoints: [],
  topItemsLW: [],
  topItemsLY: [],
  topItemsKey: null,
  topItemsLoading: false,
  topItemsCache: {},
  topItemsCacheOrder: [],
  topItemsTyCache: {},
  topItemsTyOrder: [],
  financials: [],
  financialsWindow: null,
  financialsTruncated: false,
  financialsLoading: false,
  rawSubs: [],
  rawLWSubs: [],
  rawLYSubs: [],
  rawHourly: [],
  rawLWHourly: [],
  rawLYHourly: [],
  rawCats: [],
  rawLWCats: [],
  rawLYCats: [],
  top10: [],
  exportSubDeptName: "",
  exportSubDeptItems: [],
  selectedSubDeptId: null,
  selectedSubDeptItems: [],
  inactiveSubDeptItems: [],
  selectedHour: null,
  selectedCatId: null,
  lastFetchedItemsKey: null,
  gradingMetric: "sales" as GradingMetric,
  threshold: { op: "gt", amount: 9 } as ThresholdValue,
  subDeptThreshold: 9,
  hourlyThreshold: 9,
  itemThreshold: 9,
  categoryThreshold: 9,
  screen: "list",
  listSevFilter: "all",
  reportSevFilter: "all",
  openSheetType: null,
  openSheetId: null,
};

const salesLedgerSlice = createSlice({
  // Distinct from the prod slice's "salesLedger": Redux matches actions on this
  // string alone, so sharing it would move prod and dev together.
  name: "devSalesLedger",
  initialState,
  reducers: {
    setHasSearched: (state, action: PayloadAction<boolean>) => {
      state.hasSearched = action.payload;
    },
    setLedgerSelection: (
      state,
      action: PayloadAction<StoreSelection | null>,
    ) => {
      // Opening a different store drops the counterpart. "018 against 018"
      // is not a comparison, and silently keeping a counterpart that is now
      // the open store is worse than asking again.
      const next = action.payload;
      const changed =
        next?.storeId !== state.selection?.storeId ||
        next?.storeNumber !== state.selection?.storeNumber;
      if (changed) state.counterpart = null;
      state.selection = next;
    },
    setCounterpart: (state, action: PayloadAction<Counterpart | null>) => {
      state.counterpart = action.payload;
    },
    setLedgerTab: (state, action: PayloadAction<LedgerTab>) => {
      state.tab = action.payload;
    },
    setInvestigation: (
      state,
      action: PayloadAction<InvestigationTarget | null>,
    ) => {
      state.investigation = action.payload;
      // Opening an investigation from the matrix leaves the matrix behind,
      // so Back from the investigation returns to the ledger rather than to
      // a grid the reader has already finished with.
      if (action.payload !== null) state.matrixOpen = false;
    },
    setGroupView: (
      state,
      action: PayloadAction<"stores" | "departments">,
    ) => {
      state.groupView = action.payload;
    },
    setMatrixOpen: (state, action: PayloadAction<boolean>) => {
      state.matrixOpen = action.payload;
      // Expanding is the same view with more room, so coming back from it
      // lands on the tab it expanded from rather than on the store list.
      if (action.payload) state.groupView = "departments";
    },
    setLedgerSelectedDate: (state, action: PayloadAction<string | null>) => {
      state.selectedDate = action.payload;
    },
    setLedgerLoading: (state, action: PayloadAction<boolean>) => {
      state.ledgerLoading = action.payload;
    },
    setFinancials: (
      state,
      action: PayloadAction<{
        rows: FinancialsRow[];
        window: { start: string; end: string };
        truncated: boolean;
      }>,
    ) => {
      state.financials = action.payload.rows;
      state.financialsWindow = action.payload.window;
      state.financialsTruncated = action.payload.truncated;
    },
    setTopItems: (
      state,
      action: PayloadAction<{ key: string; data: TopItemsEntry }>,
    ) => {
      const { key, data } = action.payload;
      state.topItems = data.rows;
      state.topItemPoints = data.points;
      state.topItemsLW = data.lw;
      state.topItemsLY = data.ly;
      state.topItemsKey = key;
      state.topItemsCache[key] = data;
      const put = lruPut(state.topItemsCacheOrder, key);
      put.evicted.forEach((k) => delete state.topItemsCache[k]);
      state.topItemsCacheOrder = put.order;
    },
    /**
     * One store's week for the comparison, kept so switching tabs and coming
     * back does not ask for it again.
     *
     * Deliberately does NOT touch `topItems` or `topItemsKey`: those are the
     * open store's current rows, and the comparison reads a second store.
     */
    cacheTopItemsTy: (
      state,
      action: PayloadAction<{
        key: string;
        rows: TopItemRow[];
        points: TopItemPricePoint[];
      }>,
    ) => {
      const { key, rows, points } = action.payload;
      state.topItemsTyCache[key] = { rows, points };
      const put = lruPut(state.topItemsTyOrder, key);
      put.evicted.forEach((k) => delete state.topItemsTyCache[k]);
      state.topItemsTyOrder = put.order;
    },

    /** Serve a store-week already held. */
    restoreTopItems: (state, action: PayloadAction<string>) => {
      const held = state.topItemsCache[action.payload];
      if (!held) return;
      state.topItems = held.rows;
      state.topItemPoints = held.points;
      state.topItemsLW = held.lw;
      state.topItemsLY = held.ly;
      state.topItemsKey = action.payload;
      state.topItemsCacheOrder = lruTouch(
        state.topItemsCacheOrder,
        action.payload,
      );
    },
    setTopItemsLoading: (state, action: PayloadAction<boolean>) => {
      state.topItemsLoading = action.payload;
    },
    setFinancialsLoading: (state, action: PayloadAction<boolean>) => {
      state.financialsLoading = action.payload;
    },
    setReportLoading: (state, action: PayloadAction<boolean>) => {
      state.reportLoading = action.payload;
    },
    setTop10Loading: (state, action: PayloadAction<boolean>) => {
      state.top10Loading = action.payload;
    },
    /**
     * Take one store's six arrays in, and remember them under its key.
     *
     * One action rather than six, because the six are one answer: a partial
     * cache entry would serve a store its subs and somebody else's hourly.
     */
    cacheStoreData: (
      state,
      action: PayloadAction<{ key: string; data: PopupStoreData }>,
    ) => {
      const { key, data } = action.payload;
      state.rawSubs = data.rawSubs;
      state.rawLWSubs = data.rawLWSubs;
      state.rawLYSubs = data.rawLYSubs;
      state.rawHourly = data.rawHourly;
      state.rawLWHourly = data.rawLWHourly;
      state.rawLYHourly = data.rawLYHourly;
      state.lastFetchedStoreKey = key;

      state.storeCache[key] = data;
      const { order, evicted } = lruPut(state.storeCacheOrder, key);
      evicted.forEach((k) => delete state.storeCache[k]);
      state.storeCacheOrder = order;
    },

    /** Serve a store already held, without going to the network. A read is a
     *  use, so it goes to the front of the queue too. */
    restoreStoreData: (state, action: PayloadAction<string>) => {
      const held = state.storeCache[action.payload];
      if (!held) return;
      state.rawSubs = held.rawSubs;
      state.rawLWSubs = held.rawLWSubs;
      state.rawLYSubs = held.rawLYSubs;
      state.rawHourly = held.rawHourly;
      state.rawLWHourly = held.rawLWHourly;
      state.rawLYHourly = held.rawLYHourly;
      state.lastFetchedStoreKey = action.payload;
      state.storeCacheOrder = lruTouch(state.storeCacheOrder, action.payload);
    },

    setLastFetchedStoreKey: (state, action: PayloadAction<string | null>) => {
      state.lastFetchedStoreKey = action.payload;
    },
    setRawSubs: (state, action: PayloadAction<SubSale[]>) => {
      state.rawSubs = action.payload;
    },
    setRawLWSubs: (state, action: PayloadAction<SubSale[]>) => {
      state.rawLWSubs = action.payload;
    },
    setRawLYSubs: (state, action: PayloadAction<SubSale[]>) => {
      state.rawLYSubs = action.payload;
    },
    setRawHourly: (state, action: PayloadAction<HourlySale[]>) => {
      state.rawHourly = action.payload;
    },
    setRawLWHourly: (state, action: PayloadAction<HourlySale[]>) => {
      state.rawLWHourly = action.payload;
    },
    setRawLYHourly: (state, action: PayloadAction<HourlySale[]>) => {
      state.rawLYHourly = action.payload;
    },
    setRawCats: (state, action: PayloadAction<CatSale[]>) => {
      state.rawCats = action.payload;
    },
    setRawLWCats: (state, action: PayloadAction<CatSale[]>) => {
      state.rawLWCats = action.payload;
    },
    setRawLYCats: (state, action: PayloadAction<CatSale[]>) => {
      state.rawLYCats = action.payload;
    },
    setTop10: (state, action: PayloadAction<Top10Item[]>) => {
      state.top10 = action.payload;
    },
    setExportSubDeptName: (state, action: PayloadAction<string>) => {
      state.exportSubDeptName = action.payload;
    },
    setExportSubDeptItems: (state, action: PayloadAction<ExportSubDeptItem[]>) => {
      state.exportSubDeptItems = action.payload;
    },
    setSelectedSubDeptId: (state, action: PayloadAction<number | null>) => {
      state.selectedSubDeptId = action.payload;
    },
    setSelectedSubDeptItems: (state, action: PayloadAction<Top10Item[]>) => {
      state.selectedSubDeptItems = action.payload;
    },
    setInactiveSubDeptItems: (state, action: PayloadAction<Top10Item[]>) => {
      state.inactiveSubDeptItems = action.payload;
    },
    setSelectedHour: (state, action: PayloadAction<number | null>) => {
      state.selectedHour = action.payload;
    },
    setSelectedCatId: (state, action: PayloadAction<number | null>) => {
      state.selectedCatId = action.payload;
    },
    setLastFetchedItemsKey: (state, action: PayloadAction<string | null>) => {
      state.lastFetchedItemsKey = action.payload;
    },
    clearPopupSelections: (state) => {
      state.selectedSubDeptId = null;
      state.selectedSubDeptItems = [];
      state.inactiveSubDeptItems = [];
      state.selectedHour = null;
      state.selectedCatId = null;
      state.lastFetchedItemsKey = null;
    },
    setScreen: (state, action: PayloadAction<"list" | "report">) => {
      state.screen = action.payload;
    },
    setGradingMetric: (state, action: PayloadAction<GradingMetric>) => {
      state.gradingMetric = action.payload;
    },
    setThreshold: (state, action: PayloadAction<ThresholdValue | null>) => {
      state.threshold = action.payload;
    },
    setSubDeptThreshold: (state, action: PayloadAction<number | null>) => {
      state.subDeptThreshold = action.payload;
    },
    setHourlyThreshold: (state, action: PayloadAction<number | null>) => {
      state.hourlyThreshold = action.payload;
    },
    setItemThreshold: (state, action: PayloadAction<number | null>) => {
      state.itemThreshold = action.payload;
    },
    setCategoryThreshold: (state, action: PayloadAction<number | null>) => {
      state.categoryThreshold = action.payload;
    },
    setListSevFilter: (state, action: PayloadAction<SevFilter>) => {
      state.listSevFilter = action.payload;
    },
    setReportSevFilter: (state, action: PayloadAction<SevFilter>) => {
      state.reportSevFilter = action.payload;
    },
    openSheet: (
      state,
      action: PayloadAction<{ type: "subdept" | "hourly"; id: number }>,
    ) => {
      state.openSheetType = action.payload.type;
      state.openSheetId = action.payload.id;
      state.top10 = [];
    },
    closeSheet: (state) => {
      state.openSheetType = null;
      state.openSheetId = null;
      state.top10 = [];
    },
    resetLedger: (state) => {
      Object.assign(state, initialState);
    },
    reQueryLedger: (state) => {
      // The cache is keyed on the store, not the week, so a new search has to
      // empty it: the same store's rows for a different week are the one
      // thing that would be served wrongly and look perfectly normal.
      state.storeCache = {};
      state.storeCacheOrder = [];
      state.topItems = [];
      state.topItemPoints = [];
      state.topItemsLW = [];
      state.topItemsLY = [];
      state.topItemsKey = null;
      state.topItemsCache = {};
      state.topItemsCacheOrder = [];
      state.financials = [];
      state.financialsWindow = null;
      state.financialsTruncated = false;
      state.selection = null;
      state.selectedDate = null;
      state.lastFetchedStoreKey = null;
      state.rawSubs = [];
      state.rawLWSubs = [];
      state.rawLYSubs = [];
      state.rawHourly = [];
      state.rawLWHourly = [];
      state.rawLYHourly = [];
      state.rawCats = [];
      state.rawLWCats = [];
      state.rawLYCats = [];
      state.top10 = [];
      state.exportSubDeptName = "";
      state.exportSubDeptItems = [];
      state.selectedSubDeptId = null;
      state.selectedSubDeptItems = [];
      state.inactiveSubDeptItems = [];
      state.selectedHour = null;
      state.selectedCatId = null;
      state.lastFetchedItemsKey = null;
      state.screen = "list";
      state.listSevFilter = "all";
      state.reportSevFilter = "all";
      state.openSheetType = null;
      state.openSheetId = null;
    },
    // Navigate to store report (mobile)
    navigateToReport: (state, action: PayloadAction<StoreSelection>) => {
      state.selection = action.payload;
      state.screen = "report";
      state.selectedDate = null;
      state.tab = "subdept";
      state.reportSevFilter = "all";
      state.openSheetType = null;
      state.openSheetId = null;
      state.top10 = [];
    },
    // Go back to list (mobile)
    navigateToList(state) {
      state.screen = "list";
      state.selection = null;
      state.openSheetType = null;
      state.openSheetId = null;
      state.top10 = [];
    },
  },
});

export const {
  setGradingMetric,
  setHasSearched,
  setLedgerSelection,
  setLedgerTab,
  setCounterpart,
  setInvestigation,
  setGroupView,
  setMatrixOpen,
  setLedgerSelectedDate,
  setLedgerLoading,
  setFinancials,
  setFinancialsLoading,
  setTopItems,
  setTopItemsLoading,
  restoreTopItems,
  cacheTopItemsTy,
  setReportLoading,
  setTop10Loading,
  cacheStoreData,
  restoreStoreData,
  setLastFetchedStoreKey,
  setRawSubs,
  setRawLWSubs,
  setRawLYSubs,
  setRawHourly,
  setRawLWHourly,
  setRawLYHourly,
  setRawCats,
  setRawLWCats,
  setRawLYCats,
  setTop10,
  setExportSubDeptName,
  setExportSubDeptItems,
  setSelectedSubDeptId,
  setSelectedSubDeptItems,
  setInactiveSubDeptItems,
  setSelectedHour,
  setSelectedCatId,
  setLastFetchedItemsKey,
  clearPopupSelections,
  setScreen,
  setThreshold,
  setSubDeptThreshold,
  setHourlyThreshold,
  setItemThreshold,
  setCategoryThreshold,
  setListSevFilter,
  setReportSevFilter,
  openSheet,
  closeSheet,
  resetLedger,
  reQueryLedger,
  navigateToReport,
  navigateToList,
} = salesLedgerSlice.actions;

export default salesLedgerSlice.reducer;
