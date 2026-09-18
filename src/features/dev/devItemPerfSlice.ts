/**
 * Dev copy of `features/itemPerfSlice.ts`, mounted at `state.dev.itemPerf` and read only
 * by `pages/shared/itemPerf/dev`. Edit this one while changing dev shared/itemPerf; when dev is
 * promoted, it replaces the prod slice. See src/store/devReducers.ts.
 */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { cycleSort, type SortState } from "../../utils/perfPairs";
import type { CatItem, SubDeptMargin } from "../../interfaces";
import { storeNumbersIn } from "../../utils/storeIdentity";

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

/**
 * Where a page's rows came from.
 *
 * Sub Dept Margins and Vendors read the same `subs/subs` rows and differ only
 * in how they group them, so moving between them should regroup rather than
 * re-fetch. Categories reads a different endpoint entirely — without this,
 * opening it after Vendors showed the previous page's rows under the new
 * heading, because one slice serves all three.
 */
export type ItemSource = "subs" | "cats";

export const sourceOf = (d: ItemDimension): ItemSource =>
  d === "category" ? "cats" : "subs";

/** The three views every one of these pages has. */
/**
 * There is no "view" any more.
 *
 * The three tabs — list, search, daily — were not siblings: list and daily
 * were two rungs of one ladder, and search spanned the whole store from
 * outside it. Tabbing between them meant the screen could not say where you
 * were, which is why an item needed `itemOrigin` to know what Back meant.
 *
 * Now the ladder is the screen (a group opens, its items open, an item's week
 * opens) and search is its own place. Each level knows what is above it, so
 * Back is always one rung.
 */
export type MarginSortState = SortState<MarginSort>;

/** Rows rendered per page. Comfortably more than a phone screen holds, so
 *  "show more" is a deliberate act rather than something you hit scrolling. */
export const ROWS_PER_PAGE = 100;

/** How a list of departments, vendors, categories or items can be ordered.
 *  Sales is the default: it is what the bars show. */
export type MarginSort = "profit" | "sales" | "gpm" | "change" | "name";

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
  /** Which endpoint the rows in here came from. */
  source: ItemSource | null;

  /**
   * Bumped by every load and every hand-over to another page.
   *
   * A load only lands if its number is still current. Without it, a Sub Dept
   * Margins load still in flight when you opened Categories arrived after the
   * reset, marked the page searched, and showed sub-department rows as one
   * "Uncategorised" group — and its `finally` cleared Categories' own spinner.
   */
  loadGen: number;

  /** The week-ending date (ISO) of the rows in hand. Every date on screen
   *  reads from this, not from the shared search date — changing the date on
   *  another page used to relabel this week and zero its day chart. */
  loadedEnd: string | null;

  /** Every store_number in the loaded rows. More than one means the storeid
   *  covers two locations (685 → 369 and 370), fetched combined. */
  storeNumbers: string[];
  /** The location shown when there is more than one, else null. */
  storeNumber: string | null;

  /** Sort for the page's own list, and for item lists. Kept across searches. */
  /** Null is the order the list was built in — see `cycleSort`. */
  groupSort: MarginSortState | null;
  itemSort: MarginSortState | null;

  /** The "?" sheet. */
  infoOpen: boolean;

  hasSearched: boolean;
  loading: boolean;

  /** The store being reported on. These pages never take a group. */
  storeId: number;

  itemsTy: ItemRow[];
  itemsLy: ItemRow[];

  /**
   * Last year could not be read for this store.
   *
   * Not the same as a store that traded nothing last year, and the difference
   * is the whole point of the flag. Both arrive here as an empty `itemsLy`,
   * but one means "they made no money" and the other means "we have no
   * record" — and the comparison has to be withheld for the second, not
   * printed as a rise from zero.
   *
   * Some stores simply have no history on the new backend; the endpoint
   * answers with an error rather than an empty list, which used to reject the
   * whole fetch and leave the page on its search card.
   */
  lyMissing: boolean;

  /**
   * The expanded card in the group list, or null when they are all closed.
   *
   * One at a time — this screen is an accordion, and a single key is what
   * keeps it one.
   */
  openGroup: { key: string; label: string } | null;

  /** The items screen for `openGroup` is on screen. */
  detailOpen: boolean;

  /**
   * The find-an-item screen is on screen.
   *
   * Its own place rather than a level: it spans every department and it drives
   * the scanner, so there is no one group it could sit under.
   */
  searchOpen: boolean;

  /** ISO date of the selected day, or null for the whole window. Scopes the
   *  open card. Tapping the selected day again clears it — there is no
   *  "all week" control. */
  selectedDay: string | null;

  /** The item whose week is showing, inside whichever screen opened it — the
   *  items list, or search. That screen is what Back returns to, so no origin
   *  needs recording. */
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

  /** Which of the three pages is on screen. */
  active: ItemDimension;

  /**
   * What each of the other pages was left looking at.
   *
   * Sub Dept Margins, Vendors and Categories are one screen with three
   * groupings, and they used to be one state as well — so searching on one
   * put its query on the next, an open department survived into a vendor list
   * that had never heard of it, and stepping into Categories wiped the lot.
   * None of that is explicable to someone who thinks of them as three pages,
   * because to them it is three pages.
   *
   * So each page parks everything on its way out and takes it back on its way
   * in. Rows included: re-fetching a week you already had, to show it grouped
   * the way you last left it, is the part that reads as broken.
   */
  stash: Partial<Record<ItemDimension, ItemPerfSnapshot>>;
}

