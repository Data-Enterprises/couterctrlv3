import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SubDeptMargin } from "../interfaces";
import type { VendorMetric, VendorRow, VendorTier } from "../pages/vendors/vendorsUtils";

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
  loading: boolean;
  /** Named rather than a bare spinner — this page walks every sub department
   *  three times, so an unexplained wait reads as a stall. */
  loadingMessage: string;
  storeid: number;
  storeName: string;
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
  loading: false,
  loadingMessage: "",
  storeid: 0,
  storeName: "",
  twStart: "",
  twEnd: "",
  metric: "sales",
  threshold: VENDOR_THRESHOLD_DEFAULT,
  tierFilter: "all",
  textFilter: "",
  selectedDay: null,
  selectedVendor: null,
  itemThreshold: VENDOR_ITEM_THRESHOLD_DEFAULT,
};

const vendorsSlice = createSlice({
  name: "vendors",
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
  setLoading,
  setLoadingMessage,
  setStore,
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
