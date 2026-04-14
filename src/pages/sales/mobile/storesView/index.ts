import type { PieData } from "..";
import type { AggCoupons, AggTotals } from "../../../../interfaces";

export const defaultAggTotals: AggTotals = {
  total_sales: 0,
  total_tax: 0,
  total_cpn_dollars: 0,
  basket_size_sales: 0,
  transactions: 0,
  avg_basket_amount: 0,
};

export const defaultAggCoupons: AggCoupons = {
  digital_coupons: 0,
  elec_instore_coupons: 0,
  elect_store_coupons: 0,
  store_coupon: 0,
};

export const pieData: PieData[] = [
  { id: "Digital Coupons", value: 0 },
  { id: "E. In-Store Coupons", value: 0 },
  { id: "E. Store Coupons", value: 0 },
  { id: "Store Coupons", value: 0 },
];

export const sortOptions = [
  { id: "total_sales", label: "Sales" },
  { id: "total_tax", label: "Tax" },
  { id: "qty", label: "Qty" },
  { id: "weight", label: "Weight" },
  { id: "", label: "Reset" },
];
