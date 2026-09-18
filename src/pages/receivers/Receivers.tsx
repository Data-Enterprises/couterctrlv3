import { useAppSelector } from "../../hooks";
import ProdReceivers from "./prod/Receivers";
import DevReceivers from "./dev/Receivers";

/**
 * Which Receivers to show.
 *
 * The API switch picks the UI tree as well as the backend: on the dev API you
 * get `pages/receivers/dev`, on prod you get `pages/receivers/prod`. Work happens in
 * dev; when it is signed off, `node scripts/promote-page.mjs receivers` copies it
 * over prod and the two trees match again until the next change.
 */
const Receivers = () => {
  const apiEnv = useAppSelector((state) => state.app.apiEnv);
  return apiEnv === "dev" ? <DevReceivers /> : <ProdReceivers />;
};

export default Receivers;
