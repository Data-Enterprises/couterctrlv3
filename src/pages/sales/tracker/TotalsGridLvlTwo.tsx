import { useRef } from "react";
// import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { formatDate } from ".";
import { formatCurrency2 } from "../../../utils";
import type { WeekTotal } from "../../../features/salesSlice";
import { changeTextColor } from ".";
import TotalsGridLvlThree from "./TotalsGridLvlThree";
import CardLine from "./CardLine";

interface TotalsGridLvlTwoProps {
  week: WeekTotal[];
  weekTotals: {
    tyTotalSales: number;
    lyTotalSales: number;
    percentChange: number;
    dollarChange: number;
    atsTotalSales: number;
  };
  idx: number;
  desc: string;
}

const TotalsGridLvlTwo = ({
  week,
  weekTotals,
  idx,
  desc = "",
}: TotalsGridLvlTwoProps) => {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="text-[12px] px-2 py-1.5 rounded-lg shadow-lg bg-custom-white max-w-full border border-content/15 hover:shadow-md transition-shadow duration-200">
      <div className="font-medium cursor-pointer relative select-none">
        <div className="flex justify-between items-center">
          <div className="text-content/60">
            {desc} Week {idx}
          </div>
          <div className="text-[11px] text-content/90 flex items-center gap-1">
            {formatDate(week[0].sale_date)} –{" "}
            {formatDate(week[week.length - 1].sale_date)}
          </div>
        </div>
        <div className="h-[1px] bg-gradient-to-r from-gray-200 to-transparent my-1"></div>

        <div className="grid grid-cols-[1fr_3fr] gap-2 my-2 text-[11px]">
          <div className="bg-bkg/70 px-2 py-[2px] rounded-lg shadow-md border-2 border-content/15">
            <div className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-0.5 text-[11px] leading-5 mt-0.5">
              <div className="text-content/60">TY Sales</div>
              <div className="text-right">
                {formatCurrency2(weekTotals.tyTotalSales)}
              </div>

              <div className="text-content/60">LY Sales</div>
              <div className="text-right">
                {formatCurrency2(weekTotals.lyTotalSales)}
              </div>

              <div className="text-content/60">ATS Sales</div>
              <div className="text-right">
                {formatCurrency2(weekTotals.atsTotalSales)}
              </div>

              <div className="text-content/60">$ vs LY</div>
              <div
                className={`text-right ${changeTextColor(weekTotals.dollarChange, 0)}`}
              >
                {formatCurrency2(weekTotals.dollarChange)}
              </div>

              <div className="text-content/60">% vs LY</div>
              <div
                className={`text-right ${changeTextColor(weekTotals.percentChange, 0)}`}
              >
                {weekTotals.percentChange.toFixed(2)}%
              </div>
            </div>
          </div>

          <CardLine data={week} />
        </div>
      </div>

      <div
        ref={ref}
        className={`overflow-hidden transition-all duration-200 grid grid-cols-4 gap-1.5
          ${ref.current?.getAttribute("data-display") === "closed" ? "max-h-0" : "max-h-[999px]"}
        `}
      >
        {week.map((day, idx) => (
          <TotalsGridLvlThree key={`${day.sale_date}-${idx}`} weekDay={day} />
        ))}
      </div>
    </div>
  );
};

export default TotalsGridLvlTwo;
