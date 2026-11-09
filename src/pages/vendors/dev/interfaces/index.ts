// Interfaces
import type { ItemMarginRow } from "../../../../utils/itemMargins";

/** Where the Vendors fetches go: one store. */
export interface VendorScope {
  url: string;
  token: string;
  storeid: number;
}

export interface PeriodRange {
  start: string;
  end: string;
}

export type GradedSev = "critical" | "watch" | "healthy";

/** One graded item, with the vendor and department it came from. The full
 *  export and the UPC-only export share this so the two can never disagree
 *  about which items are in scope — the second is the first with the columns
 *  taken away. */
export interface GradedItem {
  vendorId: string;
  vendorName: string;
  dept: string;
  r: ItemMarginRow;
  sev: GradedSev;
}

/** Sortable columns. With none active the list keeps its own worst-grade
 *  -first order, which is the point of a Performance page — see
 *  useTriStateSort. */
export type ListSortCol = "ty" | "lw" | "ly";
