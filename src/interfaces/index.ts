import type { Coverage, Tier } from "../utils/grading";
import type { Severity } from "../utils/severity";

export type JsonError = {
  message: string;
};

export interface Question {
  id: number;
  question: string;
}

////////////////////// For the sales slice //////////////////////
// SalesInterfaces
export interface DepartmentSale {
  qty: number;
  sales: number;
  sub_department: number;
  sub_department_description: string;
}

export interface TopTenItem {
  cost: number;
  product_code: string;
  product_description: string;
  qty: number;
  store_name: string;
  store_number: string;
  storeid: number;
  total_sales: number;
}

export type TopTenData = {
  id: string;
  label: string;
  value: number;
  fill: string;
  color: string;
  qty: number;
};

export type SelectedSalesPanel = {
  sale_date: string;
  storeid: number;
  store_name: string;
};

export type WeeklySale = {
  net_sales: number;
  qty: number;
  sale_date: string;
  store_name: string;
  store_number: string;
  storeid: number;
  total_sales: number;
  total_tax: number;
  weight: number;
};

export type SalesPanelInfo = {
  qty: number;
  sale_date: string;
  store_name: string;
  store_number: string;
  storeid: number;
  total_sales: number;
  weight: number;
};

export type AggTotals = {
  total_sales: number;
  total_tax: number;
  total_cpn_dollars: number;
  basket_size_sales: number;
  transactions: number;
  avg_basket_amount: number;
};

export type AggCoupons = {
  digital_coupons: number;
  elec_instore_coupons: number;
  elect_store_coupons: number;
  store_coupon: number;
};

export type GroupTopTenItem = {
  product_code: string;
  product_description: string;
  total_sales: number;
  qty: number;
};

// used for the hourly/hourly endpoint
export type HourlySale = {
  avg_item_price: number;
  avg_item_qty: number;
  basket_size_qty: number;
  basket_size_sales: number;
  hour: number;
  net_sales: number;
  qty: number;
  sale_date: string;
  store_name: string;
  store_number: string;
  storeid: number;
  total_sales: number;
  total_tax: number;
  transactions: number;
  weight: number;
};

export type SalesBarData = {
  id: number;
  label: string;
  value: number;
  fill: string;
  color: string;
  qty: number;
};

export type CatSale = {
  sale_date: string;
  storeid: number;
  store_name: string;
  store_number: string;
  category: number;
  category_description: string;
  total_sales: number;
  net_sales: number;
  total_tax: number;
  qty: number;
  weight: number;
  elec_instore_coupons: number;
  elec_store_coupons: number;
  digital_coupons: number;
  store_coupon: number;
};

export type SubSale = {
  sale_date: string;
  storeid: number;
  store_name: string;
  store_number: string;
  sub_department: number;
  sub_department_description: string;
  total_sales: number;
  net_sales: number;
  total_tax: number;
  qty: number;
  weight: number;
  elec_instore_coupons: number;
  elec_store_coupons: number;
  digital_coupons: number;
  store_coupon: number;
  transaction_count: number;
};

export type SubGridRow = SubSale & {
  lastYrSales: number;
};

/////////////////////// End sales slice //////////////////////

//////////////////////////////////////////////////////////////
// User Interfaces
//////////////////////////////////////////////////////////////
export interface UserPrefs {
  userid: number;
  last_searh: number | null;
  last_group: number | null;
  template: number;
  last_search_type: string;
  last_route: string;
}

export interface Store {
  storeid: number;
  store_number: string;
  store_name: string;
  company: number;
  company_name: string;
}

export interface UnassignedStore {
  storeid: number;
  store_number: string;
  store_name: string;
  company: number;
  company_name: string;
}

export interface UserCompany {
  id: number;
  name: string;
  userid: number;
  company: number;
  username: string;
}

export interface User {
  id: number;
  username: string;
  password: string;
  user_level: number;
  last_visit: string | null;
  join_date: string | null;
  first_name: string;
  last_name: string;
  email: string;
  companies: UserCompany[];
  company: number;
  active: number;
  template: number | null;
  security: number | null;
  role: number | null;
  password_change_needed: number;
  logged_in: boolean | null;
  security_question_id: number;
  security_answer: string;
}

export interface BaseGroup {
  id: number;
  name: string;
  company: number;
  company_name: string;
  active: 1 | 0;
}

export interface BaseGroupJsonResp {
  error: number;
  success: boolean;
  active: BaseGroup[];
  inactive: BaseGroup[];
}

//////////////////////////////////////////////////////////////
// Loss Prevention Interfaces
//////////////////////////////////////////////////////////////

// cashiers/preflight endpoint => sale_types property from response object
export interface SaleType {
  sale_type: string;
}

// cashiers/ endpoint => sales property from response object
// array of CashierSales
export interface CashierDetails {
  transaction_count: number;
  total_items: number;
  amount: number;
  qty: number;
  avg_item_amount: number;
  avg_item_qty: number;
  weight: number;
  sale_type: string;
  storeid: number;
  store_number: string;
  store_name: string;
  sale_date: string;
  cashier_count: number;
  average_dollars: number;
  average_qty: number;
}

// cashiers/ endpoint => trend property from response object
export interface CashierTrend {
  transaction_count: number;
  total_items: number;
  amount: number;
  qty: number;
  avg_item_amount: number;
  avg_item_qty: number;
  weight: number;
  sale_type: string;
  storeid: number;
  store_number: string;
  store_name: string;
  cashier_count: number;
  average_dollars: number;
  average_qty: number;
}

// cashiers/ endpoint => transactions property from response object
export interface CashierTransaction {
  cashier_name: string;
  cashier_number: number;
  sale_date: string;
  sale_id: string;
  sale_type: string;
  store_name: string;
  store_number: string;
  storeid: number;
  /** The register. Spelled with the typo because that is how the payload
   *  arrived; `terminal` is carried alongside it because nothing outside LP
   *  Actions has ever read this field, so a change of spelling on the backend
   *  would go unnoticed. Read it through `laneOf`, never directly. */
  termainal?: string;
  terminal?: string;
  total_sales: number;
}

// cashiers/transaction endpoint => transaction property from response object

export type UniqueCashier = {
  cashier_name: string;
  cashier_number: number;
  total_sales: number;
  transaction_count: number;
  store_number: string;
  transaction_ids: string[];
};

export type TransactionOverview = {
  transaction_id: string;
  sale_id: string;
  sale_date: string;
  sale_type: string;
  store_number: string;
  cashier_name: string;
  cashier_number: number;
  qty: number;
  storeid: number;
  total_sales: number;
};

export interface TransactionListItem {
  transaction_id: string;
  coupon_amount: number;
  storeid: number;
  store_name: string;
  store_number: string;
  sale_type: string;
  sale_date: string;
  line_number: number;
  terminal: string;
  total_sales: number;
  /**
   * `total_sales` as the column actually stores it — no tax added, no store
   * coupon removed.
   *
   * `total_sales` above is the adjusted figure this endpoint has always
   * returned. `cashier_table` returns the raw one, so anything reconciling the
   * two must compare like with like: the difference is small per line and
   * compounds into a visibly different case value. Optional because only the
   * optimized router returns it.
   */
  item_total?: number;
  net_sales: number;
  sale_id: string;
  product_code: string;
  product_description: string;
  price_type: string;
  store_city: string;
  store_state: string;
  store_zipcode: string | null;
  store_phone: string;
  store_address: string | null;
  brand: string | null;
  size: string;
  is_discounted: number;
  is_coupon: number;
  cashier_number: number;
  cashier_name: string;
  sale_start_time: string;
  sale_end_time: string;
  total_rounded_tax: number;
  fs: number;
  fsa: number;
  wic: number;
  scalable: number;
  qty?: number;
}

//////////////////////////////////////////////////////////////
// UPC List Interfaces
//////////////////////////////////////////////////////////////

// For upc sales comp data
export type UpcSalesComp = {
  product_code: string;
  description: string;
  week: string;
  Monday: number | null;
  Tuesday: number | null;
  Wednesday: number | null;
  Thursday: number | null;
  Friday: number | null;
  Saturday: number | null;
  Sunday: number | null;
};

export type UpcItem = {
  product_code: string;
  description: string;
};

export type UpcMetrics = {
  avg_daily_qty: number;
  days_active: number;
  description: string;
  max_day_qty: number;
  qty: number;
};

export type UpcInfo = {
  label: string;
  value: string;
  color: string;
  metrics: UpcMetrics;
};

export type Forecast = {
  // id === upc code
  id: string;
  // x === date and y === value
  data: { x: string; y: number }[];
  // for the chart color
  color: string;
};

export interface UpcForecastData {
  product_code: string;
  data: UpcForecast;
}

export interface UpcForecast {
  forecast: { date: string; value: number }[];
  forecast_dimension: number;
  forecast_method: string;
  history: { date: string; value: number }[];
  history_dimension: number;
  metrics: {
    avg_daily_qty: number;
    days_active: number;
    description: string;
    max_day_qty: number;
    qty: number;
    outliers: { date: string; qty: number }[];
    prices: any;
  };
}

