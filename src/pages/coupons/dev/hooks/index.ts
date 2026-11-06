// Hooks
import { useAppSelector } from "../../../../hooks";

// Redux
import * as couponActions from "../../../../features/dev/devCouponSlice";

export const useCouponContext = () => {
  const {
    coupons,
    isFetching,
    gridCoupons,
    noCouponsFound,
    couponMobileStage,
    uniqueCpnDates,
    uniqueSubDepts,
    subDeptMobileFilter,
    uniqueDateMobileFilter,
    showSubsMobileFilter,
  } = useAppSelector((state) => state.dev.coupons);
  const { startDate, endDate, type, lastStore, lastGroup } = useAppSelector(
    (state) => state.search,
  );
  const { url, token, isMobile } = useAppSelector((state) => state.app);

  return {
    url,
    token,
    coupons,
    startDate,
    endDate,
    type,
    lastStore,
    lastGroup,
    isFetching,
    gridCoupons,
    noCouponsFound,
    isMobile,
    couponMobileStage,
    uniqueCpnDates,
    uniqueSubDepts,
    subDeptMobileFilter,
    uniqueDateMobileFilter,
    showSubsMobileFilter,
  };
};

/**
 * Coupons' action creators.
 */
export const useCouponActions = () => couponActions;
