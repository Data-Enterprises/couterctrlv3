// Utils
import { padStoreNumber } from "../../../../../utils/storeIdentity";
import { compileFilters, fmtDmy, LIST_FILTERS, filterValue } from "../../utils";

// Interfaces
import type { MarkdownFilters, MarkdownItem } from "../../../../../interfaces/markdowns";
import type { MarkdownAvailable, MarkdownFilterKey, MarkdownOption } from "../../interfaces";

/** The label a filter shows for one row's value. */
const labelOf = (r: MarkdownItem, key: MarkdownFilterKey, value: string): string => {
  switch (key) {
    // The number first: two locations can share a name, as Orders lists them.
    case "storeNumbers":
      return r.storename ? `${padStoreNumber(value)} — ${r.storename}` : padStoreNumber(value);
    case "dates":
      return fmtDmy(value);
    case "subIds":
      return r.sub_department_description ?? value;
    case "categories":
      return r.category_description ?? value;
    case "vendorIds":
      return r.vendor_name ? `${r.vendor_name} (${value})` : value;
    case "productCodes":
      return r.description ? `${value} — ${r.description}` : value;
    default:
      return value;
  }
};

/**
 * Every filter's choices, read off the rows that came back, so nothing offered
 * returns nothing. One pass over the rows for all eight lists.
 */
export const buildOptions = (rows: MarkdownItem[]): Record<MarkdownFilterKey, MarkdownOption[]> => {
  const seen = Object.fromEntries(LIST_FILTERS.map((k) => [k, new Map<string, string>()])) as Record<
    MarkdownFilterKey,
    Map<string, string>
  >;
  for (const r of rows)
    for (const key of LIST_FILTERS) {
      const v = filterValue(r, key);
      if (v !== null && v !== "" && !seen[key].has(v)) seen[key].set(v, labelOf(r, key, v));
    }
  const list = (key: MarkdownFilterKey, byValue = false) =>
    [...seen[key].entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) =>
        byValue ? b.value.localeCompare(a.value) : a.label.localeCompare(b.label),
      );
  return {
    types: list("types"),
    storeNumbers: list("storeNumbers"),
    // Newest first, as Orders lists its dates.
    dates: list("dates", true),
    subIds: list("subIds"),
    categories: list("categories"),
    vendorIds: list("vendorIds"),
    productCodes: list("productCodes"),
    userIds: list("userIds"),
  };
};

/**
 * Which choices in each filter still have a row behind them, given the other
 * filters. A filter's own picks are left out of its own test, or picking one
 * value would rule out every other.
 */
export const availableOptions = (rows: MarkdownItem[], f: MarkdownFilters): MarkdownAvailable => {
  const out = Object.fromEntries(LIST_FILTERS.map((k) => [k, new Set<string>()])) as MarkdownAvailable;
  const passes = compileFilters(f);
  for (const key of LIST_FILTERS) {
    const keep = passes(key);
    for (const r of rows) {
      if (!keep(r)) continue;
      const v = filterValue(r, key);
      if (v !== null) out[key].add(v);
    }
  }
  return out;
};

/** How many list filters have picks, plus the minimum percent when set. */
export const activeFilterCount = (f: MarkdownFilters) =>
  LIST_FILTERS.reduce((n, key) => n + (f[key].length > 0 ? 1 : 0), 0) +
  (f.minPercent === null ? 0 : 1);

/** Each filter's heading, list noun and "all" placeholder, in panel order. */
export const FILTER_FIELDS: { key: MarkdownFilterKey; label: string; noun: string; all: string }[] = [
  { key: "types", label: "Types", noun: "types", all: "All types" },
  { key: "storeNumbers", label: "Stores", noun: "stores", all: "All stores" },
  { key: "dates", label: "Dates", noun: "dates", all: "All dates" },
  { key: "subIds", label: "Sub departments", noun: "departments", all: "All sub departments" },
  { key: "categories", label: "Categories", noun: "categories", all: "All categories" },
  { key: "vendorIds", label: "Vendors", noun: "vendors", all: "All vendors" },
  { key: "productCodes", label: "Items", noun: "items", all: "All items" },
  { key: "userIds", label: "Users", noun: "users", all: "All users" },
];
