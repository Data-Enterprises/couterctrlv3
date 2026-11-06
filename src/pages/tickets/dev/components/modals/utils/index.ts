import type { RootState } from "../../../../../../store";
import type { SearchState } from "../../../../../../features/searchSlice";
import type { Store } from "../../../../../../interfaces";

/**
 * The store a page picked for itself, and the window it ran, when it has one.
 * A storeid of 0 means the page has a picker and nothing is picked yet.
 */
export type PageStore = { storeid: number; start?: string; end?: string };

/**
 * Pages with their own store picker.
 *
 * The shared search is what Sales and the pages built on it read, and it
 * outlives every page. These pages pick a store on their own card and never
 * write it there, so on them the shared search is whichever store was last
 * searched somewhere else. A ticket filed from Item Actions read
 * "002 - IGA IRVINGTON KY 2" in its header and ticked that store, because it
 * was the store open on Sales; the page was about a different one.
 *
 * Each entry reads the store the page is showing, from the page's own slice.
 * The window rides along where the page keeps one, so the record sent with
 * the ticket says what was run rather than what the shared search last held.
 *
 * Unlisted pages read the shared search, as before.
 */
const OWN_STORE: Record<string, (s: RootState) => PageStore> = {
  // What was run, once something has been; until then, the picker.
  "item-report": (s) =>
    s.dev.itemReport.scope ?? { storeid: s.dev.itemReport.storeId },
  "item-lookup": (s) => ({ storeid: s.dev.item.selectedStore }),
  categories: (s) => ({ storeid: s.dev.categories.storeid }),
  vendors: (s) => ({
    storeid: s.dev.vendors.storeid,
    start: s.dev.vendors.twStart || undefined,
    end: s.dev.vendors.twEnd || undefined,
  }),
  "sub-dept-margins": (s) => ({ storeid: s.dev.subMargin.searchValue }),
  "inventory-sub-department": (s) =>
    s.dev.priceOpt.subDept.window ?? { storeid: 0 },
  "inventory-vendor": (s) => s.dev.priceOpt.vendor.window ?? { storeid: 0 },
  receivers: (s) => ({ storeid: s.dev.receivers.storeid }),
};

/** The page's own store, or undefined for a page that reads the shared search. */
export const pageStoreOf = (
  state: RootState,
  href: string,
): PageStore | undefined => OWN_STORE[href]?.(state);

const NO_STORE: Store = {
  storeid: 0,
  store_number: "",
  store_name: "",
  company: 0,
  company_name: "",
};

/**
 * The search the ticket should describe.
 *
 * For a page with its own picker, a store search on that page's store, named
 * from the person's assigned stores (the only ones the picker offers). With
 * nothing picked it is a store search on no store, which names nothing and
 * ticks nothing: an empty line beats somebody else's store. Dates stay the
 * shared search's except where the page holds its own window.
 */
export const searchForPage = (
  shared: SearchState,
  own: PageStore | undefined,
  assignedStores: Store[],
): SearchState => {
  if (!own) return shared;
  const store =
    (own.storeid && assignedStores.find((s) => s.storeid === own.storeid)) ||
    NO_STORE;
  return {
    ...shared,
    type: "Store",
    selectedStore: store,
    lastStore: store.storeid,
    ...(own.start && own.end ? { startDate: own.start, endDate: own.end } : {}),
  };
};

/** The roster gets a search box past this many. A desk of three is a list
 *  somebody can read; a box above it is one more thing to look at. */
export const SEARCHABLE_FROM = 5;