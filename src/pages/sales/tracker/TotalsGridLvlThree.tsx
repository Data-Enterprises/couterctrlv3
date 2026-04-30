import { formatDate } from ".";
import type { WeekTotal } from "../../../features/salesSlice";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import { changeTextColor } from ".";

interface TotalsGridLvlThreeProps {
  weekDay: WeekTotal;
}

const TotalsGridLvlThree = ({ weekDay }: TotalsGridLvlThreeProps) => {
  const percentChange =
    weekDay.salesLY === 0
      ? 0
      : ((weekDay.salesTY - weekDay.salesLY) / weekDay.salesLY) * 100;

  const dow = new Date(weekDay.sale_date).toLocaleDateString("en-US", {
    weekday: "short",
  });

  const totalSales = weekDay.salesTY;
  const totalTrans = weekDay.transaction_count;
  const atsTotalSales = totalTrans === 0 ? 0 : totalSales / totalTrans;

  return (
    <div className="bg-bkg/25 shadow-md rounded-lg px-2 py-1 text-[10px] grid grid-cols-2 gap-x-2">
      {/* Header: Day of week + formatted date */}
      <div className="font-medium text-content/60">{dow}</div>
      <div className="font-medium text-content/60 text-right">
        {formatDate(weekDay.sale_date)}
      </div>

      <div className="col-span-2 border-t border-bkg/40 my-0.5 -mx-2"></div>

      <div className="text-content/60">ATS Sales</div>
      <div className="text-right">{formatBigNumber(atsTotalSales, 0)}</div>

      <div className="text-content/60 text-xs">$ vs LY</div>
      <div
        className={`text-right font-medium ${changeTextColor(
          weekDay.salesTY - weekDay.salesLY,
          0,
        )}`}
      >
        {formatCurrency2(weekDay.salesTY - weekDay.salesLY)}
      </div>

      <div className="text-content/60 text-xs">% vs LY</div>
      <div
        className={`text-right font-medium ${changeTextColor(percentChange, 0)}`}
      >
        {percentChange.toFixed(2)}%
      </div>
    </div>
  );
};

export default TotalsGridLvlThree;
