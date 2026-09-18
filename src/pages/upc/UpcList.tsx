import { useAppSelector } from "../../hooks";
import ProdUpcList from "./prod/UpcList";
import DevUpcList from "./dev/UpcList";

/**
 * Which UpcList to show.
 *
 * The API switch picks the UI tree as well as the backend: on the dev API you
 * get `pages/upc/dev`, on prod you get `pages/upc/prod`. Work happens in
 * dev; when it is signed off, `node scripts/promote-page.mjs upc` copies it
 * over prod and the two trees match again until the next change.
 */
const UpcList = () => {
  const apiEnv = useAppSelector((state) => state.app.apiEnv);
  return apiEnv === "dev" ? <DevUpcList /> : <ProdUpcList />;
};

export default UpcList;
