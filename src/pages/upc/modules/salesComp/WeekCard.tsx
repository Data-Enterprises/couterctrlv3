import type { WeekDay } from ".";
import { formatCurrency2, formatDate } from "../../../../utils";

interface WeekCardProps {
  week: string;
  sales: WeekDay;
}

const WeekCard = ({ week, sales }: WeekCardProps) => {
  console.log(week, sales);
  return (
    <div className="bg-custom-white rounded-lg shadow-lg p-2">
      <div className="text-center font-semibold border-b border-gray-200">
        <div>Week Starting</div>
        <div> {formatDate(week)}</div>
      </div>
      <div className="grid grid-cols-2 text-sm gap-1 mt-1">
        <div className="flex gap-1">
          <div className="font-medium">Mon:</div>
          <div>{formatCurrency2(sales.Monday!)}</div>
        </div>
        <div className="flex gap-1 justify-end">
          <div className="font-medium">Tues:</div>
          <div>{formatCurrency2(sales.Tuesday!)}</div>
        </div>
        <div className="flex gap-1">
          <div className="font-medium">Wed:</div>
          <div>{formatCurrency2(sales.Wednesday!)}</div>
        </div>
        <div className="flex gap-1 justify-end">
          <div className="font-medium">Thurs:</div>
          <div>{formatCurrency2(sales.Thursday!)}</div>
        </div>
        <div className="flex gap-1">
          <div className="font-medium">Fri:</div>
          <div>{formatCurrency2(sales.Friday!)}</div>
        </div>
        <div className="flex gap-1 justify-end">
          <div className="font-medium">Sat:</div>
          <div>{formatCurrency2(sales.Saturday!)}</div>
        </div>
        <div className="flex gap-1">
          <div className="font-medium">Sun:</div>
          <div>{formatCurrency2(sales.Sunday!)}</div>
        </div>
      </div>
    </div>
  );
};

export default WeekCard;
