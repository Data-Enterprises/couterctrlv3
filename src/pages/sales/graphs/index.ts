import type { SubSale } from "../../../interfaces";

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
};

export const reduceSubs = (data: SubSale[]): TopSub[] => {
  return [...data].reduce((acc: TopSub[], curr) => {
    const exists = acc.find((d) => d.sub_department === curr.sub_department);
    if (exists) {
      exists.total_sales += curr.total_sales;
      exists.net_sales += curr.net_sales;
      exists.qty += curr.qty;
      exists.digital_coupons += curr.digital_coupons;
      exists.elec_instore_coupons += curr.elec_instore_coupons;
      exists.elec_store_coupons += curr.elec_store_coupons;
      exists.store_coupon += curr.store_coupon;
    } else {
      acc.push({
        sub_department: curr.sub_department,
        sub_department_description: curr.sub_department_description,
        total_sales: curr.total_sales,
        net_sales: curr.net_sales,
        qty: curr.qty,
        digital_coupons: curr.digital_coupons,
        elec_instore_coupons: curr.elec_instore_coupons,
        elec_store_coupons: curr.elec_store_coupons,
        store_coupon: curr.store_coupon,
      });
    }
    return acc;
  }, []);
};