export type UpcData = {
  storeid: number;
  sale_date: string;
  store_number: string;
  terminal: string;
  product_code: string;
  description: string;
  qty: number;
  sales: number;
  weight: number;
};

export type ForecastExport = {
  upc: string;
  description: string;
  date: string;
  quantity: number;
};

export type ForecastMetrics = {
  upc: string;
  description: string;
  avg_daily_qty: number;
  days_active: number;
  max_day_qty: number;
  qty: number;
};

export type UpcPriceOpt = {
  product_code: string;
  product_description: string;
  price: number;
  total_qty: number;
  total_revenue: number;
  total_weight: number;
};

export type UpcTrend = {
  product_code: string;
  product_description: string;
  trend_date: string;
  slope_before: number;
  slope_after: number;
  slope_change: number;
  // The live endpoint sends a number here, not a string — it is slope_change
  // repeated. Nothing reads it; typed honestly so nothing starts to.
  trend: number;
  mean_before: number;
  mean_after: number;
  pct_change_mean: number;
  total_before: number;
  total_after: number;
  volatility_before: number;
  volatility_after: number;
  active_days_before: number;
  active_days_after: number;
  "r2-before": number;
  "r2-after": number;
  impact_units: number;
  // Not reliably present on every row from the live endpoint despite being
  // typed as required here before — confirmed via a runtime crash when a
  // row arrived without it. Treat all three as possibly absent.
  sparkline?: number[];
  tooltip?: string;
  rank?: number;
};

/** What `marketing/trend_detector` answers with.
 *
 *  `startdate` and `end_date` are the two ends of the AFTER window, echoed
 *  back from the request — the split point the before/after figures are
 *  measured either side of, and how far past it they run. `top_5`/`bottom_5`
 *  are the backend's own cross-UPC rankings of the same rows and are
 *  deliberately unused; see TrendTab. */
export type TrendDetectorResp = {
  error: number;
  msg?: string;
  startdate: string;
  end_date: string;
  total_stores: number;
  upc_count: number;
  trends: UpcTrend[];
  top_5?: UpcTrend[];
  bottom_5?: UpcTrend[];
};

export type Handlers = {
  copyUpc?: () => Promise<void> | void;
  copyDesc?: () => Promise<void> | void;
  copyAllUpcs?: () => Promise<void> | void;
};

export type ContextEvent = React.MouseEvent<
  HTMLTableRowElement | HTMLDivElement
>;
export type Option = {
  label: string;
  key: keyof Handlers;
  children?: Option[];
  value?: string;
};

// Context Menu Interfaces
export type ClipboardText = {
  upc: string;
  desc: string;
};

export type SMClipboardText = {
  upc: string;
  allUpc: string;
};

// Forecast Interfaces
export interface ForecastQtyData<T> {
  upc: string;
  history: { date: string; value: number }[];
  history_dimension: number;
  forecast: number;
  forecast_dimension: number;
  forecast_method: string;
  metrics: {
    description: string;
    qty: number;
    avg_daily_qty: number;
    max_day_qty: number;
    days_active: number;
    outliers: { date: string; qty: number }[];
    prices: T;
  };
}

export interface ForecastSalesData<T> {
  upc: string;
  history: { date: string; value: number }[];
  history_dimension: number;
  forecast: number;
  forecast_dimension: number;
  forecast_method: string;
  metrics: {
    description: string;
    sales: number;
    avg_daily_sales: number;
    max_day_sales: number;
    days_active: number;
    outliers: { date: string; qty: number }[];
    prices: T;
    total_sales: number;
  };
}

export interface ForecastItem {
  upc: string;
  description: string;
}

export interface ForecastPriceHistory {
  storeid: number;
  price_type: string;
  unit_price: number;
  total_qty: number;
  product_code: string;
  product_description: string;
  store_number: string;
  store_name: string;
  lift: number;
  regular_retail_price: number;
}

export interface UpcCodeDesc {
  upc: string;
  description: string;
}

export interface PriceSimQtyData<T> {
  upc: string;
  history: { date: string; value: number }[];
  history_dimension: number;
  forecast: number;
  forecast_dimension: number;
  forecast_method: string;
  metrics: {
    description: string;
    qty: number;
    avg_daily_qty: number;
    max_day_qty: number;
    days_active: number;
    outliers: { date: string; qty: number }[];
    prices: T;
  };
}

export interface PriceSimSalesData<T> {
  upc: string;
  history: { date: string; value: number }[];
  history_dimension: number;
  forecast: number;
  forecast_dimension: number;
  forecast_method: string;
  metrics: {
    description: string;
    sales: number;
    avg_daily_sales: number;
    max_day_sales: number;
    days_active: number;
    outliers: { date: string; qty: number }[];
    prices: T;
    total_sales: number;
  };
}

// price simulator interfaces
export interface SimGridRow {
  upc: string;
  description: string;
  fcstPrice: number;
  calcNow: 0 | 1;
  fcstQty: number;
  fcstDollars: number;
  regRetail: number;
  regQty: number;
  regDollars: number;
  markdownDollars: number;
  lift: number;
  prices: number[][]; // not seen in grid but used for calculations
}

export interface PriceSimHistory<T> {
  upc: string;
  description: string;
  qty: number;
  avg_daily_qty: number;
  max_day_qty: number;
  days_active: number;
  regular_retail_price: number;
  prices: T;
}

export interface PriceHistory {
  price: string;
  qty: number;
  sale_dates: string[];
  days_active: number;
}

export interface PriceHistoryResult {
  upc: string;
  description: string;
  qty: number;
  regular_retail_price: number;
  avg_daily_qty: number;
  max_day_qty: number;
  days_active: number;
  price_history: PriceHistory[];
}

export interface PriceHistoryFromListResp {
  error: number;
  success: boolean;
  /** Only present when error === 1 — carries the backend's own reason. */
  msg?: string;
  end_date: string;
  total_stores: number;
  upc_count: number;
  results: PriceHistoryResult[];
}

////////////////////
///RECEIVERS PAGE///
////////////////////

export interface ReceiverListItem {
  invoiceid: number;
  invoice_date: string;
  store_number: string;
  vendor_name: string;
  vendorid: string;
  reference_number: string;
  items: number;
  cashier_number: number;
  cashier_name: string; // Operator
}

export interface ReceiverListResponse {
  error: number;
  msg?: string;
  success: boolean;
  record_count: number;
  recievers: ReceiverListItem[];
}

export interface ReceiverDetailsItem {
  storeid: number;
  line_number: number;
  product_code: string;
  product_description: string;
  qty: number;
  total_dollars: number;
  weight: number | null;
  units: number;
  cases: number;
  ext_retail: number;
  retail: number;
  free: number;
  return: number;
  ucost: number;
  ext_cost: number;
  gm: number;
  cashier_number: number;
  cashier_name: string;
}

export interface ReceiverDetailsTotals {
  cases: number;
  units: number;
  ucost: number;
  ext_cost: number;
  retail: number;
  ext_retail: number;
  cashier_name: string;
  cashier_number: number;
}

export interface ReceiverDetailsResponse {
  error: number;
  success: boolean;
  record_count: number;
  records: ReceiverDetailsItem[];
  totals: ReceiverDetailsTotals[];
}

////////////////////
// COUPONS PAGE/////
////////////////////

export interface CouponItem {
  storeid: number;
  sale_id: number;
  sale_date: string;
  store_name: string;
  store_number: string;
  product_code: string;
  product_description: string;
  is_coupon: number;
  coupon_amount: number;
  vendor_coupon: number;
  store_coupon: number;
  coupon_type: string;
  sale_type: string;
  line_number: number;
  cashier_number: number;
  cashier_name: string;
  employee_number: number | null;
  terminal: string;
  qty: number;
  total_sales: number;
  sub_department: number;
  sub_department_description: string;
  category: number;
  category_description: string;
  customer_id: string;
  customer_name: string;
}

export interface CouponsResponse {
  error: number;
  msg?: string;
  success: boolean;
  record_count: number;
  records: CouponItem[];
}

////////////////////
//SIMULATIONS///////
////////////////////
export interface SimReplayItem {
  sale_id: number;
  line_number: number;
  sale_date: string;
  product_code: string;
  product_description: string;
  qty: number;
  total_sales: number;
  weight: number;
}

export interface SimReplayResp {
  error: number;
  success: boolean;
  future_count: number;
  future: SimReplayItem[];
  past_count: number;
  past: SimReplayItem[];
}

export interface SimListItem {
  sim_name: string;
  start_date: string;
  end_date: string;
}

export interface SimListResp {
  error: number;
  success: boolean;
  records: SimListItem[];
}

//////////////////////////////
// Company/Admin/Team types///
//////////////////////////////

export interface Company {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: number;
  phone: string;
  contact_email: string;
}

export interface CompanyJsonResp {
  error: number;
  success: boolean;
  msg: string;
  companies: Company[];
}

/* ----------------------------------------------------------- shared groups */

/** A store as the shared_groups router returns it. */
export interface SharedGroupStore {
  storeid: number;
  store_number: string | null;
  store_name: string | null;
}

