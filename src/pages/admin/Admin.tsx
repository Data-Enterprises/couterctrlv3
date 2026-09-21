import { useAppSelector } from "../../hooks";
import ProdAdmin from "./prod/Admin";
import DevAdmin from "./dev/Admin";

/**
 * Which Admin to show.
 *
 * The API switch picks the UI tree as well as the backend: on the dev API you
 * get `pages/admin/dev`, on prod you get `pages/admin/prod`. Work happens in
 * dev; when it is signed off, `node scripts/promote-page.mjs admin` copies it
 * over prod and the two trees match again until the next change.
 */
const Admin = () => {
  const apiEnv = useAppSelector((state) => state.app.apiEnv);
  return apiEnv === "dev" ? <DevAdmin /> : <ProdAdmin />;
};

export default Admin;
