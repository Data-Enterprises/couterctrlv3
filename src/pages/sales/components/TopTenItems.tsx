import { useState, useEffect } from "react";
import { useAppSelector } from "../../../hooks";

// Bar Chart utils
import { ResponsiveBar } from "@nivo/bar";
import { barColors } from "../utils";
import type { TopTenData } from "../../../interfaces";

const TopTenItems = () => {
  const sales = useAppSelector((state) => state.sales);
  const [topTen, setTopTen] = useState<TopTenData[]>([]);

  useEffect(() => {
    const newTopTen = sales.topTenItems
      .map((item, idx) => ({
        id: item.product_description,
        label: item.product_code,
        value: item.total_sales || 0,
        fill: barColors[idx],
        color: barColors[idx],
        qty: item.qty || 0,
      }))
      .sort((a, b) => b.value - a.value)
      .reverse();
    setTopTen(newTopTen);
  }, [sales.topTenItems]);

  const rgbaColor = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  return (
    <div data-testid="sales-top-ten" className="bg-custom-white rounded-lg shadow-lg h-full overflow-visible">
      <div className="font-medium bg-blue-500 text-custom-white rounded-t-lg pl-4 py-0.5">
        Top Ten Items
      </div>
      <ResponsiveBar
        data={topTen}
        indexBy="label"
        colors={(bar) => rgbaColor(bar.data.fill, 0.3)}
        borderWidth={2}
        borderColor={(bar) => rgbaColor(bar.data.data.color, 1)}
        margin={{ top: 10, right: 10, bottom: 40, left: 90 }}
        padding={0.1}
        borderRadius={4}
        labelSkipWidth={12}
        labelSkipHeight={12}
        keys={["value"]}
        enableLabel={false}
        layout="horizontal"
        axisBottom={null}
        tooltipLabel={(e) => `${e.data.id}`}
        theme={{
          tooltip: {
            container: {
              fontSize: "13px",
              zIndex: 9999,
            },
          },
        }}
      />
    </div>
  );
};

export default TopTenItems;
