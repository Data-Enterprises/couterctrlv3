import { useAppSelector } from "../../hooks";
import ProdCoupons from "./prod/Coupons";
import DevCoupons from "./dev/Coupons";

/**
 * Which Coupons to show.
 *
 * The API switch picks the UI tree as well as the backend: on the dev API you
 * get `pages/coupons/dev`, on prod you get `pages/coupons/prod`. Work happens in
 * dev; when it is signed off, `node scripts/promote-page.mjs coupons` copies it
 * over prod and the two trees match again until the next change.
 */
const Coupons = () => {
  const apiEnv = useAppSelector((state) => state.app.apiEnv);
  return apiEnv === "dev" ? <DevCoupons /> : <ProdCoupons />;
};

export default Coupons;
