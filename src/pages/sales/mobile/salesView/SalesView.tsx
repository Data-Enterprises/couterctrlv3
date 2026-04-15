import { useMobileSalesCtx } from "../hooks";

import SalesViewHourly from "./SalesViewHourly";
import SalesViewTopTen from "./SalesViewTopTen";
import SalesViewWeekly from "./SalesViewWeekly";

/**
 * THE SCROLL FLOW:
 * 
 * General overview => Granular
 * weekly => hourly => top ten
 */
const SalesView = () => {
  const { salesViewHourly, salesViewTopTen, salesViewWeekly } =
    useMobileSalesCtx();

  return (
    <div className="p-2">
      <SalesViewWeekly weekly={salesViewWeekly} />
      <SalesViewHourly hourly={salesViewHourly} />
      <SalesViewTopTen topTen={salesViewTopTen} />
    </div>
  );
};

export default SalesView;
