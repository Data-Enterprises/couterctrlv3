// Interfaces
import type { SubDeptMargin } from "../../../../interfaces";

export interface InventoryScope {
  url: string;
  token: string;
  storeid: number;
  /** yyyy-mm-dd. */
  start: string;
  end: string;
}

export interface SubDeptSummary {
  id: number;
  description: string;
  sales: number;
  /** Items can't be counted until the department is opened — `subs/sub_sales`
   *  aggregates above the item line. Null means "not loaded yet", which is why
   *  the row shows nothing rather than a misleading zero. */
  itemCount: number | null;
}

/** One UPC inside a department, rolled up from its daily rows. */
export interface ProductSummary {
  productCode: string;
  description: string;
  sales: number;
  qty: number;
  /** Priced units — pounds on a scale item, else identical to qty. Kept apart
   *  from `qty` because a scale item's qty counts rings, not what was sold. */
  units: number;
  /** The daily rows behind it. Estimated Price Points is computed from these
   *  with no further fetching. */
  rows: SubDeptMargin[];
}

export interface ItemCostStats {
  /** Cost of everything sold in the window. */
  cogs: number;
  netSales: number;
  /** Blended across the window, because cost moves. An item bought at two costs
   *  has no single true unit cost, and the average is the only honest figure to
   *  hold a price against. Null when nothing sold. */
  unitCost: number | null;
  marginPct: number | null;
}

export interface VendorSummary {
  vendorId: string;
  vendorName: string;
  sales: number;
  /** Distinct items. Null while the vendor comes from the rollup alone: its
   *  item counts are per day, and a week's distinct count can't be added up
   *  from them. Filled in when the item rows land. */
  itemCount: number | null;
  /** Every item row this vendor supplied, so opening it costs nothing. Empty
   *  until the item rows land. */
  rows: SubDeptMargin[];
}

export interface InvoiceCost {
  /** Per selling unit — the same unit the sales rows count in. */
  unitCost: number;
  /** yyyy-mm-dd of the invoice it came from. */
  date: string;
  invoiceId: string | number;
}

export type CostSource = "invoice" | "item file";

export interface ResolvedCost {
  unitCost: number | null;
  source: CostSource;
  /** Set when `source` is "invoice". */
  invoice: InvoiceCost | null;
}

export interface InvoiceCostState {
  /** Which UPC `cost` belongs to. The panel checks this before reading, the
   *  same way it checks the register lines, so a slow answer for the item
   *  clicked before can't land on the one on screen. */
  upc: string | null;
  cost: InvoiceCost | null;
  loading: boolean;
}

export interface TreeGroup {
  id: string;
  label: string;
  sales: number;
  /** Null when the count can't be known until the group is opened, which is
   *  the department page's situation — `sub_sales` aggregates above the item
   *  line. Rendered as nothing rather than a misleading zero. */
  itemCount: number | null;
}
