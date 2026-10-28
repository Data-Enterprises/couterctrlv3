/**
 * Dev copy of `features/invoicesSlice.ts`, mounted at `state.dev.invoices` and read only
 * by `pages/invoices/dev`. Edit this one while changing dev invoices; when dev is
 * promoted, it replaces the prod slice. See src/store/devReducers.ts.
 */
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  ALL_INVOICES,
  type InvoiceEdit,
} from "../../pages/invoices/dev/vendors/awg/applyEdit";
import type { DiscardedInvoice } from "../../api/invoices";

/**
 * AWG Invoices page state.
 *
 * What is stored is the **file text and the corrections made to it** — not the
 * parsed invoices. Parsed invoices carry `Decimal` instances, which are class
 * objects and not serialisable, and Redux state has to stay serialisable.
 *
 * So the page holds the two things that are: the text it read, and an ordered
 * list of edits. Everything else — records, invoices, totals, the four
 * reconciliation checks — is re-derived from that pair by `useAwgInvoices`.
 * That is also what makes an edit cheap to undo: drop it from the list and the
 * file re-derives without it.
 *
 * The text is kept rather than a `File` handle because a handle does not
 * survive navigating away and back, and re-reading would mean asking the user
 * for a file they already gave us.
 */
export interface InvoicesState {
  /** Name of the file the text came from, for the header. */
  fileName: string;
  /** The file, read as ISO-8859-1. Empty until one is dropped. */
  fileText: string;
  /** Corrections, oldest first. Replayed over every parse. */
  edits: InvoiceEdit[];
  /** The one invoice open in the list, by `${storeNbr}-${invoiceNbr}`. */
  expandedId: string | null;
  /** Narrows the list to invoices that failed reconciliation. */
  failedOnly: boolean;
  /** Narrows the list to invoices a check misses by more than 10¢ — past
   *  the vendor's penny rounding, so worth a look. */
  overTenCentsOnly: boolean;
  /** Narrows the list to invoices that billed nothing — exceptions only. */
  nothingBilledOnly: boolean;
  /** Narrows the list on store, invoice number or department. */
  textFilter: string;
  parsing: boolean;
  error: string | null;
  /** Set while an upload is in flight, and afterwards to whatever came back. */
  sending: boolean;
  sendError: string | null;
  sentAt: string | null;
  /** The server's own run id. Kept because it is how a result is fetched again
   *  without re-uploading. */
  runId: string | null;
  /** Record types the server's decoder had no layout for — AWG's 20/21 credit
   *  memos among them. Money it saw and did not understand, so a run carrying
   *  these must not look like a clean one. */
  serverWarnings: string[];
  /** Invoices the server read and would not save, with why. A send with any
   *  of these is a partial one, whatever the toast said. */
  serverDiscarded: DiscardedInvoice[];
}

const initialState: InvoicesState = {
  fileName: "",
  fileText: "",
  edits: [],
  expandedId: null,
  failedOnly: false,
  overTenCentsOnly: false,
  nothingBilledOnly: false,
  textFilter: "",
  parsing: false,
  error: null,
  sending: false,
  sendError: null,
  sentAt: null,
  runId: null,
  serverWarnings: [],
  serverDiscarded: [],
};

