// Hooks
import { useAppDispatch, useAppSelector } from "../../../../hooks";

// Redux
import * as couponActions from "../../../../features/dev/devCouponSlice";

/** Coupons' flat context: the slice, the search and the app values every part reads. */
export const useCouponContext = () => {
  const dispatch = useAppDispatch();
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
    receiptLines,
  } = useAppSelector((state) => state.dev.coupons);
  const { startDate, endDate, type, lastStore, lastGroup, selectedGroup } =
    useAppSelector((state) => state.search);
  const { selectedGroupStores, assignedStores } = useAppSelector(
    (state) => state.user,
  );
  const { url, token, isMobile } = useAppSelector((state) => state.app);

  return {
    dispatch,
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
    receiptLines,
    selectedGroup,
    selectedGroupStores,
    assignedStores,
  };
};

/**
 * Coupons' action creators.
 */
export const useCouponActions = () => couponActions;
