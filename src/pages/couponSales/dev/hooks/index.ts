// Hooks
import { shallowEqual } from "react-redux";
import { useAppSelector } from "../../../../hooks";

/** The Coupon Sales slice, the API connection and the user's stores, read where they are used instead of passed down. */
export const useCouponSalesCtx = () => {
  const couponSales = useAppSelector((s) => s.dev.couponSales, shallowEqual);
  const { url, token } = useAppSelector((s) => s.app);
  const assignedStores = useAppSelector((s) => s.user.assignedStores);
  const groupStores = useAppSelector((s) => s.user.selectedGroupStores);
  return { ...couponSales, url, token, assignedStores, groupStores };
};