/** A store group an owner builds and lets other users search with. A search
 *  filter only: it never grants or revokes store access. */
export interface SharedGroup {
  id: number;
  name: string;
  company: number;
  /** userid of whoever created it; their rows are the group's store list. */
  owner: number;
  stores: SharedGroupStore[];
  /** Who it is shared with. Never includes the owner. */
  userids: number[];
}

export interface SharedGroupUser {
  userid: number;
  username: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  shared_group_ids: number[];
}

/** A base group offered as a starting point: its name and stores. */
export interface SharedGroupTemplate {
  id: number;
  name: string;
  stores: SharedGroupStore[];
}

interface SharedGroupsEnvelope {
  error: number;
  success: boolean;
  msg?: string;
  company: number;
}

export type SharedGroupsResp = SharedGroupsEnvelope & { shared_groups: SharedGroup[] };
export type SharedGroupUsersResp = SharedGroupsEnvelope & { users: SharedGroupUser[] };
export type SharedGroupTemplatesResp = SharedGroupsEnvelope & { templates: SharedGroupTemplate[] };

/** groups/base_group_users: everyone a base group's Users tab needs, in one call. */
export interface BaseGroupUserRow {
  userid: number;
  username: string;
  email: string | null;
}

export interface BaseGroupUsersResp {
  error: number;
  success: boolean;
  msg?: string;
  groupid: number;
  company: number;
  assigned: BaseGroupUserRow[];
  unassigned: BaseGroupUserRow[];
}

export interface CompanyBaseGroup {
  id: number;
  name: string;
  company: number;
}

export interface CompanyBGJsonResp {
  error: number;
  success: boolean;
  groups: CompanyBaseGroup[];
}

export interface Vendor {
  vendor_id: number;
  vendor_name: string;
  company_name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  zip: string;
  contact_email: string;
}

export interface VendorJsonResp {
  error: number;
  success: boolean;
  msg: string;
  vendors: Vendor[];
}

export interface UsersJsonResp {
  error: number;
  success: boolean;
  msg: string;
  users_count: number;
  users: User[];
  inactive_users: User[];
}

export type AdminOption = {
  label: string;
  option: number;
};

export interface UserLevel {
  id: number;
  name: string;
}

export interface UserLevelJsonResp {
  error: number;
  success: boolean;
  levels: UserLevel[];
}

export type UserData = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
};

export type StaticUserData = {
  user_level: number;
  role: number;
  password: string;
  confirm_password: string;
};

export type StoreWithActivity = {
  storeid: number;
  store_name: string;
  start_date: string;
  end_date: string;
  total_days_in_range: number;
  active_days: number;
  inactive_or_missing_days: number;
};

export interface StoreActivityJsonResp {
  error: number;
  success: boolean;
  msg: string;
  stores: StoreWithActivity[];
}

/////////////////////////
// Margin Maze Interfaces
/////////////////////////

export type SubDept = {
  id: number;
  desc: string;
};

export type SubSalesJsonResp = {
  error: number;
  msg?: string;
  success: boolean;
  store_count: number;
  total_records: number;
  total_pages: number;
  page_label: string;
  start_idx: number;
  end_idx: number;
  page_size: number;
  subs: SubSale[];
};

export type SubDeptMargin = {
  storeid: number;
  sale_date: string;
  store_number: string;
  store_name: string;
  product_code: string;
  product_description: string;
  price_type: string;
  vendor_id: string;
  vendor_name: string;
  sub_department: number;
  sub_department_description: string;
  sale_type: string;
  total_sales: number;
  net_sales: number;
  total_tax: number;
  qty: number;
  weight: number;
  cost: number;
  case_size: number;
  calculated_cost: number;
  margin: number;
  cost_fees: number;
  net_cost: number;
  /**
   * The posted price on the line — the POS price record, not what was charged.
   *
   * `ring_price` is per unit: `price_split` came back 1 on all 1,423 rows of a
   * real department, so no multi-buy divisor is being applied. It diverges from
   * what actually rang whenever a promotion is running — $7.99 on file against
   * a $3.99 ring — and that divergence is the thing worth looking at, not an
   * error to reconcile away.
   *
   * Optional because they were added to `subs/subs` after this type, and a
   * response without them should read as "unknown", not as zero.
   */
  ring_price?: number;
  price?: number;
  price_split?: number;
  avg_unit_price?: number;
};

export type SubMarginsJsonResp = {
  error: number;
  msg?: string;
  success: boolean;
  store_count: number;
  total_records: number;
  total_pages: number;
  page_label: string;
  start_idx: number;
  end_idx: number;
  page_size: number;
  subs: SubDeptMargin[];
};

/**
 * One price an item actually rang at, from `subs/subs?include_price_points=1`.
 *
 * Not the same thing as the estimated points derived from the daily rows: those
 * divide a day's dollars by its units, so a day that sold at two prices reports
 * a blend that matched neither. This is grouped by the price on the line.
 *
 * PRE-DISCOUNT. The qty=0 coupon and "DC" rows divide to a null price and are
 * filtered out of this aggregate, so `net_sales` is what rang before any
 * discount row reversed part of it — an item selling 81 units at $3.99 with
 * $40 of discounts reports one point of 81 units at $3.99, not the $2.99 that
 * 40 of those customers effectively paid.
 */
export interface SubsPricePoint {
  storeid: number;
  store_number: string;
  store_name: string;
  product_code: string;
  product_description: string;
  price: number;
  units: number;
  transactions: number;
  net_sales: number;
  first_sold: string;
  last_sold: string;
  /** Distinct days at this price. */
  days: number;
  /** The days themselves, so a promo that lapsed and came back is
   *  distinguishable from one that ran straight through — same first and last,
   *  different story. */
  days_sold: string[];
}

/** `subs/subs` when price points were asked for. The extra pair is absent
 *  otherwise, so both are optional rather than the type being forked. */
export type SubMarginsPricePointsResp = SubMarginsJsonResp & {
  price_point_count?: number;
  price_points?: SubsPricePoint[];
};

export type Mover = {
  vendor_id: string;
  vendor_name: string;
  total_sales: number;
  qty: number;
  cogs: number;
  gpm: number;
  tax: number;
  weight: number;
};

export type MarginKpi = {
  total_sales: string;
  qty: string;
  total_tax: string;
  items: string;
  gpm: string;
  vendors: string;
  // top_mover: Mover;
  total_cogs: string;
};

///////////////////
// ADMIN FORM TYPES
///////////////////

export type MissingStore = {
  storeid: number;
  store_number: string;
  store_name: string;
};

export type StoresMissingSalesJsonResp = {
  error: number;
  success: boolean;
  missing_store_count: number;
  missing: Store[];
};

export type SubDeptCost = {
  date: string;
  product_code: string;
  description: string;
  calculated_cost: number;
  cost: number;
  qty: number;
  /**
   * Pounds, on a scale item. Zero or absent on a by-the-each item.
   *
   * Carried because `total_cost` is costed on this, not on `qty` — see
   * `calculateCogs`, where `weight` wins whenever it is non-zero. Without it a
   * reader multiplies the cost column by `qty` and gets a number that is not
   * the COGS beside it: BNLS CHICKEN THIGHS rang 160 packages weighing 506.03
   * lb, so its week costed at $1.36 x 506.03 = $688.19, not $217.60.
   *
   * Optional only because the legacy KPI builder in `display/MarginKpi.tsx`
   * does not populate it and the legacy grid does not read it. Every dev
   * caller sets it.
   */
  weight?: number;
  total_cost: number;
};

////////////////////////////
// Cashiers Interfaces
///////////////////////////

export type StoreCard = {
  storeid: number;
  store_name: string;
  total_transactions: number;
  total_sales: number;
  net_sales: number;
  total_qty: number;
  voided_count: number;
  voided_sales: number;
  voided_qty: number;
  refunded_count: number;
  refunded_sales: number;
  refunded_qty: number;
  no_sale_count: number;
  no_sale_sales: number;
  no_sale_qty: number;
  hand_key_count: number;
  hand_key_sales: number;
  hand_key_qty: number;
  cancelled_count: number;
  cancelled_sales: number;
  cancelled_qty: number;
  adjustment_count: number;
  adjustment_sales: number;
  adjustment_qty: number;
  backup_count: number;
  backup_sales: number;
  backup_qty: number;
  modified_count: number;
  modified_sales: number;
  modified_qty: number;
  total_flagged: number;
  voided_rate: number;
  refunded_rate: number;
  no_sale_rate: number;
  hand_key_rate: number;
  cancelled_rate: number;
  adjustment_rate: number;
  backup_rate: number;
  modified_rate: number;
  flagged_rate: number;
  weighted_risk_rate: number;
  risk_score: number;
  risk_tier: string;
  exception_tier: string;
};

export interface StoreCardResp {
  error: number;
  success: boolean;
  stores: StoreCard[];
}

