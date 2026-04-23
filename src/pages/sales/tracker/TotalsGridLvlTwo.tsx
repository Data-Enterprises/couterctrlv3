import { useRef, useState } from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { formatDate } from ".";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import type { WeekTotal } from "../../../features/salesSlice";
import { changeTextColor } from ".";
import TotalsGridLvlThree from "./TotalsGridLvlThree";

interface TotalsGridLvlTwoProps {
  week: WeekTotal[];
  weekTotals: {
    tyTotalSales: number;
    lyTotalSales: number;
    percentChange: number;
    dollarChange: number;
  };
}

const TotalsGridLvlTwo = ({ week, weekTotals }: TotalsGridLvlTwoProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const chevronTurn = () => {
    if (ref.current) {
      const display = ref.current.getAttribute("data-display");
      if (display === "closed") {
        ref.current.setAttribute("data-display", "open");
        setIsOpen(true);
      } else {
        ref.current.setAttribute("data-display", "closed");
        setIsOpen(false);
      }
    }
  };

  const chevronClass = () => {
    if (isOpen) {
      return "rotate-90 animate";
    } else {
      return "rotate-0 animate";
    }
  };

  return (
    <div className="odd:bg-blue-500/20">
      <div className="text-[12.5px] grid grid-cols-6 gap-4 font-medium">
        {/* week range */}
        <div className="flex gap-1 items-center pl-2">
          <div
            className="hover:bg-blue-200 transition-all duration-200 rounded-full p-1 flex justify-center"
            onClick={chevronTurn}
          >
            <ChevronRightIcon
              className={`w-4 h-4 cursor-pointer transition-transform duration-100 ease-in-out ${chevronClass()}`}
            />
          </div>
          <div>
            {formatDate(week[0].sale_date)} -{" "}
            {formatDate(week[week.length - 1].sale_date)}
          </div>
        </div>
        {/* The week totals here */}
        <div>{formatCurrency2(weekTotals.tyTotalSales)}</div>
        <div>{formatCurrency2(weekTotals.lyTotalSales)}</div>
        <div className={`${changeTextColor(weekTotals.dollarChange, 0)}`}>
          {formatCurrency2(weekTotals.dollarChange)}
        </div>
        <div className={`${changeTextColor(weekTotals.percentChange, 0)}`}>
          {weekTotals.percentChange.toFixed(2)}%
        </div>
        <div>{formatBigNumber(0)}</div>
      </div>
      <div
        ref={ref}
        data-display="closed"
        className="data-[display=open]:block data-[display=closed]:hidden"
      >
        {week.map((day, idx) => (
          <TotalsGridLvlThree key={idx} week={day} />
        ))}
      </div>
      <div className="bg-blue-500/20">
        <div className="ml-4 border-b border-content/40"></div>
      </div>
    </div>
  );
};

export default TotalsGridLvlTwo;
