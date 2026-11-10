// Hooks
import { shallowEqual } from "react-redux";
import { useAppSelector } from "../../../../hooks";

/** The Coupon Sales slice, read where it is used instead of passed down. */
export const useCouponSalesCtx = () =>
  useAppSelector((s) => s.dev.couponSales, shallowEqual);
