import type { SearchState } from "../../../features/searchSlice";
import { weekEnding } from "../../../utils/dates";
import { formatDateSimple } from "../../../utils";

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

/**
 * Pages the store and group search does not scope at all.
 *
 * The search slice outlives every page: it holds whatever store was last
 * searched anywhere in the session. A ticket filed from one of these pages
 * printed that store as if the problem were about it — Erica's ticket from
 * User Management read "GROCERY BASKET · #1 · storeid 805" while she and
 * Wayne were working on a B&T user, because Grocery Basket was the last store
 * she had searched on another page.
 *
 * The same pages the dates already leave out, plus Settings: nothing on them
 * is about a store somebody picked.
 */
const NO_SEARCH = new Set([
  "admin",
  "user-management",
  "groups",
  "tickets",
  "quicksight",
  "settings",
]);

/** Whether the page reads the store or group search at all. */
export const pageUsesSearch = (href: string) => !NO_SEARCH.has(href);

/**
 * One date, as mm/dd/yyyy, whichever way it arrives.
 *
 * Two shapes reach this. The search slice stores what `formatDate` produced,
 * which is already m/d/yyyy and unpadded; `weekEnding` returns what
 * `setDates` produced, which is yyyy-mm-dd because the endpoints want it that
 * way. Running the ISO formatter over an already-formatted date is what
 * printed "undefined/undefined/9/27/2026" — it split on "-", found no parts,
 * and pasted the undefineds in front.
 *
 * Splitting rather than parsing throughout: handing either shape to
 * `new Date` invites the midnight-UTC shift that lands a date a day early
 * west of Greenwich.
 */
const day = (value: string) => {
  if (!value) return "";
  const pad = (n: string) => n.padStart(2, "0");
  if (value.includes("-")) {
    const [y, m, d] = formatDateSimple(value).split("/");
    return y && m && d ? `${y}/${m}/${d}` : value;
  }
  const [m, d, y] = value.split("/");
  return m && d && y ? `${pad(m)}/${pad(d)}/${y}` : value;
};

const datesFor = (search: SearchState, shape: DateShape): string => {
  if (shape === "none") return "";
  if (shape === "single") return day(search.singleDate ?? "");
  if (shape === "week") {
    if (!search.singleDate) return "";
    const { start, end } = weekEnding(search.singleDate);
    return `week of ${day(start)} – ${day(end)}`;
  }
  if (!search.startDate || !search.endDate) return day(search.singleDate ?? "");
  return search.startDate === search.endDate
    ? day(search.startDate)
    : `${day(search.startDate)} – ${day(search.endDate)}`;
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
  if (!pageUsesSearch(href)) return null;
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
 * The attachments are raw responses, grouped per endpoint. Capturing every
 * call on the page covers paged endpoints as a side effect — `fetchAllPages`
 * asks for each page over axios, so each page is captured and they group back
 * together. What is still missing is the ASSEMBLED result: that object is
 * built in JavaScript and never crosses the wire, and neither does anything
 * the page computed from it.
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

/**
 * The scope the ticket was filed under, as a record rather than a sentence.
 *
 * The panel showed the store and the dates and then sent neither — a tech
 * opened "Issue on Sales" with no idea which store it was about. For a
 * miscalculation that is the whole question, and the name on its own does not
 * answer it: two stores share a storeid when they are two locations of one
 * business, and a number is how you tell 369 from 370.
 *
 * Both halves go on the ticket. The line reads in the thread, where the tech
 * is already looking; the record rides along as a file, because storeid and
 * company are what a query needs and nobody wants them in prose.
 */
export type PickedStore = {
  storeid: number;
  store_number: string;
  store_name: string;
};

export const scopeOf = (
  search: SearchState,
  origin: TicketOrigin,
  /** For a group search, the stores inside it the client is actually looking
   *  at. Empty means the whole group, which is what the search was. */
  stores: PickedStore[] = [],
): Record<string, unknown> =>
  // A page with no search behind it has nothing to scope: no store, no
  // group, no dates. The session's last search is about some other page.
  !pageUsesSearch(origin.href)
    ? { page: origin.page ?? origin.href, area: origin.area, search_type: null }
    : {
        page: origin.page ?? origin.href,
        area: origin.area,
        search_type: search.type,
        ...(search.type === "Store"
          ? {
              store: {
                storeid: search.selectedStore?.storeid ?? null,
                store_number: search.selectedStore?.store_number ?? null,
                store_name: search.selectedStore?.store_name ?? null,
                company: search.selectedStore?.company ?? null,
                company_name: search.selectedStore?.company_name ?? null,
              },
            }
          : {
              group: {
                id: search.selectedGroup?.id ?? null,
                group_name: search.selectedGroup?.group_name ?? null,
                is_shared: search.selectedGroup?.is_shared ?? null,
                // Inside the group rather than beside it — these are a narrowing of
                // it, and one self-contained key beats a second top-level shape
                // that only exists sometimes. Absent rather than empty when they
                // did not narrow: present and empty reads as "no stores", which is
                // the opposite of "the whole group".
                ...(stores.length ? { stores } : {}),
              },
            }),
        dates: {
          shape: PAGE_DATES[origin.href] ?? "range",
          start_date: search.startDate,
          end_date: search.endDate,
          single_date: search.singleDate,
        },
      };

/**
 * The same thing in a sentence, for the foot of the first message.
 *
 * Carries the store number and the id as well as the name: the name is how
 * somebody says which store, and the other two are how anybody looks it up.
 */
export const scopeLine = (
  search: SearchState,
  origin: TicketOrigin,
  stores: PickedStore[] = [],
): string => {
  if (!pageUsesSearch(origin.href)) return origin.page ?? origin.href;
  const where =
    search.type === "Store"
      ? [
          search.selectedStore?.store_name,
          search.selectedStore?.store_number
            ? `#${search.selectedStore.store_number}`
            : null,
          search.selectedStore?.storeid
            ? `storeid ${search.selectedStore.storeid}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : [
          search.selectedGroup?.group_name,
          search.selectedGroup?.id ? `group ${search.selectedGroup.id}` : null,
          stores.length
            ? `seen on ${stores
                .map(
                  (s) =>
                    `${s.store_name} #${s.store_number} (storeid ${s.storeid})`,
                )
                .join(", ")}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ");

  const when = datesFor(search, PAGE_DATES[origin.href] ?? "range");
  return [origin.page ?? origin.href, where, when].filter(Boolean).join(" · ");
};

/**
 * The same two, for a ticket filed from the help desk itself.
 *
 * No page and no search behind it, so there is a store and nothing else —
 * whichever one they picked out of their own assigned list. Kept beside
 * `scopeOf` so both shapes of ticket describe a store the same way and a tech
 * does not have to learn two.
 */
export const storeScope = (store: {
  storeid: number;
  store_number: string;
  store_name: string;
  company: number;
  company_name: string;
}): Record<string, unknown> => ({
  page: null,
  area: null,
  search_type: "Store",
  store: {
    storeid: store.storeid,
    store_number: store.store_number,
    store_name: store.store_name,
    company: store.company,
    company_name: store.company_name,
  },
});

export const storeLine = (store: {
  storeid: number;
  store_number: string;
  store_name: string;
}): string =>
  [
    store.store_name,
    store.store_number ? `#${store.store_number}` : null,
    store.storeid ? `storeid ${store.storeid}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

/** The title a page-filed ticket opens with, so it is never blank. */
export const suggestedTitle = (origin: TicketOrigin) =>
  origin.page ? `Issue on ${origin.page}` : "";
