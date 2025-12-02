import type { WeekDay } from ".";
import { formatCurrency2, formatDate } from "../../../../utils";

interface WeekCardProps {
  week: string;
  sales: WeekDay;
}

const WeekCard = ({ week, sales }: WeekCardProps) => {
  const calcTotalSales = () => {
    const values = Object.values(sales);
    const total = values.reduce((acc, cur) => acc + (cur || 0), 0);
    return total;
  };

  const calcAvgSales = () => {
    const values = Object.values(sales);
    const total = values.reduce((acc, cur) => acc + (cur || 0), 0);
    return total / values.length;
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg px-2 py-1">
      <div className="text-center font-semibold border-b border-content/30 pb-1">
        {formatDate(week)}
      </div>
      <div className="grid grid-cols-2 text-sm gap-0.5 mt-1">
        <div className="flex gap-1">
          <div className="font-medium">Mon:</div>
          <div>{formatCurrency2(sales.Monday!)}</div>
        </div>
        <div className="flex gap-1 justify-end">
          <div className="font-medium">Fri:</div>
          <div>{formatCurrency2(sales.Friday!)}</div>
        </div>
        <div className="flex gap-1">
          <div className="font-medium">Tue:</div>
          <div>{formatCurrency2(sales.Tuesday!)}</div>
        </div>
        <div className="flex gap-1 justify-end">
          <div className="font-medium">Sat:</div>
          <div>{formatCurrency2(sales.Saturday!)}</div>
        </div>
        <div className="flex gap-1">
          <div className="font-medium">Wed:</div>
          <div>{formatCurrency2(sales.Wednesday!)}</div>
        </div>
        <div className="flex gap-1 justify-end">
          <div className="font-medium">Sun:</div>
          <div>{formatCurrency2(sales.Sunday!)}</div>
        </div>
        <div className="flex gap-1">
          <div className="font-medium">Thu:</div>
          <div>{formatCurrency2(sales.Thursday!)}</div>
        </div>
      </div>
      <div className="flex justify-center gap-4 items-center font-semibold border-t border-content/30">
        <div>
          Total: {formatCurrency2(calcTotalSales())}
        </div>

        <div>
          Avg: {formatCurrency2(calcAvgSales())}
        </div>
      </div>
    </div>
  );
};

export default WeekCard;
