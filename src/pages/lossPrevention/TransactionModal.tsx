import { useAppSelector } from "../../hooks";
import ProdTransactionModal from "./prod/TransactionModal";
import DevTransactionModal from "./dev/TransactionModal";

/**
 * Which TransactionModal to show.
 *
 * The API switch picks the UI tree as well as the backend: on the dev API you
 * get `pages/lossPrevention/dev`, on prod you get `pages/lossPrevention/prod`. Work happens in
 * dev; when it is signed off, `node scripts/promote-page.mjs lossPrevention` copies it
 * over prod and the two trees match again until the next change.
 */
const TransactionModal = () => {
  const apiEnv = useAppSelector((state) => state.app.apiEnv);
  return apiEnv === "dev" ? <DevTransactionModal /> : <ProdTransactionModal />;
};

export default TransactionModal;
