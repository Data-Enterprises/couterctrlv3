// Utils
import { cmpShort } from "./perfData";

// Interfaces
import type { CmpBasis, PairSort, PerfPair } from "./perfData";
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
export const subSorts = (basis: CmpBasis): SortOption<PairSort>[] => [
  { key: "sales", label: "Sales" },
  { key: "change", label: `Change vs ${cmpShort(basis)}` },
];

/** The hourly list's sort chips, the change chip naming the basis. */
export const hourSorts = (basis: CmpBasis): SortOption<PairSort>[] => [
  { key: "time", label: "Time" },
  { key: "sales", label: "Sales" },
  { key: "change", label: `Change vs ${cmpShort(basis)}` },
];

/** The item list's sort chips, the change chip naming the basis. */
export const itemSorts = (basis: CmpBasis): SortOption<PairSort>[] => [
  { key: "sales", label: "Sales" },
  { key: "change", label: `Change vs ${cmpShort(basis)}` },
];

/** The scale every row in one drill shares. 1 floors it so an all-zero list
 *  divides by something. */
export const scaleOf = (pairs: PerfPair[]) =>
  Math.max(...pairs.map((p) => Math.max(p.ty, p.noLy ? 0 : p.ly)), 1);

/** Darkest to lightest, so the stack and the legend agree. */
export const COUPON_KEYS = ["digital", "elecStore", "elecInstore", "store"] as const;

/** The store list's sort chips, the change chip naming the basis. */
export const storeSorts = (basis: CmpBasis): SortOption<PairSort>[] => [
  { key: "sales", label: "Sales" },
  { key: "change", label: `Change vs ${cmpShort(basis)}` },
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