export type CashierCard = {
  storeid: number;
  store_name: string;
  cashier_number: number;
  cashier_name: string;
  store_number: number;
  total_transactions: number;
  total_sales: number;
  net_sales: number;
  total_qty: number;
  voided_count: number;
  voided_sales: number;
  voided_qty: number;
  refunded_count: number;
  refunded_sales: number;
  refunded_qty: number;
  no_sale_count: number;
  no_sale_sales: number;
  no_sale_qty: number;
  hand_key_count: number;
  hand_key_sales: number;
  hand_key_qty: number;
  cancelled_count: number;
  cancelled_sales: number;
  cancelled_qty: number;
  adjustment_count: number;
  adjustment_sales: number;
  adjustment_qty: number;
  backup_count: number;
  backup_sales: number;
  backup_qty: number;
  modified_count: number;
  modified_sales: number;
  modified_qty: number;
  total_flagged: number;
  voided_rate: number;
  refunded_rate: number;
  no_sale_rate: number;
  hand_key_rate: number;
  cancelled_rate: number;
  adjustment_rate: number;
  backup_rate: number;
  modified_rate: number;
  flagged_rate: number;
  weighted_risk_rate: number;
  blended_base_score: number;
  volume_factor: number;
  risk_score: number;
  risk_tier: string;
  exception_tier: string;
};

export interface CashierCardResp {
  error: number;
  success: boolean;
  stores: CashierCard[];
}

export type Cashier = {
  storeid: number;
  store_name: string;
  store_number: number;
  cashier_number: number;
  cashier_name: string;
};

export type CashierStore = {
  storeid: number;
  store_name: string;
};

export type ExceptionType =
  | "Voided"
  | "Refunded"
  | "No Sale"
  | "Hand Key"
  | "Cancelled"
  | "Adjustment"
  | "Backup"
  | "Modified";

//////////////////////////////////////
// Orders Interfaces
//////////////////////////////////////

export interface AvailableOrder {
  order_date: string;
  storenumber: string;
  order_type: string;
  record_count: number;
  storeid: number;
}

export interface AvailableOrderResp {
  error: number;
  success: boolean;
  msg: string;
  orders: AvailableOrder[];
}

export interface AllOrder {
  storeid: number;
  order_id: number;
  order_date: string;
  storenumber: string;
  storename: string;
  status: string;
  record_count: number;
  order_type: string;
  product_code: string;
  qty: number;
  line_number: number;
  tpr: number;
  active_price: number;
  active_qty: number;
  extended_plessy: string | null;
  net_cost: number;
  weight: number;
  active_retail_price: number;
  active_retail_qty: number;
  description: string;
  base_cost: number;
  category: number;
  category_description: string;
  vendor_id: string;
  retail_price: number | null;
  sub_department: number;
  sub_department_description: string;
  vendor_name: string;
  casesize: number;
  edited: number | null;
  scalable: number;
  e_ret: number;
  cogs: number;
  rev: number;
}

export interface AllOrderResp {
  error: number;
  success: boolean;
  msg: string;
  orders: AllOrder[];
}

/* ── categories/cat_sales ──────────────────────────────────────────────────
   One endpoint, three row shapes, chosen by the `consolidated` and
   `displayHourly` flags. Fields common to all three sit in the base. */

export interface CatSalesBase {
  storeid: number;
  store_name: string;
  store_number: string;
  category: number;
  /** Null means the items in this bucket are uncategorized at the POS —
   *  a data-quality signal in its own right, not a display gap. */
  category_description: string | null;
  total_sales: number;
  net_sales: number;
  total_tax: number;
  qty: number;
  weight: number;
}

export interface CatSalesCoupons {
  elec_instore_coupons: number;
  elec_store_coupons: number;
  digital_coupons: number;
  store_coupon: number;
}

/** consolidated=1, displayHourly=0 — one row per category, no dates. */
export type CatSalesConsolidated = CatSalesBase & CatSalesCoupons;

/** consolidated=0, displayHourly=0 — one row per category per day. The only
 *  shape that carries sale_date, so the only one day-matching can use. */
export type CatSalesDaily = CatSalesBase &
  CatSalesCoupons & { sale_date: string };

/** displayHourly=1 — one row per category per day per hour. Trades the coupon
 *  columns for basket and average-item figures. */
export type CatSalesHourly = CatSalesBase & {
  sale_date: string;
  hour: number;
  sale_id: number;
  avg_item_price: number;
  avg_item_qty: number;
  basket_size_sales: number;
  basket_size_qty: number;
};

/** One item, one day, within a category — `categories/cats`.
 *
 *  Field-for-field a `SubDeptMargin` with the grouping column swapped: both
 *  endpoints select the same columns from the same table. That is what lets the
 *  Categories item report reuse the Sub Dept Margins maths in
 *  `src/utils/itemMargins.ts` rather than reimplement it.
 *
 *  `margin` is present but must not be consumed — it is computed server-side as
 *  `sum(total_sales) - avg(calculated_cost)`, never multiplied by qty and
 *  denominated on tax-inclusive sales. Use `calculateCogs` instead. */
export type CatItem = Omit<
  SubDeptMargin,
  "sub_department" | "sub_department_description"
> & {
  category: number;
  category_description: string;
};

export interface CatSalesResponse<T> {
  error: number;
  success: boolean;
  store_count: number;
  total_records: number;
  total_pages: number;
  start_idx: number;
  end_idx: number;
  page_label: string;
  page_size: number;
  subs: T[];
}

/**
 * One product from `cashiers/product_lookup`.
 *
 * Both description arrays are `array_agg(...) FILTER (...)` results, and
 * Postgres returns NULL — not an empty array — when the filter matches no
 * rows. An item that never discounted has `discount_descriptions: null`, so
 * neither can be read without a null check.
 */
export interface ProductLookupProduct {
  product_code: string;
  /** Names off the qty<>0 rows — the real item. */
  item_descriptions: string[] | null;
  /** Names off the qty=0 rows, e.g. "DC Smithfield". These act as coupon
   *  aliases: they are how a vendor name reaches an item whose own
   *  description never mentions it. */
  discount_descriptions: string[] | null;
  /** SUM(qty) over every row. Discount rows are qty 0, so they cannot inflate it. */
  units: number;
  /** Distinct baskets holding a qty<>0 row. */
  baskets: number;
}

/**
 * One row of `cashier_table`'s `groupBy: "cashier"` rollup.
 *
 * The per-cashier-per-week counts LP Actions used to derive by counting rows in
 * the browser. `line_count` is the number of PRODUCT-GRAIN rows the same query
 * would have returned — which is what the page's `+= 1` counted — and is NOT
 * `transaction_count`, which is distinct baskets. For one group over four weeks
 * those differ by roughly 7x, so they are never interchangeable.
 */
export interface CashierRollupRow {
  storeid: number;
  store_name: string;
  store_number: string;
  sale_type: string;
  /** 0-based, in 7-day blocks from the request's `startDate`. */
  week_index: number;
  /** The block's first day. Returned so a bucketing mismatch is visible in the
   *  response rather than silently shifting every weekly figure. */
  week_start: string;
  cashier_number: number;
  cashier_name: string;
  line_count: number;
  transaction_count: number;
  total_sales: number;
}

/**
 * One week of one cashier's exception, with its peer indices.
 *
 * An index is the cashier's figure over the peer average — 1.0 is the average
 * cashier. `null` where the peer average is zero and there is nothing to be
 * above, which is every dollar measure on a type like No Sale.
 */
export interface CashierWeekStat {
  week_index: number;
  /** yyyy-mm-dd, the block's first day. */
  week_start: string;
  line_count: number;
  transaction_count: number;
  qty: number;
  total_sales: number;
  lines_index: number | null;
  qty_index: number | null;
  sales_index: number | null;
  /** Only present when the request carried a threshold. ABSENT means "not
   *  evaluated", which is not the same as false. */
  investigate?: boolean;
}

/** One cashier's whole window for one exception type. */
export interface CashierExceptionStat {
  line_count: number;
  transaction_count: number;
  qty: number;
  total_sales: number;
  lines_index: number | null;
  qty_index: number | null;
  sales_index: number | null;
  /** Weeks this cashier had ANY of this exception — the true denominator.
   *  `weekly` may be shorter, because it holds only the flagged weeks. */
  weeks_present: number;
  weekly: CashierWeekStat[];
  investigate?: boolean;
  weeks_flagged?: number;
}

/**
 * The peer baseline for one exception type.
 *
 * The peer group is the cashiers who HAVE that exception — someone with no
 * refunds is not part of the refund average. `peer_count` stays larger than the
 * cashiers returned whenever the response is filtered to the flagged ones,
 * which is correct: dropping clean cashiers from the LIST must never drop them
 * from the DENOMINATOR.
 */
export interface CashierBenchmark {
  peer_count: number;
  avg_line_count: number;
  avg_transaction_count: number;
  avg_qty: number;
  avg_total_sales: number;
  /** The same averages over cashier-WEEKS, for grading a single week. */
  weekly: {
    peer_count: number;
    avg_line_count: number;
    avg_transaction_count: number;
    avg_qty: number;
    avg_total_sales: number;
  };
  /** Which measures could be graded at all. A measure whose peer average is
   *  zero returns a null index rather than a special case keyed on the type
   *  name — this says so without the frontend having to infer it. */
  gradeable: {
    line_count: boolean;
    qty: boolean;
    total_sales: boolean;
  };
}

