// Interfaces
import type { HelpPage } from "../../../../../constants/helpPages";
import type { ItemDimension, MarginSort } from "../../../../../features/dev/devItemPerfSlice";
import type { SortOption } from "../../../../../components-dev/mobile/MobileSortChips";
import type { CmpBasis } from "../../../../../utils/perfPairs";

/** How many recents sit in the page before the rest move to a sheet. */
export const RECENTS_INLINE = 3;

/** Which help page each grouping opens. One screen, three pages. */
export const HELP_PAGE: Record<ItemDimension, HelpPage> = {
  subdept: "sub-dept-margins",
  vendor: "vendors",
  category: "categories",
};

export const pct = (v: number | null) => (v === null ? "—" : `${v.toFixed(2)}%`);

export const fmtChange = (v: number) =>
  `${v > 0 ? "+" : v < 0 ? "\u2212" : ""}${Math.abs(v).toFixed(1)}%`;

export const sorts = (basis: CmpBasis): SortOption<MarginSort>[] => [
  { key: "sales", label: "Sales" },
  { key: "profit", label: "Profit" },
  { key: "gpm", label: "GPM" },
  { key: "change", label: `Change vs ${cmpShort(basis)}` },
];

/** What to call the comparison. A figure drawn from last week that says "LY"
 *  is worse than no label at all. */
export const cmpShort = (basis: CmpBasis) => (basis === "lw" ? "LW" : "LY");
export const cmpWord = (basis: CmpBasis) =>
  basis === "lw" ? "Last week" : "Last year";
