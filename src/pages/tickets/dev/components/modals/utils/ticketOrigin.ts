// Utils
import { weekEnding } from "../../../../../../utils/dates";
import { formatDateSimple } from "../../../../../../utils";

// Interfaces
import type { SearchState } from "../../../../../../features/searchSlice";
import type { DateShape, PickedStore, TicketOrigin } from "../interfaces";

/**
 * Page to ticket category, by the nav's own href.
 *
 * One category per family of pages in the nav, so every page has an answer
 * (decided 29 Oct 2026). Sub Dept Margins, Categories and Vendors are one
 * screen and one category; Orders, Receivers and AWG Invoices are the
 * receiving side; User Management, Groups, Admin and Settings are all who can
 * see what. Only the help desk itself (`tickets`) and Home name no category:
 * a ticket filed from there is about nothing in particular.
 */
export const PAGE_CATEGORY: Record<string, string> = {
  sales: "Sales",
  "sales-tracker": "Sales",
  // Its own since it reads orders, invoices and markdowns too (2 Nov 2026).
  "data-export": "Export",
  "sub-dept-margins": "Margins",
  categories: "Margins",
  vendors: "Margins",
  "coupon-sales": "Coupons",
  coupons: "Coupons",
  "loss-prevention": "Loss Prevention",
  "lp-actions": "Loss Prevention",
  cashiers: "Cashiers",
  "item-lookup": "Item Lookup",
  "item-report": "Item Lookup",
  "upc-upload": "UPC List",
  "upc-scanner": "UPC List",
  forecasting: "Forecasting",
  orders: "Orders & Receiving",
  receivers: "Orders & Receiving",
  invoices: "Orders & Receiving",
  "inventory-sub-department": "Price Optimization",
  "inventory-vendor": "Price Optimization",
  "user-management": "Users & Access",
  groups: "Users & Access",
  admin: "Users & Access",
  settings: "Users & Access",
  quicksight: "Analyses",
};

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
 */
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
 * The panel showed the store and the dates and then sent neither — a tech
 * opened "Issue on Sales" with no idea which store it was about. For a
 * miscalculation that is the whole question, and the name on its own does not
 * answer it: two stores share a storeid when they are two locations of one
 * business, and a number is how you tell 369 from 370.
 */

export const scopeOf = (
  search: SearchState,
  origin: TicketOrigin,
  stores: PickedStore[] = [],
): Record<string, unknown> =>
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

/** The title a page-filed ticket opens with, so it is never blank. */
export const suggestedTitle = (origin: TicketOrigin) =>
  origin.page ? `Issue on ${origin.page}` : "";
