import type { SubSale } from "../../../interfaces";

export const isValidData = (data: SubSale) => {
  if (
    data.net_sales === 0 &&
    data.qty === 0 &&
    data.total_sales === 0 &&
    data.total_tax === 0 &&
    data.weight === 0 &&
    data.digital_coupons === 0 &&
    data.elec_instore_coupons === 0 &&
    data.elec_store_coupons === 0 &&
    data.store_coupon === 0
  ) {
    return false;
  }
  return true;
};
