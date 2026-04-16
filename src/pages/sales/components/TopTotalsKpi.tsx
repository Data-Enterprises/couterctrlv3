import { formatBigNumber, formatCurrency2 } from "../../../utils";

interface TopTotalsKpiProps {
  data: number;
  title: string;
}
const TopTotalsKpi = ({ data, title }: TopTotalsKpiProps) => {
  return (
    <div className="bg-custom-white rounded-lg shadow-lg pl-1 text-center flex-col gap-2 relative py-2 md:py-0">
      <div className="font-medium text-content/60 mb-1">{title}</div>
      <div className="flex justify-center gap-1">
        <div className="text-content/60">This Year:</div>
        {title === "Total Trans" ? (
          <div className="font-medium">{formatBigNumber(data, 0)}</div>
        ) : (
          <div className="font-medium">{formatCurrency2(data)}</div>
        )}
      </div>
      <div className="flex justify-center gap-1">
        <div className="text-content/60">Last Year:</div>
        {title === "Total Trans" ? (
          <div className="font-medium">{formatBigNumber(data, 0)}</div>
        ) : (
          <div className="font-medium">{formatCurrency2(data)}</div>
        )}
      </div>
    </div>
  );
};

export default TopTotalsKpi;