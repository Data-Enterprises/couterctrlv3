// Utils
import { foldDepartmentRings } from "../../../utils/departmentRings";
import { priceRows } from "./itemPerfData";

// Interfaces
import type { HelpPage } from "../../../constants/helpPages";
import type {
  ItemDimension,
  ItemRow,
  MarginSort,
} from "../../../features/dev/devItemPerfSlice";
import type { CmpBasis } from "../../../utils/perfPairs";
import type { SortOption } from "../../mobile/interfaces";

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

/** Units are whole numbers on screen; a weighed item's fraction of a pound is
 *  noise at the size of a bar label. */
export const fmtUnits = (n: number) => Math.round(n).toLocaleString("en-US");

/**
 * One period's rows, ready for every builder: one location, and priced.
 *
 * The department's own sales (rung on the department key, no UPC) fold into
 * one labelled row first, so the lists show one item for them rather than a
 * "0", a blank and a "Refunded", each named after the department. See
 * foldDepartmentRings.
 */
export const prepared = (rows: ItemRow[], storeNumber: string | null) =>
  priceRows(
    foldDepartmentRings(
      storeNumber ? rows.filter((r) => r.store_number === storeNumber) : rows,
    ),
  );

/** The size sort is named for what the bars measure; both comparisons can
 *  order a list, since both are drawn on every row. */
export const sorts = (size: string): SortOption<MarginSort>[] => [
  { key: "sales", label: size },
  { key: "profit", label: "Profit" },
  { key: "gpm", label: "GPM" },
  { key: "change", label: "Change vs LY" },
  { key: "changeLw", label: "Change vs LW" },
];

/** What the day chart's second column is. A column drawn from last week that
 *  says "Last year" is worse than no label at all. */
export const cmpWord = (basis: CmpBasis) =>
  basis === "lw" ? "Last week" : "Last year";
