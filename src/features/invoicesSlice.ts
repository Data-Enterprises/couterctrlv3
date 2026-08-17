import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { InvoiceRow } from "../pages/invoices/present";
import type { ParseWarning } from "../pages/invoices/core/types";

/**
 * Invoices page state.
 *
 * The parsed rows live here rather than in the component for the same reason
 * every other page's results do: parsing a file is work the user did, and
 * navigating away and back should not silently throw it away. The raw
 * `AwgInvoice` objects are deliberately *not* stored — they carry `Decimal`
 * instances, which are class objects and not serialisable, and Redux state has
 * to stay serialisable. `present()` flattens them to strings on the way in.
 */
export interface InvoicesState {
  /** Name of the file these rows came from, for the header. */
  fileName: string;
  rows: InvoiceRow[];
  warnings: ParseWarning[];
  countsByType: Record<string, number>;
  /** True when every invoice in the file reconciled — the figure that says
   *  whether this file is safe to send onward. */
  allReconciled: boolean;
  selectedId: string | null;
  /** Narrows the list to invoices that failed reconciliation. */
  failedOnly: boolean;
  textFilter: string;
  /** Narrow the selected invoice's lines. Cleared when the selection changes —
   *  a filter carried from the last invoice hides rows on this one without
   *  saying why. */
  lineUpcFilter: string;
  lineDescFilter: string;
  parsing: boolean;
  error: string | null;
}

const initialState: InvoicesState = {
  fileName: "",
  rows: [],
  warnings: [],
  countsByType: {},
  allReconciled: false,
  selectedId: null,
  failedOnly: false,
  textFilter: "",
  lineUpcFilter: "",
  lineDescFilter: "",
  parsing: false,
  error: null,
};

const invoicesSlice = createSlice({
  name: "invoices",
  initialState,
  reducers: {
    setInvoicesParsing: (state, action: PayloadAction<boolean>) => {
      state.parsing = action.payload;
      if (action.payload) state.error = null;
    },

    setInvoicesError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.parsing = false;
    },

    setInvoicesResult: (
      state,
      action: PayloadAction<{
        fileName: string;
        rows: InvoiceRow[];
        warnings: ParseWarning[];
        countsByType: Record<string, number>;
        allReconciled: boolean;
      }>,
    ) => {
      state.fileName = action.payload.fileName;
      state.rows = action.payload.rows;
      state.warnings = action.payload.warnings;
      state.countsByType = action.payload.countsByType;
      state.allReconciled = action.payload.allReconciled;
      // A new file gets a clean view: filters from the last one would hide
      // rows without saying why.
      state.selectedId = action.payload.rows[0]?.id ?? null;
      state.failedOnly = false;
      state.textFilter = "";
      state.lineUpcFilter = "";
      state.lineDescFilter = "";
      state.parsing = false;
      state.error = null;
    },

    setInvoiceSelected: (state, action: PayloadAction<string | null>) => {
      state.selectedId = action.payload;
      state.lineUpcFilter = "";
      state.lineDescFilter = "";
    },

    setInvoiceLineUpcFilter: (state, action: PayloadAction<string>) => {
      state.lineUpcFilter = action.payload;
    },

    setInvoiceLineDescFilter: (state, action: PayloadAction<string>) => {
      state.lineDescFilter = action.payload;
    },

    setInvoiceFailedOnly: (state, action: PayloadAction<boolean>) => {
      state.failedOnly = action.payload;
    },

    setInvoiceTextFilter: (state, action: PayloadAction<string>) => {
      state.textFilter = action.payload;
    },

    clearInvoices: () => initialState,
  },
});

export const {
  setInvoicesParsing,
  setInvoicesError,
  setInvoicesResult,
  setInvoiceSelected,
  setInvoiceFailedOnly,
  setInvoiceTextFilter,
  setInvoiceLineUpcFilter,
  setInvoiceLineDescFilter,
  clearInvoices,
} = invoicesSlice.actions;

export default invoicesSlice.reducer;
