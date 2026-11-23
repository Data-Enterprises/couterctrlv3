// Interfaces
import type { ExportSubDeptItem } from "../../../../../../features/dev/devSalesLedgerSlice";
import type { Severity, SevFilter } from "../../../../../../utils/severity";

/** One sub department in the left list: this week, last week, last year. */
export type DeptRow = {
  id: number;
  desc: string;
  tw: number;
  lw: number;
  ly: number;
  hasLW: boolean;
  hasLY: boolean;
  vsLWPct: number;
  vsLYPct: number;
  vsLWQtyPct: number;
  vsLYQtyPct: number;
  qty: number;
  lwQty: number;
  lyQty: number;
  digital: number;
  lyDigital: number;
  elecInstore: number;
  lyElecInstore: number;
  elecStore: number;
  lyElecStore: number;
  storeCpn: number;
  lyStoreCpn: number;
};

export type DeptSortColumn = "dept" | "ty" | "vsLW" | "vsLY";
export type DeptSortState = {
  column: DeptSortColumn;
  direction: "desc" | "asc";
} | null;

export type ItemSortColumn = "ty" | "lw" | "ly";
export type ItemSortState = {
  column: ItemSortColumn;
  direction: "desc" | "asc";
} | null;

/** An item with its grade, as the list draws it and the export takes it. */
export type GradedItem = ExportSubDeptItem;

/** The insight line under the open sub department's name. */
export type DeptCta = { text: string; severity: Severity | null };

/** The filters that make up a list of items: a grade, a search and the active
 *  picker ("" = active and inactive together). */
export type ListFilter = { sev: SevFilter; text: string; active: string };

/** The two compared lists: A is the one pinned, B the filters showing now. */
export type Side = "A" | "B";

/** Where a right-click opened the UPC menu, and on which item ("" = none). */
export type ItemMenu = { x: number; y: number; upc: string } | null;
