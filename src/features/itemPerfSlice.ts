import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CatItem, SubDeptMargin } from "../interfaces";

/**
 * How this page groups its rows. One per page, never a switch.
 *
 * The same item row carries sub_department, vendor_id and product_code, so a
 * single fetch could serve all of them — but Sub Dept Margins and Vendors are
 * separate pages to a user, and showing both groupings on one screen would
 * blur that. The dataset is shared; the page is not.
 */
export type ItemDimension = "subdept" | "vendor" | "category";

/**
 * An item row from either endpoint.
 *
 * `subs/subs` returns sub-department and vendor; `categories/cats` returns
 * category and vendor. Otherwise they are the same columns off the same
 * table, which is what lets all three pages share one screen and one set of
 * maths. The grouping columns are optional here because a row only ever
 * carries the one its endpoint groups by.
 */
export type ItemRow = Omit<
  SubDeptMargin,
  "sub_department" | "sub_department_description"
> &
  Partial<
    Pick<SubDeptMargin, "sub_department" | "sub_department_description">
  > &
  Partial<Pick<CatItem, "category" | "category_description">>;

/** The three views every one of these pages has. */
export type ItemView = "list" | "search" | "daily";

/** Rows rendered per page. Comfortably more than a phone screen holds, so
 *  "show more" is a deliberate act rather than something you hit scrolling. */
export const ROWS_PER_PAGE = 100;

/**
 * State for the ungraded mobile Margins screen, shared by Sub Dept Margins and
 * Vendors.
 *
 * Separate from subMarginSlice and vendorsSlice, both of which are built around
 * grading — thresholds, tiers, severity filters. This screen has none of it.
 *
 * Single store only, and this year against last year only. No group scope, no
 * last week, so a search is two paged reads.
 */
interface ItemPerfState {
  hasSearched: boolean;
  loading: boolean;

  /** The store being reported on. These pages never take a group. */
  storeId: number;

  itemsTy: ItemRow[];
  itemsLy: ItemRow[];

  view: ItemView;

  /** ISO date of the selected day, or null for the whole window. Tapping the
   *  selected day again clears it — there is no "all week" control. */
  selectedDay: string | null;

  /** Set by tapping a department or vendor row, narrowing the list to the
   *  items inside it. Cleared by tapping it again. */
  selectedGroupKey: string | null;
  selectedGroupLabel: string | null;

  /**
   * Which view sent us into the item, so Back can undo that one step.
   *
   * Search and Daily's picker both land on the same item layout — Search is
   * just the faster way in — so the screen itself cannot say where you came
   * from. Without this, Back from a scanned item would drop you into the
   * picker you never opened.
   */
  itemOrigin: ItemView | null;

  /** The item Daily is reporting on. Search sets it too, so scanning in
   *  either place lands somewhere useful. */
  selectedItemCode: string | null;

  /** One query, shared by Search and the Daily picker — they search the same
   *  rows, and carrying the text between them saves retyping a UPC. */
  itemQuery: string;

  /** Product codes most recently opened, newest first. Search opens on these
   *  rather than the whole catalogue: someone checking the same few items
   *  through a shift should not retype a UPC, and a list of every item in the
   *  store is not a useful thing to land on. */
  recentItems: string[];

  /**
   * How many list rows are actually in the DOM.
   *
   * Daily's picker covers every item in the store week — thousands — and each
   * row carries two bars and four figures. Rendering the lot is tens of
   * thousands of nodes built in one tap, which is what made switching to
   * Daily feel stuck. Rows are sorted biggest-profit-first, so the first page
   * is the part anyone browsing actually wants; the rest arrive on request.
   */
  listLimit: number;

  /** The recents list is expanded into a sheet. Capped at 8, but even 8 rows
   *  push the search field off a phone screen, so the panel shows the top few
   *  and the rest live over the page rather than inside it. */
  recentsOpen: boolean;

  /** The camera is open. Kept in state rather than local so closing it is a
   *  reducer away from anywhere, including the scan handler itself. */
  scannerOpen: boolean;
}

const initialState: ItemPerfState = {
  hasSearched: false,
  loading: false,
  storeId: 0,
  itemsTy: [],
  itemsLy: [],
  view: "list",
  selectedDay: null,
  selectedGroupKey: null,
  selectedGroupLabel: null,
  selectedItemCode: null,
  itemOrigin: null,
  itemQuery: "",
  listLimit: ROWS_PER_PAGE,
  recentItems: [],
  recentsOpen: false,
  scannerOpen: false,
};

