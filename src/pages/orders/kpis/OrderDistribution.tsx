import type { PieData } from "../../sales/mobile";
import { ResponsivePie } from "@nivo/pie";
import { colors } from "../../sales/utils";
import { formatBigNumber } from "../../../utils";

interface OrderDistributionProps {
  data: PieData[];
}

const OrderDistribution = ({ data }: OrderDistributionProps) => {
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="bg-custom-white rounded-lg shadow-lg px-2 text-sm">
      <div className="font-medium">Order Distribution</div>
      <div className="grid grid-cols-2">
        <div className="bg-gradient-to-r from-emerald-200 to-custom-white h-[1.5px]"></div>
        <div className="bg-gradient-to-l from-emerald-200 to-custom-white h-[1.5px]"></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-[120px] py-1 relative">
          <ResponsivePie
            data={data}
            colors={(d) => {
              const idx = data.findIndex((item) => item.id === d.data.id);
              return colors[idx % colors.length];
            }}
            enableArcLabels={false}
            enableArcLinkLabels={false}
            innerRadius={0.7}
            animate={true}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="text-content/60 font-medium">
              {formatBigNumber(total, 0)}
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-1 pl-4">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-1 text-[13px]">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[i % colors.length] }}
              ></div>
              <div className="flex  gap-1">
                <div className="text-content/60">{d.id}:</div>
                <div className="font-medium">{formatBigNumber(d.value, 0)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderDistribution;
