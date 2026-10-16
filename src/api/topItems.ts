import axios from "axios";

/**
 * `sales/topitems` and `sales/item_detail` — the store's biggest sellers, and
 * one of them drilled into.
 *
 * Both take `searchType` rather than the `useGroups` / `singleStore` pair the
 * subs endpoints use: `"Store"` means `storeid` is a store, anything else
 * means it is a group id. The Sales popup is always about one store, so this
 * module passes `"Store"` and nothing else needs to know.
 */

/** One item, for the window asked about. */
export interface TopItemRow {
  storeid: number;
  store_number: string | null;
  store_name: string | null;
  product_code: string;
  product_description: string;
  qty: number;
  total_sales: number;
  /** Null when no line carried a cost at all. */
  ext_cost: number | null;
  /** Percent of lines that carried a cost. */
  cost_coverage: number | null;
  /**
   * Null when too few lines carried a cost to trust it.
   *
   * Deliberate server-side: a margin off partial cost reads near 100%,
   * because the sales are all there and the cost is not. Render the absence,
   * never a zero.
   */
  margin: number | null;
  /**
   * Units by how they rang. The four sum to `qty`.
   *
   * Every one is nullable, and most rows have at least one null: these are
   * `SUM(qty) FILTER (WHERE …)` and Postgres returns NULL rather than 0 when
   * nothing matches the filter. An item that only ever sold at regular price
   * comes back with `qty_promo: null`, not zero.
   */
  qty_regular: number | null;
  qty_promo: number | null;
  qty_deal_item: number | null;
  qty_unknown: number | null;
}

/** One price an item actually rang at, and what went through at it. */
export interface TopItemPricePoint {
  storeid: number;
  product_code: string;
  product_description: string;
  price: number;
  units: number;
  net_sales: number;
}

export interface TopItemsResponse {
  error: number;
  success: boolean;
  msg?: string;
  recordCount: number;
  topN: number;
  items: TopItemRow[];
  /** Empty for a single store; the group rollup lives here. */
  stores: unknown[];
  price_point_count: number;
  price_points: TopItemPricePoint[];
}

/** One store's movement on one item. A single-store call returns exactly one. */
export interface ItemDetailStore {
  storeid: number;
  store_number: string | null;
  store_name: string | null;
  qty: number;
  total_sales: number;
  ext_cost: number | null;
  cost_coverage: number | null;
  margin: number | null;
  qty_regular: number | null;
  qty_deal_item: number | null;
  pct_of_total: number | null;
}

/** One invoice day. `allowance` is `list_unit - paid_unit`. */
export interface ItemCostLine {
  invoice_date: string;
  list_unit: number;
  paid_unit: number;
  allowance: number;
  cases: number;
  vendor_name: string | null;
}

export interface ItemCostSummary {
  paying_now: number;
  best_seen: number;
  /** What waiting is worth per unit: `paying_now - best_seen`. */
  gap: number;
  best_seen_on: string;
  last_bought_on: string;
  purchases: number;
  days: number;
  on_allowance_now: boolean;
}

export interface ItemDetailResponse {
  error: number;
  success: boolean;
  msg?: string;
  product_code: string;
  product_description: string | null;
  store_count: number;
  stores: ItemDetailStore[];
  /** Null when nothing was bought in the cost window. */
  cost_summary: ItemCostSummary | null;
  cost_history: ItemCostLine[];
}

/**
 * How many items to ask for.
 *
 * The list is shown ranked by SALES, and the endpoint ranks by units — so the
 * top 200 by sales is not the 200 it returns. A $16 item selling five makes
 * one list and misses the other, and no amount of re-sorting here recovers a
 * row that never came back.
 *
 * So ask for the endpoint's ceiling and take the top 200 by sales out of it.
 * That is a mitigation, not a fix: an item outside the top 500 by units but
 * inside the top 200 by sales is still missed, which takes roughly a £90
 * single-unit sale to arrange. The fix is `ORDER BY total_sales` on the
 * endpoint, and this constant goes back to `SHOWN` when it lands.
 */
export const TOP_ITEMS_FETCH = 500;

/** How many the tab shows once they are ranked by sales. */
export const TOP_ITEMS_SHOWN = 200;

/**
 * How far back the cost history reaches.
 *
 * Long enough to say whether today's price is a good one — a week cannot, and
 * a slow mover on a monthly cycle needs more than one delivery to compare
 * against. Short enough that the invoice list stays a list: at 120 days a
 * weekly-delivered item ran to seventeen rows, which is a scroll rather than
 * an answer.
 */
export const COST_HISTORY_DAYS = 60;

export const getTopItems = async (
  url: string,
  token: string,
  storeid: number,
  startDate: string,
  endDate: string,
  topN: number = TOP_ITEMS_FETCH,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "sales/topitems",
    data: { storeid, searchType: "Store", startDate, endDate, topN },
  });
  return json;
};

/**
 * One item: where it sells, and what it has cost to buy.
 *
 * `costDays` reaches past the sales window on purpose — a week cannot say
 * whether today's price is a good one.
 */
export const getItemDetail = async (
  url: string,
  token: string,
  storeid: number,
  productCode: string,
  startDate: string,
  endDate: string,
  costDays: number = 120,
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "sales/item_detail",
    data: {
      storeid,
      searchType: "Store",
      productCode,
      startDate,
      endDate,
      costDays,
    },
  });
  return json;
};