const itemPerfSlice = createSlice({
  name: "itemPerf",
  initialState,
  reducers: {
    setItemPerfLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setItemPerfHasSearched: (state, action: PayloadAction<boolean>) => {
      state.hasSearched = action.payload;
    },
    setItemPerfStore: (state, action: PayloadAction<number>) => {
      state.storeId = action.payload;
    },
    setItemPerfRows: (
      state,
      action: PayloadAction<{ ty: ItemRow[]; ly: ItemRow[] }>,
    ) => {
      state.itemsTy = action.payload.ty;
      state.itemsLy = action.payload.ly;
      // A new window invalidates every drill into the old one.
      state.view = "list";
      state.selectedDay = null;
      state.selectedGroupKey = null;
      state.selectedGroupLabel = null;
      state.selectedItemCode = null;
      state.itemOrigin = null;
      state.itemQuery = "";
      state.listLimit = ROWS_PER_PAGE;
      state.recentItems = [];
      state.recentsOpen = false;
    },
    setItemPerfView: (state, action: PayloadAction<ItemView>) => {
      // Daily with no item selected shows its own picker, so there is nothing
      // to redirect away from — every tab lands somewhere usable.
      state.view = action.payload;
      state.listLimit = ROWS_PER_PAGE;
      // Leaving Daily by tab drops the item; coming back should offer the
      // picker rather than whatever was last open.
      if (action.payload !== "daily") {
        state.selectedItemCode = null;
        state.itemOrigin = null;
      }
    },
    toggleItemPerfDay: (state, action: PayloadAction<string>) => {
      state.selectedDay =
        state.selectedDay === action.payload ? null : action.payload;
      state.listLimit = ROWS_PER_PAGE;
    },
    /**
     * Tapping a department or vendor moves to Daily, showing that group's
     * items.
     *
     * The overview list answers "which department", and the question straight
     * after it is always "which item in it" — so the chevron goes somewhere
     * rather than expanding in place. Clearing the group stays on Daily and
     * widens it to every item, which is where the picker lives anyway.
     */
    toggleItemPerfGroup: (
      state,
      action: PayloadAction<{ key: string; label: string }>,
    ) => {
      const same = state.selectedGroupKey === action.payload.key;
      state.selectedGroupKey = same ? null : action.payload.key;
      state.selectedGroupLabel = same ? null : action.payload.label;
      state.selectedItemCode = null;
      state.itemOrigin = null;
      state.listLimit = ROWS_PER_PAGE;
      state.view = "daily";
    },
    setItemQuery: (state, action: PayloadAction<string>) => {
      state.itemQuery = action.payload;
      state.listLimit = ROWS_PER_PAGE;
    },
    setRecentsOpen: (state, action: PayloadAction<boolean>) => {
      state.recentsOpen = action.payload;
    },
    /**
     * Open the camera on an empty field.
     *
     * Clearing the query is the point, not housekeeping: leaving the last
     * code in the input means a read that fails to replace it — a cancelled
     * scan, a partial decode — searches the PREVIOUS item while looking like
     * it searched the one in your hand.
     */
    openScanner: (state) => {
      state.itemQuery = "";
      state.scannerOpen = true;
    },
    closeScanner: (state) => {
      state.scannerOpen = false;
    },
    /** A scan replaces the field outright and closes the camera. It does not
     *  jump straight to the item: a mis-scan should land on a list showing
     *  nothing matched, not on some other item's page. */
    scannedUpc: (state, action: PayloadAction<string>) => {
      state.itemQuery = action.payload;
      state.listLimit = ROWS_PER_PAGE;
      state.scannerOpen = false;
    },
    /** Picking an item is the only way into Daily, from either the drilled
     *  list or Search. */
    selectPerfItem: (state, action: PayloadAction<string>) => {
      state.selectedItemCode = action.payload;
      // Recorded before the view changes — after this line the screen no
      // longer knows which of the two ways in was used.
      state.itemOrigin = state.view;
      state.view = "daily";
      // Newest first, no duplicates, capped — a recents list you have to
      // scroll is just the catalogue again.
      state.recentItems = [
        action.payload,
        ...state.recentItems.filter((c) => c !== action.payload),
      ].slice(0, 8);
    },
    showMoreItems: (state) => {
      state.listLimit += ROWS_PER_PAGE;
    },
    /** Back out of an item, to whichever list opened it. Falls back to Daily's
     *  own picker, which is where an item with no recorded origin belongs. */
    clearPerfItem: (state) => {
      state.listLimit = ROWS_PER_PAGE;
      state.view = state.itemOrigin ?? "daily";
      state.selectedItemCode = null;
      state.itemOrigin = null;
    },
    resetItemPerf: () => initialState,
  },
});

export const {
  setItemPerfLoading,
  setItemPerfHasSearched,
  setItemPerfStore,
  setItemPerfRows,
  setItemPerfView,
  toggleItemPerfDay,
  toggleItemPerfGroup,
  setItemQuery,
  setRecentsOpen,
  openScanner,
  closeScanner,
  scannedUpc,
  selectPerfItem,
  showMoreItems,
  clearPerfItem,
  resetItemPerf,
} = itemPerfSlice.actions;

export default itemPerfSlice.reducer;
