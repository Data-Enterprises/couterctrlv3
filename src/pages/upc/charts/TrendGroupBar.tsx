import { type ComputedDatum, ResponsiveBar } from "@nivo/bar";
import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import type { UpcTrend } from "../../../interfaces";
import { setUpc } from "../../../features/trendModalSlice";
// import { setOpenModal, setUpc } from "../../../features/trendModalSlice";

interface GroupBarProps {
  data: UpcTrend[];
  type: "Top 5" | "Bottom 5" | "Selected";
}

const GroupBar = ({ data, type }: GroupBarProps) => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.upc);
  const [formattedData, setFormattedData] = useState<any[]>([]);

  useEffect(() => {
    setFormattedData(
      data.map((item) => {
        if (state.trendMode === "Totals")
          return {
            upc: item.product_code,
            Before: item.total_before,
            After: item.total_after,
            color1: "#f97316",
            color2: "#3b82f6",
            tooltip: item.tooltip,
            desc: item.product_description,
          };
        if (state.trendMode === "Mean")
          return {
            upc: item.product_code,
            Before: item.mean_before,
            After: item.mean_after,
            color1: "#f97316",
            color2: "#3b82f6",
            tooltip: item.tooltip,
            desc: item.product_description,
          };
        if (state.trendMode === "Volatility")
          return {
            upc: item.product_code,
            Before: item.volatility_before,
            After: item.volatility_after,
            color1: "#f97316",
            color2: "#3b82f6",
            tooltip: item.tooltip,
            desc: item.product_description,
          };
        return {
          upc: item.product_code,
          Before: item.total_before,
          After: item.total_after,
          color1: "#f97316",
          color2: "#3b82f6",
          tooltip: item.tooltip,
          desc: item.product_description,
        };
      })
    );
  }, [state.upcTrends, state.trendMode, data]);

  const rgbaColor = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const handleBarClick = (e: ComputedDatum<any>) => {
    dispatch(setUpc(e.data.upc as string));
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg relative">
      <div className="bg-blue-500 text-custom-white rounded-t-lg py-0.5 pl-4">
        {type} {state.trendMode}
      </div>
      <div className="w-full h-[92%] rounded-b-lg">
        <ResponsiveBar
          data={formattedData}
          keys={["Before", "After"]}
          colors={(d) =>
            d.id === "Before"
              ? rgbaColor(d.data.color1, 0.3)
              : rgbaColor(d.data.color2, 0.3)
          }
          borderColor={(d) =>
            d.data.id === "Before" ? d.data.data.color1 : d.data.data.color2
          }
          borderWidth={2}
          borderRadius={4}
          innerPadding={3}
          enableLabel={false}
          indexBy="upc"
          groupMode="grouped"
          margin={{ top: 20, right: 85, bottom: 30, left: 40 }}
          tooltipLabel={(d) => `${d.id} - ${d.value}`}
          onClick={handleBarClick}
          tooltip={(e) => (
            <div className="bg-custom-white p-2 rounded-lg shadow-lg border border-content/70 w-[243px]">
              <div className="font-medium text-xs mb-1">{e.data.desc}</div>
              <div className="text-xs mb-0.5 gap-1 flex">
                <div className="font-medium">Before:</div>
                <div>
                  {e.data.tooltip.split(". ")[0].replace("Before:", "")}
                </div>
              </div>
              <div className="text-xs flex gap-1">
                <div className="font-medium">After:</div>
                <div>{e.data.tooltip.split(". ")[1].replace("After:", "")}</div>
              </div>
            </div>
          )}
        />
      </div>
      <div className="absolute right-1.5 top-8 pr-3">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-orange-500"></div>
          <div className="text-xs">Before</div>
        </div>
        <div className="flex items-center gap-1 mt-2">
          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
          <div className="text-xs">After</div>
        </div>
      </div>
    </div>
  );
};

export default GroupBar;
