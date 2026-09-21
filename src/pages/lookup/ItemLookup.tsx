import { useAppSelector } from "../../hooks";
import ProdItemLookup from "./prod/ItemLookup";
import DevItemLookup from "./dev/ItemLookup";

/**
 * Which ItemLookup to show.
 *
 * The API switch picks the UI tree as well as the backend: on the dev API you
 * get `pages/lookup/dev`, on prod you get `pages/lookup/prod`. Work happens in
 * dev; when it is signed off, `node scripts/promote-page.mjs lookup` copies it
 * over prod and the two trees match again until the next change.
 */
const ItemLookup = () => {
  const apiEnv = useAppSelector((state) => state.app.apiEnv);
  return apiEnv === "dev" ? <DevItemLookup /> : <ProdItemLookup />;
};

export default ItemLookup;
