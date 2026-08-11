import { getSubDepts } from "../../api/subMargins";
import { fetchAllPages } from "../../utils/paging";
import { fetchSubDeptRows, fetchSubDeptRowsSafe } from "../../utils/marginRows";
import { calculateCogs } from "../subDepts";
import type {
  SubDeptMargin,
  SubSale,
  SubSalesJsonResp,
} from "../../interfaces";

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
      found.sales += s.total_sales;
    } else {
      byId.set(s.sub_department, {
        id: s.sub_department,
        description: s.sub_department_description,
        sales: s.total_sales,
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
      found.sales += r.total_sales;
      found.qty += r.qty;
      found.units += pricedUnits(r);
      found.rows.push(r);
    } else {
      byCode.set(code, {
        productCode: code,
        description: r.product_description,
        sales: r.total_sales,
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
export const itemCostStats = (p: ProductSummary): ItemCostStats => {
  const cogs = p.rows.reduce(
    (s, r) =>
      s + calculateCogs(r.net_cost, r.cost, r.case_size, r.qty, r.weight),
    0,
  );
  const netSales = p.rows.reduce((s, r) => s + r.net_sales, 0);
  return {
    cogs,
    netSales,
    unitCost: p.units > 0 ? cogs / p.units : null,
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
  /** Known immediately, unlike a department's — every row is already in hand
   *  by the time a vendor exists at all. */
  itemCount: number;
  /** Every item row this vendor supplied, so opening it costs nothing. */
  rows: SubDeptMargin[];
}

/**
 * Every vendor that sold in the window, with their items.
 *
 * `vendor_id` lives only on item rows, and item rows come one department at a
 * time — so unlike the department page, this cannot be lazy. Naming a single
 * vendor requires having walked all of them, which is why this loads up front
 * behind a two-step message rather than expanding on click.
 *
 * Departments go out together; serialising would multiply latency by the
 * department count for no benefit. A department that fails resolves to no rows
 * rather than taking down the search — losing one department understates a
 * vendor, losing the page helps nobody.
 */
export const fetchVendors = async (
  scope: InventoryScope,
  subDeptIds: number[],
): Promise<VendorSummary[]> => {
  const results = await Promise.all(
    subDeptIds.map((id) =>
      fetchSubDeptRowsSafe(
        scope.url,
        scope.token,
        id,
        scope.start,
        scope.end,
        USE_GROUPS,
        scope.storeid,
        SINGLE_STORE,
      ),
    ),
  );

  const byVendor = new Map<string, VendorSummary>();
  results.flat().forEach((r) => {
    // Rows with no vendor are real — DSD and miscellaneous departments both
    // produce them — and bucketing them together under one heading is more
    // honest than dropping the sales out of the page entirely.
    const id = r.vendor_id || "—";
    const found = byVendor.get(id);
    if (found) {
      found.sales += r.total_sales;
      found.rows.push(r);
    } else {
      byVendor.set(id, {
        vendorId: id,
        vendorName: r.vendor_name || "No vendor",
        sales: r.total_sales,
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
