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
  /**
   * Where the item is filed, and how many ways.
   *
   * Aggregated rather than grouped on: filing is a property OF the item, so a
   * code filed two ways stays one row instead of splitting and halving its
   * own sales. `sub_department` is therefore the COMMONEST filing in scope,
   * not an assertion that every store agrees — `sub_department_count` says
   * whether they do, and is always 1 for a single store.
   */
  sub_department: number | null;
  sub_department_description: string | null;
  sub_department_count: number;
  /**
   * Rings, not amount sold.
   *
   * On a scale item this counts how many times something was weighed, and at
   * Food Giant it is 0 on every weighed row — the feed sends no ring count
   * and nothing in the data can derive one. `weight` is the amount on those
   * rows, and `qty: 0` beside `weight: 507.230` is accurate rather than
   * broken.
   */
  qty: number;
  /**
   * Pounds, to three decimals. Zero on a packaged item.
   *
   * Its own column rather than a stand-in for `qty`: the two mean different
   * things and a row can carry both.
   */
  weight: number;
  total_sales: number;
  /** Null when no line carried a cost at all. */
  ext_cost: number | null;
  /** Percent of lines that carried a cost. */
  cost_coverage: number | null;
  /**
   * Null when too few lines carried a cost to trust it.
   *
   * Withheld below 90% coverage — not a half. A margin off partial cost
   * reads near 100% because the sales all count and the uncosted rows' cost
   * does not, and DSD vendors like Pepsi routinely send no cost at all, so
   * the inflation lands on exactly the fast movers this list is about.
   * Render the absence, never a zero.
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

/**
 * One price an item actually rang at, and what went through at it.
 *
 * On a weighed line `price` is the posted per-pound price, read off the row
 * rather than divided out of it — so a weighed item returns ONE price point
 * where it used to return a scatter, one per basket size.
 */
export interface TopItemPricePoint {
  storeid: number;
  product_code: string;
  product_description: string;
  price: number;
  units: number;
  /** Pounds at this price. Zero on a packaged item. */
  weight: number;
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
  /** Pounds, to three decimals. Zero on a packaged item. */
  weight: number;
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
 * The endpoint ranks by SALES now, which is what the list is ranked by, so
 * the 200 it returns are the 200 shown. This asked for 500 and took the top
 * 200 out of them while the endpoint still ranked on units — a mitigation
 * for a list that could not otherwise contain the right rows, and 60% of a
 * payload that was thrown away.
 *
 * Units could never order a mixed list anyway: on a scale item `qty` counts
 * weighings, on a packaged one it counts units, and at Food Giant it is 0 on
 * every weighed row. Dollars mean the same thing on every row.
 */
export const TOP_ITEMS_FETCH = 200;

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
