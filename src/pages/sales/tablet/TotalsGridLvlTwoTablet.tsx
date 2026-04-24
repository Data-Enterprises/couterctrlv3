import { useRef, useState } from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { formatDate } from "../tracker";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import type { WeekTotal } from "../../../features/salesSlice";
import { changeTextColor } from "../tracker";
import TotalsGridLvlThreeTablet from "./TotalsGridLvlThreeTablet";

interface TotalsGridLvlTwoProps {
  week: WeekTotal[];
  weekTotals: {
    tyTotalSales: number;
    lyTotalSales: number;
    percentChange: number;
    dollarChange: number;
  };
}

const TotalsGridLvlTwoTablet = ({ week, weekTotals }: TotalsGridLvlTwoProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const atsTotalSales = week.reduce((acc, day) => acc + day.atsTotalSales, 0) / week.length

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
  <div className="">
    <div
      className="grid grid-cols-6 gap-2 rounded-xl px-3 py-2 text-[12px] md:text-[12.5px] font-medium items-center cursor-pointer bg-white hover:bg-blue-50 transition-colors duration-200"
      onClick={chevronTurn}
    >
      <div className="flex items-center gap-2 min-w-0 col-span-2 md:col-span-1">
        <div className="rounded-full p-1 bg-slate-50 ring-1 ring-slate-200 flex justify-center items-center shrink-0">
          <ChevronRightIcon
            className={`w-4 h-4 cursor-pointer transition-transform duration-150 ease-in-out ${chevronClass()}`}
          />
        </div>

        <div className="truncate text-content">
          {formatDate(week[0].sale_date)} -{" "}
          {formatDate(week[week.length - 1].sale_date)}
        </div>
      </div>

      <div className="text-right tabular-nums text-content">
        {formatCurrency2(weekTotals.tyTotalSales)}
      </div>

      <div className="text-right tabular-nums text-content">
        {formatCurrency2(weekTotals.lyTotalSales)}
      </div>

      <div
        className={`text-right tabular-nums ${changeTextColor(weekTotals.dollarChange, 0)}`}
      >
        {formatCurrency2(weekTotals.dollarChange)}
      </div>

      <div
        className={`text-right tabular-nums ${changeTextColor(weekTotals.percentChange, 0)}`}
      >
        {weekTotals.percentChange.toFixed(2)}%
      </div>

      <div className="text-right tabular-nums text-content">
        {formatBigNumber(atsTotalSales, 2)}
      </div>
    </div>

    <div
      ref={ref}
      data-display="closed"
      className="data-[display=open]:block data-[display=closed]:hidden"
    >
      {week.map((day, idx) => (
        <TotalsGridLvlThreeTablet key={idx} week={day} />
      ))}
    </div>

    <div className="border-b border-slate-200"></div>
  </div>
);
};

export default TotalsGridLvlTwoTablet;
