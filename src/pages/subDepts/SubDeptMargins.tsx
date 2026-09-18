import { useAppSelector } from "../../hooks";
import ProdSubDeptMargins from "./prod/SubDeptMargins";
import DevSubDeptMargins from "./dev/SubDeptMargins";

/**
 * Which SubDeptMargins to show.
 *
 * The API switch picks the UI tree as well as the backend: on the dev API you
 * get `pages/subDepts/dev`, on prod you get `pages/subDepts/prod`. Work happens in
 * dev; when it is signed off, `node scripts/promote-page.mjs subDepts` copies it
 * over prod and the two trees match again until the next change.
 */
const SubDeptMargins = () => {
  const apiEnv = useAppSelector((state) => state.app.apiEnv);
  return apiEnv === "dev" ? <DevSubDeptMargins /> : <ProdSubDeptMargins />;
};

export default SubDeptMargins;
