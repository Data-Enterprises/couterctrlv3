import { getSubDepts } from "../../../api/subMargins";
import { fetchAllPages } from "../../../utils/paging";
import { fetchSubDeptRows, fetchSubDeptRowsSafe } from "../../../utils/marginRows";
import { calculateCogs } from "../../../utils/cogs";
// Net of tax, the basis every other Sales surface reconciles on. Price Opt
// summed raw total_sales and read 6-7% above Top 200 and Item Lookup for
// the same item and week (dev board review, finding E).
import { netOf } from "../../../utils/perfPairs";
import { getRollup } from "../../../api/rollup";
import type {
  SubDeptMargin,
  SubSale,
  SubSalesJsonResp,
} from "../../../interfaces";

/**
 * Fetching for Price Opt — Sub Department.
 *
 * Two levels, and deliberately lazy between them. `subs/sub_sales` names the
 * departments that sold; `subs/subs` returns the item rows for **one** of them.
 * Nothing below a department is fetched until the user opens it, which is what
 * keeps this page cheap on a store with forty departments — the sibling Vendor
 * page can't do that, because `vendor_id` only exists on item rows and so every
 * department has to be walked before a single vendor can be named.
 *
 * Both flags are fixed. Price Opt is examined one store at a time, like Sub Dept
 * Margins, Categories and Vendors — the pages this one drills beneath.
 */

const USE_GROUPS = 0;
const SINGLE_STORE = 1;

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

/**
 * The departments that sold in the window.
 *
 * Paged: a large store's department list can exceed one page, and reading only
 * page 1 would silently drop whole departments off the tree.
 */
export const fetchSubDepts = async (
  scope: InventoryScope,
): Promise<SubDeptSummary[]> => {
  const call = (page: number) =>
    getSubDepts(
      scope.url,
      scope.token,
      scope.start,
      scope.end,
      USE_GROUPS,
      scope.storeid,
      SINGLE_STORE,
      0, // consolidated — 0 keeps sale_date
      0, // displayHourly
      page,
    );

  const first = await call(1);
  const body: SubSalesJsonResp = first.data;
  if (body.error !== 0)
    throw new Error(body.msg ?? "Failed to load departments");

  const all = await fetchAllPages(body, body.subs ?? [], async (page) => {
    try {
      const r = await call(page);
      const j: SubSalesJsonResp = r.data;
      return j.error === 0 ? (j.subs ?? []) : [];
    } catch {
      return [];
    }
  });

  // Rows are per department per day, so a week arrives as seven rows per
  // department and the sales have to be summed before anything is comparable.
  const byId = new Map<number, SubDeptSummary>();
  all.forEach((s: SubSale) => {
    const found = byId.get(s.sub_department);
    if (found) {
      found.sales += netOf(s);
    } else {
      byId.set(s.sub_department, {
        id: s.sub_department,
        description: s.sub_department_description,
        sales: netOf(s),
        itemCount: null,
      });
    }
  });

  return [...byId.values()].sort((a, b) => b.sales - a.sales);
};

/** Priced units for an item row. `qty` counts rings; `weight` is what the
 *  customer was charged for, and comes back 0 on an each-priced item — the same
 *  discriminator Item Lookup uses. */
export const pricedUnits = (r: SubDeptMargin): number =>
  r.weight > 0 ? r.weight : r.qty;

/**
 * Item rows into one entry per UPC.
 *
 * Sales rank the list because that is the order someone hunting a pricing
 * problem wants: the item that moved the most money first. Returns are left in
 * the rows so the estimated math can exclude them itself — dropping them here
 * would make the item's sales total disagree with Sub Dept Margins.
 *
 * Shared by both Price Opt pages. They differ in how rows are *obtained* — one
 * department on demand, or every department up front — and not at all in how
 * they're rolled up.
 */
export const groupProducts = (rows: SubDeptMargin[]): ProductSummary[] => {
  const byCode = new Map<string, ProductSummary>();
  rows.forEach((r) => {
    const code = String(r.product_code);
    const found = byCode.get(code);
    if (found) {
      found.sales += netOf(r);
      found.qty += r.qty;
      found.units += pricedUnits(r);
      found.rows.push(r);
    } else {
      byCode.set(code, {
        productCode: code,
        description: r.product_description,
        sales: netOf(r),
        qty: r.qty,
        units: pricedUnits(r),
        rows: [r],
      });
    }
  });

  return [...byCode.values()].sort((a, b) => b.sales - a.sales);
};

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

/**
 * The cost floor under every price on the page.
 *
 * Register lines carry no cost of their own, so this is what reaches them from
 * the `subs/subs` rows — which makes it the one number the panel, the
 * suggestion and the export all have to agree on. It lives here rather than in
 * the panel so the export can't compute it a second, subtly different way.
 */
