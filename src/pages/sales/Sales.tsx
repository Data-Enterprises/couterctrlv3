import { useAppSelector } from "../../hooks";
import ProdSales from "./prod/Sales";
import DevSales from "./dev/Sales";

/**
 * Which Sales to show.
 *
 * The API switch picks the UI tree as well as the backend: on the dev API you
 * get `pages/sales/dev`, on prod you get `pages/sales/prod`. Work happens in
 * dev; when it is signed off, the dev files replace the prod ones and the two
 * trees match again until the next change.
 *
 * Code both trees use — the perf chart and bars, ledger row, grading helpers,
 * ledgerUtils — stays outside `prod/` and `dev/` and is shared, as are the
 * session slices (store, dates, user) so a flip keeps what you were looking at.
 */
const Sales = () => {
  const apiEnv = useAppSelector((state) => state.app.apiEnv);
  return apiEnv === "dev" ? <DevSales /> : <ProdSales />;
};

export default Sales;
