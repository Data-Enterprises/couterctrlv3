/**
 * Dev copy of `features/invoicesSlice.ts`, mounted at `state.dev.invoices` and read only
 * by `pages/invoices/dev`. Edit this one while changing dev invoices; when dev is
 * promoted, it replaces the prod slice. See src/store/devReducers.ts.
 */
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  lastMergeIndex,
  type InvoiceEdit,
} from "../../pages/invoices/dev/vendors/awg/applyEdit";

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
}

const initialState: InvoicesState = {
  fileName: "",
  fileText: "",
  edits: [],
  expandedId: null,
  failedOnly: false,
  textFilter: "",
  parsing: false,
  error: null,
  sending: false,
  sendError: null,
  sentAt: null,
  runId: null,
  serverWarnings: [],
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
      state.textFilter = "";
      state.parsing = false;
      state.error = null;
      state.sending = false;
      state.sendError = null;
      state.sentAt = null;
      state.runId = null;
      state.serverWarnings = [];
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
      // Only edits since the invoice's last merge share this one's row
      // numbering, so only those can be the same field.
      const floor = lastMergeIndex(state.edits, next.docId);
      const at = state.edits.findIndex(
        (edit, index) =>
          index > floor &&
          edit.docId === next.docId &&
          edit.kind === next.kind &&
          edit.field === next.field &&
          edit.rowIndex === next.rowIndex,
      );
      if (at === -1) state.edits.push(next);
      else state.edits[at] = next;
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
      const floor = lastMergeIndex(state.edits, target.docId);
      state.edits = state.edits.filter(
        (edit, index) =>
          index <= floor ||
          !(
            edit.docId === target.docId &&
            edit.kind === target.kind &&
            edit.field === target.field &&
            edit.rowIndex === target.rowIndex
          ),
      );
      state.sentAt = null;
    },

    /** Collapse one group of repeated lines — see `findMergeGroups`. Undone
     *  only with the rest, because the edits after it are numbered against the
     *  merged lines. */
    mergeInvoiceLines: (
      state,
      action: PayloadAction<{
        docId: string;
        itemCode: string;
        retailPrice: string;
      }>,
    ) => {
      const { docId, itemCode, retailPrice } = action.payload;
      state.edits.push({
        docId,
        kind: "merge",
        field: itemCode,
        value: retailPrice,
      });
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
      action: PayloadAction<{ runId: string; warnings: string[] }>,
    ) => {
      state.sentAt = new Date().toISOString();
      state.runId = action.payload.runId;
      state.serverWarnings = action.payload.warnings;
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
  mergeInvoiceLines,
  clearInvoiceEdits,
  setInvoiceExpanded,
  setInvoiceFailedOnly,
  setInvoiceTextFilter,
  setInvoicesSending,
  setInvoicesSendError,
  setInvoicesSent,
  clearInvoices,
} = invoicesSlice.actions;

export default invoicesSlice.reducer;
