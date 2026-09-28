import type { SearchState } from "../../../features/searchSlice";
import { weekEnding } from "../../../utils/dates";

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
 * Which dates a page actually means.
 *
 * The search slice always carries all three — a start, an end and a single
 * date — and a page reads whichever one matches the shape of its data. Sales
 * is a week: it takes `singleDate` as the week's last day and works back
 * seven, and its startDate and endDate say nothing about what is on screen.
 * Printing those two on a Sales ticket is printing a range nobody searched.
 *
 * `SearchCard` has always taken this as a prop from the page, because the
 * page is what knows. This map is the same answer for pages that are not
 * rendering a search card at the moment somebody reports a problem.
 *
 * Unlisted means a plain start-to-end range, which is the common case.
 */
type DateShape = "range" | "single" | "week" | "none";

const PAGE_DATES: Record<string, DateShape> = {
  sales: "week",
  "sales-tracker": "week",
  categories: "week",
  vendors: "week",
  "sub-dept-margins": "week",
  "coupon-sales": "week",
  "loss-prevention": "single",
  "lp-actions": "single",
  forecasting: "single",
  "item-report": "single",
  cashiers: "single",
  // Nothing on these is scoped to a date the user picked.
  admin: "none",
  "user-management": "none",
  groups: "none",
  tickets: "none",
  quicksight: "none",
};

const datesFor = (search: SearchState, shape: DateShape): string => {
  if (shape === "none") return "";
  if (shape === "single") return search.singleDate ?? "";
  if (shape === "week") {
    if (!search.singleDate) return "";
    const { start, end } = weekEnding(search.singleDate);
    return `week of ${start} – ${end}`;
  }
  if (!search.startDate || !search.endDate) return search.singleDate ?? "";
  return search.startDate === search.endDate
    ? search.startDate
    : `${search.startDate} – ${search.endDate}`;
};

/**
 * What they had asked for, in one line.
 *
 * Shown rather than asked about: "is this about your last search?" makes
 * somebody remember, and a line naming the store and the dates lets them
 * check. Returns null when nothing has been searched, so the offer does not
 * appear with nothing behind it.
 */
export const searchSummary = (
  search: SearchState,
  href: string,
): string | null => {
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

  const when = datesFor(search, PAGE_DATES[href] ?? "range");
  return when ? `${where} · ${when}` : where;
};

/**
 * TODO — the second half of the evidence: what the page ENDED UP with.
 *
 * The attached response is the last HTTP call, and for a paged endpoint that
 * is the last page rather than the set. `fetchAllPages` walks the rest and
 * assembles the result in JavaScript, so no interceptor ever sees the whole
 * thing — Sales, Sub Dept Margins, Loss Prevention, Receivers, Categories and
 * Suggested all page, which is most of the screens a data problem turns up
 * on.
 *
 * The assembled set is in Redux, and the dev slices are already keyed
 * (store/devReducers.ts), so the map is a sibling of PAGE_CATEGORY above:
 *
 *   "sub-dept-margins" -> subMargin      "upc-upload"  -> upcDev
 *   "loss-prevention"  -> lossPrevention  "item-lookup" -> item
 *
 * Both are worth sending, because they answer different questions: the slice
 * is what the page ended up showing, the raw call is what the server actually
 * said, and when the transform is the bug the slice shows only the symptom.
 *
 * Three things to settle when this is picked up:
 *   - a page can have two slices (Sub Dept Margins is subMargin on desktop
 *     and itemPerf on mobile)
 *   - a whole slice carries more than the page's own data — tickets holds
 *     every company's queue for a tech, users and organization hold people
 *   - size: a slice is bigger than one response, so this probably wants
 *     named keys per page rather than the whole thing
 */

/** The title a page-filed ticket opens with, so it is never blank. */
export const suggestedTitle = (origin: TicketOrigin) =>
  origin.page ? `Issue on ${origin.page}` : "";
