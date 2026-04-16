import { formatBigNumber, formatCurrency2 } from "../../../utils";

interface TopTotalsKpiProps {
  tyData: number;
  lyData: number;
  title: string;
}
const TopTotalsKpi = ({ tyData, lyData, title }: TopTotalsKpiProps) => {

  const textStyle = () => {
    if (tyData > lyData) {
      return "text-emerald-500";
    } else if (tyData < lyData) {
      return "text-orange-500";
    }
    return "text-content";
  };
  return (
    <div className="bg-custom-white rounded-lg shadow-lg pl-1 text-center flex-col gap-2 relative py-2 md:py-0">
      <div className="font-medium text-content/60 mb-1">{title}</div>
      <div className="flex justify-center gap-1">
        <div className="text-content/60">This Year:</div>
        {title === "Total Trans" ? (
          <div className={`font-medium ${textStyle()}`}>{formatBigNumber(tyData, 0)}</div>
        ) : (
          <div className={`font-medium ${textStyle()}`}>{formatCurrency2(tyData)}</div>
        )}
      </div>

      {/* Last Year */}
      <div className="flex justify-center gap-1">
        <div className="text-content/60">Last Year:</div>
        {title === "Total Trans" ? (
          <div className="font-medium">{formatBigNumber(lyData, 0)}</div>
        ) : (
          <div className="font-medium">{formatCurrency2(lyData)}</div>
        )}
      </div>
    </div>
  );
};

export default TopTotalsKpi;