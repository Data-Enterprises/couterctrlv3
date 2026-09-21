import { useAppSelector } from "../../hooks";
import ProdCashiers from "./prod/Cashiers";
import DevCashiers from "./dev/Cashiers";

/**
 * Which Cashiers to show.
 *
 * The API switch picks the UI tree as well as the backend: on the dev API you
 * get `pages/cashiers/dev`, on prod you get `pages/cashiers/prod`. Work happens in
 * dev; when it is signed off, `node scripts/promote-page.mjs cashiers` copies it
 * over prod and the two trees match again until the next change.
 */
const Cashiers = () => {
  const apiEnv = useAppSelector((state) => state.app.apiEnv);
  return apiEnv === "dev" ? <DevCashiers /> : <ProdCashiers />;
};

export default Cashiers;