const invoicesSlice = createSlice({
  // Distinct from the prod slice's "invoices": Redux matches actions on this
  // string alone, so sharing it would move prod and dev together.
  name: "devInvoices",
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

    setInvoicesFile: (
      state,
      action: PayloadAction<{ fileName: string; fileText: string }>,
    ) => {
      state.fileName = action.payload.fileName;
      state.fileText = action.payload.fileText;
      // A new file gets a clean view. Carrying edits over would apply one
      // file's corrections to another's line numbers, which is the one way
      // this page could produce a wrong figure silently.
      state.edits = [];
      state.expandedId = null;
      state.failedOnly = false;
      state.overTenCentsOnly = false;
      state.nothingBilledOnly = false;
      state.textFilter = "";
      state.parsing = false;
      state.error = null;
      state.sending = false;
      state.sendError = null;
      state.sentAt = null;
      state.runId = null;
      state.serverWarnings = [];
      state.serverDiscarded = [];
    },

    /**
     * Record one correction.
     *
     * An edit to a field already edited replaces the earlier one rather than
     * stacking, so the list stays the size of what was actually changed and
     * "revert this field" is a removal rather than an inverse edit.
     */
    editInvoiceField: (state, action: PayloadAction<InvoiceEdit>) => {
      const next = action.payload;
      const at = state.edits.findIndex(
        (edit) =>
          edit.docId === next.docId &&
          edit.kind === next.kind &&
          edit.field === next.field &&
          edit.rowIndex === next.rowIndex,
      );
      // Replaced at the end, not in place: suggested corrections applied since
      // would otherwise be replayed over it.
      if (at !== -1) state.edits.splice(at, 1);
      state.edits.push(next);
      // A correction invalidates the last send: what is on the server is no
      // longer what is on screen.
      state.sentAt = null;
    },

    /** Drop one correction, putting the field back to what the file said.
     *  A removal rather than an inverse edit, so the original value never has
     *  to be carried around to get back to it. */
    revertInvoiceField: (
      state,
      action: PayloadAction<Omit<InvoiceEdit, "value">>,
    ) => {
      const target = action.payload;
      state.edits = state.edits.filter(
        (edit) =>
          !(
            edit.docId === target.docId &&
            edit.kind === target.kind &&
            edit.field === target.field &&
            edit.rowIndex === target.rowIndex
          ),
      );
      state.sentAt = null;
    },

    /** Every suggested correction, across the whole file, as one entry —
     *  undone with the rest. Applying twice is a no-op. */
    /**
     * Suggested corrections on or off.
     *
     * It only went on before, and taking it back meant "Undo all
     * corrections" — which also threw away every figure the user had typed
     * by hand. Two different intentions on one button.
     */
    toggleSuggestedCorrections: (state) => {
      const at = state.edits.findIndex((edit) => edit.kind === "suggested");
      if (at >= 0) {
        state.edits.splice(at, 1);
      } else {
        state.edits.push({
          docId: ALL_INVOICES,
          kind: "suggested",
          field: "",
          value: "",
        });
      }
      state.sentAt = null;
    },

    clearInvoiceEdits: (state) => {
      state.edits = [];
      state.sentAt = null;
    },

    setInvoiceExpanded: (state, action: PayloadAction<string | null>) => {
      state.expandedId = action.payload;
    },

    setInvoiceFailedOnly: (state, action: PayloadAction<boolean>) => {
      state.failedOnly = action.payload;
    },

    setInvoiceOverTenCentsOnly: (state, action: PayloadAction<boolean>) => {
      state.overTenCentsOnly = action.payload;
    },

    setInvoiceNothingBilledOnly: (state, action: PayloadAction<boolean>) => {
      state.nothingBilledOnly = action.payload;
    },

    setInvoiceTextFilter: (state, action: PayloadAction<string>) => {
      state.textFilter = action.payload;
    },

    setInvoicesSending: (state, action: PayloadAction<boolean>) => {
      state.sending = action.payload;
      if (action.payload) state.sendError = null;
    },

    setInvoicesSendError: (state, action: PayloadAction<string>) => {
      state.sendError = action.payload;
      state.sending = false;
    },

    setInvoicesSent: (
      state,
      action: PayloadAction<{
        runId: string;
        warnings: string[];
        discarded?: DiscardedInvoice[];
      }>,
    ) => {
      state.sentAt = new Date().toISOString();
      state.runId = action.payload.runId;
      state.serverWarnings = action.payload.warnings;
      state.serverDiscarded = action.payload.discarded ?? [];
      state.sending = false;
      state.sendError = null;
    },

    clearInvoices: () => initialState,
  },
});

export const {
  setInvoicesParsing,
  setInvoicesError,
  setInvoicesFile,
  editInvoiceField,
  revertInvoiceField,
  toggleSuggestedCorrections,
  clearInvoiceEdits,
  setInvoiceExpanded,
  setInvoiceFailedOnly,
  setInvoiceOverTenCentsOnly,
  setInvoiceNothingBilledOnly,
  setInvoiceTextFilter,
  setInvoicesSending,
  setInvoicesSendError,
  setInvoicesSent,
  clearInvoices,
} = invoicesSlice.actions;

export default invoicesSlice.reducer;
