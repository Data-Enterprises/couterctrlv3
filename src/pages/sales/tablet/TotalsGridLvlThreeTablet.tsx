import { formatDate } from "../tracker";
import type { WeekTotal } from "../../../features/salesSlice";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import { changeTextColor } from "../tracker";
// import { changeTextColor } from "...";

interface TotalsGridLvlThreeProps {
  week: WeekTotal;
}
const TotalsGridLvlThreeTablet = ({ week }: TotalsGridLvlThreeProps) => {
  const percentChange =
    week.salesLY === 0
      ? 0
      : ((week.salesTY - week.salesLY) / week.salesLY) * 100;

return (
  <div className="odd:bg-custom-white even:bg-bkg/85">
    <div className="grid grid-cols-6 gap-2 text-[12px] px-3 py-2 items-center">
      <div className="pl-8 font-medium text-slate-700 truncate">
        {formatDate(week.sale_date)}
      </div>

      <div className="text-right tabular-nums text-slate-800">
        {formatCurrency2(week.salesTY)}
      </div>

      <div className="text-right tabular-nums text-slate-800">
        {formatCurrency2(week.salesLY)}
      </div>

      <div
        className={`text-right tabular-nums ${changeTextColor(week.salesTY - week.salesLY, 0)}`}
      >
        {formatCurrency2(week.salesTY - week.salesLY)}
      </div>

      <div
        className={`text-right tabular-nums ${changeTextColor(percentChange, 0)}`}
      >
        {percentChange.toFixed(2)}%
      </div>

      <div className="text-right tabular-nums text-slate-800">
        {formatBigNumber(week.atsTotalSales, 0)}
      </div>
    </div>

    <div className="ml-16 border-b border-slate-200/70"></div>
  </div>
);
};

export default TotalsGridLvlThreeTablet;
