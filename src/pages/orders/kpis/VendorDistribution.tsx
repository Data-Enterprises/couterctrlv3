import { ResponsivePie } from "@nivo/pie";
import { formatBigNumber } from "../../../utils";
import type { PieData } from "../../sales/mobile";
import { colors } from "../../sales/utils";

interface VendorDistributionProps {
  data: PieData[];
}

const VendorDistribution = ({ data }: VendorDistributionProps) => {
  console.log(data);
  return (
    <div className="bg-custom-white rounded-lg shadow-lg px-2 text-sm">
      <div className="font-medium">Total Vendors</div>
      <div className="grid grid-cols-2">
        <div className="bg-gradient-to-r from-blue-200 to-custom-white h-[1.5px]"></div>
        <div className="bg-gradient-to-l from-blue-200 to-custom-white h-[1.5px]"></div>
      </div>
      <div className="grid grid-cols-[45%_55%]">
        <div className="h-[120px] py-1 relative">
          <ResponsivePie
            data={data}
            colors={colors}
            enableArcLabels={false}
            enableArcLinkLabels={false}
            innerRadius={0.7}
            animate={true}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="text-content/60 font-medium">{formatBigNumber(data.length, 0)}</div>
          </div>
        </div>
        <div className="max-h-[100px] overflow-y-auto my-2">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-1 text-[11px]">
              <div className="grid grid-cols-[auto_1fr] gap-1 items-center">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors[i % colors.length] }}
                ></div>
                <div className="text-content/60 text-nowrap truncate w-full">
                  {d.id ? d.id : "null"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VendorDistribution;
