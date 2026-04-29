import { useRef } from "react";
// import { ChevronRightIcon } from "@heroicons/react/24/outline";
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
  idx: number;
  desc: string;
}

const TotalsGridLvlTwo = ({ week, weekTotals, idx, desc = "" }: TotalsGridLvlTwoProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const atsTotalSales =
    week.reduce((acc, day) => acc + day.atsTotalSales, 0) / week.length;

  const chevronTurn = () => {
    if (ref.current) {
      const display = ref.current.getAttribute("data-display");
      if (display === "closed") {
        ref.current.setAttribute("data-display", "open");
        // setIsOpen(true);
      } else {
        ref.current.setAttribute("data-display", "closed");
        // setIsOpen(false);
      }
    }
  };

  return (
    <div className="text-[12px] px-2 py-1.5 rounded-lg shadow-lg grid bg-custom-white max-w-full border border-content/15">
      <div
        className="font-medium cursor-default relative"
        onClick={chevronTurn}
      >
        <div className="flex justify-between items-center">
          <div className="text-content/60">
            {desc} Week {idx}
          </div>
          <div>
            {formatDate(week[0].sale_date)} -{" "}
            {formatDate(week[week.length - 1].sale_date)}
          </div>
        </div>

        {/* <div className="absolute flex right-0 top-0 gap-1 tabular-nums text-[10px]">
          <div className={changeTextColor(weekTotals.dollarChange, 0)}>
            {formatCurrency2(weekTotals.dollarChange)}
          </div>
          <div className={changeTextColor(weekTotals.percentChange, 0)}>
            ({weekTotals.percentChange.toFixed(2)}%)
          </div>
        </div> */}

        {/* metrics grid */}
        <div className="grid grid-cols-4 gap-2 my-1 text-[11.5px]">
          <div className="bg-bkg/75 px-2 py-[1px] rounded-lg shadow-md text-center">
            <div className="text-content/60">TY</div>
            <div>{formatCurrency2(weekTotals.tyTotalSales)}</div>
          </div>

          <div className="bg-bkg/75 px-2 py-[1px] rounded-lg shadow-md text-center">
            <div className="text-content/60">LY</div>
            <div>{formatCurrency2(weekTotals.lyTotalSales)}</div>
          </div>

          <div className="bg-bkg/75 px-2 py-[1px] rounded-lg shadow-md text-center">
            <div className="text-content/60">ATS</div>
            <div>{formatBigNumber(atsTotalSales, 2)}</div>
          </div>
          <div className="bg-bkg/75 px-2 py-[1px] rounded-lg shadow-md text-center">
            <div className={changeTextColor(weekTotals.dollarChange, 0)}>
              {formatCurrency2(weekTotals.dollarChange)}
            </div>
            <div className={changeTextColor(weekTotals.percentChange, 0)}>
              ({weekTotals.percentChange.toFixed(2)}%)
            </div>
          </div>
        </div>
      </div>

      <div
        ref={ref}
        // data-display="closed"
        // className="data-[display=open]:block data-[display=closed]:hidden"
      >
        <div className="grid grid-cols-6 gap-4 text-[10.5px] font-medium text-content/60">
          <div>Date</div>
          <div className="text-right">TY Sales</div>
          <div className="text-right">LY Sales</div>
          <div className="text-right">ATS</div>
          <div className="text-right">$ Change</div>
          <div className="text-right">% Change</div>
        </div>
        {/* thin divider line */}
        <div className="grid grid-cols-2">
          <div className="h-[1.5px] bg-gradient-to-r from-blue-200 to-custom-white"></div>
          <div className="h-[1.5px] bg-gradient-to-l from-blue-200 to-custom-white"></div>
        </div>
        {week.map((day, idx) => (
          <TotalsGridLvlThree key={`${day.sale_date}-${idx}`} week={day} />
        ))}
      </div>
    </div>
  );
};

export default TotalsGridLvlTwo;
