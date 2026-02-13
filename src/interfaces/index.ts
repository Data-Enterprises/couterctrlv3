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
}

export interface UnassignedStore {
  storeid: number;
  store_number: string;
  store_name: string;
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
  active: 1 | 0;
}

//////////////////////////////////////////////////////////////
// Cashiers Interfaces
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
  termainal: string;
  total_sales: number;
}

// cashiers/transaction endpoint => transaction property from response object

export type UniqueCashier = {
  cashier_name: string;
  cashier_number: number;
  total_sales: number;
  transaction_count: number;
  store_number: string;
};

export interface TransactionListItem {
  storeid: number;
  store_name: string;
  store_number: string;
  sale_type: string;
  sale_date: string;
  line_number: number;
  terminal: string;
  total_sales: number;
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
  trend: string;
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
  sparkline: number[];
  tooltip: string;
  rank: number;
};

export type Handlers = {
  copyUpc?: () => Promise<void> | void;
  copyDesc?: () => Promise<void> | void;
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
  users: User[]
}

export type AdminOption = {
  label: string;
  option: number;
};
