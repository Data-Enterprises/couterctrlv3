import { useState, useEffect } from "react";
import { useAppSelector } from "../../../hooks";
import { formatCurrency2 } from "../../../utils";

// Bar Chart utils
import { ResponsiveBar } from "@nivo/bar";
import { barColors } from "../utils";
import type { TopTenData } from "../../../interfaces";

const TopTenItems = () => {
  const sales = useAppSelector((state) => state.sales);
  const [topTen, setTopTen] = useState<TopTenData[]>([]);
  const [stores, setStores] = useState<string[]>([]);
  const [currentStore, setCurrentStore] = useState<string>("");
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    avgSales: 0,
    totalQty: 0,
    avgQty: 0,
  });

  useEffect(() => {
    // Grabbing the unique store names for the legend
    const storeNames = new Set(
      sales.topTenItems.map((item) => item.store_name)
    );
    setStores(Array.from(storeNames));

    // console.log(new Set(sales.topTenItems.map((item) => item.product_code)));
    // console.log(sales.topTenItems.map((item) => item.product_code));
    /**
     * if we're in a group, check the search.type, if single store, then leave below as is.
     * if group, then we need to aggregate all the total_sales and qty for each product_code/product_description
     * Then slice the top 10 and then set that as the newTopTen below
     */

    if (!currentStore) {
      setCurrentStore(Array.from(storeNames)[0]);
    }

    const store = currentStore ? currentStore : Array.from(storeNames)[0];
    const newTopTen = sales.topTenItems
      .filter((item) => item.store_name === store)
      .sort((a, b) => b.total_sales - a.total_sales)
      .map((item, idx) => ({
        id: item.product_description,
        label: item.product_code,
        value: item.total_sales || 0,
        fill: barColors[idx],
        color: barColors[idx],
        qty: item.qty || 0,
      }))
      .reverse();
    setTopTen(newTopTen);
    calculateMetrics(newTopTen);
  }, [sales.topTenItems, currentStore]);

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
      <div className="font-medium bg-blue-500 text-custom-white rounded-t-lg pl-4 py-0.5">
        Top Ten Items
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
      <div className="absolute top-8 right-2 h-[80%] max-h-[80%] overflow-y-scroll no-scrollbar text-right space-y-1">
        {stores.map((store) => (
          <div
            key={store}
            className={`text-xs font-medium flex gap-1 items-center select-none text-nowrap text-ellipsis ${
              currentStore === store && "bg-blue-500 text-custom-white"
            } px-2 py-1.5 rounded-md cursor-pointer hover:bg-blue-200 transition-all duration-200`}
            onClick={() => setCurrentStore(store)}
          >
            {store}
          </div>
        ))}
      </div>
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
