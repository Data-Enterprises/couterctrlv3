import type { SearchState } from "../../../features/searchSlice";

/**
 * Where a ticket is being filed from, and what the page was showing.
 *
 * A client on a page hits a problem. Everything needed to open the ticket for
 * them is already on hand — the nav knows which page they are on and which
 * area it belongs to, and the shared search slice knows what they had asked
 * for. Neither needs a call.
 */

/**
 * Page to ticket category, by the nav's own href.
 *
 * The thirteen categories are product areas and most of them name a page
 * outright. Where they do not, the entry is absent and the category is left
 * unset — the backend's own advice, and better than guessing: a ticket filed
 * under the wrong area is worse than one filed under none, because the wrong
 * one looks deliberate.
 *
 * Deliberately unmapped, with nothing to map them to: admin, cashiers,
 * categories, coupons, coupon-sales, orders, groups, user-management,
 * vendors. And three categories have no page — Chat, Teams and Tickets
 * itself.
 */
const PAGE_CATEGORY: Record<string, string> = {
  sales: "Sales",
  "sales-tracker": "Sales",
  "sales-export": "Sales",
  "loss-prevention": "Loss Prevention",
  "lp-actions": "Loss Prevention",
  "upc-upload": "UPC List",
  "item-lookup": "Item Lookup",
  "item-report": "Item Lookup",
  forecasting: "Forecasting",
  receivers: "Receivers",
  "sub-dept-margins": "Margins",
  quicksight: "Analyses",
  tickets: "Tickets",
};

export interface TicketOrigin {
  /** The page's own name, as the nav calls it. */
  page: string | null;
  /** The nav section it sits under — Performance, Analytics, Data, Config. */
  area: string | null;
  /** The matching ticket category's name, or null where there is no honest
   *  match. Resolved to an id against the lookups at the point of use. */
  category: string | null;
  href: string;
}

/**
 * What the title bar handed over, as somewhere a ticket can come from.
 *
 * The page's name and its area arrive rather than being looked up: the nav
 * holds that map, the nav lives in the prod tree, and this is the dev one.
 * Passing the two words it already computed for its own highlight is cheaper
 * than a second copy of the table here, and a second copy is what would
 * quietly stop matching.
 */
export const originOf = (from: {
  reportFrom: string;
  page?: string | null;
  area?: string | null;
}): TicketOrigin => {
  const href = from.reportFrom.replace(/^\/+/, "").split("/")[0] ?? "";
  return {
    page: from.page ?? null,
    area: from.area ?? null,
    category: PAGE_CATEGORY[href] ?? null,
    href,
  };
};

/**
 * What they had asked for, in one line.
 *
 * Shown rather than asked about: "is this about your last search?" makes
 * somebody remember, and a line naming the store and the dates lets them
 * check. Returns null when nothing has been searched, so the offer does not
 * appear with nothing behind it.
 */
export const searchSummary = (search: SearchState): string | null => {
  const where =
    search.type === "Store"
      ? search.selectedStore?.store_name
        ? `${search.selectedStore.store_name}${
            search.selectedStore.store_number
              ? ` ${search.selectedStore.store_number}`
              : ""
          }`
        : null
      : (search.selectedGroup?.group_name ?? null);
  if (!where) return null;

  const when =
    search.startDate && search.endDate
      ? search.startDate === search.endDate
        ? search.startDate
        : `${search.startDate} – ${search.endDate}`
      : (search.singleDate ?? "");

  return when ? `${where} · ${when}` : where;
};

/** The title a page-filed ticket opens with, so it is never blank. */
export const suggestedTitle = (origin: TicketOrigin) =>
  origin.page ? `Issue on ${origin.page}` : "";