/**
 * Everything that belongs to one page's visit.
 *
 * `loadGen` and `infoOpen` are deliberately outside it: the counter has to
 * keep climbing across pages so a load left in flight by one can never land on
 * another, and the sheet is a thing on screen now rather than a thing a page
 * remembers.
 */
type ItemPerfSnapshot = Omit<
  ItemPerfState,
  "loadGen" | "infoOpen" | "active" | "stash"
>;

const SNAPSHOT_KEYS = [
  "source",
  "loadedEnd",
  "storeNumbers",
  "storeNumber",
  "groupSort",
  "itemSort",
  "hasSearched",
  "loading",
  "storeId",
  "itemsTy",
  "itemsLy",
  "lyMissing",
  "openGroup",
  "detailOpen",
  "searchOpen",
  "selectedDay",
  "selectedItemCode",
  "itemQuery",
  "listLimit",
  "recentItems",
  "recentsOpen",
  "scannerOpen",
] as const;

const snapshotOf = (s: ItemPerfSnapshot): ItemPerfSnapshot =>
  Object.fromEntries(
    SNAPSHOT_KEYS.map((k) => [k, s[k]]),
  ) as unknown as ItemPerfSnapshot;

/** The rows half of a snapshot — what a page loaded, as opposed to where it
 *  was looking. */
const ROW_KEYS = [
  "source",
  "loadedEnd",
  "storeNumbers",
  "itemsTy",
  "itemsLy",
  "lyMissing",
  "hasSearched",
  "storeId",
] as const;

const initialState: ItemPerfState = {
  source: null,
  loadGen: 0,
  loadedEnd: null,
  storeNumbers: [],
  storeNumber: null,
  groupSort: null,
  itemSort: null,
  infoOpen: false,
  hasSearched: false,
  loading: false,
  storeId: 0,
  itemsTy: [],
  itemsLy: [],
  lyMissing: false,
  openGroup: null,
  detailOpen: false,
  searchOpen: false,
  selectedDay: null,
  selectedItemCode: null,
  itemQuery: "",
  listLimit: ROWS_PER_PAGE,
  recentItems: [],
  recentsOpen: false,
  scannerOpen: false,
  active: "subdept",
  stash: {},
};

