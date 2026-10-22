/**
 * Dev copy of `features/vendorsSlice.ts`, mounted at `state.dev.vendors` and read only
 * by `pages/vendors/dev`. Edit this one while changing dev vendors; when dev is
 * promoted, it replaces the prod slice. See src/store/devReducers.ts.
 */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SubDeptMargin } from "../../interfaces";
import type { RollupRow } from "../../api/rollup";
import type { VendorMetric, VendorRow, VendorTier } from "../../interfaces";

/** Vendors (Performance).
 *
 *  Single store, three periods, graded on decline against a threshold the user
 *  sets — the same contract as Sub Dept Margins and Categories.
 *
 *  Unlike Categories, the raw rows are kept. Categories folds its rows away
 *  because nothing downstream reads them; here the right panel's Items and Sub
 *  departments tabs both re-derive from the same rows whenever the day
 *  selection or the metric changes, so folding once up front would throw away
 *  exactly what the panel needs.
 */

/** Default decline that counts as critical, matching Categories. */
export const VENDOR_THRESHOLD_DEFAULT = 15;

/** Item-level default. Tighter, because a single UPC moving is a smaller thing
 *  than a whole vendor moving. */
export const VENDOR_ITEM_THRESHOLD_DEFAULT = 9;

interface VendorsState {
  rows: VendorRow[];
  /** Item rows for all three periods, the source for both right-panel tabs. */
  raw: { tw: SubDeptMargin[]; lw: SubDeptMargin[]; ly: SubDeptMargin[] };
  /** The vendor totals the list is built from (`subs/rollup`). Kept unscoped,
   *  like `raw`, so switching location rebuilds the list without a call. */
  rollup: { tw: RollupRow[]; lw: RollupRow[]; ly: RollupRow[] };
  /** The item rows arrive after the list. True from the search until they
   *  land, so the detail panel can say so rather than show an empty table. */
  itemsLoading: boolean;
  itemsError: string | null;
  loading: boolean;
  /** Named rather than a bare spinner — this page walks every sub department
   *  three times, so an unexplained wait reads as a stall. */
  loadingMessage: string;
  storeid: number;
  storeName: string;
  /** Every store_number the search came back with. More than one means the
   *  storeid covers two physical locations — see utils/storeIdentity. */
  availableStoreNumbers: string[];
  /** Which location is on screen; null is every location combined. */
  selectedStoreNumber: string | null;
  /** This week's range, kept so the day strip and the panel can rebuild the
   *  same periods without recomputing from search state. */
  twStart: string;
  twEnd: string;

  metric: VendorMetric;
  /** Null while the input is mid-edit — an empty box must not read as 0. */
  threshold: number | null;
  tierFilter: VendorTier | "all";
  textFilter: string;
  /** Null means the whole week. */
  selectedDay: string | null;
  selectedVendor: string | null;
  /** Items grade against their own threshold. Lives here so the export grades
   *  exactly what the Items tab is showing. */
  itemThreshold: number | null;
}

const initialState: VendorsState = {
  rows: [],
  raw: { tw: [], lw: [], ly: [] },
  rollup: { tw: [], lw: [], ly: [] },
  itemsLoading: false,
  itemsError: null,
  loading: false,
  loadingMessage: "",
  storeid: 0,
  storeName: "",
  availableStoreNumbers: [],
  selectedStoreNumber: null,
  twStart: "",
  twEnd: "",
  metric: "margin",
  threshold: VENDOR_THRESHOLD_DEFAULT,
  tierFilter: "all",
  textFilter: "",
  selectedDay: null,
  selectedVendor: null,
  itemThreshold: VENDOR_ITEM_THRESHOLD_DEFAULT,
};

const vendorsSlice = createSlice({
  // Distinct from the prod slice's "vendors": Redux matches actions on this
  // string alone, so sharing it would move prod and dev together.
  name: "devVendors",
  initialState,
  reducers: {
    setRows: (state, action: PayloadAction<VendorRow[]>) => {
      state.rows = action.payload;
    },
    setRaw: (
      state,
      action: PayloadAction<{
        tw: SubDeptMargin[];
        lw: SubDeptMargin[];
        ly: SubDeptMargin[];
      }>,
    ) => {
      state.raw = action.payload;
    },
    setRollup: (
      state,
      action: PayloadAction<{ tw: RollupRow[]; lw: RollupRow[]; ly: RollupRow[] }>,
    ) => {
      state.rollup = action.payload;
    },
    setItemsLoading: (state, action: PayloadAction<boolean>) => {
      state.itemsLoading = action.payload;
      if (action.payload) state.itemsError = null;
    },
    setItemsError: (state, action: PayloadAction<string | null>) => {
      state.itemsError = action.payload;
      state.itemsLoading = false;
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
    setAvailableStoreNumbers: (state, action: PayloadAction<string[]>) => {
      state.availableStoreNumbers = action.payload;
    },
    setSelectedStoreNumber: (state, action: PayloadAction<string | null>) => {
      state.selectedStoreNumber = action.payload;
    },
    setRange: (state, action: PayloadAction<{ start: string; end: string }>) => {
      state.twStart = action.payload.start;
      state.twEnd = action.payload.end;
    },
    setMetric: (state, action: PayloadAction<VendorMetric>) => {
      state.metric = action.payload;
    },
    setThreshold: (state, action: PayloadAction<number | null>) => {
      state.threshold = action.payload;
    },
    setItemThreshold: (state, action: PayloadAction<number | null>) => {
      state.itemThreshold = action.payload;
    },
    setTierFilter: (state, action: PayloadAction<VendorTier | "all">) => {
      state.tierFilter = action.payload;
    },
    setTextFilter: (state, action: PayloadAction<string>) => {
      state.textFilter = action.payload;
    },
    setSelectedDay: (state, action: PayloadAction<string | null>) => {
      state.selectedDay = action.payload;
    },
    setSelectedVendor: (state, action: PayloadAction<string | null>) => {
      state.selectedVendor = action.payload;
    },
    /** New search — clear results and selection but keep display preferences.
     *  Re-picking a metric and threshold after every search would be an
     *  irritation, and neither depends on which store is loaded. */
    reQuery: (state) => {
      state.rows = [];
      state.raw = { tw: [], lw: [], ly: [] };
      state.rollup = { tw: [], lw: [], ly: [] };
      state.itemsLoading = false;
      state.itemsError = null;
      state.availableStoreNumbers = [];
      state.selectedStoreNumber = null;
      state.selectedVendor = null;
      state.selectedDay = null;
      state.textFilter = "";
      state.tierFilter = "all";
    },
  },
});

export const {
  setRows,
  setRaw,
  setRollup,
  setItemsLoading,
  setItemsError,
  setLoading,
  setLoadingMessage,
  setStore,
  setAvailableStoreNumbers,
  setSelectedStoreNumber,
  setRange,
  setMetric,
  setThreshold,
  setItemThreshold,
  setTierFilter,
  setTextFilter,
  setSelectedDay,
  setSelectedVendor,
  reQuery,
} = vendorsSlice.actions;

export default vendorsSlice.reducer;
