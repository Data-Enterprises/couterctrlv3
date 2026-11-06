// Interfaces
import type { RootState } from "../../../../../../store";
import type { SearchState } from "../../../../../../features/searchSlice";
import type { Store } from "../../../../../../interfaces";
import type { PageStore } from "../interfaces";

/**
 * Pages with their own store picker. These never write the shared search, so
 * for them it holds some other page's store. Unlisted pages read it.
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
 * The search the ticket should describe: on a page with its own picker, that
 * page's store (or none) and, where it holds one, its own date window.
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