import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SubDeptMargin } from "../interfaces";
import type { ReceiptLine } from "../pages/itemReport/itemReportData";
import type { ActionKind } from "../pages/itemReport/itemReportMetrics";

/**
 * Item Report.
 *
 * The whole page lives here rather than in component state, because a route
 * change unmounts the page and component state goes with it — and rebuilding
 * this one costs roughly a hundred calls plus an invoice walk. Navigating to
 * another page and back should cost nothing.
 *
 * Receipts are a plain object, not a Map. Redux state has to stay serializable,
 * and a Map trips the store's checks and breaks devtools; every consumer indexes
 * by product code, which an object does just as well.
 *
 * The scope is stored without `url`/`token`. Those live on `app` and change with
 * the session, so copying them here would let a stale token outlive its own
 * login — the container recomposes the full fetch scope at call time.
 */

export interface ReportWindow {
  storeid: number;
  /** yyyy-mm-dd. */
  start: string;
  end: string;
}

/** Which population the sheet lists. "uploaded" is the file the user brought;
 *  "all" adds the codes the receiving walk turned up that also have prior-period
 *  sales. Deliberately not "everything" — the wider set is still bounded by what
 *  came through receiving inside the lookback. */
export type ItemScope = "uploaded" | "all";

/** A list handed over from a graded page instead of uploaded as a file. Held
 *  as a whole object so the container can tell "a handoff arrived" from "the
 *  same handoff I already ran" — it is cleared the moment it is consumed. */
export interface ItemReportHandoff {
  storeId: number;
  upcs: string[];
  departments: string[];
  sourceLabel: string;
  basisLabel: string;
}

interface ItemReportState {
  /** The store picked on the entry card, before a search has run. */
  storeId: number;
  /** The window the current results belong to. Null until a search succeeds,
   *  and the key for deciding whether a re-fetch is needed at all. */
  scope: ReportWindow | null;
  upcs: string[];
  /** Departments named by the upload, so a re-run can narrow the fan-out the
   *  same way the first run did. */
  uploadDepartments: string[];

  tyRows: SubDeptMargin[];
  lwRows: SubDeptMargin[];
  lyRows: SubDeptMargin[];

  receipts: Record<string, ReceiptLine[]>;
  invoicesSeen: number;
  invoicesTotal: number;
  receivingRunning: boolean;
  receivingComplete: boolean;
  receivingSkipped: number;
  receivingError: string | null;

  loading: boolean;
  loadingMessage: string;
  selectedUpc: string | null;
  /** Which population the sheet shows. Defaults to the uploaded list — the
   *  file is the question the user asked, and the wider set is the aside. */
  itemScope: ItemScope;
  /** Set by `useCriticalReport` just before navigating here; consumed and
   *  cleared by the container on arrival. */
  handoff: ItemReportHandoff | null;
  /** Where the current list came from, kept after the handoff is consumed so
   *  the header can keep saying it. Empty for an ordinary upload. */
  sourceLabel: string;
  basisLabel: string;
  actionFilter: ActionKind | null;
  textFilter: string;
  searchOpen: boolean;
  exportOpen: boolean;

  /** The parsed upload, held so a chosen file survives navigating away before
   *  running the report. The paste box and its error message stay local to the
   *  card — they are mid-keystroke form state with no meaning once it closes. */
  pendingUpcs: string[];
  pendingDepartments: string[];
  pendingFileName: string;
  /** The paste box. In the slice because the UPC List card keeps its textarea
   *  there too — a half-typed list is work, and losing it on a route change is
   *  the same complaint as losing the report. */
  pendingUpcText: string;
}

const initialState: ItemReportState = {
  storeId: 0,
  scope: null,
  upcs: [],
  uploadDepartments: [],
  tyRows: [],
  lwRows: [],
  lyRows: [],
  receipts: {},
  invoicesSeen: 0,
  invoicesTotal: 0,
  receivingRunning: false,
  receivingComplete: false,
  receivingSkipped: 0,
  receivingError: null,
  loading: false,
  loadingMessage: "",
  selectedUpc: null,
  itemScope: "uploaded",
  handoff: null,
  sourceLabel: "",
  basisLabel: "",
  actionFilter: null,
  textFilter: "",
  searchOpen: false,
  exportOpen: false,
  pendingUpcs: [],
  pendingDepartments: [],
  pendingFileName: "",
  pendingUpcText: "",
};

