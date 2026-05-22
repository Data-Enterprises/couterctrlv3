import { type BarData } from "../display/widgets";
import { formatBigNumber, formatCurrency2 } from "../../../utils";

interface DayCardProps {
  data: BarData;
  handleCardClick: (date: string) => void;
  selectedWeekDay: string;
}
const DayCardOverview = ({ data, handleCardClick, selectedWeekDay }: DayCardProps) => {
  const activeStyle =
    data.date === selectedWeekDay ? "bg-[rgb(30,45,80)]/75 text-custom-white" : "bg-custom-white";

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

      <div className="text-[13.5px] grid grid-cols-2 lg:grid-cols-3 gap-2 text-slate-700">
        <div className={`flex flex-col py-1.5 transition-all duration-200 ${data.date === selectedWeekDay ? "bg-custom-white" : "bg-bkg"} rounded-md leading-snug items-center justify-between`}>
          <span>Sales</span>
          <span className="font-semibold text-slate-900">
            {formatCurrency2(data.sales)}
          </span>
        </div>
        <div className={`flex flex-col py-1.5 transition-all duration-200 ${data.date === selectedWeekDay ? "bg-custom-white" : "bg-bkg"} rounded-md leading-snug items-center justify-between`}>
          <span>Net</span>
          <span className="font-semibold text-slate-900">
            {formatCurrency2(data.net)}
          </span>
        </div>
        <div className={`flex flex-col py-1.5 transition-all duration-200 ${data.date === selectedWeekDay ? "bg-custom-white" : "bg-bkg"} rounded-md leading-snug items-center justify-between`}>
          <span>Qty</span>
          <span className="font-semibold text-slate-900">
            {formatBigNumber(data.qty, 0)}
          </span>
        </div>
        <div className={`flex flex-col py-1.5 transition-all duration-200 ${data.date === selectedWeekDay ? "bg-custom-white" : "bg-bkg"} rounded-md leading-snug items-center justify-between`}>
          <span>Tax</span>
          <span className="font-semibold text-slate-900">
            {formatCurrency2(data.tax)}
          </span>
        </div>
        <div className={`flex flex-col py-1.5 transition-all duration-200 ${data.date === selectedWeekDay ? "bg-custom-white" : "bg-bkg"} rounded-md leading-snug items-center justify-between`}>
          <span>COGS</span>
          <span className="font-semibold text-slate-900">
            {formatCurrency2(data.cogs)}
          </span>
        </div>
        <div className={`flex flex-col py-1.5 transition-all duration-200 ${data.date === selectedWeekDay ? "bg-custom-white" : "bg-bkg"} rounded-md leading-snug items-center justify-between`}>
          <span>GPM</span>
          <span className="font-semibold text-slate-900">{data.gpm}</span>
        </div>
      </div>
    </div>
  );
};

export default DayCardOverview;