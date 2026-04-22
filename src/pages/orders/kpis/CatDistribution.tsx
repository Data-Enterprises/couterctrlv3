import { ResponsivePie } from "@nivo/pie";
import type { PieData } from "../../sales/mobile";
import { colors } from ".";

interface CatDistributionProps {
  data: PieData[];
}

const CatDistribution = ({ data }: CatDistributionProps) => {
  return (
    <div className="bg-custom-white rounded-lg shadow-lg px-2 text-sm w-[32%] cursor-default select-none">
      <div className="font-medium">Category Frequency</div>
      <div className="grid grid-cols-2">
        <div className="bg-gradient-to-r from-orange-200 to-custom-white h-[1.5px]"></div>
        <div className="bg-gradient-to-l from-orange-200 to-custom-white h-[1.5px]"></div>
      </div>
      <div className="grid grid-cols-[36%_64%]">
        <div className="h-[120px] py-1 relative">
          <ResponsivePie
            data={data.slice(0, 10)}
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
            <div className="text-content/60 font-medium">Top 10</div>
          </div>
        </div>
        <div className="max-h-[100px] overflow-y-auto my-2">
          {data.slice(0, 10).map((d, i) => (
            <div key={i} className="flex items-center gap-1 text-[12px]">
              <div className="grid grid-cols-[auto_1fr] gap-1 items-center">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors[i % colors.length] }}
                ></div>
                <div className="text-content/60 text-nowrap truncate w-full">
                  {d.id ? d.id : "null"} -{" "}
                  <span className="font-medium text-content">{d.value}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CatDistribution;
