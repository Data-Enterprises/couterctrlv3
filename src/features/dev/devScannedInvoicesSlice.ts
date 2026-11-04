import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { InvoiceParseResp } from "../../api/invoices";

/**
 * Scanned Invoices page state.
 *
 * Dev only — the page has no prod tree — so there is no prod twin of this
 * slice and it is listed in `DEV_ONLY_SLICES`.
 *
 * The whole parse response is kept, as the server sent it. A Bedrock run
 * takes minutes and is billed, so leaving the page and coming back must not
 * mean reading the same scans again. It is plain JSON — money as strings —
 * so it is serialisable as it stands.
 */
export interface ScannedInvoicesState {
  result: InvoiceParseResp | null;
  /** The files as they were sent, for the header. */
  fileNames: string[];
  parsing: boolean;
  /** When the parse in flight started, for the elapsed counter. */
  startedAt: number | null;
  error: string | null;
  /** The one invoice open in the list, by `${file}:${invoiceNumber}`. */
  expandedId: string | null;
  /** Narrows the list to invoices that failed reconciliation. */
  failedOnly: boolean;
}

const initialState: ScannedInvoicesState = {
  result: null,
  fileNames: [],
  parsing: false,
  startedAt: null,
  error: null,
  expandedId: null,
  failedOnly: false,
};

const devScannedInvoicesSlice = createSlice({
  name: "devScannedInvoices",
  initialState,
  reducers: {
    startScannedParse: (state, action: PayloadAction<string[]>) => {
      state.parsing = true;
      state.startedAt = Date.now();
      state.error = null;
      state.fileNames = action.payload;
    },
    setScannedResult: (state, action: PayloadAction<InvoiceParseResp>) => {
      state.result = action.payload;
      state.parsing = false;
      state.startedAt = null;
      state.expandedId = null;
      state.failedOnly = false;
    },
    failScannedParse: (state, action: PayloadAction<string>) => {
      state.parsing = false;
      state.startedAt = null;
      state.error = action.payload;
    },
    setScannedExpanded: (state, action: PayloadAction<string | null>) => {
      state.expandedId = action.payload;
    },
    setScannedFailedOnly: (state, action: PayloadAction<boolean>) => {
      state.failedOnly = action.payload;
    },
    clearScannedResult: () => initialState,
  },
});

export const {
  startScannedParse,
  setScannedResult,
  failScannedParse,
  setScannedExpanded,
  setScannedFailedOnly,
  clearScannedResult,
} = devScannedInvoicesSlice.actions;

export default devScannedInvoicesSlice.reducer;