/** One cashier, with every exception they hit nested underneath. */
export interface CashierProfile {
  storeid: number;
  store_name: string;
  store_number: string;
  cashier_number: number;
  cashier_name: string;
  /** Keyed by sale type. An absent key means none of that exception. */
  exceptions: Record<string, CashierExceptionStat>;
  peak_index: number | null;
  peak_type: string | null;
  peak_measure: string | null;
  flagged_types?: string[];
  investigate?: boolean;
  max_weeks_flagged?: number;
  /** The same exception, week after week. */
  persistent?: boolean;
  /** Several different exceptions at once. */
  multi_type?: boolean;
  repeat_offender?: boolean;
}

/** `cashier_table` with `groupBy: "cashier"` and `includeStats: true`. */
export interface CashierStatsResp {
  error: number;
  success: boolean;
  msg?: string;
  /** Counts CASHIERS in this mode, not exception rows. */
  record_count: number;
  total_pages: number;
  page: number;
  benchmarks: Record<string, CashierBenchmark>;
  cashiers: CashierProfile[];
}

/** `cashiers/transaction_ids` — the id list without the rows behind it. */
export interface TransactionIdsResp {
  error: number;
  success: boolean;
  msg?: string;
  /** Distinct baskets in the window BEFORE `limit`, so the page can report the
   *  overflow without fetching what it is about to discard. */
  transaction_count: number;
  returned_count: number;
  truncated: boolean;
  transaction_ids: string[];
}

export interface ProductLookupResp {
  error: number;
  success: boolean;
  msg?: string;
  product_count: number;
  products: ProductLookupProduct[];
  transaction_count: number;
  /** Empty when a `searchString` spanned several products — pick one and ask
   *  again with `productCodes`. Always populated when `productCodes` was sent. */
  transaction_ids: string[];
}

/**
 * One line on a receiver from `receivers/item_search`.
 *
 * Nearly `ReceiverDetailsItem`, with two differences worth knowing: the return
 * flag is `item_return` here rather than `return`, and the invoice header —
 * vendor, date, invoice id — lives on the parent receiver instead of being
 * repeated on every line.
 */
export interface ReceiverItemSearchLine {
  line_number: number;
  product_code: string;
  product_description: string;
  qty: number;
  total_dollars: number;
  weight: number | null;
  units: number;
  cases: number;
  ext_retail: number;
  retail: number;
  free: number;
  item_return: number;
  ucost: number;
  ext_cost: number;
  gm: number;
}

export interface ReceiverItemSearchReceiver {
  receiver_rank: number;
  storeid: number;
  store_number: string;
  invoiceid: number;
  invoice_date: string;
  vendorid: number;
  vendor_name: string;
  reference_number: string | null;
  terminal: string | null;
  cashier_number: number | null;
  cashier_name: string | null;
  invoice_item_count: number;
  line_count: number;
  /**
   * Covers only the matched lines unless `includeAllLines` was sent.
   *
   * Unlike `receivers/details`, these are safe to read: `avg_unit_cost` is
   * ext_cost/qty rather than a sum of per-unit prices, and `ucost`/`retail`
   * are deliberately absent instead of being summed into nonsense.
   */
  totals: {
    cases: number;
    units: number;
    qty: number;
    ext_cost: number;
    ext_retail: number;
    avg_unit_cost: number;
    avg_unit_retail: number;
  };
  lines: ReceiverItemSearchLine[];
}

export interface ReceiverItemSearchResponse {
  error: number;
  success: boolean;
  msg?: string;
  requested_code_count: number;
  receiver_count: number;
  page_line_count: number;
  /** Counts RECEIVERS, not lines — a caller stopping at page 1 loses whole
   *  deliveries, not trailing lines off the last one. */
  total_pages: number;
  page: number;
  page_size: number;
  /** Absent on the no-rows response, which returns before they are set. */
  start_idx?: number;
  end_idx?: number;
  include_all_lines?: boolean;
  receivers: ReceiverItemSearchReceiver[];
}

////////////////////////////
// Suggested Weight Interfaces
///////////////////////////

/**
 * Average pounds sold on each day of the week, keyed "0".."6" with **0 =
 * Sunday** — Postgres' `extract(dow)` convention, not JavaScript's, though the
 * two happen to agree. All seven keys are always present; a day the item never
 * sells is a `0`, not a missing key, so a strip built from this never has gaps.
 *
 * At item grain these are that item's rates; at store grain the department's
 * items summed. Each is the weekday's pounds divided by how many times that
 * weekday occurred in the lookback, so the seven sum to
 * `avg_daily_weight * 7` exactly.
 */
export type DowRates = Record<string, number>;

/**
 * What the shrink adjustment on a row was built from, best signal first.
 *
 * `receipts` is the good one and arrives with EDI. `markdown` is the best
 * available today — recorded waste out of `public.markdowns`, and where meat's
 * loss actually lives. `damage` is narrower and almost entirely a subset of
 * markdown, so it only applies where markdown found nothing. `none` is a pure
 * demand figure.
 *
 * These are exclusive, not additive: markdown REPLACES damage rather than
 * stacking, because the two overlap ~94% and stacking would double-count on
 * exactly the most heavily wasted items.
 */
export type ShrinkSource = "receipts" | "markdown" | "damage" | "none";

/** One item on one store's order sheet. Every weight is POUNDS — this endpoint
 *  only answers for scale departments, so there is no qty anywhere in it. */
export interface SuggestedItem {
  /** The endpoint has always sent these on item rows; they only started
   *  mattering once the sheet held more than one store's worth. */
  storeid: number;
  store_name: string | null;
  store_number: string | null;
  product_code: string;
  product_description: string | null;
  sub_department: number | null;
  sub_department_description: string | null;
  /** Pounds sold across the whole lookback, not the cover window. */
  sold_weight_window: number;
  /** Pounds the cover window is forecast to sell, by weekday. */
  demand_weight: number;
  shrink_source: ShrinkSource;
  shrink_multiplier: number;
  /** True when the raw shrink rate blew past its clamp — a keying problem
   *  rather than heavy waste, and not the same thing as a big multiplier. */
  shrink_clamped: boolean;
  /** The figures BEHIND `shrink_multiplier`. Present only when the request
   *  sets `includeDiagnostics` — they exist to audit a multiplier ("why is
   *  this item 1.31?"), which is a pgAdmin question, not a manager's screen.
   *  This page does not ask for them. */
  lifetime_damaged?: number;
  lifetime_markdown?: number;
  /**
   * Recorded markdown pounds over the LOOKBACK, not the item's whole life.
   *
   * The figure the sheet shows. Lifetime pounds cannot be totalled beside
   * anything else on the row — item lifetimes differ, so the column had to sit
   * out of the totals row and could only be sorted. This one covers the same
   * window as every other figure there, so it adds up.
   */
  markdown_weight_window?: number;
  lifetime_received?: number;
  lifetime_sold?: number;
  /**
   * demand x shrink - on_hand, floored at 0. The number the buyer acts on.
   *
   * ABSENT when `parameters.is_historical` is true. A call for a past date is a
   * comparison, not an order — nobody buys for last September — and the figure
   * would be a hybrid anyway, since shrink comes from lifetime aggregates with
   * no date scope. Everything else on a historical response is genuinely
   * historical; this one field and `on_order_weight` are the exceptions.
   */
  suggested_weight?: number;
  avg_daily_weight: number;
  /** Normalised by `api/suggested`. Optional because a row whose profile is
   *  missing or malformed arrives here absent, and callers must treat that as
   *  "no profile", never as seven zeros. */
  dow_rates?: DowRates;

  /* ── ordered against sold. Present with `includeOrders`, and absent in
        their entirety on a historical response, because order_status is an
        action and a past date has no ordering decision left in it. ── */
  ordered_weight?: number;
  ordered_units?: number;
  /** Ordered ÷ sold over the lookback. Null when nothing sold. */
  order_ratio?: number | null;
  /** The same statement in pounds: bought and not sold. Negative where the
   *  store sold more than it bought. This is what a list should rank by — the
   *  ratio says how far out of line, the gap says what it costs. */
  order_gap_weight?: number | null;
  order_status?: OrderStatus;

  /**
   * The two halves `on_hand_weight` is the difference of, over the short
   * window rather than the lookback.
   *
   * Returned separately because the subtraction is the one term of the model a
   * buyer will not take on trust: "48 lb already in the case" is an assertion,
   * and "ordered 91, sold 43" is an argument. Neither is a lookback figure, so
   * neither should be read against `ordered_weight` or `sold_weight_window`.
   */
  ordered_weight_recent?: number;
  sold_weight_recent?: number;

  /**
   * Ordered and sold within 3% of each other AND no waste recorded anywhere.
   *
   * Two independent readings both saying nothing was ever lost, on product sold
   * by the pound. Not a clean bill — a hole in the recording. The bands cannot
   * say so, because a ratio of 1.000 sits squarely inside `ok`.
   */
  shrink_unrecorded?: boolean;

