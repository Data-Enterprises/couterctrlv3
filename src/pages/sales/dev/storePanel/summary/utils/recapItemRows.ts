// Utils
import { NO_VENDOR } from "./recapItems";

// Interfaces
import type { DayItemsState, RecapItem, RecapItemRow, RecapVendorPart } from "../interfaces/index";
import type { MultiSelectOption } from "../../../../../../components-dev/filters/interfaces";

/** Where a period's items are: every day's in hand, or why not. */
export type PeriodItems =
  | { status: "loading" }
  | { status: "error"; dates: string[] }
  | { status: "ready"; days: RecapItem[][] };

/**
 * A period's days of items as one answer, the way combineMix treats the mix:
 * ready only when every day is, so a week missing a day never passes for the
 * whole. A day that failed names itself; one still out keeps it loading.
 */
export const periodItems = (dates: string[], states: DayItemsState[]): PeriodItems => {
  const failed = dates.filter((_, i) => states[i]?.status === "error");
  if (failed.length) return { status: "error", dates: failed };
  const days: RecapItem[][] = [];
  for (const s of states) {
    if (s.status !== "ready") return { status: "loading" };
    days.push(s.items);
  }
  return { status: "ready", days };
};

/** An item's vendor parts. A day kept before vendors were recorded has none:
 *  it reads as one part under NO_VENDOR rather than vanishing from a filter. */
const partsOf = (item: RecapItem): RecapVendorPart[] =>
  item.vendors?.length
    ? item.vendors
    : [{ vendor: NO_VENDOR, units: item.units, pounds: item.pounds, net: item.net }];

/**
 * The period's items, one row each, under a vendor filter.
 *
 * Every day's rows for an item are added together on its code, so All week
 * lists an item once however many days it sold, and the unfiltered count is
 * the Baskets card's Items figure. With vendors ticked, an item counts only
 * those vendors' share of it, and an item none of them sold drops out: the
 * totals then add up to what those vendors sold.
 *
 * The name and sub dept come from the day that took the most money, as each
 * day's own fold takes them from its biggest row.
 */
export const mergeItems = (days: RecapItem[][], vendors: string[]): RecapItemRow[] => {
  const only = vendors.length ? new Set(vendors) : null;
  const byCode = new Map<
    string,
    { row: RecapItemRow; topNet: number; byVendor: Map<string, number> }
  >();
  for (const items of days) {
    for (const item of items) {
      const parts = partsOf(item).filter((p) => !only || only.has(p.vendor));
      if (!parts.length) continue;
      const held = byCode.get(item.code) ?? {
        row: {
          code: item.code,
          name: item.name,
          subDeptName: item.subDeptName,
          vendors: [],
          units: 0,
          pounds: 0,
          net: 0,
        },
        topNet: -Infinity,
        byVendor: new Map<string, number>(),
      };
      for (const p of parts) {
        held.row.units += p.units;
        held.row.pounds += p.pounds;
        held.row.net += p.net;
        held.byVendor.set(p.vendor, (held.byVendor.get(p.vendor) ?? 0) + p.net);
      }
      if (item.net > held.topNet) {
        held.row.name = item.name;
        held.row.subDeptName = item.subDeptName;
        held.topNet = item.net;
      }
      byCode.set(item.code, held);
    }
  }
  return [...byCode.values()].map(({ row, byVendor }) => ({
    ...row,
    vendors: [...byVendor.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v),
  }));
};

/** The rows left by the sub dept filter and the search (name or UPC). */
export const filterItemRows = (rows: RecapItemRow[], subDepts: string[], search: string) => {
  const depts = subDepts.length ? new Set(subDepts) : null;
  const q = search.trim().toLowerCase();
  return rows.filter(
    (r) =>
      (!depts || depts.has(r.subDeptName)) &&
      (!q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)),
  );
};

/** What the totals row says: the whole filtered list, not the page. */
export const itemTotals = (rows: RecapItemRow[]) => ({
  items: rows.length,
  units: rows.reduce((t, r) => t + r.units, 0),
  pounds: rows.reduce((t, r) => t + r.pounds, 0),
  net: rows.reduce((t, r) => t + r.net, 0),
});

const byLabel = (a: MultiSelectOption, b: MultiSelectOption) => a.label.localeCompare(b.label);

/**
 * The Sub depts filter's options: every sub dept the period sold, each marked
 * unavailable when the vendors ticked sold nothing in it, so the list only
 * offers picks that return rows.
 */
export const subDeptOptions = (
  all: RecapItemRow[],
  underVendors: RecapItemRow[],
): MultiSelectOption[] => {
  const live = new Set(underVendors.map((r) => r.subDeptName));
  return [...new Set(all.map((r) => r.subDeptName))]
    .map((name) => ({ label: name, value: name, unavailable: !live.has(name) }))
    .sort(byLabel);
};

/**
 * The Vendors filter's options: every vendor the period's items came from,
 * each marked unavailable when it sold nothing in the sub depts ticked.
 */
export const vendorOptions = (all: RecapItemRow[], subDepts: string[]): MultiSelectOption[] => {
  const depts = subDepts.length ? new Set(subDepts) : null;
  const live = new Set<string>();
  const every = new Set<string>();
  for (const r of all) {
    for (const v of r.vendors) {
      every.add(v);
      if (!depts || depts.has(r.subDeptName)) live.add(v);
    }
  }
  return [...every]
    .map((v) => ({ label: v, value: v, unavailable: !live.has(v) }))
    .sort(byLabel);
};