export const itemCostStats = (
  p: ProductSummary,
  /** The latest invoice cost, when there is one to use. See invoiceCost.ts. */
  unitCostOverride?: number | null,
): ItemCostStats => {
  const cogs =
    unitCostOverride != null
      ? p.units * unitCostOverride
      : p.rows.reduce(
          (s, r) =>
            s + calculateCogs(r.net_cost, r.cost, r.case_size, r.qty, r.weight),
          0,
        );
  const netSales = p.rows.reduce((s, r) => s + r.net_sales, 0);
  return {
    cogs,
    netSales,
    unitCost:
      unitCostOverride != null
        ? unitCostOverride
        : p.units > 0
          ? cogs / p.units
          : null,
    marginPct: netSales > 0 ? ((netSales - cogs) / netSales) * 100 : null,
  };
};

/** Every UPC in one department. Fetched on demand, one call per department the
 *  user actually opens. */
export const fetchProducts = async (
  scope: InventoryScope,
  subDeptId: number,
): Promise<ProductSummary[]> =>
  groupProducts(
    await fetchSubDeptRows(
      scope.url,
      scope.token,
      subDeptId,
      scope.start,
      scope.end,
      USE_GROUPS,
      scope.storeid,
      SINGLE_STORE,
    ),
  );

/* ------------------------------------------------------------------ vendors */

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

/** Rows with no vendor are real — DSD and miscellaneous departments both
 *  produce them — and bucketing them together under one heading is more
 *  honest than dropping the sales out of the page entirely. */
const NO_VENDOR = "—";

/**
 * One vendor id, whichever kind of row it came from.
 *
 * The rollup's key is the item rows' `vendor_id` as trimmed text, so the two
 * agree on every real vendor. Nothing at all, or all zeros (coupon lines send
 * the number 0), is no vendor, the same rule the Vendors page uses. Without
 * one rule here, a vendor from the rollup and the same vendor from the item
 * rows would be two different groups.
 */
const vendorKey = (raw: unknown): string => {
  const id = (raw === null || raw === undefined ? "" : String(raw)).trim();
  return id === "" || /^0+$/.test(id) ? NO_VENDOR : id;
};

/**
 * Every vendor that sold in the window, from `subs/rollup`: names and sales,
 * no item rows. ~40 KB, so the tree draws at once; `fetchVendors` brings the
 * items behind it.
 */
export const fetchVendorTotals = async (
  scope: InventoryScope,
): Promise<VendorSummary[]> => {
  const resp = await getRollup(scope.url, scope.token, {
    by: "vendor",
    startDate: scope.start,
    endDate: scope.end,
    useGroups: USE_GROUPS,
    singleStore: SINGLE_STORE,
    searchValue: scope.storeid,
  });
  if (resp.data.error !== 0) {
    throw new Error(resp.data.msg ?? "Could not read the vendor totals");
  }
  const byVendor = new Map<string, VendorSummary>();
  for (const r of resp.data.rows ?? []) {
    const id = vendorKey(r.key);
    const found = byVendor.get(id);
    if (found) found.sales += r.net_sales;
    else
      byVendor.set(id, {
        vendorId: id,
        vendorName: id === NO_VENDOR ? "No vendor" : r.name || id,
        sales: r.net_sales,
        itemCount: null,
        rows: [],
      });
  }
  return [...byVendor.values()].sort((a, b) => b.sales - a.sales);
};

/**
 * The `sub_department` argument that asks `subs/subs` for every department in
 * one read. As a request argument 0 means "all"; as a row value it is a real
 * department, which is why it is named rather than written as a bare 0.
 */
const ALL_SUB_DEPTS = 0;

/**
 * Every vendor that sold in the window, with their items.
 *
 * `vendor_id` lives only on item rows, so naming a single vendor needs every
 * item row in the window, which is why this loads up front rather than
 * expanding on click.
 *
 * One paged read of every department, the way the Vendors page reads it. This
 * used to ask for the department list first and then fire one `subs/subs` per
 * department, all at once: 27 calls and up to 26 in flight for one store-week
 * (dev board review, finding I). The rows that come back are the same rows;
 * only the number of requests changes.
 *
 * Read behind `fetchVendorTotals` now, which draws the tree first. Still every
 * item row, deliberately: opening a vendor and the item filter both read
 * them, and every field `subs/subs` returns stays in hand.
 */
export const fetchVendors = async (
  scope: InventoryScope,
): Promise<VendorSummary[]> => {
  const rows = await fetchSubDeptRowsSafe(
    scope.url,
    scope.token,
    ALL_SUB_DEPTS,
    scope.start,
    scope.end,
    USE_GROUPS,
    scope.storeid,
    SINGLE_STORE,
  );

  const byVendor = new Map<string, VendorSummary>();
  rows.forEach((r) => {
    const id = vendorKey(r.vendor_id);
    const found = byVendor.get(id);
    if (found) {
      found.sales += netOf(r);
      found.rows.push(r);
    } else {
      byVendor.set(id, {
        vendorId: id,
        vendorName:
          id === NO_VENDOR ? "No vendor" : r.vendor_name || id,
        sales: netOf(r),
        itemCount: 0,
        rows: [r],
      });
    }
  });

  return [...byVendor.values()]
    .map((v) => ({
      ...v,
      itemCount: new Set(v.rows.map((r) => String(r.product_code))).size,
    }))
    .sort((a, b) => b.sales - a.sales);
};
