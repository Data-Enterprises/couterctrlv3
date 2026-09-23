import type { PieData } from "../../sales/mobile";

interface CatDistributionProps {
  data: PieData[];
}

const CatDistribution = ({ data }: CatDistributionProps) => {
  const sliced = data.slice(0, 10);

  return (
    <div className="w-[32%] min-h-[120px] max-h-[120px] rounded-lg bg-custom-white shadow-lg py-1">
      <div className="flex items-start justify-between px-2 text-[13px]">
        <div className="font-medium tracking-wide text-content">
          Category Frequency
        </div>
        <div className="font-medium text-content/60">Top 10</div>
      </div>
      <div className="grid grid-cols-2 mb-1 px-2">
        <div className="bg-gradient-to-r from-orange-200 to-custom-white h-[1.5px]"></div>
        <div className="bg-gradient-to-l from-orange-200 to-custom-white h-[1.5px]"></div>
      </div>
      <div className="px-2 text-[11.5px]">
        <div className="grid grid-cols-2 gap-x-4">
          {sliced.map((d, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="min-w-0 truncate">
                  {d.id ?? "null"}
                </div>
                <div className="shrink-0 font-semibold">{d.value}</div>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CatDistribution;
