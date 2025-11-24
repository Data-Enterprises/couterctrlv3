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

export interface SalesTwoDates {
  qty: number;
  sale_date: string;
  store_name: string;
  store_number: string;
  storeid: number;
  total_sales: number;
  weight: number;
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
  bin: number;
  description: string;
  qty: number;
  sale_date: string;
  sales: number;
  store_name: string;
  store_number: string;
  storeid: number;
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
}