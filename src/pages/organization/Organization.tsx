import { useAppSelector } from "../../hooks";
import ProdOrganization from "./prod/Organization";
import DevOrganization from "./dev/Organization";

/**
 * Which Organization to show.
 *
 * The API switch picks the UI tree as well as the backend: on the dev API you
 * get `pages/organization/dev`, on prod you get `pages/organization/prod`. Work happens in
 * dev; when it is signed off, `node scripts/promote-page.mjs organization` copies it
 * over prod and the two trees match again until the next change.
 */
const Organization = () => {
  const apiEnv = useAppSelector((state) => state.app.apiEnv);
  return apiEnv === "dev" ? <DevOrganization /> : <ProdOrganization />;
};

export default Organization;
