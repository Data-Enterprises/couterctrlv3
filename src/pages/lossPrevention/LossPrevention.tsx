import { useAppSelector } from "../../hooks";
import ProdLossPrevention from "./prod/LossPrevention";
import DevLossPrevention from "./dev/LossPrevention";

/**
 * Which LossPrevention to show.
 *
 * The API switch picks the UI tree as well as the backend: on the dev API you
 * get `pages/lossPrevention/dev`, on prod you get `pages/lossPrevention/prod`. Work happens in
 * dev; when it is signed off, `node scripts/promote-page.mjs lossPrevention` copies it
 * over prod and the two trees match again until the next change.
 */
const LossPrevention = () => {
  const apiEnv = useAppSelector((state) => state.app.apiEnv);
  return apiEnv === "dev" ? <DevLossPrevention /> : <ProdLossPrevention />;
};

export default LossPrevention;
