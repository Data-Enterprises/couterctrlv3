import { useAppSelector } from "../../hooks";
import ProdCouponSales from "./prod/CouponSales";
import DevCouponSales from "./dev/CouponSales";

/**
 * Which CouponSales to show.
 *
 * The API switch picks the UI tree as well as the backend: on the dev API you
 * get `pages/couponSales/dev`, on prod you get `pages/couponSales/prod`. Work happens in
 * dev; when it is signed off, `node scripts/promote-page.mjs couponSales` copies it
 * over prod and the two trees match again until the next change.
 */
const CouponSales = () => {
  const apiEnv = useAppSelector((state) => state.app.apiEnv);
  return apiEnv === "dev" ? <DevCouponSales /> : <ProdCouponSales />;
};

export default CouponSales;
