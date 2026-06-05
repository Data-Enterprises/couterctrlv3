import { useEffect, useState } from "react";
import { useSubMarginCtx } from "../hooks";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import type { BarData } from "../display/widgets";
import { gpm } from "../../../functions";

interface TotalsHeaderProps {
  data: BarData[];
}
const TotalsHeader = ({ data }: TotalsHeaderProps) => {
  const { selectedWeekDay } = useSubMarginCtx();
  const [totals, setTotals] = useState<BarData>({
    date: "",
    sales: 0,
    net: 0,
    qty: 0,
    tax: 0,
    cogs: 0,
    gpm: "",
  });

  useEffect(() => {
    if (selectedWeekDay === "") {
      const totalSales = data.reduce((acc, data) => acc + data.sales, 0);
      const totalNetSales = data.reduce((acc, data) => acc + data.net, 0);
      const totalQty = data.reduce((acc, data) => acc + data.qty, 0);
      const totalTax = data.reduce((acc, data) => acc + data.tax, 0);
      const totalCogs = data.reduce((acc, data) => acc + data.cogs, 0);
      setTotals({
        date: `${data[0].date} - ${data[data.length - 1].date}`,
        sales: totalSales,
        net: totalNetSales,
        qty: totalQty,
        tax: totalTax,
        cogs: totalCogs,
        gpm: gpm(totalNetSales, totalCogs),
      });
    } else {
      const selectedData = data.filter((d) => d.date === selectedWeekDay);
      if (selectedData.length) {
        setTotals(selectedData[0]);
      }
    }
  }, [data, selectedWeekDay]);

  return (
    <div className="bg-custom-white text-sm rounded-xl border border-slate-200/70 shadow-md px-3 py-1.5 transition-all duration-200">
      <div
        className={`font-medium text-slate-500`}
      >
        {totals.date}
      </div>

      <div className="grid grid-cols-2 h-[1.5px] mb-1.5">
        <div className="bg-gradient-to-r from-[rgb(30,45,80)] to-custom-white"></div>
        <div className="bg-gradient-to-l from-[rgb(30,45,80)] to-custom-white"></div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 text-slate-700">
        <div
          className={`flex flex-col py-1.5 transition-all duration-200 bg-bkg rounded-md leading-snug items-center justify-between`}
        >
          <span>Sales</span>
          <span className="font-semibold text-content/95">
            {formatCurrency2(totals.sales)}
          </span>
        </div>
        <div
          className={`flex flex-col py-1.5 transition-all duration-200 bg-bkg rounded-md shadow-md leading-snug items-center justify-between`}
        >
          <span>Net</span>
          <span className="font-semibold text-content/95">
            {formatCurrency2(totals.net)}
          </span>
        </div>
        <div
          className={`flex flex-col py-1.5 transition-all duration-200 bg-bkg rounded-md shadow-md leading-snug items-center justify-between`}
        >
          <span>Qty</span>
          <span className="font-semibold text-content/95">
            {formatBigNumber(totals.qty, 0)}
          </span>
        </div>
        <div
          className={`flex flex-col py-1.5 transition-all duration-200 bg-bkg rounded-md shadow-md leading-snug items-center justify-between`}
        >
          <span>Tax</span>
          <span className="font-semibold text-content/95">
            {formatCurrency2(totals.tax)}
          </span>
        </div>
        <div
          className={`flex flex-col py-1.5 transition-all duration-200 bg-bkg rounded-md shadow-md leading-snug items-center justify-between`}
        >
          <span>COGS</span>
          <span className="font-semibold text-content/95">
            {formatCurrency2(totals.cogs)}
          </span>
        </div>
        <div
          className={`flex flex-col py-1.5 transition-all duration-200 bg-bkg rounded-md shadow-md leading-snug items-center justify-between`}
        >
          <span>GPM</span>
          <span className="font-semibold text-content/95">{totals.gpm}</span>
        </div>
      </div>
    </div>
  );
};

export default TotalsHeader;
