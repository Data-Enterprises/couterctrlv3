// Utils
import { isGroupSearch, type SEARCH_TYPE } from "../../../../../../features/searchSlice";
import { shiftIso } from "../../../../../../utils/grading";
import { formatGoliathDate, sameWeekDayLastYear } from "../../../../../../utils";

// Interfaces
import type { PairSort, PerfPair } from "./perfData";
import type {
  DetailTab,
  SortOption,
} from "../../../../../../components-dev/mobile/interfaces";

/** What each drill can sort by. Hours adds the time of day, which is also its
 *  default — a day reads as a timeline first.
 *
 *  No sort by name. These lists are read for where the money went, and
 *  alphabetical order answers a question nobody brought to a Performance
 *  page; `PairSort` keeps the "name" case because the store list still sorts
 *  by store number, which is an identifier rather than a name. */
/** Both comparisons can order a list, since both are drawn on every row. */
export const changeSorts: SortOption<PairSort>[] = [
  { key: "change", label: "Change vs LY" },
  { key: "changeLw", label: "Change vs LW" },
];

/** The sub department list's sort chips; the size sort is named for what is
 *  measured ("Sales" or "Units"). */
export const subSorts = (size: string): SortOption<PairSort>[] => [
  { key: "sales", label: size },
  ...changeSorts,
];

/** The hourly list's sort chips. */
export const hourSorts = (size: string): SortOption<PairSort>[] => [
  { key: "time", label: "Time" },
  { key: "sales", label: size },
  ...changeSorts,
];

/** The item list's sort chips: the same as a sub department's. */
export const itemSorts = subSorts;

/** The scale every row in one drill shares. 1 floors it so an all-zero list
 *  divides by something. */
export const scaleOf = (pairs: PerfPair[]) =>
  Math.max(
    ...pairs.map((p) =>
      Math.max(p.ty, p.noLy ? 0 : p.ly, p.noLw ? 0 : (p.lw ?? 0)),
    ),
    1,
  );

/** Darkest to lightest, so the stack and the legend agree. */
export const COUPON_KEYS = ["digital", "elecStore", "elecInstore", "store"] as const;

/** The store list's sort chips. Both comparisons can order the list, since
 *  both are drawn on every card. */
export const storeSorts = (size: string): SortOption<PairSort>[] => [
  { key: "sales", label: size },
  ...changeSorts,
  { key: "name", label: "Store #" },
];

/** Two breakdowns under a store. Items are not one of them — they live
 *  inside a sub department, and a tab for them showed the department list a
 *  second time under a name that promised item rows. */
export const DETAIL_TABS: DetailTab<"subs" | "hours">[] = [
  { key: "subs", label: "Sub Depts" },
  { key: "hours", label: "Hours" },
];

/** Stores sort on their number, taken from the key — the label is whatever
 *  name the user knows the store by, which needn't start with it. */
export const storeNumberOf = (p: { key: string; label: string }) =>
  p.key.split("__")[1] ?? p.label;

/** What a search asks the endpoints for: one store, or a group. */
export const perfScopeOf = (s: { type: SEARCH_TYPE; lastStore: number; lastGroup: number }) => {
  const isStore = !isGroupSearch(s.type);
  return {
    isStore,
    useGroups: isStore ? 0 : 1,
    searchValue: isStore ? s.lastStore : s.lastGroup,
    singleStore: isStore ? 1 : 0,
  };
};

/**
 * The week ending on a search date (MM/DD/YYYY), its day-matched days last
 * year, and the week before. Every day is shifted rather than only the two
 * endpoints: an endpoint on a fixed-date holiday snaps to the holiday while the
 * other keeps a weekday shift, and the range stops lining up with the per-day
 * lookups.
 */
export const perfWeekOf = (singleDate: string) => {
  const twEnd = formatGoliathDate(singleDate);
  const twStart = shiftIso(twEnd, -6);
  const lyDates = Array.from({ length: 7 }, (_, i) =>
    sameWeekDayLastYear(shiftIso(twStart, i)).date,
  ).sort();
  // Last week is fetched beside last year and used where last year is empty.
  const lwStart = shiftIso(twStart, -7);
  const lwEnd = shiftIso(twEnd, -7);
  return { twStart, twEnd, lyDates, lwStart, lwEnd };
};
