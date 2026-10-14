import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * The Upc Scanner batch: UPCs collected off a shelf, on their way to a tag file.
 *
 * Dev only — the page has no prod tree — so there is no prod twin of this
 * slice and it is listed in `DEV_ONLY_SLICES`.
 *
 * Two codes per row, deliberately. `normalizeUpc` strips the check digit and a
 * leading zero to make the code the lookup wants, and neither can be put back
 * afterwards. The printed code is the one the clerk is looking at and, until
 * the file format is settled, possibly the one Pangea wants — so `raw` is kept
 * as the scanner gave it and `code` is derived for lookups and for dedupe.
 * `raw` is also the row's identity: two different printed codes can normalize
 * to the same thing, and the clerk needs to see which one they scanned.
 */

export type ScanSource = "gun" | "camera" | "typed";

/**
 * Where a row is in being identified.
 *
 * `unnamed` is not an error. The lookup is a sales query, so an item that has
 * never rung has no name to return — and a new item is exactly what gets a new
 * shelf tag. A name is a confirmation that the digits are right; its absence
 * says nothing either way, and the UI must not grade it.
 */
export type ScanStatus = "pending" | "named" | "unnamed" | "error";

export interface ScanRow {
  /** The code as printed, exactly as the scanner handed it over. */
  raw: string;
  /** `normalizeUpc(raw)`. What the lookup is keyed on, and what dedupe compares. */
  code: string;
  source: ScanSource;
  /** ms epoch, for the row's time and for ordering. */
  at: number;
  status: ScanStatus;
  description?: string;
  productCode?: string;
  /**
   * When a scan last arrived for a code already in the batch.
   *
   * A repeat adds nothing — the file is one row per UPC — but it has to be
   * visible, or a clerk reads the silence as a scan that failed and pulls the
   * trigger again.
   */
  repeatedAt?: number;
}

export interface SentBatch {
  count: number;
  at: number;
  /** Where it landed, as the send reported it. */
  file: string;
}

interface UpcScannerState {
  /** 0 until a store is picked. The batch is for exactly one store. */
  storeId: number;
  /** Newest first. */
  rows: ScanRow[];
  /** `raw` of the row open for correction, or null. */
  editing: string | null;
  sending: boolean;
  sent: SentBatch | null;
}

const initialState: UpcScannerState = {
  storeId: 0,
  rows: [],
  editing: null,
  sending: false,
  sent: null,
};

const slice = createSlice({
  name: "devUpcScanner",
  initialState,
  reducers: {
    /**
     * Pick the store the batch belongs to.
     *
     * Changing it empties the batch. Every row carries this store's id into
     * the file, so a batch that spanned a store change would print tags for
     * the wrong shelves — and silently, since the UPCs would all still look
     * fine. Re-picking the same store is a no-op so the screen can dispatch
     * freely.
     */
    setScanStore: (state, { payload }: PayloadAction<number>) => {
      if (state.storeId === payload) return;
      state.storeId = payload;
      state.rows = [];
      state.editing = null;
      state.sent = null;
    },

    /**
     * A scan, from either capture path.
     *
     * A code already in the batch is not added again; the row it duplicates is
     * stamped and lifted to the top, so the clerk sees the tag they just
     * scanned react.
     */
    addScan: (
      state,
      { payload }: PayloadAction<{ raw: string; code: string; source: ScanSource; at: number }>,
    ) => {
      const existing = state.rows.find((r) => r.code === payload.code);
      if (existing) {
        existing.repeatedAt = payload.at;
        state.rows = [existing, ...state.rows.filter((r) => r !== existing)];
        return;
      }
      state.rows.unshift({
        raw: payload.raw,
        code: payload.code,
        source: payload.source,
        at: payload.at,
        status: "pending",
      });
    },

    /** The lookup came back with an item. */
    nameRow: (
      state,
      {
        payload,
      }: PayloadAction<{ code: string; description: string; productCode?: string }>,
    ) => {
      const row = state.rows.find((r) => r.code === payload.code);
      if (!row) return;
      row.status = "named";
      row.description = payload.description;
      row.productCode = payload.productCode;
    },

    /** The lookup answered, and this store has nothing by that code. */
    markUnnamed: (state, { payload }: PayloadAction<string>) => {
      const row = state.rows.find((r) => r.code === payload);
      if (row) row.status = "unnamed";
    },

    /**
     * The lookup never answered.
     *
     * Kept apart from `unnamed` for the same reason Item Lookup keeps them
     * apart: a request that failed says nothing about whether the item exists,
     * and a row that claims absence on a dropped connection is a lie the clerk
     * would act on.
     */
    markRowError: (state, { payload }: PayloadAction<string>) => {
      const row = state.rows.find((r) => r.code === payload);
      if (row) row.status = "error";
    },

    /**
     * Ask again about a row whose lookup never answered.
     *
     * Dropping one connection should not leave a row permanently unexplained,
     * and the clerk has no way to tell a dead request from a real absence —
     * which is the whole reason the two statuses are separate.
     */
    retryRow: (state, { payload }: PayloadAction<string>) => {
      const row = state.rows.find((r) => r.raw === payload);
      if (row) row.status = "pending";
    },

    removeRow: (state, { payload }: PayloadAction<string>) => {
      state.rows = state.rows.filter((r) => r.raw !== payload);
      if (state.editing === payload) state.editing = null;
    },

    beginEdit: (state, { payload }: PayloadAction<string | null>) => {
      state.editing = payload;
    },

    /**
     * A corrected code, typed over a row in place.
     *
     * Stays where it is rather than jumping to the top: it is the same shelf
     * tag, not a new scan. If the correction lands on a code already in the
     * batch the row is dropped instead of duplicating it, and the row it
     * merged into is stamped so something visibly happens.
     */
    replaceRow: (
      state,
      {
        payload,
      }: PayloadAction<{ raw: string; nextRaw: string; nextCode: string; at: number }>,
    ) => {
      const index = state.rows.findIndex((r) => r.raw === payload.raw);
      if (index < 0) return;
      state.editing = null;
      const clash = state.rows.find(
        (r) => r.code === payload.nextCode && r.raw !== payload.raw,
      );
      if (clash) {
        clash.repeatedAt = payload.at;
        state.rows.splice(index, 1);
        return;
      }
      state.rows[index] = {
        ...state.rows[index],
        raw: payload.nextRaw,
        code: payload.nextCode,
        source: "typed",
        status: "pending",
        description: undefined,
        productCode: undefined,
        repeatedAt: undefined,
      };
    },

    clearBatch: (state) => {
      state.rows = [];
      state.editing = null;
    },

    setSending: (state, { payload }: PayloadAction<boolean>) => {
      state.sending = payload;
    },

    /**
     * A batch that went.
     *
     * Clears the rows: they are in the file now, and leaving them on screen
     * invites the same batch being sent twice.
     */
    setSent: (state, { payload }: PayloadAction<SentBatch | null>) => {
      state.sent = payload;
      state.sending = false;
      if (payload) {
        state.rows = [];
        state.editing = null;
      }
    },
  },
});

export const {
  setScanStore,
  addScan,
  nameRow,
  markUnnamed,
  markRowError,
  retryRow,
  removeRow,
  beginEdit,
  replaceRow,
  clearBatch,
  setSending,
  setSent,
} = slice.actions;

export default slice.reducer;
