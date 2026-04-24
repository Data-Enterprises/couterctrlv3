import { useAppSelector } from "../../../hooks";
import { formatBigNumber, formatCurrency2 } from "../../../utils";

interface TopTotalsKpiProps {
  tyData: number;
  lyData: number;
  title: string;
}
const TopTotalsKpi = ({ tyData, lyData, title }: TopTotalsKpiProps) => {
  const isTablet = useAppSelector((state) => state.app.isTablet);
  const textStyle = () => {
    if (lyData === 0) return "text-content";
    if (tyData > lyData) {
      return "text-emerald-500";
    } else if (tyData < lyData) {
      return "text-orange-500";
    }
    return "text-content";
  };

  return (
    <div
      className={`bg-custom-white rounded-lg shadow-lg text-center flex-col gap-2 relative py-2 ${isTablet ? "pt-0" : "md:py-0"}`}
    >
      <div className="font-medium text-content/60 mt-1">{title}</div>
      <div className="flex justify-around">
        <div>
          <div className="text-content/60">This Year:</div>
          {title === "Total Trans" ? (
            <div className={`font-medium ${textStyle()}`}>
              {formatBigNumber(tyData, 0)}
            </div>
          ) : (
            <div className={`font-medium ${textStyle()}`}>
              {formatCurrency2(tyData)}
            </div>
          )}
        </div>

        {/* Last Year */}
        <div>
          <div className="text-content/60">Last Year:</div>
          {title === "Total Trans" ? (
            <div className="font-medium">{formatBigNumber(lyData, 0)}</div>
          ) : (
            <div className="font-medium">{formatCurrency2(lyData)}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopTotalsKpi;
