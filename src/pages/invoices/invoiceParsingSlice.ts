import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ExtractedInvoice,
  InvoiceEngine,
  InvoiceFileReport,
  InvoiceHistoryFile,
  InvoiceReconciliation,
  InvoiceRunStatus,
  InvoiceStorage,
} from "../../interfaces";

/** Which screen the page is on. Explicit rather than derived from whether
 *  there are invoices: "upload another batch" and "browse history" both have
 *  to be reachable while a finished run is still on screen. */
export type InvoiceView = "upload" | "results" | "history";

export const HISTORY_PAGE_SIZE = 50;

/** The finished run only. The pending File objects stay in component state —
 *  a File isn't serializable and has no business in the store — but the result
 *  does live here, because an extraction costs minutes of Bedrock time and a
 *  stray click on the nav must not throw it away. */
interface InvoiceParsingState {
  view: InvoiceView;
  /** The engine the next run will use. A standing preference, not part of the
   *  result — clearing the results leaves it alone. */
  engine: InvoiceEngine;
  /** Store the next run is filed against. 0 = none picked yet. Like `engine`,
   *  a standing choice rather than part of the result. */
  storeid: number;
  /** Send each staged file as its own request instead of one request carrying
   *  the batch. Slower end to end, but one bad file fails alone and the
   *  invoices from the rest are on screen before the batch has finished.
   *  A standing preference, like `engine`. */
  bulk: boolean;
  /** Every run behind what's on screen — one entry normally, one per file
   *  after a bulk run. */
  runIds: string[];
  /** The single run on screen, or null when several were merged. Kept for the
   *  common case; `runIds` is the authoritative list. */
  runId: string | null;
  /** The engine that produced the results on screen. Separate from `engine`
   *  above so switching the picker never relabels a run that already happened. */
  runEngine: InvoiceEngine | null;
  /** Store the results on screen were filed against, kept apart from the
   *  picker above for the same reason as runEngine. */
  runStoreid: number | null;
  model: string | null;
  /** Pages billed across the run, and what the server priced it at. The cost
   *  is a decimal string; null when no pricing row matched. */
  pageCount: number | null;
  estCostUsd: string | null;
  invoices: ExtractedInvoice[];
  reconciliation: InvoiceReconciliation[];
  files: InvoiceFileReport[];
  storage: InvoiceStorage | null;
  isParsing: boolean;
  /** Index into `invoices`, not an invoice number — two files in one batch can
   *  print the same number. */
  selectedInvoiceIndex: number | null;
  exportOpen: boolean;

  /** True when the results on screen were read back from the archive rather
   *  than produced by a run in this session. */
  runArchived: boolean;
  /** Provenance from the archive — when the run happened and who ran it. Null
   *  for a run made here, where both are self-evident. */
  runExtractedAt: string | null;
  runExtractedBy: string | null;

  history: InvoiceHistoryFile[];
  historyTotal: number;
  historyOffset: number;
  historyLoading: boolean;
  /** null = no filter, i.e. every store the caller can see. */
  historyStoreid: number | null;
  historyEngine: InvoiceEngine | null;
  historyStatus: InvoiceRunStatus | null;
  /** Run currently being fetched from the archive, so its row can show that
   *  it's opening rather than the whole table blanking. */
  openingRunId: string | null;
}

export const initialState: InvoiceParsingState = {
  view: "upload",
  // Claude by default: it reads any layout without per-vendor setup, so it's
  // the one that works on an invoice nobody has tried yet.
  engine: "bedrock",
  storeid: 0,
  bulk: false,
  runIds: [],
  runId: null,
  runEngine: null,
  runStoreid: null,
  model: null,
  pageCount: null,
  estCostUsd: null,
  invoices: [],
  reconciliation: [],
  files: [],
  storage: null,
  isParsing: false,
  selectedInvoiceIndex: null,
  exportOpen: false,
  runArchived: false,
  runExtractedAt: null,
  runExtractedBy: null,
  history: [],
  historyTotal: 0,
  historyOffset: 0,
  historyLoading: false,
  historyStoreid: null,
  historyEngine: null,
  historyStatus: null,
  openingRunId: null,
};

export type InvoiceParseResult = Pick<
  InvoiceParsingState,
  | "runIds"
  | "runEngine"
  | "runStoreid"
  | "model"
  | "pageCount"
  | "estCostUsd"
  | "runArchived"
  | "runExtractedAt"
  | "runExtractedBy"
  | "invoices"
  | "reconciliation"
  | "files"
  | "storage"
