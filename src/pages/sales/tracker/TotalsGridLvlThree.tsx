import { formatDate } from ".";
import type { WeekTotal } from "../../../features/salesSlice";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import { changeTextColor } from ".";

interface TotalsGridLvlThreeProps {
  week: WeekTotal;
}
const TotalsGridLvlThree = ({ week }: TotalsGridLvlThreeProps) => {
  const percentChange =
    week.salesLY === 0
      ? 0
      : ((week.salesTY - week.salesLY) / week.salesLY) * 100;

  return (
    <>
      <div className="grid grid-cols-6 gap-4 bg-bkg/85 text-[12px]">
        <div className="pl-12 font-medium">{formatDate(week.sale_date)}</div>
        <div>{formatCurrency2(week.salesTY)}</div>
        <div>{formatCurrency2(week.salesLY)}</div>
        <div className={`${changeTextColor(week.salesTY - week.salesLY, 0)}`}>
          {formatCurrency2(week.salesTY - week.salesLY)}
        </div>
        <div className={`${changeTextColor(percentChange, 0)}`}>
          {percentChange.toFixed(2)}%
        </div>
        <div>{formatBigNumber(0)}</div>
      </div>
      <div className="bg-bkg/85">
        <div className="ml-12 bg-bkg/85 border-b border-content/20"></div>
      </div>
    </>
  );
};

export default TotalsGridLvlThree;