  /**
   * How many days the stock on hand would last at this item's ordinary rate.
   *
   * The rhythm test, and the reason it is expressed in DAYS rather than pounds:
   * 2 lb is a lot of saffron and nothing of bananas. Null when nothing sold
   * over the lookback, which is why `rhythm_action` has an `unknown` band —
   * a missing figure is not a verdict of "fine".
   */
  days_of_cover?: number | null;
  /** This item's heaviest weekday against its own daily mean. At 1.5 and above
   *  one delivery has to carry a spike, which ordering more does not fix. */
  dow_peak_ratio?: number | null;
  rhythm_action?: RhythmAction;

  /**
   * Stock still in the store: ordered minus sold over `leadDays + coverDays`,
   * floored at zero. ALREADY SUBTRACTED from `suggested_weight` — do not net it
   * off again.
   *
   * The short window is the whole point. On-hand is a LEVEL; ordered-minus-sold
   * over the lookback is an accumulation of every imbalance since June, and it
   * grows if you widen `lookbackWeeks`. Nothing in the case changes when you
   * look further back, so a figure that moves when you do is not stock.
   */
  on_hand_weight?: number;

  /* ── diagnostics only ── */
  damaged_weight?: number;
  damaged_units?: number;
}

/**
 * One day's actual pounds for a store x sub department.
 *
 * The backward-looking half of the page. `dow_rates` answers "what does a
 * Friday normally look like"; this answers "what did we actually move last
 * Friday", and they are different numbers — the first is an average over the
 * lookback, the second is one observation.
 */
export interface SuggestedDailyPoint {
  /** yyyy-mm-dd. */
  date: string;
  weight: number;
  /** Distinct products that sold weight that day. */
  items: number;
}

/**
 * One department's day-by-day history.
 *
 * Returned once per department under `daily_by_department` rather than copied
 * onto every row. It used to ride on the rows, which read as the ROW's history:
 * on an item row the department's series looked like that item's own, so banana
 * showed a daily average of 361 lb against its real ~103 with nothing on the row
 * to tell you which it was.
 */
export interface SuggestedDailySeries {
  storeid: number;
  sub_department: number | null;
  /** Mean of the days that actually traded — NOT the window mean, which a
   *  closed Sunday would dilute. */
  avg: number;
  days: number;
  series: SuggestedDailyPoint[];
}

/**
 * The key `daily_by_department` is indexed by.
 *
 * The backend builds it in Python as `f"{storeid}:{sub_department}"`, so a null
 * department stringifies to the literal `None` rather than an empty segment.
 * Reproduced here rather than worked around at each call site — get it wrong and
 * the lookup silently misses, which shows up as a department with no history
 * instead of an error.
 */
export const dailyKey = (storeid: number, subDepartment: number | null) =>
  `${storeid}:${subDepartment === null ? "None" : subDepartment}`;

/** One store x sub department in the group rollup. Carries counts rather than
 *  the items themselves; the sheet is a separate call. */
export interface SuggestedGroupRow {
  storeid: number;
  store_name: string | null;
  store_number: string | null;
  sub_department: number | null;
  sub_department_description: string | null;
  item_count: number;
  sold_weight_window: number;
  demand_weight: number;
  suggested_weight: number;
  items_receipts: number;
  items_markdown: number;
  items_damage: number;
  items_none: number;
  items_clamped: number;
  avg_daily_weight: number;

  /* ── ordered against sold, same availability rules as the item row ── */
  ordered_weight?: number;
  ordered_units?: number;
  order_ratio?: number | null;
  order_gap_weight?: number | null;
  on_hand_weight?: number;
  items_critical?: number;
  items_watch?: number;
  items_ok?: number;
  items_under?: number;
  items_no_orders?: number;
  items_insufficient?: number;
  items_shrink_unrecorded?: number;
  /** The department's own days of cover: its total on-hand over its total
   *  daily rate. Not the mean of its items' figures — a department is stocked
   *  as a case, and one dead line with 400 days of cover would swamp that. */
  days_of_cover?: number | null;
  items_slow_down?: number;
  items_skip_cycle?: number;
  items_tighten?: number;
  items_deliver_often?: number;
  items_watch_rhythm?: number;

  /** Normalised by `api/suggested`. Optional because a row whose profile is
   *  missing or malformed arrives here absent, and callers must treat that as
   *  "no profile", never as seven zeros. */
  dow_rates?: DowRates;
}

/**
 * How this item's ORDERING has run against its selling, over the lookback.
 *
 * Faces the opposite way to `suggested_weight`, and the two can disagree on the
 * same item without either being wrong: a line bought at 1.6x all quarter can
 * still genuinely need 313 lb this weekend. This is a verdict on the pattern,
 * never an instruction about the order on screen.
 *
 * `ok` starts at 0.9 and runs THROUGH 1.0 deliberately — a store should buy a
 * little more than it sells, and the gap above 1.0 is the shrink.
 * `no_orders` and `insufficient` are absences of signal, not verdicts.
 */
export type OrderStatus =
  | "critical"
  | "watch"
  | "ok"
  | "under"
  | "no_orders"
  | "insufficient";

/** Band counts over the whole query. Exhaustive and exclusive, so they sum to
 *  `record_count`. */
export type OrderSummary = Record<OrderStatus, number>;

/** Kept out of `OrderSummary` on purpose: a flagged item is ALSO counted in its
 *  band, so folding it in would break that sum. */
export interface OrderFlags {
  shrink_unrecorded: number;
}

/**
 * What to do about the ordering RHYTHM, as opposed to this order's pounds.
 *
 * Server-side, and deliberately so. The thresholds are request fields the
 * endpoint tunes (`slowCycles`, `tightCycles`), the bands are counted over the
 * whole query into `rhythm_summary`, and a store-grain view needs "3 items need
 * to slow down" per department — which a frontend holding one store's item rows
 * cannot produce. The frontend owns the wording, not the verdict.
 *
 * Measured in CYCLES of `leadDays + coverDays`, so one threshold holds across a
 * 4-day rhythm and a 7-day one:
 *
 *   slow_down      over a cycle of stock AND buying 1.2x+ — both signals, so it
 *                  is neither an item that already corrected nor one heavy
 *                  delivery
 *   skip_cycle     over a cycle of stock, but the buying is in line. Nothing
 *                  wrong with the rhythm; this turn just is not needed
 *   tighten        under a quarter-cycle AND buying under what sells
 *   deliver_often  under a quarter-cycle with a spiky weekday. Ordering more
 *                  does not fix a spike; delivering closer to it does
 *   watch          the trend is wrong while today's number is fine — doing
 *                  nothing THIS cycle costs nothing
 *   ok             nothing to do
 *   insufficient   under 10 lb sold in the lookback: too little to judge
 *   unknown        nothing sold, so there is no rate to divide stock by
 */
export type RhythmAction =
  | "slow_down"
  | "skip_cycle"
  | "tighten"
  | "deliver_often"
  | "watch"
  | "ok"
  | "insufficient"
  | "unknown";

/** Band counts over the whole query, same contract as `OrderSummary`:
 *  exhaustive and exclusive, so they sum to `record_count`. */
export type RhythmSummary = Record<RhythmAction, number>;

/** Why an item is on the not-selling list, worst-to-least-recoverable.
 *
 *  `declining` is the one that pays for the feature: dead and stopped are
 *  visible to anyone paying attention, but an item still moving at half its old
 *  rate is being produced to the OLD level and rotting the difference. */
export type NotSellingStatus = "dead" | "stopped" | "declining";

/** One item that has stopped or slowed. Rates are per day, because the two
 *  halves of the lookback are different lengths and raw totals would call
 *  everything declining. */
export interface NotSellingItem {
  storeid: number;
  product_code: string;
  product_description: string | null;
  sub_department: number | null;
  sub_department_description: string | null;
  status: NotSellingStatus;
  recent_weight: number;
  prior_weight: number;
  recent_lb_per_day: number;
  prior_lb_per_day: number;
  /** recent/prior - 1. Null when the item never sold in the prior half, which
   *  is division by zero rather than a 0% change. */
  change_ratio: number | null;
}

export interface NotSellingWindow {
  start: string;
  end: string;
  days: number;
}

/**
 * The other half of the question, under its own key.
 *
 * Never merged into `items`: a zero-demand row is not an order, and folding it
 * in would move record_count, every department sum and the shrink coverage.
 * Those are order figures.
 *
 * `counts` is over every department the call covered, not the selected one —
 * a per-department badge has to be counted client-side from `items`.
 */
export interface SuggestedNotSelling {
  window: { recent: NotSellingWindow; prior: NotSellingWindow };
  decline_threshold: number;
  counts: Record<NotSellingStatus, number>;
  items: NotSellingItem[];
}

/** Echoed back so the page can state what the numbers were computed under. A
 *  suggestion without its window is meaningless. */
export interface SuggestedParameters {
  storeid?: number;
  storeids?: number[];
  group_by?: string;
  as_of: string;
  /** True when `as_of` is in the past, which makes the response a comparison
   *  rather than an order — `suggested_weight` is omitted from every row. */
  is_historical?: boolean;
  lead_days: number;
  cover_days: number;
  cover_window: { start: string; end: string };
  lookback_window: { start: string; end: string; weeks: number; days: number };
  min_weight_sold: number;
}

