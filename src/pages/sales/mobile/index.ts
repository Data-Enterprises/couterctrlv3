import type {
  HourlySale,
  SubSale,
  WeeklySale,
  AggTotals,
  AggCoupons,
} from "../../../interfaces";

export const aggTotals = (
  data: HourlySale[],
  panels: WeeklySale[],
): AggTotals => {
  // Implementation for aggregating totals
  const totals = data.reduce(
    (acc, val) => {
      acc.basket_size_sales += val.basket_size_sales;
      acc.total_tax += val.total_tax;
      acc.transactions += val.transactions;
      return acc;
    },
    {
      total_sales: 0,
      total_tax: 0,
      total_cpn_dollars: 0,
      basket_size_sales: 0,
      transactions: 0,
      avg_basket_amount: 0,
    },
  );

  const formatSales = () => {
    return [...panels].reduce((acc, cur) => {
      acc += cur.total_sales - cur.total_tax;
      return acc;
    }, 0);
  };
  totals.total_sales = formatSales();
  totals.avg_basket_amount = totals.total_sales / totals.transactions;

  return totals;
};

export const aggCoupons = (data: SubSale[]): AggCoupons => {
  const totals = [...data].reduce(
    (acc, val) => {
      acc.digital_coupons += val.digital_coupons;
      acc.elec_instore_coupons += val.elec_instore_coupons;
      acc.elect_store_coupons += val.elec_store_coupons;
      acc.store_coupon += val.store_coupon;
      return acc;
    },
    {
      digital_coupons: 0,
      elec_instore_coupons: 0,
      elect_store_coupons: 0,
      store_coupon: 0,
    },
  );

  return totals;
};

export type PieData = {
  id: string;
  value: number;
};