const itemPerfSlice = createSlice({
  // Distinct from the prod slice's "itemPerf": Redux matches actions on this
  // string alone, so sharing it would move prod and dev together.
  name: "devItemPerf",
  initialState,
  reducers: {
    setItemPerfLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    /** Start a load. The caller passes loadGen + 1 and hands the same number
     *  to setItemPerfRows or failItemPerfLoad. */
    beginItemPerfLoad: (state, action: PayloadAction<number>) => {
      state.loadGen = action.payload;
      state.loading = true;
    },
    /** A load failed. Only the current load may clear the spinner. */
    failItemPerfLoad: (state, action: PayloadAction<number>) => {
      if (action.payload === state.loadGen) state.loading = false;
    },
    setItemPerfHasSearched: (state, action: PayloadAction<boolean>) => {
      state.hasSearched = action.payload;
    },
    setItemPerfStore: (state, action: PayloadAction<number>) => {
      state.storeId = action.payload;
    },
    setItemPerfRows: (
      state,
      action: PayloadAction<{
        ty: ItemRow[];
        /** Null when last year could not be read at all — see `lyMissing`. */
        ly: ItemRow[] | null;
        gen: number;
        source: ItemSource;
        /** Week-ending ISO date the rows were fetched for. */
        end: string;
      }>,
    ) => {
      // A load for another page, or overtaken by a newer one.
      if (
        action.payload.gen !== state.loadGen ||
        action.payload.source !== state.source
      )
        return;
      state.loading = false;
      state.hasSearched = true;
      state.loadedEnd = action.payload.end;
      state.storeNumbers = storeNumbersIn(action.payload.ty);
      // First location by default, as on desktop Sub Dept Margins.
      state.storeNumber =
        state.storeNumbers.length > 1 ? state.storeNumbers[0] : null;
      state.itemsTy = action.payload.ty;
      state.itemsLy = action.payload.ly ?? [];
      state.lyMissing = action.payload.ly === null;
      // A new window invalidates every drill into the old one.
      state.openGroup = null;
      state.detailOpen = false;
      state.searchOpen = false;
      state.selectedDay = null;
      state.selectedItemCode = null;
      state.itemQuery = "";
      state.listLimit = ROWS_PER_PAGE;
      state.recentItems = [];
      state.recentsOpen = false;
    },
    /** Show or leave the items screen. Leaving keeps the card open behind it,
     *  so Back is a return rather than a re-search. */
    openItemDetail: (state, action: PayloadAction<boolean>) => {
      state.detailOpen = action.payload;
      state.listLimit = ROWS_PER_PAGE;
      if (!action.payload) state.selectedItemCode = null;
    },
    /** Show or leave the find-an-item screen. It is not a level, so it does
     *  not disturb whichever card is open underneath it. */
    openItemSearch: (state, action: PayloadAction<boolean>) => {
      state.searchOpen = action.payload;
      state.listLimit = ROWS_PER_PAGE;
      state.selectedItemCode = null;
      if (!action.payload) state.scannerOpen = false;
    },
    toggleItemPerfDay: (state, action: PayloadAction<string>) => {
      state.selectedDay =
        state.selectedDay === action.payload ? null : action.payload;
      state.listLimit = ROWS_PER_PAGE;
    },
    /**
     * Open a department or vendor where it sits, or close it.
     *
     * It expands rather than navigating: the figures that answer "is this one
     * worth opening" are the same ones the card shows, so making you leave the
     * list to see them meant leaving to find out you needn't have.
     */
    toggleItemPerfGroup: (
      state,
      action: PayloadAction<{ key: string; label: string }>,
    ) => {
      const same = state.openGroup?.key === action.payload.key;
      state.openGroup = same ? null : action.payload;
      state.detailOpen = false;
      state.selectedItemCode = null;
      // A day picked inside one department says nothing about the next.
      state.selectedDay = null;
      state.listLimit = ROWS_PER_PAGE;
    },
    setItemQuery: (state, action: PayloadAction<string>) => {
      state.itemQuery = action.payload;
      state.listLimit = ROWS_PER_PAGE;
    },
    setRecentsOpen: (state, action: PayloadAction<boolean>) => {
      state.recentsOpen = action.payload;
    },
    /** Switch location. Every drill belonged to the other one. */
    setItemPerfStoreNumber: (state, action: PayloadAction<string>) => {
      state.storeNumber = action.payload;
      state.openGroup = null;
      state.detailOpen = false;
      state.searchOpen = false;
      state.selectedDay = null;
      state.selectedItemCode = null;
      state.listLimit = ROWS_PER_PAGE;
    },
    /** Both sorts advance the same three-state cycle. */
    setItemPerfGroupSort: (state, action: PayloadAction<MarginSort>) => {
      state.groupSort = cycleSort(state.groupSort, action.payload);
      state.listLimit = ROWS_PER_PAGE;
    },
    setItemPerfItemSort: (state, action: PayloadAction<MarginSort>) => {
      state.itemSort = cycleSort(state.itemSort, action.payload);
      state.listLimit = ROWS_PER_PAGE;
    },
    setItemPerfInfoOpen: (state, action: PayloadAction<boolean>) => {
      state.infoOpen = action.payload;
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
    /** Back out of an item, to the list that opened it. Which list that is
     *  no longer needs recording: the screen it sits on is still on screen. */
    clearPerfItem: (state) => {
      state.listLimit = ROWS_PER_PAGE;
      state.selectedItemCode = null;
    },
    /**
     * Put one page away and bring another out.
     *
     * Called on mount, so arriving at a page restores exactly what it was left
     * looking at — its rows, its search, its open card and its sorts.
     */
    setItemPerfDimension: (state, action: PayloadAction<ItemDimension>) => {
      const next = action.payload;
      if (state.active === next) {
        // The first page to mount already matches `active`, so it never runs
        // the swap below — but it still has to claim its endpoint, because
        // setItemPerfRows drops any result whose source is not the current
        // one, and a null source matches nothing.
        state.source = sourceOf(next);
        return;
      }

      state.stash[state.active] = snapshotOf(state);
      const back = state.stash[next];
      Object.assign(state, back ?? snapshotOf(initialState));
      state.active = next;
      // The endpoint this page reads. The snapshot just assigned carries
      // whatever the previous occupant had, so it is set explicitly rather
      // than inherited.
      state.source = sourceOf(next);
      // Anything still in flight was the outgoing page's.
      state.loadGen += 1;

      if (back) return;

      /*
       * First visit. Sub Dept Margins and Vendors read the same endpoint and
       * differ only in how they group the rows, so if its sibling already has
       * this store's week in hand, group those rather than asking for an
       * identical copy. Categories reads a different endpoint and never
       * qualifies.
       */
      const want = sourceOf(next);
      const sibling = (Object.entries(state.stash) as [
        ItemDimension,
        ItemPerfSnapshot,
      ][]).find(
        ([d, snap]) =>
          d !== next &&
          sourceOf(d) === want &&
          snap.source === want &&
          snap.hasSearched &&
          snap.itemsTy.length > 0,
      );
      if (!sibling) return;
      for (const k of ROW_KEYS) {
        (state as Record<string, unknown>)[k] = sibling[1][k];
      }
      state.storeNumber = sibling[1].storeNumber;
    },
    // The counter survives a reset and moves on, so a load still in flight
    // from before it can't match the next load's number and land.
    resetItemPerf: (state) => ({
      ...initialState,
      loadGen: state.loadGen + 1,
      active: state.active,
    }),
  },
});

export const {
  setItemPerfLoading,
  beginItemPerfLoad,
  failItemPerfLoad,
  setItemPerfStoreNumber,
  setItemPerfGroupSort,
  setItemPerfItemSort,
  setItemPerfInfoOpen,
  setItemPerfHasSearched,
  setItemPerfStore,
  setItemPerfRows,
  openItemDetail,
  openItemSearch,
  toggleItemPerfDay,
  toggleItemPerfGroup,
  setItemQuery,
  setRecentsOpen,
  openScanner,
  closeScanner,
  scannedUpc,
  selectPerfItem,
  showMoreItems,
  setItemPerfDimension,
  clearPerfItem,
  resetItemPerf,
} = itemPerfSlice.actions;

export default itemPerfSlice.reducer;
