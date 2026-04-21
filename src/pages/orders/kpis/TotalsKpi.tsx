import type { TotalsSummary } from ".";
import { gpm } from "../../../functions";
import { formatBigNumber, formatCurrency2 } from "../../../utils";

interface TotalsKpiProps {
  summary: TotalsSummary;
}

const TotalsKpi = ({ summary }: TotalsKpiProps) => {
  return (
    <div className="text-[13px] w-[30%]">
      <div className="grid grid-cols-3 gap-2 h-full">
        <div className="bg-custom-white rounded-lg shadow-lg px-2 flex flex-col justify-center items-center">
          <div className="text-content/60">Sales</div>
          <div className="font-medium">{formatCurrency2(summary.eret)}</div>
        </div>
        <div className="bg-custom-white rounded-lg shadow-lg px-2 flex flex-col justify-center items-center">
          <div className="text-content/60">COGS</div>
          <div className="font-medium">{formatCurrency2(summary.cost)}</div>
        </div>
        <div className="bg-custom-white rounded-lg shadow-lg px-2 flex flex-col justify-center items-center">
          <div className="text-content/60">Profit</div>
          <div className="font-medium">{formatCurrency2(summary.retail)}</div>
        </div>
        <div className="bg-custom-white rounded-lg shadow-lg px-2 flex flex-col justify-center items-center">
          <div className="text-content/60">Weight</div>
          <div className="font-medium">
            {formatBigNumber(summary.weight, 2)}
          </div>
        </div>
        <div className="bg-custom-white rounded-lg shadow-lg px-2 flex flex-col justify-center items-center">
          <div className="text-content/60">Qty</div>
          <div className="font-medium">{formatBigNumber(summary.qty, 0)}</div>
        </div>
        <div className="bg-custom-white rounded-lg shadow-lg px-2 flex flex-col justify-center items-center">
          <div className="text-content/60">GPM</div>
          <div className="font-medium">
            {gpm(summary.eret, summary.cost)}
          </div>
        </div>
        {/* <div>
          <div className="text-content/60">Vendors:</div>
          <div className="font-medium">{formatBigNumber(summary.vendors, 0)}</div>
        </div> 
        <div>
          <div className="text-content/60">Categories:</div>
          <div className="font-medium">{formatBigNumber(summary.categories, 0)}</div>
        </div>  */}
      </div>
    </div>
  );
};

export default TotalsKpi;
