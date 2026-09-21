import { useAppSelector } from "../../../hooks";
import SalesPerfMobile from "./mobile/perf/SalesPerfMobile";
import SalesLedger from "./SalesLedger";

/**
 * Sales, dev tree. Rendered by `pages/sales/Sales.tsx` when the session is on
 * the dev API.
 *
 * Desktop and mobile only. The dev tree carries no tablet layout — tablet gets
 * a fresh start later rather than a copy of the old one — so a tablet takes the
 * desktop ledger here, the same way the side bar already treats it as desktop.
 *
 * Everything under `pages/sales/dev` reads `state.dev.*` and dispatches to the
 * `features/dev` slices, so nothing done here reaches prod's Sales.
 */
const Sales = () => {
  const isMobile = useAppSelector((state) => state.app.isMobile);
  return isMobile ? <SalesPerfMobile /> : <SalesLedger />;
};

export default Sales;
