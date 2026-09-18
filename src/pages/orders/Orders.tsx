import { useAppSelector } from "../../hooks";
import ProdOrders from "./prod/Orders";
import DevOrders from "./dev/Orders";

/**
 * Which Orders to show.
 *
 * The API switch picks the UI tree as well as the backend: on the dev API you
 * get `pages/orders/dev`, on prod you get `pages/orders/prod`. Work happens in
 * dev; when it is signed off, `node scripts/promote-page.mjs orders` copies it
 * over prod and the two trees match again until the next change.
 */
const Orders = () => {
  const apiEnv = useAppSelector((state) => state.app.apiEnv);
  return apiEnv === "dev" ? <DevOrders /> : <ProdOrders />;
};

export default Orders;