const itemReportSlice = createSlice({
  name: "itemReport",
  initialState,
  reducers: {
    setItemReportStoreId: (state, action: PayloadAction<number>) => {
      state.storeId = action.payload;
    },
    setItemReportLoading: (
      state,
      action: PayloadAction<{ loading: boolean; message?: string }>,
    ) => {
      state.loading = action.payload.loading;
      state.loadingMessage = action.payload.message ?? "";
    },

    /** A new search clears every derived thing at once, so no stale slice of a
     *  previous store can survive alongside fresh rows. */
    startItemReportSearch: (state) => {
      state.scope = null;
      state.tyRows = [];
      state.lwRows = [];
      state.lyRows = [];
      state.receipts = {};
      state.invoicesSeen = 0;
      state.invoicesTotal = 0;
      state.receivingRunning = false;
      state.receivingComplete = false;
      state.receivingSkipped = 0;
      state.receivingError = null;
      state.selectedUpc = null;
      state.itemScope = "uploaded";
      state.actionFilter = null;
      state.textFilter = "";
    },

    setItemReportResults: (
      state,
      action: PayloadAction<{
        scope: ReportWindow;
        upcs: string[];
        uploadDepartments: string[];
        tyRows: SubDeptMargin[];
        lwRows: SubDeptMargin[];
        lyRows: SubDeptMargin[];
      }>,
    ) => {
      state.scope = action.payload.scope;
      state.upcs = action.payload.upcs;
      state.uploadDepartments = action.payload.uploadDepartments;
      state.tyRows = action.payload.tyRows;
      state.lwRows = action.payload.lwRows;
      state.lyRows = action.payload.lyRows;
    },

    /* ── receiving walk ───────────────────────────────────────────────── */

    startReceivingWalk: (state) => {
      state.receipts = {};
      state.invoicesSeen = 0;
      state.invoicesTotal = 0;
      state.receivingRunning = true;
      state.receivingComplete = false;
      state.receivingSkipped = 0;
      state.receivingError = null;
    },
    /** One flush of the walk. Batched by the hook — a dispatch per invoice
     *  would re-render a several-hundred-row sheet several hundred times. */
    setReceivingProgress: (
      state,
      action: PayloadAction<{
        receipts: Record<string, ReceiptLine[]>;
        seen: number;
        total: number;
        skipped: number;
        done: boolean;
      }>,
    ) => {
      state.receipts = action.payload.receipts;
      state.invoicesSeen = action.payload.seen;
      state.invoicesTotal = action.payload.total;
      state.receivingSkipped = action.payload.skipped;
      state.receivingRunning = !action.payload.done;
      state.receivingComplete = action.payload.done;
    },
    setReceivingError: (state, action: PayloadAction<string>) => {
      state.receivingError = action.payload;
      state.receivingRunning = false;
      state.receivingComplete = false;
    },

    /* ── view ─────────────────────────────────────────────────────────── */

    setItemReportSelected: (state, action: PayloadAction<string | null>) => {
      state.selectedUpc = action.payload;
    },
    setItemReportHandoff: (
      state,
      action: PayloadAction<ItemReportHandoff>,
    ) => {
      state.handoff = action.payload;
      // The store and the pending list are set here too, so the entry card
      // behind the re-search button shows what the report is actually built
      // from rather than whatever was last typed into it.
      state.storeId = action.payload.storeId;
      state.pendingUpcs = action.payload.upcs;
      state.pendingDepartments = action.payload.departments;
      state.pendingFileName = "";
      state.pendingUpcText = "";
    },
    /** Consumed on arrival, before the run starts, so a re-render can't fire
     *  the same handoff twice. */
    clearItemReportHandoff: (state) => {
      state.handoff = null;
    },
    /** Where the list being reported came from. Blank for a plain upload, which
     *  is why every run sets it rather than only the handoff path — otherwise a
     *  later manual search would inherit the previous handoff's provenance. */
    setItemReportSource: (
      state,
      action: PayloadAction<{ sourceLabel: string; basisLabel: string }>,
    ) => {
      state.sourceLabel = action.payload.sourceLabel;
      state.basisLabel = action.payload.basisLabel;
    },
    setItemReportScope: (state, action: PayloadAction<ItemScope>) => {
      state.itemScope = action.payload;
    },
    setItemReportActionFilter: (
      state,
      action: PayloadAction<ActionKind | null>,
    ) => {
      state.actionFilter = action.payload;
    },
    setItemReportTextFilter: (state, action: PayloadAction<string>) => {
      state.textFilter = action.payload;
    },
    setItemReportSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.searchOpen = action.payload;
    },
    setItemReportExportOpen: (state, action: PayloadAction<boolean>) => {
      state.exportOpen = action.payload;
    },
    setPendingUpload: (
      state,
      action: PayloadAction<{
        upcs: string[];
        departments: string[];
        fileName: string;
      }>,
    ) => {
      state.pendingUpcs = action.payload.upcs;
      state.pendingDepartments = action.payload.departments;
      state.pendingFileName = action.payload.fileName;
    },
    clearPendingUpload: (state) => {
      state.pendingUpcs = [];
      state.pendingDepartments = [];
      state.pendingFileName = "";
      state.pendingUpcText = "";
    },
    setPendingUpcText: (state, action: PayloadAction<string>) => {
      state.pendingUpcText = action.payload;
    },
    /** Merges rather than replaces, so pasting a second batch adds to the
     *  first — the UPC List card behaves the same way. */
    addPendingUpcs: (state, action: PayloadAction<string[]>) => {
      const seen = new Set(state.pendingUpcs);
      for (const upc of action.payload) {
        if (!seen.has(upc)) {
          seen.add(upc);
          state.pendingUpcs.push(upc);
        }
      }
    },
    removePendingUpc: (state, action: PayloadAction<string>) => {
      state.pendingUpcs = state.pendingUpcs.filter((u) => u !== action.payload);
    },
  },
});

export const {
  setItemReportStoreId,
  setItemReportLoading,
  startItemReportSearch,
  setItemReportResults,
  startReceivingWalk,
  setReceivingProgress,
  setReceivingError,
  setItemReportSelected,
  setItemReportHandoff,
  clearItemReportHandoff,
  setItemReportSource,
  setItemReportScope,
  setItemReportActionFilter,
  setItemReportTextFilter,
  setItemReportSearchOpen,
  setItemReportExportOpen,
  setPendingUpload,
  clearPendingUpload,
  setPendingUpcText,
  addPendingUpcs,
  removePendingUpc,
} = itemReportSlice.actions;

export default itemReportSlice.reducer;
