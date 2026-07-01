import { useAppSelector } from "../../../hooks";
import * as couponActions from "../../../features/couponSlice";
import * as couponLegacyActions from "../../../features/couponLegacySlice";

export const useCouponActions = () => {
  const devMode = useAppSelector((s) => s.app.devMode);
  return devMode ? couponActions : couponLegacyActions;
};
