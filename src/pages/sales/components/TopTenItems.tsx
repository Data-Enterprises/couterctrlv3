import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { formatCurrency2 } from "../../../utils";
import { setTopTenItemsMetrics } from "../../../features/salesSlice";

// Bar Chart utils
import { ResponsiveBar } from "@nivo/bar";
import { formatTopTenData, calculateMetrics, rgbaColor } from "../utils";
import type {
  GroupTopTenItem,
  TopTenData,
  TopTenItem,
} from "../../../interfaces";

const TopTenItems = () => {
  const dispatch = useAppDispatch();
  const sales = useAppSelector((state) => state.sales);
  const search = useAppSelector((state) => state.search);
  const [title, setTitle] = useState<string>("");
  const [topTen, setTopTen] = useState<TopTenData[]>([]);

  useEffect(() => {
    let newTopTen: TopTenData[] = [];

    // Show the selected panel's top ten items if in group mode and a panel is selected
    if (search.type === "Group" && sales.selectedSalesPanel.storeid !== 0) {
      // If selecting a sales panel from a group of stores, we just filter for the top ten items for that store
      const panelItems = sales.topTenItems
        .filter((item) => item.storeid === sales.selectedSalesPanel.storeid)
        .sort((a: TopTenItem, b: TopTenItem) => b.total_sales - a.total_sales);

      newTopTen = formatTopTenData(panelItems);

      // Selecting a panel then sets up the title to the store name
      setTitle(sales.selectedSalesPanel.store_name);

      // If a search type is store, then we're only looking at one store's data so clicking a panel doesn't change anything
    } else if (search.type === "Store") {
      const panelItems = [...sales.topTenItems].sort(
        (a: TopTenItem, b: TopTenItem) => b.total_sales - a.total_sales
      );

      newTopTen = formatTopTenData(panelItems);

      // The storepicker for is setting the selected store in search slice
      setTitle(search.selectedStore.store_name || "");

      // If group or all stores, then aggregate the data from multiple stores if a panel is not selected!!!!!!!!!! AGGREGATED DATA
    } else if (search.type === "Group" || search.type === "Stores") {
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

      newTopTen = formatTopTenData(groupTopTen);

      // Setting title for group or all stores
      setTitle(
        search.type === "Group"
          ? search.selectedGroup!.group_name
          : "All Stores"
      );
    }

    // If single store, then it's all good, if multiple stores, then the data will be aggregated above and sliced
    setTopTen(newTopTen);
    
    const metrics = calculateMetrics(newTopTen);
    dispatch(setTopTenItemsMetrics(metrics));
  }, [sales.topTenItems, sales.selectedSalesPanel, sales.salesPanels]);

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
      />
      <div className="flex justify-around absolute bottom-0 border-t border-content/50 w-full py-3.5 place-items-center">
        <div className="flex gap-1 text-[13px]">
          <div className="font-medium">Total Sales:</div>
          <div>{formatCurrency2(sales.topTenItemsMetrics.totalSales)}</div>
        </div>
        <div className="flex gap-1 text-[13px]">
          <div className="font-medium">Avg Sales:</div>
          <div>{formatCurrency2(sales.topTenItemsMetrics.avgSales)}</div>
        </div>
        <div className="flex gap-1 text-[13px]">
          <div className="font-medium">Total Qty:</div>
          <div>{sales.topTenItemsMetrics.totalQty}</div>
        </div>
        <div className="flex gap-1 text-[13px]">
          <div className="font-medium">Avg Qty:</div>
          <div>{sales.topTenItemsMetrics.avgQty}</div>
        </div>
      </div>
    </div>
  );
};

export default TopTenItems;
