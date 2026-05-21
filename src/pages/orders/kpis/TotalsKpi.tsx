import type { TotalsSummary } from ".";
import { formatBigNumber, formatCurrency2 } from "../../../utils";

interface TotalsKpiProps {
  summary: TotalsSummary;
}

const TotalsKpi = ({ summary }: TotalsKpiProps) => {
  return (
    <div className="text-[13px] w-[30%]">
      <div className="grid grid-cols-3 gap-2 h-full">
        <div className="bg-custom-white rounded-lg shadow-lg px-2 flex flex-col justify-center items-center">
          <div className="text-content/60">Ext Retail</div>
          <div className="font-medium text-[12.5px]">
            {formatCurrency2(summary.eret)}
          </div>
        </div>
        <div className="bg-custom-white rounded-lg shadow-lg px-2 flex flex-col justify-center items-center">
          <div className="text-content/60">Total Cost</div>
          <div className="font-medium text-[12.5px]">
            {formatCurrency2(summary.cost)}
          </div>
        </div>

        <div className="bg-custom-white rounded-lg shadow-lg px-2 flex flex-col justify-center items-center">
          <div className="text-content/60">Items</div>
          <div className="font-medium text-[12.5px]">
            {formatBigNumber(summary.uniqueItems, 0)}
          </div>
        </div>
        <div className="bg-custom-white rounded-lg shadow-lg px-2 flex flex-col justify-center items-center">
          <div className="text-content/60">Weight</div>
          <div className="font-medium text-[12.5px]">
            {formatBigNumber(summary.weight, 2)}
          </div>
        </div>
        <div className="bg-custom-white rounded-lg shadow-lg px-2 flex flex-col justify-center items-center">
          <div className="text-content/60">Qty</div>
          <div className="font-medium text-[12.5px]">
            {formatBigNumber(summary.qty, 0)}
          </div>
        </div>
        <div className="bg-custom-white rounded-lg shadow-lg px-2 flex flex-col justify-center items-center">
          <div className="text-content/60">TPR</div>
          <div className="font-medium text-[12.5px]">
            {formatBigNumber(summary.tpr, 0)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotalsKpi;
