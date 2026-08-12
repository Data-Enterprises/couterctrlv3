import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ExtractedInvoice,
  InvoiceEngine,
  InvoiceFileReport,
  InvoiceReconciliation,
  InvoiceStorage,
} from "../../interfaces";

/** The finished run only. The pending File objects stay in component state —
 *  a File isn't serializable and has no business in the store — but the result
 *  does live here, because an extraction costs minutes of Bedrock time and a
 *  stray click on the nav must not throw it away. */
interface InvoiceParsingState {
  /** The engine the next run will use. A standing preference, not part of the
   *  result — clearing the results leaves it alone. */
  engine: InvoiceEngine;
  runId: string | null;
  /** The engine that produced the results on screen. Separate from `engine`
   *  above so switching the picker never relabels a run that already happened. */
  runEngine: InvoiceEngine | null;
  model: string | null;
  invoices: ExtractedInvoice[];
  reconciliation: InvoiceReconciliation[];
  files: InvoiceFileReport[];
  storage: InvoiceStorage | null;
  isParsing: boolean;
  /** Index into `invoices`, not an invoice number — two files in one batch can
   *  print the same number. */
  selectedInvoiceIndex: number | null;
  exportOpen: boolean;
}

export const initialState: InvoiceParsingState = {
  // Claude by default: it reads any layout without per-vendor setup, so it's
  // the one that works on an invoice nobody has tried yet.
  engine: "bedrock",
  runId: null,
  runEngine: null,
  model: null,
  invoices: [],
  reconciliation: [],
  files: [],
  storage: null,
  isParsing: false,
  selectedInvoiceIndex: null,
  exportOpen: false,
};

export type InvoiceParseResult = Pick<
  InvoiceParsingState,
  | "runId"
  | "runEngine"
  | "model"
  | "invoices"
  | "reconciliation"
  | "files"
  | "storage"
>;

export const invoiceParsingSlice = createSlice({
  name: "invoiceParsing",
  initialState,
  reducers: {
    setEngine: (state, action: PayloadAction<InvoiceEngine>) => {
      state.engine = action.payload;
    },
    setParsing: (state, action: PayloadAction<boolean>) => {
      state.isParsing = action.payload;
    },
    setParseResult: (state, action: PayloadAction<InvoiceParseResult>) => {
      const {
        runId,
        runEngine,
        model,
        invoices,
        reconciliation,
        files,
        storage,
      } = action.payload;
      state.runId = runId;
      state.runEngine = runEngine;
      state.model = model;
      state.invoices = invoices;
      state.reconciliation = reconciliation;
      state.files = files;
      state.storage = storage;
      // Land on the first invoice so the detail panel has something to show;
      // a run that produced only file errors selects nothing.
      state.selectedInvoiceIndex = invoices.length > 0 ? 0 : null;
    },
    setSelectedInvoiceIndex: (state, action: PayloadAction<number | null>) => {
      state.selectedInvoiceIndex = action.payload;
    },
    setInvoiceExportOpen: (state, action: PayloadAction<boolean>) => {
      state.exportOpen = action.payload;
    },
    // Engine survives — it's a preference, not a result.
    clearParseResult: (state) => ({ ...initialState, engine: state.engine }),
  },
});

export const {
  setEngine,
  setParsing,
  setParseResult,
  setSelectedInvoiceIndex,
  setInvoiceExportOpen,
  clearParseResult,
} = invoiceParsingSlice.actions;

export default invoiceParsingSlice.reducer;