/**
 * Which terms of the model actually had data behind them.
 *
 * Not decoration: with `on_hand` and `receipts` false, `suggested_weight` is a
 * demand forecast with a waste adjustment, NOT an order quantity — it does not
 * subtract what is already in the case. The page has to say so.
 */
export interface SuggestedCoverage {
  demand: boolean;
  receipts: boolean;
  markdown: boolean;
  damage: boolean;
  on_hand: boolean;
  on_order: boolean;
  items_by_shrink_source: {
    receipts: number;
    markdown: number;
    damage: number;
    none: number;
  };
  note: string;
}

export interface SuggestedItemsResp {
  error: number;
  success: boolean;
  msg?: string;
  record_count: number;
  total_pages: number;
  page: number;
  parameters: SuggestedParameters;
  data_coverage: SuggestedCoverage;
  /** Keyed by `dailyKey(storeid, sub_department)`. Null unless `includeDaily`. */
  daily_by_department: Record<string, SuggestedDailySeries> | null;
  /** Null when `includeOrders` is off or the response is historical. */
  order_summary: OrderSummary | null;
  order_flags: OrderFlags | null;
  /** Null on the same terms as `order_summary` — the rhythm bands are computed
   *  in the same CTE and are gated on the same `includeOrders`. */
  rhythm_summary: RhythmSummary | null;
  /** Present only when the request set `includeNotSelling`; null otherwise. */
  not_selling: SuggestedNotSelling | null;
  items: SuggestedItem[];
}

export interface SuggestedGroupResp {
  error: number;
  success: boolean;
  msg?: string;
  record_count: number;
  total_pages: number;
  page: number;
  parameters: SuggestedParameters;
  data_coverage: SuggestedCoverage;
  /** Keyed by `dailyKey(storeid, sub_department)`. Null unless `includeDaily`. */
  daily_by_department: Record<string, SuggestedDailySeries> | null;
  /** Null when `includeOrders` is off or the response is historical. */
  order_summary: OrderSummary | null;
  order_flags: OrderFlags | null;
  /** Null on the same terms as `order_summary` — the rhythm bands are computed
   *  in the same CTE and are gated on the same `includeOrders`. */
  rhythm_summary: RhythmSummary | null;
  items: SuggestedGroupRow[];
}

//////////////////////////////////////////////////////////////
// Sales — shapes the Sales slices hold. Moved out of the Sales page's
// LedgerRow and components/index so the data layer imports no UI file.
//////////////////////////////////////////////////////////////

export type DayDot = {
  sale_date: string;
  twNet: number;
  // null means no matching LW/LY row for this day — not the same as a
  // genuine $0 sales day. See computeDayMatchedTotals in shared/ledgerUtils.
  lwNet: number | null;
  lyNet: number | null;
  lwQty: number | null;
  lyQty: number | null;
  twQty: number;
};

export type StoreSelection = {
  storeId: number;
  storeName: string;
  storeNumber: string;
  /** Mirrors LedgerRowData.storeNumbersForId — lets the detail panel label
   * which of the co-located locations it's showing. */
  storeNumbersForId: string[];
  start: string;
  end: string;
  mode: "weekly" | "daily";
  days: DayDot[];
  /** Null when the store wasn't graded — see LedgerRowData.gradedOn. */
  severity: Severity | null;
};

export interface TopSub {
  sub_department: number;
  sub_department_description: string;
  total_sales: number;
  net_sales: number;
  qty: number;
  digital_coupons: number;
  elec_instore_coupons: number;
  elec_store_coupons: number;
  store_coupon: number;
  total_tax: number;
}

//////////////////////////////////////////////////////////////
// Receipts — two different things that both used to be called ReceiptLine.
//   ReceivedLine     a line delivered on an invoice (Item Report)
//   SaleReceiptLine  a line on a till receipt (LP and Coupon Sales)
//////////////////////////////////////////////////////////////

/** One receipt of one item, flattened out of the invoice it arrived on. */
export interface ReceivedLine {
  invoiceId: number;
  /** Carried because receipts are now an entry point in their own right — an
   *  item that was delivered and never scanned exists nowhere else. */
  productCode: string;
  description: string;
  date: string;
  vendorName: string;
  /**
   * Sellable units received. The API calls this `qty`, and it is the same basis
   * `subs/subs` sells in — which is the only reason received and sold can be
   * compared at all.
   *
   * Named `sellingUnits` rather than `units` on purpose: the API *also* has a
   * field called `units`, and it means something else entirely (see `billedIn`).
   * Carrying our own `units` that held their `qty` was a trap waiting for
   * whoever touched this next.
   *
   * Verified across 47 lines on four invoices: `ext_cost = ucost * qty` and
   * `ext_retail = retail * qty` are exact on every one.
   */
  sellingUnits: number;
  /** Shipping containers, `0` on a unit-received line. */
  cases: number;
  /**
   * How the vendor billed the line. The two modes are mutually exclusive — no
   * line ever carries both `units` and `cases` — and `qty` is sellable units
   * either way:
   *
   *     cases: qty = cases * caseSize,  units = 0
   *     units: qty = units,             cases = 0
   *
   * So a line whose `qty` equals its `cases` is a case size of one, not a line
   * counted in cases.
   */
  billedIn: "cases" | "units";
  /** Sellable units per shipping container, or null on a unit receipt. Derived,
   *  because the endpoint does not return it — worth asking for, since without
   *  it this can be computed but not checked. */
  caseSize: number | null;
  /** Unit cost on the day it landed. Two receipts at different costs is how a
   *  margin slips without anyone touching the shelf price. */
  unitCost: number;
  /** Retail the receipt expected, which is not always the retail that rang. */
  retail: number;
  /** Free goods and returns on the line.
   *
   *  Carried because they are the two things that can make "received" mean
   *  something other than "arrived and was paid for" — and both feed Net and
   *  Unaccounted, which the Reorder and Investigate reasoning rests on. Whether
   *  `units` already nets them is unverified against a real invoice, so they are
   *  surfaced rather than silently subtracted. */
  free: number;
  returned: number;
}

/** One line on a receipt. Both pages resolve to this — Coupon Sales from rows
 *  already in memory, Loss Prevention from a fetch — so the sheet that renders
 *  it never learns which page opened it. */
export interface SaleReceiptLine {
  description: string;
  qty: number;
  amount: number;
  /**
   * Tender lines sit below the total, the way they do on a till roll.
   *
   * Optional, and defaulting to an item, because only Loss Prevention's
   * payload distinguishes them. A page that cannot tell simply renders
   * everything as items, which is what it did before this existed.
   */
  kind?: "item" | "tender";
}

//////////////////////////////////////////////////////////////
// Categories
//////////////////////////////////////////////////////////////

export type CategoryMetric = "sales" | "qty";

/** Matches Sub Dept Margins' MarginTier naming — same list-of-rows-under-a-
 *  store shape, so the vocabulary should be the same too. */
export type CategoryTier = "critical" | "watch" | "healthy" | "ungraded";

export interface CategoryRow {
  category: number;
  /** Null from the API means uncategorized at the POS. Surfaced as such rather
   *  than hidden, because a large uncategorized bucket is worth acting on. */
  description: string | null;
  uncategorized: boolean;
  days: CategoryDay[];
  /** Day-matched: each comparison totals only the days present on both sides,
   *  and carries its own TW subtotal so the two are like for like. */
  twNet: number;
  twQty: number;
  lwNet: number;
  lwQty: number;
  twNetForLW: number;
  twQtyForLW: number;
  lyNet: number;
  lyQty: number;
  twNetForLY: number;
  twQtyForLY: number;
  hasLW: boolean;
  hasLY: boolean;
  /** The store's coverage for the week — the same object on every row. A
   *  comparison grades only when it covers every day; see utils/grading. */
  coverage: Coverage;
}

export interface CategoryDay {
  /** YYYY-MM-DD, always the *this week* date — LW and LY are aligned onto it. */
  date: string;
  twNet: number;
  twQty: number;
  /** This week's full figures for the day. */
  detail: DayDetail;
  lwNet: number | null;
  lwQty: number | null;
  lyNet: number | null;
  lyQty: number | null;
}

/** One category's figures for a single day, across the three periods.
 *
 *  `null` is load-bearing throughout: it means "that day did not exist in that
 *  period" and must never be coerced to 0. Zero is a real trading day with no
 *  sales; null is a day the store was shut or a week that ran short. */
/** Everything the payload carries for one day, kept for the report column.
 *  Grading only needs net and qty, but the drill-down should show what the
 *  endpoint actually returned rather than a two-field summary of it. */
export interface DayDetail {
  gross: number;
  net: number;
  tax: number;
  qty: number;
  weight: number;
  elecInstore: number;
  elecStore: number;
  digital: number;
  storeCoupon: number;
}

//////////////////////////////////////////////////////////////
// Vendors
//////////////////////////////////////////////////////////////

/** Margin or sales — the page-wide toggle, the same contract Sub Dept Margins
 *  uses. Vendors reads the same `subs/subs` rows, just grouped by vendor rather
 *  than by department, so margin is available on exactly the same basis. */
