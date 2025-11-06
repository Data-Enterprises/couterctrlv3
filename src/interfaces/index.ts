export type JsonError = {
  message: string;
};

export interface SecurityQuestion {
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
  terminal: string;
  total_sales: number;
  weight: number;
}
