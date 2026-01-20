import { ResponsiveBar } from "@nivo/bar";
import { useState, useEffect } from "react";
import { useAppSelector } from "../../../hooks";
import type { UpcPriceOpt } from "../../../interfaces";

interface BarProps {
  type: string;
  yKey: string;
}

const PriceOptBar = ({ type, yKey }: BarProps) => {
  const state = useAppSelector((state) => state.upc);
  const [chartData, setChartData] = useState<UpcPriceOpt[]>([]);
  const [max, setMax] = useState<number>(0);
  const color =
    yKey === "price"
      ? "bg-[#3b82f6]"
      : yKey === "total_qty"
      ? "bg-[#f97316]"
      : "bg-[#10b981]";

  const barColor =
    yKey === "price" ? "#3b82f6" : yKey === "total_qty" ? "#f97316" : "#10b981";

  useEffect(() => {
    let data: UpcPriceOpt[] = [];
    if (state.optDisplayMode === "singleRow") {
      data = state.optBestPrices
        .filter((item) =>
          state.selectedOptItem.product_code.includes(item.product_code)
        )
        // the product_code is what the chart is indexing by, so to avoid duplicates, I'm changing it to the price + index
        // this way, the chart will show each price point for the selected item
        // The chart is set to take those out in the axisLeft format prop for visualization purposes
        .map((item, i) => ({
          ...item,
          product_code: `${i + 1} - $${item.price}`,
        }))
        .sort(
          (a, b) =>
            (a[yKey as keyof UpcPriceOpt] as number) -
            (b[yKey as keyof UpcPriceOpt] as number)
        );
    } else if (state.optDisplayMode === "multiRow") {
      data = state.optBestPricesByUpc
        .filter((item) => state.selectedUpcs.includes(item.product_code))
        // .map((item) => ({ ...item }))
        .sort(
          (a, b) =>
            (b[yKey as keyof UpcPriceOpt] as number) -
            (a[yKey as keyof UpcPriceOpt] as number)
        );
    }
    setChartData(data);

    const findMax = [...data].sort(
      (a, b) =>
        (b[yKey as keyof UpcPriceOpt] as number) -
        (a[yKey as keyof UpcPriceOpt] as number)
    );
    setMax(findMax[0][yKey as keyof UpcPriceOpt] as number);
  }, [state.optDisplayMode, state.selectedUpcs, state.selectedOptItem]);

  const rgbaColor = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  return (
    <div className="bg-custom-white shadow-lg rounded-lg h-[100%] select-none">
      <div
        className={`${color} py-1 pl-4 font-medium rounded-t-lg text-custom-white`}
      >
        {type}{" "}
        {state.optDisplayMode === "singleRow" && state.selectedOptItem
          ? ` - ${state.selectedOptItem.product_code}`
          : ""}
      </div>
      {state.selectedUpcs.length === 0 ? (
        <div className="h-full p-10 flex flex-col items-center text-content/50 text-sm text-center font-medium gap-2">
          <div>Select one or more UPCs to view the {type} data</div>
          <div>
            This mode displays optimal prices by comparing each selected item's
            historical pricing, quantity, and revenue data
          </div>
        </div>
      ) : (
        <ResponsiveBar
          data={chartData}
          keys={[yKey]}
          colors={() => rgbaColor(barColor, 0.3)}
          borderWidth={2}
          borderColor={() => barColor}
          padding={0.15}
          indexBy={
            state.optDisplayMode === "singleRow"
              ? "product_code"
              : "product_code"
          }
          layout="horizontal"
          labelSkipWidth={12}
          labelSkipHeight={12}
          enableLabel={false}
          enableGridX={true}
          enableGridY={false}
          borderRadius={5}
          axisBottom={{ tickValues: 5 }}
          gridXValues={5}
          valueScale={{ type: "linear", min: 0, max: max }}
          theme={{
            axis: {
              domain: {
                line: { stroke: "#60a5fa", strokeWidth: 1.5 },
              },
              ticks: {
                text: { fontSize: 10.5, strokeWidth: 2, fontWeight: "bolder" },
              },
            },
          }}
          // The value is being split so I can show the actual prices instead of the ${i + 1} part of the label
          axisLeft={{
            format: (v) =>
              state.optDisplayMode === "singleRow" ? v.split(" - ")[1] : `${v}`,
          }}
          margin={{
            top: 10,
            right: 30,
            bottom: 70,
            left: state.optDisplayMode === "singleRow" ? 70 : 80,
          }}
          tooltipLabel={(e) => {
            const item = chartData.find(
              (item) => item.product_code === e.indexValue
            );
            if (!item) return "";
            const desc = item.product_description;
            const price = item.price;
            return type === "Price" ? `${desc}` : `${desc} @ ${price}`;
          }}
        />
      )}
    </div>
  );
};

export default PriceOptBar;
