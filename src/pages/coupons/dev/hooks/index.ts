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
 *
 * Used to hand back the legacy slice's actions whenever `devMode` was off,
 * back when that meant the legacy Coupons page was on screen. Coupons has no
 * legacy page any more, and the legacy slice is gone with it.
 */
export const useCouponActions = () => couponActions;
