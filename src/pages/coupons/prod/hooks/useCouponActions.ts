import * as couponActions from "../../../../features/couponSlice";

/**
 * Coupons' action creators.
 *
 * Used to hand back the legacy slice's actions whenever `devMode` was off,
 * back when that meant the legacy Coupons page was on screen. Coupons has no
 * legacy page any more, and the legacy slice is gone with it.
 */
export const useCouponActions = () => couponActions;
