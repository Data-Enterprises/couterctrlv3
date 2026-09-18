import { useAppSelector } from "../../hooks";
import ProdCategories from "./prod/Categories";
import DevCategories from "./dev/Categories";

/**
 * Which Categories to show.
 *
 * The API switch picks the UI tree as well as the backend: on the dev API you
 * get `pages/categories/dev`, on prod you get `pages/categories/prod`. Work happens in
 * dev; when it is signed off, `node scripts/promote-page.mjs categories` copies it
 * over prod and the two trees match again until the next change.
 */
const Categories = () => {
  const apiEnv = useAppSelector((state) => state.app.apiEnv);
  return apiEnv === "dev" ? <DevCategories /> : <ProdCategories />;
};

export default Categories;