>;

export const invoiceParsingSlice = createSlice({
  name: "invoiceParsing",
  initialState,
  reducers: {
    setInvoiceView: (state, action: PayloadAction<InvoiceView>) => {
      state.view = action.payload;
    },
    setEngine: (state, action: PayloadAction<InvoiceEngine>) => {
      state.engine = action.payload;
    },
    setInvoiceStoreid: (state, action: PayloadAction<number>) => {
      state.storeid = action.payload;
    },
    setBulk: (state, action: PayloadAction<boolean>) => {
      state.bulk = action.payload;
    },
    setParsing: (state, action: PayloadAction<boolean>) => {
      state.isParsing = action.payload;
    },
    setParseResult: (state, action: PayloadAction<InvoiceParseResult>) => {
      const {
        runIds,
        runEngine,
        runStoreid,
        model,
        pageCount,
        estCostUsd,
        runArchived,
        runExtractedAt,
        runExtractedBy,
        invoices,
        reconciliation,
        files,
        storage,
      } = action.payload;
      state.runArchived = runArchived;
      state.runExtractedAt = runExtractedAt;
      state.runExtractedBy = runExtractedBy;
      state.runIds = runIds;
      // Only meaningful when one run produced everything on screen; a merged
      // bulk result has no single id to name.
      state.runId = runIds.length === 1 ? runIds[0] : null;
      state.runEngine = runEngine;
      state.runStoreid = runStoreid;
      state.model = model;
      state.pageCount = pageCount;
      state.estCostUsd = estCostUsd;
      state.invoices = invoices;
      state.reconciliation = reconciliation;
      state.files = files;
      state.storage = storage;
      // Land on the first invoice so the detail panel has something to show;
      // a run that produced only file errors selects nothing.
      state.selectedInvoiceIndex = invoices.length > 0 ? 0 : null;
      if (invoices.length > 0) state.view = "results";
    },
    setHistoryLoading: (state, action: PayloadAction<boolean>) => {
      state.historyLoading = action.payload;
    },
    setHistory: (
      state,
      action: PayloadAction<{
        files: InvoiceHistoryFile[];
        total: number;
        offset: number;
      }>,
    ) => {
      state.history = action.payload.files;
      state.historyTotal = action.payload.total;
      state.historyOffset = action.payload.offset;
    },
    setHistoryFilters: (
      state,
      action: PayloadAction<{
        storeid?: number | null;
        engine?: InvoiceEngine | null;
        status?: InvoiceRunStatus | null;
      }>,
    ) => {
      const { storeid, engine, status } = action.payload;
      if (storeid !== undefined) state.historyStoreid = storeid;
      if (engine !== undefined) state.historyEngine = engine;
      if (status !== undefined) state.historyStatus = status;
      // Any filter change invalidates the page you were on.
      state.historyOffset = 0;
    },
    setHistoryOffset: (state, action: PayloadAction<number>) => {
      state.historyOffset = action.payload;
    },
    setOpeningRunId: (state, action: PayloadAction<string | null>) => {
      state.openingRunId = action.payload;
    },
    setSelectedInvoiceIndex: (state, action: PayloadAction<number | null>) => {
      state.selectedInvoiceIndex = action.payload;
    },
    setInvoiceExportOpen: (state, action: PayloadAction<boolean>) => {
      state.exportOpen = action.payload;
    },
    // Engine, store, bulk mode and the loaded history survive — none of them
    // are results.
    clearParseResult: (state) => ({
      ...initialState,
      engine: state.engine,
      storeid: state.storeid,
      bulk: state.bulk,
      history: state.history,
      historyTotal: state.historyTotal,
      historyOffset: state.historyOffset,
      historyStoreid: state.historyStoreid,
      historyEngine: state.historyEngine,
      historyStatus: state.historyStatus,
    }),
  },
});

export const {
  setInvoiceView,
  setEngine,
  setInvoiceStoreid,
  setBulk,
  setParsing,
  setParseResult,
  setSelectedInvoiceIndex,
  setInvoiceExportOpen,
  setHistoryLoading,
  setHistory,
  setHistoryFilters,
  setHistoryOffset,
  setOpeningRunId,
  clearParseResult,
} = invoiceParsingSlice.actions;

export default invoiceParsingSlice.reducer;