export type VendorMetric = "margin" | "sales";

export interface VendorRow {
  /** Zero-padded string from the POS, or NO_VENDOR_ID. The stable key — names
   *  get re-keyed, ids don't. */
  vendorId: string;
  vendorName: string;
  /** True for the NO_VENDOR_ID bucket, so the panel can label it rather than
   *  presenting it as a supplier. */
  noVendor: boolean;
  days: VendorDay[];

  /** Day-matched: each comparison totals only the days present on both sides,
   *  and carries its own TW subtotal so the two are like for like. Summing a
   *  full TW against a partial LY is the error these fields exist to prevent. */
  twNet: number;
  twQty: number;
  twCogs: number;
  lwNet: number;
  lwQty: number;
  lwCogs: number;
  twNetForLW: number;
  twQtyForLW: number;
  twCogsForLW: number;
  lyNet: number;
  lyQty: number;
  lyCogs: number;
  twNetForLY: number;
  twQtyForLY: number;
  twCogsForLY: number;
  hasLW: boolean;
  hasLY: boolean;
  /** The store's coverage for the week — the same object on every row. A
   *  comparison grades only when it covers every day; see utils/grading. */
  coverage: Coverage;

  /** Margin points, computed from the DAY-MATCHED subtotals so a partial week
   *  isn't compared against a full one. Positive means margin improved. */
  tyMarginPct: number;
  lwMarginPct: number;
  lyMarginPct: number;
  lwPtsDelta: number;
  lyPtsDelta: number;
}

/** One TW day for one vendor, with its aligned comparisons.
 *
 *  Null on the LW/LY side means that day is absent from the prior period —
 *  which is not the same as zero, and is what the day-matching below keys off. */
export interface VendorDay {
  /** Always the *this week* date. LW and LY are aligned onto it. */
  date: string;
  twNet: number;
  twQty: number;
  twCogs: number;
  lwNet: number | null;
  lwQty: number | null;
  lwCogs: number | null;
  lyNet: number | null;
  lyQty: number | null;
  lyCogs: number | null;
}

export type VendorTier = Tier;

//////////////////////////////////////////////////////////////
// LP Actions
//////////////////////////////////////////////////////////////

export interface ExceptionRow {
  /** storeid + sale type. A void spike at one store says nothing about
   *  another, so they are never pooled. */
  id: string;
  storeid: number;
  storeName: string;
  saleType: string;
  weeks: WeekBucket[];
  latest: number;
  baseline: number;
  /** Null when there is no baseline to compare against — a first sighting. */
  changePct: number | null;
  severity: LpSeverity;
  cashiers: CashierMovement[];
}

export interface WeekBucket extends WeekWindow {
  count: number;
}

export interface WeekWindow {
  /** yyyy-mm-dd, inclusive. */
  start: string;
  end: string;
}

export type LpSeverity = "investigate" | "watch" | "steady";

export interface CashierMovement {
  cashierNumber: number;
  cashierName: string;
  /** Occurrences in the most recent week. */
  latest: number;
  /** Mean per week across the earlier weeks — their own normal. */
  baseline: number;
}

/**
 * Who a cashier is.
 *
 * Never the number on its own. Cashier numbers are issued per store, so
 * "cashier 19" is a different person at every store in a group — scoping a
 * case by number alone silently pools them into one impossible operator.
 */
export interface CashierRef {
  storeid: number;
  cashierNumber: number;
}

//////////////////////////////////////////////////////////////
// Item Report actions
//////////////////////////////////////////////////////////////

export type ActionKind =
  | "investigate"
  | "reorder"
  | "reprice"
  | "vendor"
  /**
   * Sells, but nothing on file says it ever arrived.
   *
   * Split out of "vendor". That action was covering two unrelated situations —
   * an unstable cost, which is a conversation with the vendor, and a missing
   * receiving trail, which usually is not their fault at all. Orders received
   * electronically never reach the scan our data is built from, so the item can
   * be arriving perfectly well and still look absent here. Telling a manager to
   * phone a vendor about that is a wrong steer, and wrong steers are what a
   * suggestion tool cannot afford.
   *
   * What is actually worth doing is finding out how the item arrives. The list
   * already hints at it — these are the rows whose Last column reads "none".
   */
  | "none"
  | "insufficient"
  /**
   * Not a verdict — the absence of one, while the delivery read is still
   * running.
   *
   * Every action here depends on receipts, so none can be reached until the
   * walk finishes. This used to report as "Insufficient", which is a real
   * finding meaning "the data will never answer this" — so a whole store would
   * briefly sit in a category that reads like a conclusion, and looks like a
   * broken page to anyone who doesn't know a fetch is in flight. Separating the
   * two lets the sheet say "still reading" and mean it.
   */
  | "pending";

//////////////////////////////////////////////////////////////
// Sub Dept Margins items
//////////////////////////////////////////////////////////////

export interface ItemRow {
  sub_department_description: string; // good
  product_code: string; // good
  product_description: string; // good
  cogs: number; // good
  total_sales: number; // good
  net_sales: number; // good
  total_tax: number; // good
  qty: number; //good
  margin: number;
  cost_fees: number;
}

export interface ItemRowMobile {
  sub_department_description: string; // good
  product_code: string; // good
  product_description: string; // good
  cogs: number; // good
  total_sales: number; // good
  net_sales: number; // good
  total_tax: number; // good
  qty: number; //good
  margin: number;
  cost_fees: number;
  cost: number;
  calculated_cost: number;
}

//////////////////////////////////////////////////////////////
// Filters
//////////////////////////////////////////////////////////////

/** A numeric threshold filter: keep rows above, below or equal to amount. */
export interface ThresholdValue {
  op: "gt" | "lt" | "eq";
  amount: number;
}

//////////////////////////////////////////////////////////////
// Invoices
//////////////////////////////////////////////////////////////

export interface InvoiceRow {
  id: string;
  storeNbr: string;
  invoiceNbr: string;
  retailDept: string;
  deliveryDate: string | null;
  lineCount: number;
  totalCost: string;
  totalRetail: string;
  totalAllowances: string;
  totalCases: string;
  reconciled: boolean;
  /** Set when the invoice couldn't be checked at all — no total record. */
  note?: string;
  checks: {
    label: string;
    derived: string;
    reported: string;
    ok: boolean;
    difference: string;
  }[];
  lines: InvoiceLineRow[];
}

export interface InvoiceLineRow {
  lineNumber: number;
  upc: string;
  description: string;
  /** Selling units per case — the bridge between a case cost and a unit
   *  retail, without which the two columns look like they should match. */
  pack: string;
  cases: string;
  /** List cost per case. `extCost` is net of allowances, so the two differ by
   *  whatever deal was applied — which is how a deal becomes visible on the
   *  line it affected rather than only in the invoice total. */
  caseCost: string;
  /** Net cost of one selling unit, to the cent — extended cost divided by the
   *  units billed, so it is after allowances and directly comparable to retail.
   *  Null when the line carries no pack or case count to divide by. */
  unitCost: string | null;
  /** Shelf price. Shown as "2/$5.00" where the invoice prices in multiples. */
  retail: string;
  extCost: string;
  extRetail: string;
  /** Null when the line carries no retail, so the panel can show a dash rather
   *  than a misleading 0.0%. */
  marginPct: string | null;
}

//////////////////////////////////////////////////////////////
// Invoice parsing
//////////////////////////////////////////////////////////////

export interface ParseWarning {
  lineNumber: number;
  recordType: string;
  message: string;
}

//////////////////////////////////////////////////////////////
// Suggested actions
//////////////////////////////////////////////////////////////

export type ActionKey =
  | "codes"
  | "slowing"
  | "slowDown"
  | "skipCycle"
  | "tighten"
  | "deliverOften"
  | "unlogged"
  | "watchRhythm"
  | "runsLow"
  /** Not an action. The chip row's "nothing to do here" pile, so a reader can
   *  see that a blank Action cell is a verdict rather than missing data. */
  | "none";

//////////////////////////////////////////////////////////////
// Forecast
//////////////////////////////////////////////////////////////

/** ABC tier on cumulative share of the forecast (see pages/forecast/dev/forecastRanking). */
export type ForecastTier = "A" | "B" | "C";

//////////////////////////////////////////////////////////////
// Forecast saved simulations
//////////////////////////////////////////////////////////////

export type SaveSimRow = {
  upc: string;
  description: string;
  qtySold: number;
  daysActive: number;
  daysAtPrice: number;
  adFcst: number;
  fcstPrice: number;
  fcstTotal: number;
  forecastWindow: number;
  adDays: number;
  markdownDollars: number;
};

//////////////////////////////////////////////////////////////
// Store Groups page
//////////////////////////////////////////////////////////////

/** A store as the group editor lists it: in the group (active 1) or not. */
export type StoreWithGroupStatus = {
  store_number: string;
  store_name: string;
  storeid: number;
  active: 1 | 0;
};

export type FilterOption = "all" | "active" | "inactive";
export type GroupFormType = "create" | "update" | "delete" | "assign" | "";
