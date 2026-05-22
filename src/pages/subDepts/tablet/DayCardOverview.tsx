import { useSubMarginCtx } from "../hooks";
import { useRef, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { AgGridReact } from "ag-grid-react";

import { type BarData } from "../display/widgets";
import { setSelectedWeekDay } from "../../../features/subMarginSlice";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import { gpm } from "../../../functions";

interface SalesGridProps {
  gridData: BarData[];
}

const DayCardOverView = ({ gridData }: SalesGridProps) => {
  const gridRef = useRef<AgGridReact>(null);
  const { selectedWeekDay } = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const sm = useAppSelector((state) => state.subMargin);
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
    const totalSales = gridData.reduce((acc, data) => acc + data.sales, 0);
    const totalNetSales = gridData.reduce((acc, data) => acc + data.net, 0);
    const totalQty = gridData.reduce((acc, data) => acc + data.qty, 0);
    const totalTax = gridData.reduce((acc, data) => acc + data.tax, 0);
    const totalCogs = gridData.reduce((acc, data) => acc + data.cogs, 0);
    setTotals({
      date: `${gridData[0].date} - ${gridData[gridData.length - 1].date}`,
      sales: totalSales,
      net: totalNetSales,
      qty: totalQty,
      tax: totalTax,
      cogs: totalCogs,
      gpm: gpm(totalNetSales, totalCogs),
    });
  }, [gridData]);

  const handleCardClick = (date: string) => {
    if (date.indexOf("-") > -1) {
      dispatch(setSelectedWeekDay(""));
      return;
    }

    if (date !== selectedWeekDay) {
      dispatch(setSelectedWeekDay(date));
    } else {
      dispatch(setSelectedWeekDay(""));
    }
  };

  useEffect(() => {
    if (gridRef.current && gridRef.current.api && selectedWeekDay) {
      gridRef.current.api.forEachNode((node) => {
        const date = new Date(selectedWeekDay).toISOString().split("T")[0];
        const nodeDate = new Date(node.data.date).toISOString().split("T")[0];
        if (nodeDate === date && !node.isSelected()) {
          node.setSelected(true);
        }
      });
    }
  }, [
    selectedWeekDay,
    gridRef.current,
    sm.itemGridData,
    sm.filteredCostGridData,
  ]);

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <DayCard data={totals} handleCardClick={handleCardClick} selectedWeekDay={selectedWeekDay} />

      {gridData.map((data, i) => (
        <DayCard key={i} data={data} handleCardClick={handleCardClick} selectedWeekDay={selectedWeekDay} />
      ))}
    </div>
  );
};

export default DayCardOverView;

interface DayCardProps {
  data: BarData;
  handleCardClick: (date: string) => void;
  selectedWeekDay: string;
}
const DayCard = ({ data, handleCardClick, selectedWeekDay }: DayCardProps) => {
  const activeStyle =
    data.date === selectedWeekDay ? "bg-[rgb(30,45,80)]/75 text-custom-white" : "bg-custom-white";
  console.log(data.date,selectedWeekDay,activeStyle)
  return (
    <div
      className={`rounded-xl border border-slate-200/70 shadow-md px-3 py-1.5 transition-all duration-200 ${activeStyle}`}
      onClick={() => handleCardClick(data.date)}
    >
      <div
        className={`mb-1 text-[13px] font-medium ${data.date === selectedWeekDay ? "text-custom-white" : "text-slate-500"}`}
      >
        {data.date}
      </div>

      <div className="text-[13.5px] grid lg:grid-cols-2 gap-2 text-slate-700">
        <div className={`flex flex-col transition-all duration-200 ${data.date === selectedWeekDay ? "bg-custom-white" : "bg-bkg"} rounded-md leading-snug items-center justify-between`}>
          <span>Sales</span>
          <span className="font-semibold text-slate-900">
            {formatCurrency2(data.sales)}
          </span>
        </div>
        <div className={`flex flex-col transition-all duration-200 ${data.date === selectedWeekDay ? "bg-custom-white" : "bg-bkg"} rounded-md leading-snug items-center justify-between`}>
          <span>Net</span>
          <span className="font-semibold text-slate-900">
            {formatCurrency2(data.net)}
          </span>
        </div>
        <div className={`flex flex-col transition-all duration-200 ${data.date === selectedWeekDay ? "bg-custom-white" : "bg-bkg"} rounded-md leading-snug items-center justify-between`}>
          <span>Qty</span>
          <span className="font-semibold text-slate-900">
            {formatBigNumber(data.qty, 0)}
          </span>
        </div>
        <div className={`flex flex-col transition-all duration-200 ${data.date === selectedWeekDay ? "bg-custom-white" : "bg-bkg"} rounded-md leading-snug items-center justify-between`}>
          <span>Tax</span>
          <span className="font-semibold text-slate-900">
            {formatCurrency2(data.tax)}
          </span>
        </div>
        <div className={`flex flex-col transition-all duration-200 ${data.date === selectedWeekDay ? "bg-custom-white" : "bg-bkg"} rounded-md leading-snug items-center justify-between`}>
          <span>COGS</span>
          <span className="font-semibold text-slate-900">
            {formatCurrency2(data.cogs)}
          </span>
        </div>
        <div className={`flex flex-col transition-all duration-200 ${data.date === selectedWeekDay ? "bg-custom-white" : "bg-bkg"} rounded-md leading-snug items-center justify-between`}>
          <span>GPM</span>
          <span className="font-semibold text-slate-900">{data.gpm}</span>
        </div>
      </div>
    </div>
  );
};
