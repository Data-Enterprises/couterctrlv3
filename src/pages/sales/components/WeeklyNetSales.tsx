import { ResponsiveLine } from "@nivo/line";
import { useAppSelector } from "../../../hooks";
import { useEffect, useState } from "react";
import { formatCurrency2 } from "../../../utils";

type LineData = { x: string; y: number; z: number }[];
type LineSeries = {
  id: number;
  data: LineData;
};

const WeeklyNetSales = () => {
  const sales = useAppSelector((state) => state.sales);
  const search = useAppSelector((state) => state.search);
  const [lineData, setLineData] = useState<LineSeries[]>([]);
  const [title, setTitle] = useState<string>("");

  const getDayMonth = (date: string) => {
    const newDate = date.split("-");
    return `${newDate[1]}/${newDate[2]}`;
  };

  useEffect(() => {
    // Do nothing if there's no weekly sales data
    if (!sales.weeklySales.length) return;

    // If there are weekly sales, then set up the line data
    if (search.type === "Group" && sales.selectedSalesPanel.storeid === 0) {
      setLineData([]);
      // console.log(sales.selectedSalesPanel);

      // From clicking a sales panel
    } else if (sales.selectedSalesPanel.storeid !== 0) {
      // handle selected panel logic here
      const id = 1;
      const series: LineData = [...sales.weeklySales].map((day) => {
        const date = getDayMonth(day.sale_date.split("T")[0]);
        return {
          x: date,
          y: day.sales,
          z: day.qty,
        };
      });
      setLineData([
        {
          id,
          data: series,
        },
      ]);
      setTitle(sales.selectedSalesPanel.store_name);
    } else {
      const id = 1;
      const series: LineData = [...sales.weeklySales].map((day) => {
        const date = getDayMonth(day.sale_date.split("T")[0]);
        return {
          x: date,
          y: day.sales,
          z: day.qty,
        };
      });
      setLineData([
        {
          id,
          data: series,
        },
      ]);
    }
  }, [sales.weeklySales, sales.selectedSalesPanel]);

  const getQty = (date: string) => {
    const found = sales.weeklySales?.find(
      (day) => getDayMonth(day.sale_date.split("T")[0]) === date
    );
    return found ? found.qty : 0;
  };

  return (
    <div
      data-testid="weekly-net-sales"
      className="bg-custom-white rounded-lg shadow-lg"
    >
      <div className="font-medium bg-blue-500 text-custom-white py-0.5 rounded-t-lg px-4 flex justify-between">
        <div>Weekly Net Sales</div>
        <div>{title}</div>
      </div>
      <ResponsiveLine
        data={lineData}
        margin={{ top: 20, right: 30, bottom: 65, left: 80 }}
        curve="natural"
        pointSize={10}
        pointBorderWidth={2}
        pointBorderColor={{ from: "seriesColor" }}
        enableTouchCrosshair={true}
        useMesh={true}
        enableGridX={true}
        gridYValues={10}
        colors={["#3b82f6"]}
        animate={true}
        axisLeft={{
          tickValues: 10,
          format: (value) => `${formatCurrency2(value)}`,
        }}
        tooltip={({ point }) => (
          <div className="bg-custom-white p-2 rounded-lg shadow shadow-content text-sm">
            <div className="flex gap-1">
              <div>Date:</div>
              <div className="font-medium">{point.data.x}</div>
            </div>
            <div className="flex gap-1">
              <div>Sales:</div>
              <div className="font-medium">{formatCurrency2(point.data.y)}</div>
            </div>
            <div className="flex gap-1">
              <div>Qty:</div>
              <div className="font-medium">{getQty(point.data.x)}</div>
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default WeeklyNetSales;
