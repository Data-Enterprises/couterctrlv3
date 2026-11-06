// API
import { getSubDepts } from "../../../../api/subMargins";
import { getRollup } from "../../../../api/rollup";

// Utils
import { fetchAllPages } from "../../../../utils/paging";
import { fetchSubDeptRows, fetchSubDeptRowsSafe } from "../../../../utils/marginRows";
import { calculateCogs } from "../../../../utils/cogs";
// Net of tax, the basis every other Sales surface reconciles on.
import { netOf } from "../../../../utils/perfPairs";

// Interfaces
import type { InventoryScope, ItemCostStats, ProductSummary, SubDeptSummary, VendorSummary } from "../interfaces";
import type {
  SubDeptMargin,
  SubSale,
  SubSalesJsonResp,
} from "../../../../interfaces";

/**
 * Fetching for Price Opt: Sub Department, lazy between two levels:
 * `subs/sub_sales` names the departments that sold; `subs/subs` returns one
 * department's item rows when it is opened. One store at a time, like the
 * pages this drills beneath.
 */

const USE_GROUPS = 0;
const SINGLE_STORE = 1;

/**
 * The departments that sold in the window, paged (a large store's list can
 * exceed one page).
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

/** Priced units for an item row: `weight` when non-zero, else `qty`, the same
 *  discriminator as Item Lookup. */
export const pricedUnits = (r: SubDeptMargin): number =>
  r.weight > 0 ? r.weight : r.qty;

/**
 * Item rows into one entry per UPC, ranked by sales. Returns stay in the rows
 * (the estimated maths excludes them), so totals agree with Sub Dept Margins.
 * Shared by both Price Opt pages.
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

/**
 * The cost floor under every price on the page, from the `subs/subs` rows. The
 * panel, the suggestion and the export all read it from here.
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

/** Rows with no vendor are real (DSD and miscellaneous departments), so they
 *  are bucketed under one heading rather than dropped. */
const NO_VENDOR = "—";

/**
 * One vendor id, whichever kind of row it came from: trimmed text, matching the
 * rollup's key. Nothing, or all zeros (coupon lines send 0), is no vendor, as
 * on the Vendors page.
 */
const vendorKey = (raw: unknown): string => {
  const id = (raw === null || raw === undefined ? "" : String(raw)).trim();
  return id === "" || /^0+$/.test(id) ? NO_VENDOR : id;
};

/**
 * Every vendor that sold in the window, from `subs/rollup` (names and sales, no
 * item rows, ~40 KB), so the tree draws at once; `fetchVendors` brings the items.
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
 * The `sub_department` argument meaning "all": as a request argument 0 is all,
 * as a row value it is a real department.
 */
const ALL_SUB_DEPTS = 0;

/**
 * Every vendor that sold in the window, with their items, in one paged read of
 * every department (as the Vendors page reads it). Loaded up front because
 * `vendor_id` lives only on item rows, and opening a vendor and the item filter
 * both need them.
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
