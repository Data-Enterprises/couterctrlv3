// Utils
import { weekEnding } from "../../../../../../utils/dates";
import { formatDateSimple } from "../../../../../../utils";

// Interfaces
import type { SearchState } from "../../../../../../features/searchSlice";
import type { DateShape, PickedStore, TicketOrigin } from "../interfaces";


/**
 * Page to ticket category, by the nav's href: one category per family of
 * pages. Only the help desk itself and Home name none.
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
 * What the title bar handed over, as somewhere a ticket can come from. The
 * page name and area are passed in, because the nav that maps them is prod-tree.
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
 * Which dates a page actually means. The search slice carries a range and a
 * single date; Sales, for one, is the week ending on `singleDate`.
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
 * Pages the store and group search does not scope. The slice holds the
 * session's last store, which would otherwise print as the ticket's store.
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
 * One date as mm/dd/yyyy, from either shape that reaches it: the slice's
 * m/d/yyyy or `weekEnding`'s yyyy-mm-dd.
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
 * What they had asked for, in one line, or null when nothing was searched.
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
 * The scope the ticket was filed under, as a record rather than a sentence.
 * Store number and id ride along, since two locations can share a storeid.
 */

export const scopeOf = (
  search: SearchState,
  origin: TicketOrigin,
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
                // Kept inside the group, and absent (not empty) when they did
                // not narrow it: empty would read as "no stores".
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
 * The same scope as a sentence, for the foot of the first message: name,
 * number and id, so anyone can look the store up.
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
