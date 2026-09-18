import { useAppSelector } from "../../hooks";
import ProdGroups from "./prod/Groups";
import DevGroups from "./dev/Groups";

/**
 * Which Groups to show.
 *
 * The API switch picks the UI tree as well as the backend: on the dev API you
 * get `pages/groups/dev`, on prod you get `pages/groups/prod`. Work happens in
 * dev; when it is signed off, `node scripts/promote-page.mjs groups` copies it
 * over prod and the two trees match again until the next change.
 */
const Groups = () => {
  const apiEnv = useAppSelector((state) => state.app.apiEnv);
  return apiEnv === "dev" ? <DevGroups /> : <ProdGroups />;
};

export default Groups;
