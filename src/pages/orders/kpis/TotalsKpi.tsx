import type { TotalsSummary } from ".";
import { formatBigNumber, formatCurrency2 } from "../../../utils";

interface TotalsKpiProps {
  summary: TotalsSummary;
}

const TotalsKpi = ({ summary }: TotalsKpiProps) => {
  return (
    <div className="text-[13px] w-[30%]">
      {/* <div className="font-medium text-sm">Totals Summary</div>
      <div className="grid grid-cols-2">
        <div className="bg-gradient-to-r from-content/60 to-custom-white h-[1.5px]"></div>
        <div className="bg-gradient-to-l from-content/60 to-custom-white h-[1.5px]"></div>
      </div> */}
      <div className="grid grid-cols-3 gap-2 h-full">
        <div className="bg-custom-white rounded-lg shadow-lg px-2 flex flex-col justify-center items-center">
          <div className="text-content/60">Retail</div>
          <div className="font-medium">{formatCurrency2(summary.retail)}</div>
        </div>
        <div className="bg-custom-white rounded-lg shadow-lg px-2 flex flex-col justify-center items-center">
          <div className="text-content/60">Ext Retail</div>
          <div className="font-medium">{formatCurrency2(summary.eret)}</div>
        </div>
        <div className="bg-custom-white rounded-lg shadow-lg px-2 flex flex-col justify-center items-center">
          <div className="text-content/60">Cost</div>
          <div className="font-medium">{formatCurrency2(summary.cost)}</div>
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
          <div className="text-content/60">Sub Depts</div>
          <div className="font-medium">
            {formatBigNumber(summary.vendors, 0)}
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
