import { useAppSelector } from "../../hooks";
import ProdVendors from "./prod/Vendors";
import DevVendors from "./dev/Vendors";

/**
 * Which Vendors to show.
 *
 * The API switch picks the UI tree as well as the backend: on the dev API you
 * get `pages/vendors/dev`, on prod you get `pages/vendors/prod`. Work happens in
 * dev; when it is signed off, `node scripts/promote-page.mjs vendors` copies it
 * over prod and the two trees match again until the next change.
 */
const Vendors = () => {
  const apiEnv = useAppSelector((state) => state.app.apiEnv);
  return apiEnv === "dev" ? <DevVendors /> : <ProdVendors />;
};

export default Vendors;
