import { useState, useEffect } from "react";
import { useAppSelector } from "../../../hooks";
import { formatCurrency2 } from "../../../utils";

// Bar Chart utils
import { ResponsiveBar } from "@nivo/bar";
import { barColors } from "../utils";
import type { TopTenData, TopTenItem } from "../../../interfaces";

type GroupTopTenItem = {
  product_code: string;
  product_description: string;
  total_sales: number;
  qty: number;
};

const TopTenItems = () => {
  const search = useAppSelector((state) => state.search);
  const sales = useAppSelector((state) => state.sales);
  const [title, setTitle] = useState<string>("");
  const [topTen, setTopTen] = useState<TopTenData[]>([]);
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    avgSales: 0,
    totalQty: 0,
    avgQty: 0,
  });

  useEffect(() => {
    let newTopTen: TopTenData[] = [];

    if (search.type === "Store") {
      newTopTen = [...sales.topTenItems]
        .sort((a: TopTenItem, b: TopTenItem) => b.total_sales - a.total_sales)
        .map((item, idx) => ({
          id: item.product_description,
          label: item.product_code,
          value: item.total_sales || 0,
          fill: barColors[idx],
          color: barColors[idx],
          qty: item.qty || 0,
        }))
        .reverse();
      setTitle(search.selectedStore?.store_name || "");
    }
    if (search.type === "Group" || search.type === "Stores") {
      const groupTopTen = [...sales.topTenItems]
        .reduce((acc: GroupTopTenItem[], item: TopTenItem) => {
          const existingItem = acc.find(
            (i) => i.product_code === item.product_code
          );
          if (!existingItem) {
            acc.push({
              product_code: item.product_code,
              product_description: item.product_description,
              total_sales: item.total_sales,
              qty: item.qty,
            });
          } else {
            existingItem.total_sales += item.total_sales;
            existingItem.qty += item.qty;
          }

          return acc;
        }, [])
        .sort((a, b) => b.total_sales - a.total_sales)
        .slice(0, 10);

      newTopTen = groupTopTen
        .map((item, idx) => ({
          id: item.product_description,
          label: item.product_code,
          value: item.total_sales || 0,
          fill: barColors[idx],
          color: barColors[idx],
          qty: item.qty || 0,
        }))
        .reverse();
      setTitle(
        search.type === "Group"
          ? search.selectedGroup?.group_name || ""
          : "All Stores"
      );
    }

    // If single store, then it's all good, if multiple stores, then the data will be aggregated above and sliced
    setTopTen(newTopTen);
    calculateMetrics(newTopTen);
  }, [sales.topTenItems]);

  const rgbaColor = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const calculateMetrics = (data: TopTenData[]) => {
    const totalSales = data.reduce((sum, item) => sum + item.value, 0);
    const totalQty = data.reduce((sum, item) => sum + item.qty, 0);
    const avgSales = data.length ? totalSales / data.length : 0;
    const avgQty = data.length ? totalQty / data.length : 0;

    setMetrics({
      totalSales,
      avgSales,
      totalQty,
      avgQty,
    });
  };

  return (
    <div
      data-testid="sales-top-ten"
      className="bg-custom-white rounded-lg shadow-lg h-full overflow-visible relative"
    >
      <div className="font-medium bg-blue-500 text-custom-white rounded-t-lg px-4 py-0.5 flex justify-between">
        <div>Top Ten Items</div>
        <div>{title}</div>
      </div>
      <ResponsiveBar
        data={topTen}
        indexBy="label"
        colors={(bar) => rgbaColor(bar.data.fill, 0.3)}
        borderWidth={2}
        borderColor={(bar) => rgbaColor(bar.data.data.color, 1)}
        margin={{ top: 10, right: 80, bottom: 80, left: 90 }}
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
      <div className="flex justify-around absolute bottom-0 border-t border-content/50 w-full py-3.5 place-items-center">
        <div className="flex gap-1 text-[13px]">
          <div className="font-medium">Total Sales:</div>
          <div>{formatCurrency2(metrics.totalSales)}</div>
        </div>
        <div className="flex gap-1 text-[13px]">
          <div className="font-medium">Avg Sales:</div>
          <div>{formatCurrency2(metrics.avgSales)}</div>
        </div>
        <div className="flex gap-1 text-[13px]">
          <div className="font-medium">Total Qty:</div>
          <div>{metrics.totalQty}</div>
        </div>
        <div className="flex gap-1 text-[13px]">
          <div className="font-medium">Avg Qty:</div>
          <div>{metrics.avgQty}</div>
        </div>
      </div>
    </div>
  );
};

export default TopTenItems;
